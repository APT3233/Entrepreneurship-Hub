import { AlreadyExists, BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { getFileProxyUrl } from "app/core/utils/file.js";
import { parsePagination } from "app/core/utils/pagination.js";
import { isAdminLike } from "./incubation.permission.js";
import { sanitizeDocument } from "./incubation.mapper.js";

const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const NON_RECREATABLE_GROUP_STATUSES = new Set(["candidate", "incubating", "active", "on_hold", "graduated"]);

const nullable = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

const compactValues = (row = {}) => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));

const dateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const makeSafeName = (fileName) => String(fileName || "file")
  .replace(/[\\/]/g, "_")
  .replace(/\s+/g, "_")
  .replace(/[^a-zA-Z0-9._-]/g, "_")
  .slice(0, 180) || "file";

const slugify = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 220) || null;

const startupFields = [
  "group_id", "class_id", "semester_id", "subject_id", "startup_name", "slug", "logo_url", "tagline",
  "short_description", "full_description", "problem_statement", "solution_description", "target_customers",
  "business_model", "product_stage", "startup_status", "category", "industry", "technology_tags",
  "website_url", "github_url", "demo_url", "pitch_deck_url", "video_url", "source", "selected_score",
  "selected_reason", "selected_at",
];

const normalizeStartupInput = (data, defaults = {}) => {
  const payload = {};
  for (const key of startupFields) {
    if (data[key] !== undefined) payload[key] = data[key];
    else if (defaults[key] !== undefined) payload[key] = defaults[key];
    else payload[key] = null;
  }
  payload.startup_name = String(payload.startup_name || "").trim();
  payload.slug = nullable(payload.slug) || slugify(payload.startup_name);
  payload.product_stage = payload.product_stage || "idea";
  payload.startup_status = payload.startup_status || "candidate";
  payload.source = payload.source || "manual_nomination";
  payload.selected_score = payload.selected_score === "" || payload.selected_score === null ? null : Number(payload.selected_score || 0);
  payload.selected_at = payload.selected_at || null;
  payload.technology_tags = Array.isArray(payload.technology_tags) ? payload.technology_tags : [];
  for (const key of ["logo_url", "tagline", "short_description", "full_description", "problem_statement", "solution_description", "target_customers", "business_model", "category", "industry", "website_url", "github_url", "demo_url", "pitch_deck_url", "video_url", "selected_reason"]) {
    payload[key] = nullable(payload[key]);
  }
  for (const key of ["group_id", "class_id", "semester_id", "subject_id"]) {
    payload[key] = payload[key] === null || payload[key] === "" ? null : Number(payload[key]);
  }
  return payload;
};

export const createIncubationService = ({ incubationRepository, transaction, auditService, storageService, tokenService }) => {
  const audit = (actor, action, tableName, recordId, title, oldValues = null, newValues = null) => auditService.log({
    userId: actor?.id || null,
    action,
    tableName,
    recordId,
    title,
    oldValues,
    newValues,
  });

  const getStartupOrFail = async (id) => {
    const startup = await incubationRepository.findStartupById(id);
    if (!startup) throw NotFound("Startup");
    return startup;
  };

  const getStageOrFail = async (id, requireActive = false) => {
    const stage = await incubationRepository.findStageById(id);
    if (!stage) throw NotFound("Pipeline stage");
    if (requireActive && stage.status !== "active") throw BadRequest("Pipeline stage is inactive");
    return stage;
  };

  const getEventOrFail = async (id) => {
    const event = await incubationRepository.findEventById(id);
    if (!event) throw NotFound("Ecosystem event");
    return event;
  };

  const assertFounderCanAccessStartup = async (startupId, actor) => {
    if (!await incubationRepository.userIsFounder(startupId, actor?.id)) {
      throw Forbidden("You can only access your startup");
    }
  };

  const assertMentorCanAccessStartup = async (startupId, actor) => {
    if (!await incubationRepository.mentorCanAccessStartup(startupId, actor?.id)) {
      throw Forbidden("Mentor can only access assigned startups");
    }
  };

  const assertEventCodeAvailable = async (eventCode, excludeId = null) => {
    if (!eventCode) return;
    if (await incubationRepository.findEventByCode(eventCode, excludeId)) throw AlreadyExists("Event code already exists");
  };

  const assertEventTimes = (startAt, endAt) => {
    if (!startAt || !endAt) return;
    if (new Date(startAt).getTime() > new Date(endAt).getTime()) throw BadRequest("Event end time must be after start time");
  };

  const assertSlugAvailable = async (slug, excludeId = null) => {
    if (!slug) return;
    if (await incubationRepository.findStartupBySlug(slug, excludeId)) throw AlreadyExists("Startup slug already exists");
  };

  const assertGroupCanCreateStartup = async (groupId, excludeId = null) => {
    if (!groupId) return;
    const existing = await incubationRepository.findActiveStartupByGroup(groupId, excludeId);
    if (existing) throw AlreadyExists("Group already has an active startup profile");
  };

  const assertLecturerOwnsGroup = async (actor, groupId) => {
    if (isAdminLike(actor)) return await incubationRepository.findGroupContext(groupId);
    const group = await incubationRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    if (Number(group.lecturer_id) !== Number(actor?.id)) throw Forbidden("Lecturer can only access groups in their classes");
    return group;
  };

  const foundersFromGroup = async (groupId) => {
    const members = await incubationRepository.listGroupMembers(groupId);
    return members.map((member) => ({
      student_id: member.student_id || null,
      user_id: member.user_id || null,
      full_name: member.full_name,
      email: member.email || null,
      phone: member.phone || null,
      role_title: member.group_role === "leader" ? "Team Leader" : "Member",
      founder_role: member.group_role === "leader" ? "founder" : "member",
      contribution: null,
      joined_at: dateOnly(member.joined_at),
      status: "active",
    }));
  };

  const addInitialPipeline = async ({ startupId, stageId, actor, reason, action = "created", conn }) => {
    if (!stageId) return null;
    const stage = await getStageOrFail(stageId, true);
    await incubationRepository.createPipelineEntry({
      startup_id: Number(startupId),
      current_stage_id: Number(stage.id),
      previous_stage_id: null,
      status: "active",
      entered_at: new Date(),
      note: nullable(reason),
      updated_by: actor?.id || null,
    }, conn);
    await incubationRepository.insertPipelineHistory({
      startup_id: Number(startupId),
      from_stage_id: null,
      to_stage_id: Number(stage.id),
      action,
      reason,
      actor_id: actor?.id || null,
      new_values: { stage_id: stage.id, stage_code: stage.code },
    }, conn);
    return stage;
  };

  const getStartup = async (id) => {
    const startup = await getStartupOrFail(id);
    const [founders, history, documents, milestones, activityLogs, groupContext] = await Promise.all([
      incubationRepository.listFounders(id),
      incubationRepository.listPipelineHistory(id),
      incubationRepository.listDocuments(id),
      incubationRepository.listMilestones(id),
      incubationRepository.getStartupActivity(id),
      startup.group_id ? incubationRepository.findGroupContext(startup.group_id) : Promise.resolve(null),
    ]);
    return {
      ...startup,
      founders,
      pipeline_history: history,
      documents: documents.map(sanitizeDocument),
      milestones,
      activity_logs: activityLogs,
      evaluation_source: groupContext ? {
        group_id: groupContext.id,
        group_name: groupContext.group_name,
        topic: groupContext.topic,
        topic_desc: groupContext.topic_desc,
        category: groupContext.category,
        average_score: groupContext.average_score,
        feedback_summary: groupContext.feedback_summary,
      } : null,
      stats: {
        founder_count: startup.founder_count,
        document_count: startup.document_count,
        milestone_count: startup.milestone_count,
        current_stage_id: startup.current_stage_id,
        current_stage_name: startup.current_stage_name,
      },
    };
  };

  const listStartups = async (query, actor = null) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStartups({
      search: nullable(query.search),
      semesterId: query.semester_id || null,
      subjectId: query.subject_id || null,
      classId: query.class_id || null,
      status: nullable(query.status),
      productStage: nullable(query.product_stage),
      pipelineStageId: query.pipeline_stage_id || null,
      source: nullable(query.source),
      minScore: query.min_score,
      maxScore: query.max_score,
      lecturerId: actor && !isAdminLike(actor) ? actor.id : null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createStartup = async (data, actor) => {
    let defaults = {};
    if (data.group_id) {
      const group = await incubationRepository.findGroupContext(data.group_id);
      if (!group) throw NotFound("Group");
      defaults = {
        class_id: group.class_id,
        semester_id: group.semester_id,
        subject_id: group.subject_id,
        category: group.category,
        short_description: group.topic_desc,
        selected_score: group.average_score,
      };
    }
    const payload = normalizeStartupInput(data, defaults);
    payload.created_by = actor?.id || null;
    payload.selected_by = payload.selected_reason || payload.selected_score !== null ? actor?.id || null : null;
    if (payload.selected_by && !payload.selected_at) payload.selected_at = new Date();
    await assertSlugAvailable(payload.slug);
    await assertGroupCanCreateStartup(payload.group_id);
    if (data.initial_stage_id) await getStageOrFail(data.initial_stage_id, true);

    const startupId = await transaction.run(async (conn) => {
      const id = await incubationRepository.createStartup(payload, conn);
      if (payload.group_id) await incubationRepository.createFounders(id, await foundersFromGroup(payload.group_id), conn);
      await addInitialPipeline({ startupId: id, stageId: data.initial_stage_id, actor, reason: payload.selected_reason, conn });
      return id;
    });

    await audit(actor, "startup_create", "startup_profiles", startupId, payload.startup_name, null, { group_id: payload.group_id, startup_status: payload.startup_status });
    return getStartup(startupId);
  };

  const createStartupFromGroup = async (groupId, data, actor) => {
    const group = await incubationRepository.findGroupContext(groupId);
    if (!group) throw NotFound("Group");
    await assertGroupCanCreateStartup(groupId);
    const payload = normalizeStartupInput({
      ...data,
      group_id: group.id,
      class_id: group.class_id,
      semester_id: group.semester_id,
      subject_id: group.subject_id,
      category: data.category !== undefined ? data.category : group.category,
      short_description: data.short_description !== undefined ? data.short_description : group.topic_desc,
      selected_score: data.selected_score !== undefined ? data.selected_score : group.average_score,
    });
    payload.created_by = actor?.id || null;
    payload.selected_by = actor?.id || null;
    payload.selected_at = new Date();
    await assertSlugAvailable(payload.slug);
    await getStageOrFail(data.initial_stage_id, true);

    const startupId = await transaction.run(async (conn) => {
      const id = await incubationRepository.createStartup(payload, conn);
      await incubationRepository.createFounders(id, await foundersFromGroup(groupId), conn);
      await addInitialPipeline({ startupId: id, stageId: data.initial_stage_id, actor, reason: payload.selected_reason, conn });
      return id;
    });

    await audit(actor, "startup_create_from_group", "startup_profiles", startupId, payload.startup_name, null, { group_id: groupId, topic: group.topic });
    return getStartup(startupId);
  };

  const updateStartup = async (id, data, actor) => {
    const current = await getStartupOrFail(id);
    const updates = compactValues(normalizeStartupInput({ ...current, ...data }));
    const allowed = compactValues(Object.fromEntries(Object.keys(data).map((key) => [key, updates[key]])));
    if (allowed.slug !== undefined) allowed.slug = allowed.slug || slugify(allowed.startup_name || current.startup_name);
    if (allowed.slug) await assertSlugAvailable(allowed.slug, id);
    if (allowed.group_id !== undefined) {
      await assertGroupCanCreateStartup(allowed.group_id, id);
      if (allowed.group_id) {
        const group = await incubationRepository.findGroupContext(allowed.group_id);
        if (!group) throw NotFound("Group");
        allowed.class_id = group.class_id;
        allowed.semester_id = group.semester_id;
        allowed.subject_id = group.subject_id;
      }
    }
    delete allowed.initial_stage_id;
    await incubationRepository.updateStartup(id, allowed);
    await audit(actor, "startup_update", "startup_profiles", id, current.startup_name, current, allowed);
    return getStartup(id);
  };

  const deleteStartup = async (id, actor) => {
    const current = await getStartupOrFail(id);
    await incubationRepository.softDeleteStartup(id);
    await audit(actor, "startup_delete", "startup_profiles", id, current.startup_name, { startup_status: current.startup_status }, null);
  };

  const listStages = async (query) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStages({
      search: nullable(query.search),
      status: nullable(query.status),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createStage = async (data, actor) => {
    const payload = {
      code: String(data.code).trim().toLowerCase(),
      name: String(data.name).trim(),
      description: nullable(data.description),
      order_index: Number(data.order_index || 0),
      is_final: data.is_final ? 1 : 0,
      status: data.status || "active",
    };
    if (await incubationRepository.findStageByCode(payload.code)) throw AlreadyExists("Pipeline stage code already exists");
    const id = await incubationRepository.createStage(payload);
    await audit(actor, "startup_stage_create", "startup_pipeline_stages", id, payload.code, null, payload);
    return incubationRepository.findStageById(id);
  };

  const updateStage = async (id, data, actor) => {
    const current = await getStageOrFail(id);
    const updates = compactValues({
      code: data.code !== undefined ? String(data.code).trim().toLowerCase() : undefined,
      name: data.name !== undefined ? String(data.name).trim() : undefined,
      description: data.description !== undefined ? nullable(data.description) : undefined,
      order_index: data.order_index !== undefined ? Number(data.order_index) : undefined,
      is_final: data.is_final !== undefined ? (data.is_final ? 1 : 0) : undefined,
      status: data.status,
    });
    if (updates.code && await incubationRepository.findStageByCode(updates.code, id)) throw AlreadyExists("Pipeline stage code already exists");
    await incubationRepository.updateStage(id, updates);
    await audit(actor, "startup_stage_update", "startup_pipeline_stages", id, current.code, current, updates);
    return incubationRepository.findStageById(id);
  };

  const updateStartupStage = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const stage = await getStageOrFail(data.stage_id, true);
    const current = await incubationRepository.findCurrentPipelineEntry(startupId);
    const nextEntry = {
      current_stage_id: Number(stage.id),
      previous_stage_id: current?.current_stage_id || null,
      status: data.status || "active",
      entered_at: new Date(),
      note: nullable(data.reason),
      updated_by: actor?.id || null,
    };
    const startupStatusUpdates = {};
    if (data.action === "graduated") startupStatusUpdates.startup_status = "graduated";
    if (data.action === "archived") startupStatusUpdates.startup_status = "archived";
    if (data.action === "rejected") startupStatusUpdates.startup_status = "rejected";
    if (data.action === "on_hold") startupStatusUpdates.startup_status = "on_hold";
    if (data.action === "resumed" && startup.startup_status === "on_hold") startupStatusUpdates.startup_status = "active";

    await transaction.run(async (conn) => {
      if (current) await incubationRepository.updatePipelineEntry(current.id, nextEntry, conn);
      else await incubationRepository.createPipelineEntry({ startup_id: Number(startupId), ...nextEntry }, conn);
      if (Object.keys(startupStatusUpdates).length) await incubationRepository.updateStartup(startupId, startupStatusUpdates, conn);
      await incubationRepository.insertPipelineHistory({
        startup_id: Number(startupId),
        from_stage_id: current?.current_stage_id || null,
        to_stage_id: Number(stage.id),
        action: data.action || "moved",
        reason: data.reason,
        actor_id: actor?.id || null,
        old_values: current,
        new_values: { ...nextEntry, stage_code: stage.code, ...startupStatusUpdates },
      }, conn);
    });
    await audit(actor, "startup_stage_change", "startup_pipeline_entries", startupId, startup.startup_name, current, { stage_id: stage.id, action: data.action, ...startupStatusUpdates });
    return getStartup(startupId);
  };

  const listSelectionReviews = async (query, actor = null) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listSelectionReviews({
      search: nullable(query.search),
      status: nullable(query.status),
      sourceType: nullable(query.source_type),
      groupId: query.group_id || null,
      startupId: query.startup_id || null,
      lecturerId: actor && !isAdminLike(actor) ? actor.id : null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createSelectionReview = async (data, actor, scope = "admin") => {
    let group = null;
    if (data.group_id) group = scope === "lecturer" ? await assertLecturerOwnsGroup(actor, data.group_id) : await incubationRepository.findGroupContext(data.group_id);
    if (data.group_id && !group) throw NotFound("Group");
    const payload = {
      group_id: data.group_id || null,
      startup_id: data.startup_id || null,
      nominated_by: actor?.id || null,
      source_type: data.source_type || "manual",
      nomination_reason: nullable(data.nomination_reason),
      support_needed: nullable(data.support_needed),
      proposed_stage_id: data.proposed_stage_id || null,
      evaluation_summary: nullable(data.evaluation_summary) || group?.feedback_summary || null,
      average_score: data.average_score === null || data.average_score === undefined ? group?.average_score || null : Number(data.average_score),
      potential_score: data.potential_score === null || data.potential_score === undefined ? null : Number(data.potential_score),
    };
    if (payload.proposed_stage_id) await getStageOrFail(payload.proposed_stage_id, true);
    const id = await incubationRepository.createSelectionReview(payload);
    await audit(actor, scope === "lecturer" ? "startup_nomination_create" : "startup_selection_review_create", "startup_selection_reviews", id, group?.topic || payload.startup_id, null, payload);
    return incubationRepository.findSelectionReviewById(id);
  };

  const reviewSelection = async (id, data, actor) => {
    const review = await incubationRepository.findSelectionReviewById(id);
    if (!review) throw NotFound("Selection review");
    if (["rejected", "needs_more_info"].includes(data.review_status) && !nullable(data.review_note)) throw BadRequest("Review note is required");

    let startupId = review.startup_id || null;
    await transaction.run(async (conn) => {
      if (data.review_status === "approved" && !startupId) {
        if (!review.group_id) throw BadRequest("Approved review must be linked to a group or startup");
        const group = await incubationRepository.findGroupContext(review.group_id);
        if (!group) throw NotFound("Group");
        const existing = await incubationRepository.findActiveStartupByGroup(group.id);
        if (existing) startupId = existing.id;
        else {
          const stages = await incubationRepository.listAllActiveStages();
          const initialStageId = data.initial_stage_id || review.proposed_stage_id || stages[0]?.id;
          const payload = normalizeStartupInput({
            group_id: group.id,
            class_id: group.class_id,
            semester_id: group.semester_id,
            subject_id: group.subject_id,
            startup_name: data.startup_name || group.group_name || group.topic || `Startup ${group.id}`,
            short_description: group.topic_desc,
            product_stage: data.product_stage || "idea",
            startup_status: data.startup_status || "candidate",
            category: group.category,
            source: review.source_type === "evaluation_result" ? "module3_selection" : "manual_nomination",
            selected_score: review.potential_score || review.average_score,
            selected_reason: review.nomination_reason,
          });
          payload.created_by = actor?.id || null;
          payload.selected_by = actor?.id || null;
          payload.selected_at = new Date();
          await assertSlugAvailable(payload.slug);
          startupId = await incubationRepository.createStartup(payload, conn);
          await incubationRepository.createFounders(startupId, await foundersFromGroup(group.id), conn);
          await addInitialPipeline({ startupId, stageId: initialStageId, actor, reason: review.nomination_reason, conn });
        }
      }
      await incubationRepository.updateSelectionReview(id, {
        startup_id: startupId,
        review_status: data.review_status,
        review_note: nullable(data.review_note),
        reviewed_by: actor?.id || null,
        reviewed_at: new Date(),
      }, conn);
    });

    await audit(actor, "startup_selection_review", "startup_selection_reviews", startupId || id, review.group_name || review.startup_name || `Review ${id}`, { review_status: review.review_status }, { review_status: data.review_status, startup_id: startupId });
    return incubationRepository.findSelectionReviewById(id);
  };

  const listDocuments = async (startupId) => {
    await getStartupOrFail(startupId);
    return (await incubationRepository.listDocuments(startupId)).map(sanitizeDocument);
  };

  const initiateDocumentUpload = async (startupId, file, documentType, visibility, actor) => {
    const startup = await getStartupOrFail(startupId);
    if (Number(file.size) > MAX_DOCUMENT_SIZE) throw BadRequest("Startup document exceeds 25MB limit");
    const safeName = makeSafeName(file.name);
    const objectKey = `incubation/startups/${startup.id}/${Date.now()}_${safeName}`;
    const uploadUrl = await storageService.generatePresignedPutUrl(objectKey, 900);
    const uploadToken = tokenService.signPayload({
      p: "startup_document_upload",
      st: Number(startup.id),
      u: Number(actor?.id),
      d: documentType || "other",
      v: visibility || "internal",
      k: objectKey,
      n: safeName,
      t: file.type || "application/octet-stream",
      z: Number(file.size),
    }, "15m");
    return { uploadToken, uploadUrl, fileName: safeName };
  };

  const confirmDocumentUpload = async (startupId, uploadToken, actor) => {
    const startup = await getStartupOrFail(startupId);
    let payload;
    try {
      payload = tokenService.verifyPayload(uploadToken);
    } catch {
      throw BadRequest("Upload token is invalid");
    }
    if (payload?.p !== "startup_document_upload") throw BadRequest("Upload token is not for startup documents");
    if (Number(payload.st) !== Number(startup.id)) throw Forbidden("Upload token does not belong to this startup");
    if (Number(payload.u) !== Number(actor?.id)) throw Forbidden("Upload token does not belong to you");
    const stat = await storageService.statObject(payload.k);
    if (!stat) throw BadRequest("Uploaded file was not found in storage");
    const fileUrl = getFileProxyUrl(payload.k, payload.n);
    const documentId = await transaction.run(async (conn) => {
      const id = await incubationRepository.createDocument({
        startup_id: Number(startup.id),
        document_type: payload.d || "other",
        file_name: payload.n,
        file_url: fileUrl,
        file_path: payload.k,
        mime_type: payload.t || "application/octet-stream",
        file_size: Number(payload.z || stat.size || 0),
        uploaded_by: actor?.id || null,
        visibility: payload.v || "internal",
      }, conn);
      const startupUpdates = {};
      if (payload.d === "logo") startupUpdates.logo_url = fileUrl;
      if (payload.d === "pitch_deck") startupUpdates.pitch_deck_url = fileUrl;
      if (payload.d === "demo_video") startupUpdates.video_url = fileUrl;
      if (Object.keys(startupUpdates).length) await incubationRepository.updateStartup(startup.id, startupUpdates, conn);
      return id;
    });
    await audit(actor, "startup_document_upload", "startup_documents", startup.id, startup.startup_name, null, { document_id: documentId, document_type: payload.d, file_name: payload.n });
    return sanitizeDocument(await incubationRepository.findDocumentById(documentId));
  };

  const deleteDocument = async (startupId, documentId, actor) => {
    const startup = await getStartupOrFail(startupId);
    const document = await incubationRepository.findDocumentById(documentId);
    if (!document || Number(document.startup_id) !== Number(startupId)) throw NotFound("Startup document");
    await incubationRepository.softDeleteDocument(documentId);
    await audit(actor, "startup_document_delete", "startup_documents", startup.id, startup.startup_name, { document_id: document.id, file_name: document.file_name }, null);
  };

  const listMilestones = async (startupId) => {
    await getStartupOrFail(startupId);
    return incubationRepository.listMilestones(startupId);
  };

  const createMilestone = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const payload = {
      startup_id: Number(startupId),
      title: String(data.title).trim(),
      description: nullable(data.description),
      milestone_type: data.milestone_type || "other",
      milestone_date: dateOnly(data.milestone_date),
      evidence_url: nullable(data.evidence_url),
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createMilestone(payload);
    await audit(actor, "startup_milestone_create", "startup_milestones", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findMilestoneById(id);
  };

  const updateMilestone = async (startupId, milestoneId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const current = await incubationRepository.findMilestoneById(milestoneId);
    if (!current || Number(current.startup_id) !== Number(startupId)) throw NotFound("Startup milestone");
    const updates = compactValues({
      title: data.title !== undefined ? String(data.title).trim() : undefined,
      description: data.description !== undefined ? nullable(data.description) : undefined,
      milestone_type: data.milestone_type,
      milestone_date: data.milestone_date !== undefined ? dateOnly(data.milestone_date) : undefined,
      evidence_url: data.evidence_url !== undefined ? nullable(data.evidence_url) : undefined,
    });
    await incubationRepository.updateMilestone(milestoneId, updates);
    await audit(actor, "startup_milestone_update", "startup_milestones", startup.id, startup.startup_name, current, updates);
    return incubationRepository.findMilestoneById(milestoneId);
  };

  const deleteMilestone = async (startupId, milestoneId, actor) => {
    const startup = await getStartupOrFail(startupId);
    const milestone = await incubationRepository.findMilestoneById(milestoneId);
    if (!milestone || Number(milestone.startup_id) !== Number(startupId)) throw NotFound("Startup milestone");
    await incubationRepository.softDeleteMilestone(milestoneId);
    await audit(actor, "startup_milestone_delete", "startup_milestones", startup.id, startup.startup_name, { milestone_id: milestone.id, title: milestone.title }, null);
  };

  const getStartupHistory = async (startupId) => {
    await getStartupOrFail(startupId);
    return incubationRepository.listPipelineHistory(startupId);
  };

  const listProgress = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listProgress(startupId, {
      updateType: nullable(query.update_type),
      visibility: nullable(query.visibility),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createProgress = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const payload = {
      startup_id: Number(startupId),
      update_title: String(data.update_title).trim(),
      update_content: nullable(data.update_content),
      update_type: data.update_type || "other",
      progress_date: dateOnly(data.progress_date),
      visibility: data.visibility || "internal",
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createProgress(payload);
    await audit(actor, "startup_progress_create", "startup_progress_updates", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findProgressById(id);
  };

  const updateProgress = async (startupId, progressId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const current = await incubationRepository.findProgressById(progressId);
    if (!current || Number(current.startup_id) !== Number(startupId)) throw NotFound("Startup progress update");
    const updates = compactValues({
      update_title: data.update_title !== undefined ? String(data.update_title).trim() : undefined,
      update_content: data.update_content !== undefined ? nullable(data.update_content) : undefined,
      update_type: data.update_type,
      progress_date: data.progress_date !== undefined ? dateOnly(data.progress_date) : undefined,
      visibility: data.visibility,
    });
    await incubationRepository.updateProgress(progressId, updates);
    await audit(actor, "startup_progress_update", "startup_progress_updates", startup.id, startup.startup_name, current, updates);
    return incubationRepository.findProgressById(progressId);
  };

  const deleteProgress = async (startupId, progressId, actor) => {
    const startup = await getStartupOrFail(startupId);
    const current = await incubationRepository.findProgressById(progressId);
    if (!current || Number(current.startup_id) !== Number(startupId)) throw NotFound("Startup progress update");
    await incubationRepository.softDeleteProgress(progressId);
    await audit(actor, "startup_progress_delete", "startup_progress_updates", startup.id, startup.startup_name, { progress_id: current.id, update_title: current.update_title }, null);
  };

  const listMetrics = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listMetrics(startupId, pagination);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createMetrics = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    const payload = {
      startup_id: Number(startupId),
      snapshot_date: dateOnly(data.snapshot_date),
      product_stage: data.product_stage || startup.product_stage || "idea",
      users_count: data.users_count === undefined || data.users_count === null ? null : Number(data.users_count),
      customers_count: data.customers_count === undefined || data.customers_count === null ? null : Number(data.customers_count),
      revenue_amount: data.revenue_amount === undefined || data.revenue_amount === null ? null : Number(data.revenue_amount),
      revenue_currency: data.revenue_currency || "VND",
      team_size: data.team_size === undefined || data.team_size === null ? null : Number(data.team_size),
      mvp_completed: data.mvp_completed ? 1 : 0,
      market_validated: data.market_validated ? 1 : 0,
      has_demo: data.has_demo ? 1 : 0,
      has_pitch_deck: data.has_pitch_deck ? 1 : 0,
      has_business_model: data.has_business_model ? 1 : 0,
      note: nullable(data.note),
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createMetrics(payload);
    await audit(actor, "startup_metrics_create", "startup_metrics_snapshots", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findMetricsById(id);
  };

  const listSupportNeeds = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listSupportNeeds(startupId, {
      needType: nullable(query.need_type),
      priority: nullable(query.priority),
      status: nullable(query.status),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createSupportNeed = async (startupId, data, actor, scope = "admin") => {
    const startup = await getStartupOrFail(startupId);
    const payload = {
      startup_id: Number(startupId),
      need_type: data.need_type || "other",
      title: String(data.title).trim(),
      description: nullable(data.description),
      priority: data.priority || "normal",
      status: "open",
      requested_by: actor?.id || null,
      assigned_to: scope === "admin" ? data.assigned_to || null : null,
    };
    const id = await incubationRepository.createSupportNeed(payload);
    await audit(actor, scope === "founder" ? "startup_founder_support_need_create" : "startup_support_need_create", "startup_support_needs", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findSupportNeedById(id);
  };

  const updateSupportNeedStatus = async (id, data, actor) => {
    const current = await incubationRepository.findSupportNeedById(id);
    if (!current) throw NotFound("Startup support need");
    const startup = await getStartupOrFail(current.startup_id);
    const updates = compactValues({
      status: data.status,
      assigned_to: data.assigned_to === undefined ? undefined : data.assigned_to || null,
      resolved_at: data.status === "resolved" ? new Date() : null,
    });
    await incubationRepository.updateSupportNeed(id, updates);
    await audit(actor, "startup_support_need_status", "startup_support_needs", startup.id, startup.startup_name, current, updates);
    return incubationRepository.findSupportNeedById(id);
  };

  const listSupportActivities = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listSupportActivities(startupId, {
      activityType: nullable(query.activity_type),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createSupportActivity = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    if (data.support_need_id) {
      const need = await incubationRepository.findSupportNeedById(data.support_need_id);
      if (!need || Number(need.startup_id) !== Number(startupId)) throw NotFound("Startup support need");
    }
    const payload = {
      startup_id: Number(startupId),
      support_need_id: data.support_need_id || null,
      activity_type: data.activity_type || "other",
      title: String(data.title).trim(),
      description: nullable(data.description),
      activity_date: dateOnly(data.activity_date),
      related_mentor_id: data.related_mentor_id || null,
      related_partner_id: data.related_partner_id || null,
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createSupportActivity(payload);
    await audit(actor, "startup_support_activity_create", "startup_support_activities", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findSupportActivityById(id);
  };

  const listFounderProgress = async (startupId, query, actor) => {
    await assertFounderCanAccessStartup(startupId, actor);
    return listProgress(startupId, query);
  };

  const createFounderProgress = async (startupId, data, actor) => {
    await assertFounderCanAccessStartup(startupId, actor);
    return createProgress(startupId, data, actor);
  };

  const listFounderSupportNeeds = async (startupId, query, actor) => {
    await assertFounderCanAccessStartup(startupId, actor);
    return listSupportNeeds(startupId, query);
  };

  const createFounderSupportNeed = async (startupId, data, actor) => {
    await assertFounderCanAccessStartup(startupId, actor);
    return createSupportNeed(startupId, data, actor, "founder");
  };

  const getMentorStartup = async (startupId, actor) => {
    await assertMentorCanAccessStartup(startupId, actor);
    return getStartupOrFail(startupId);
  };

  const listMentorProgress = async (startupId, query, actor) => {
    await assertMentorCanAccessStartup(startupId, actor);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listProgress(startupId, {
      updateType: nullable(query.update_type),
      visibility: nullable(query.visibility),
      excludePrivate: true,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const normalizeEventInput = (data, defaults = {}) => compactValues({
    event_code: data.event_code !== undefined ? nullable(data.event_code) : defaults.event_code,
    event_name: data.event_name !== undefined ? String(data.event_name).trim() : defaults.event_name,
    event_type: data.event_type !== undefined ? data.event_type : defaults.event_type,
    description: data.description !== undefined ? nullable(data.description) : defaults.description,
    start_at: data.start_at !== undefined ? new Date(data.start_at) : defaults.start_at,
    end_at: data.end_at !== undefined ? (data.end_at ? new Date(data.end_at) : null) : defaults.end_at,
    location: data.location !== undefined ? nullable(data.location) : defaults.location,
    meeting_link: data.meeting_link !== undefined ? nullable(data.meeting_link) : defaults.meeting_link,
    visibility: data.visibility !== undefined ? data.visibility : defaults.visibility,
    status: data.status !== undefined ? data.status : defaults.status,
  });

  const listEvents = async (query) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listEvents({
      search: nullable(query.search),
      eventType: nullable(query.event_type),
      status: nullable(query.status),
      visibility: nullable(query.visibility),
      dateFrom: nullable(query.date_from),
      dateTo: nullable(query.date_to),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createEvent = async (data, actor) => {
    const payload = normalizeEventInput(data, { event_type: "other", visibility: "internal", status: "draft" });
    if (payload.status === "published" && (!payload.event_name || !payload.start_at)) throw BadRequest("Published event requires name and start time");
    assertEventTimes(payload.start_at, payload.end_at);
    await assertEventCodeAvailable(payload.event_code);
    payload.created_by = actor?.id || null;
    const id = await incubationRepository.createEvent(payload);
    await audit(actor, "ecosystem_event_create", "ecosystem_events", id, payload.event_name, null, payload);
    return incubationRepository.findEventById(id);
  };

  const getEvent = async (id) => getEventOrFail(id);

  const updateEvent = async (id, data, actor) => {
    const current = await getEventOrFail(id);
    const updates = normalizeEventInput(data);
    const nextStart = updates.start_at !== undefined ? updates.start_at : current.start_at;
    const nextEnd = updates.end_at !== undefined ? updates.end_at : current.end_at;
    if ((updates.status || current.status) === "published" && (!(updates.event_name || current.event_name) || !nextStart)) throw BadRequest("Published event requires name and start time");
    assertEventTimes(nextStart, nextEnd);
    if (updates.event_code !== undefined) await assertEventCodeAvailable(updates.event_code, id);
    await incubationRepository.updateEvent(id, updates);
    await audit(actor, "ecosystem_event_update", "ecosystem_events", id, current.event_name, current, updates);
    return incubationRepository.findEventById(id);
  };

  const updateEventStatus = async (id, data, actor) => {
    const event = await getEventOrFail(id);
    if (data.status === "published" && (!event.event_name || !event.start_at)) throw BadRequest("Published event requires name and start time");
    await incubationRepository.updateEvent(id, { status: data.status });
    await audit(actor, "ecosystem_event_status", "ecosystem_events", id, event.event_name, { status: event.status }, { status: data.status });
    return incubationRepository.findEventById(id);
  };

  const deleteEvent = async (id, actor) => {
    const event = await getEventOrFail(id);
    await incubationRepository.softDeleteEvent(id);
    await audit(actor, "ecosystem_event_delete", "ecosystem_events", id, event.event_name, { status: event.status }, null);
  };

  const listEventStartups = async (eventId, query) => {
    await getEventOrFail(eventId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listEventStartups(eventId, {
      participationStatus: nullable(query.participation_status),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const addEventStartup = async (eventId, data, actor) => {
    const event = await getEventOrFail(eventId);
    const startup = await getStartupOrFail(data.startup_id);
    if (["archived", "rejected"].includes(startup.startup_status)) throw BadRequest("Archived or rejected startup cannot join an event");
    if (await incubationRepository.findEventStartup(eventId, startup.id)) throw AlreadyExists("Startup is already in this event");
    const payload = {
      event_id: Number(eventId),
      startup_id: Number(startup.id),
      pitch_order: data.pitch_order === undefined || data.pitch_order === null ? null : Number(data.pitch_order),
      booth_location: nullable(data.booth_location),
      participation_status: data.participation_status || "invited",
      pitch_deck_url: nullable(data.pitch_deck_url),
      demo_url: nullable(data.demo_url),
      note: nullable(data.note),
    };
    await incubationRepository.addEventStartup(payload);
    await audit(actor, "event_startup_add", "event_startup_participants", startup.id, startup.startup_name, null, { event_id: event.id, event_name: event.event_name });
    return incubationRepository.findEventStartup(eventId, startup.id);
  };

  const deleteEventStartup = async (eventId, startupId, actor) => {
    const event = await getEventOrFail(eventId);
    const participant = await incubationRepository.findEventStartup(eventId, startupId);
    if (!participant) throw NotFound("Event startup participant");
    await incubationRepository.deleteEventStartup(eventId, startupId);
    await audit(actor, "event_startup_remove", "event_startup_participants", startupId, event.event_name, participant, null);
  };

  const listEventJudges = async (eventId, query) => {
    await getEventOrFail(eventId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listEventJudges(eventId, pagination);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const addEventJudge = async (eventId, data, actor) => {
    const event = await getEventOrFail(eventId);
    const payload = {
      event_id: Number(eventId),
      user_id: data.user_id || null,
      mentor_id: data.mentor_id || null,
      full_name: String(data.full_name).trim(),
      email: nullable(data.email),
      organization: nullable(data.organization),
      role_title: nullable(data.role_title),
      judge_type: data.judge_type || "guest",
    };
    const id = await incubationRepository.addEventJudge(payload);
    await audit(actor, "event_judge_add", "event_judges", event.id, event.event_name, null, payload);
    return incubationRepository.findEventJudgeById(id);
  };

  const deleteEventJudge = async (eventId, judgeId, actor) => {
    const event = await getEventOrFail(eventId);
    const judge = await incubationRepository.findEventJudgeById(judgeId);
    if (!judge || Number(judge.event_id) !== Number(eventId)) throw NotFound("Event judge");
    await incubationRepository.deleteEventJudge(eventId, judgeId);
    await audit(actor, "event_judge_remove", "event_judges", event.id, event.event_name, judge, null);
  };

  const listEventFeedbacks = async (eventId, query) => {
    await getEventOrFail(eventId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listEventFeedbacks(eventId, { startupId: query.startup_id || null, limit: pagination.limit, offset: pagination.offset });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createEventFeedback = async (eventId, data, actor) => {
    const event = await getEventOrFail(eventId);
    await getStartupOrFail(data.startup_id);
    if (!await incubationRepository.findEventStartup(eventId, data.startup_id)) throw BadRequest("Startup is not a participant in this event");
    if (data.judge_id) {
      const judge = await incubationRepository.findEventJudgeById(data.judge_id);
      if (!judge || Number(judge.event_id) !== Number(eventId)) throw NotFound("Event judge");
    }
    const payload = {
      event_id: Number(eventId),
      startup_id: Number(data.startup_id),
      judge_id: data.judge_id || null,
      from_user_id: actor?.id || null,
      rating: data.rating === undefined || data.rating === null ? null : Number(data.rating),
      feedback: nullable(data.feedback),
      strengths: nullable(data.strengths),
      improvements: nullable(data.improvements),
      interest_level: data.interest_level || "none",
    };
    const id = await incubationRepository.createEventFeedback(payload);
    await audit(actor, "event_feedback_create", "event_feedbacks", data.startup_id, event.event_name, null, payload);
    return incubationRepository.findEventFeedbackById(id);
  };

  const listAwards = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listAwards(startupId, pagination);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createAward = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    if (data.event_id) await getEventOrFail(data.event_id);
    const payload = {
      startup_id: Number(startupId),
      event_id: data.event_id || null,
      award_name: String(data.award_name).trim(),
      award_type: data.award_type || "other",
      description: nullable(data.description),
      awarded_at: new Date(data.awarded_at),
      evidence_url: nullable(data.evidence_url),
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createAward(payload);
    await audit(actor, "startup_award_create", "startup_awards", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findAwardById(id);
  };

  const listEventMedia = async (eventId, query) => {
    await getEventOrFail(eventId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listEventMedia(eventId, {
      mediaType: nullable(query.media_type),
      visibility: nullable(query.visibility),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createEventMedia = async (eventId, data, actor) => {
    const event = await getEventOrFail(eventId);
    if (data.startup_id) await getStartupOrFail(data.startup_id);
    const payload = {
      event_id: Number(eventId),
      startup_id: data.startup_id || null,
      media_type: data.media_type || "other",
      title: nullable(data.title),
      file_url: nullable(data.file_url),
      external_url: nullable(data.external_url),
      visibility: data.visibility || "internal",
      uploaded_by: actor?.id || null,
    };
    const id = await incubationRepository.createEventMedia(payload);
    await audit(actor, "event_media_create", "event_media", data.startup_id || event.id, event.event_name, null, payload);
    return incubationRepository.findEventMediaById(id);
  };

  const listMyStartupProfiles = async (query, actor) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStartups({ founderUserId: actor?.id, limit: pagination.limit, offset: pagination.offset });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getMyStartupProfile = async (startupId, actor) => {
    if (!await incubationRepository.userIsFounder(startupId, actor?.id)) throw Forbidden("You can only access your startup profile");
    return getStartup(startupId);
  };

  const updateMyStartupProfile = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    if (!await incubationRepository.userIsFounder(startupId, actor?.id)) throw Forbidden("You can only update your startup profile");
    if (!NON_RECREATABLE_GROUP_STATUSES.has(startup.startup_status)) throw BadRequest("Startup profile is not editable in this status");
    const updates = compactValues(Object.fromEntries(Object.keys(data).map((key) => [key, normalizeStartupInput({ ...startup, ...data })[key]])));
    delete updates.startup_status;
    delete updates.source;
    delete updates.selected_score;
    delete updates.selected_reason;
    delete updates.selected_by;
    delete updates.selected_at;
    await incubationRepository.updateStartup(startupId, updates);
    await audit(actor, "startup_founder_profile_update", "startup_profiles", startup.id, startup.startup_name, null, updates);
    return getStartup(startupId);
  };

  const normalizeAlumniLinks = async (links = []) => {
    const normalized = [];
    for (const link of links || []) {
      await getStartupOrFail(link.startup_id);
      normalized.push({
        startup_id: Number(link.startup_id),
        role: link.role || "founder",
        start_date: dateOnly(link.start_date),
        end_date: dateOnly(link.end_date),
        status: link.status || "active",
        note: nullable(link.note),
      });
    }
    return normalized;
  };

  const normalizeAlumniInput = (data) => compactValues({
    user_id: data.user_id === undefined ? undefined : data.user_id || null,
    student_id: data.student_id === undefined ? undefined : data.student_id || null,
    full_name: data.full_name !== undefined ? String(data.full_name).trim() : undefined,
    email: data.email !== undefined ? nullable(data.email) : undefined,
    phone: data.phone !== undefined ? nullable(data.phone) : undefined,
    graduation_year: data.graduation_year === undefined ? undefined : data.graduation_year === null || data.graduation_year === "" ? null : Number(data.graduation_year),
    major: data.major !== undefined ? nullable(data.major) : undefined,
    campus: data.campus !== undefined ? nullable(data.campus) : undefined,
    current_position: data.current_position !== undefined ? nullable(data.current_position) : undefined,
    current_company: data.current_company !== undefined ? nullable(data.current_company) : undefined,
    linkedin_url: data.linkedin_url !== undefined ? nullable(data.linkedin_url) : undefined,
    bio: data.bio !== undefined ? nullable(data.bio) : undefined,
    status: data.status,
  });

  const listAlumni = async (query) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listAlumni({
      search: nullable(query.search),
      status: nullable(query.status),
      graduationYear: query.graduation_year || null,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getAlumni = async (id) => {
    const alumni = await incubationRepository.findAlumniById(id);
    if (!alumni) throw NotFound("Startup alumni");
    return { ...alumni, startup_links: await incubationRepository.listAlumniLinks(id) };
  };

  const createAlumni = async (data, actor) => {
    const { startup_links: startupLinks = [], ...fields } = data;
    const payload = {
      user_id: null,
      student_id: null,
      full_name: "",
      email: null,
      phone: null,
      graduation_year: null,
      major: null,
      campus: null,
      current_position: null,
      current_company: null,
      linkedin_url: null,
      bio: null,
      status: "active",
      ...normalizeAlumniInput({ ...fields, status: fields.status || "active" }),
    };
    const links = await normalizeAlumniLinks(startupLinks);
    const id = await transaction.run(async (conn) => {
      const alumniId = await incubationRepository.createAlumni(payload, conn);
      if (links.length) await incubationRepository.replaceAlumniLinks(alumniId, links, conn);
      return alumniId;
    });
    await audit(actor, "startup_alumni_create", "startup_alumni_profiles", id, payload.full_name, null, { ...payload, startup_links: links });
    return getAlumni(id);
  };

  const updateAlumni = async (id, data, actor) => {
    const current = await getAlumni(id);
    const { startup_links: startupLinks, ...fields } = data;
    const updates = normalizeAlumniInput(fields);
    const links = startupLinks === undefined ? null : await normalizeAlumniLinks(startupLinks);
    await transaction.run(async (conn) => {
      if (Object.keys(updates).length) await incubationRepository.updateAlumni(id, updates, conn);
      if (links) await incubationRepository.replaceAlumniLinks(id, links, conn);
    });
    await audit(actor, "startup_alumni_update", "startup_alumni_profiles", id, current.full_name, current, { ...updates, startup_links: links });
    return getAlumni(id);
  };

  const deleteAlumni = async (id, actor) => {
    const current = await getAlumni(id);
    await incubationRepository.softDeleteAlumni(id);
    await audit(actor, "startup_alumni_delete", "startup_alumni_profiles", id, current.full_name, { status: current.status }, null);
  };

  const normalizePartnerInput = (data) => compactValues({
    partner_name: data.partner_name !== undefined ? String(data.partner_name).trim() : undefined,
    partner_type: data.partner_type,
    contact_person: data.contact_person !== undefined ? nullable(data.contact_person) : undefined,
    contact_email: data.contact_email !== undefined ? nullable(data.contact_email) : undefined,
    contact_phone: data.contact_phone !== undefined ? nullable(data.contact_phone) : undefined,
    website_url: data.website_url !== undefined ? nullable(data.website_url) : undefined,
    description: data.description !== undefined ? nullable(data.description) : undefined,
    focus_areas: data.focus_areas !== undefined ? (Array.isArray(data.focus_areas) ? data.focus_areas : []) : undefined,
    status: data.status,
    visibility: data.visibility,
  });

  const getPartnerOrFail = async (id) => {
    const partner = await incubationRepository.findPartnerById(id);
    if (!partner) throw NotFound("Ecosystem partner");
    return partner;
  };

  const listPartners = async (query, actor = null) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listPartners({
      search: nullable(query.search),
      partnerType: nullable(query.partner_type),
      status: nullable(query.status),
      visibility: nullable(query.visibility),
      allowedVisibility: actor && !isAdminLike(actor),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getPartner = async (id) => getPartnerOrFail(id);

  const createPartner = async (data, actor) => {
    const payload = {
      partner_name: "",
      partner_type: "other",
      contact_person: null,
      contact_email: null,
      contact_phone: null,
      website_url: null,
      description: null,
      focus_areas: [],
      status: "active",
      visibility: "internal",
      ...normalizePartnerInput(data),
      status: data.status || "active",
      visibility: data.visibility || "internal",
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createPartner(payload);
    await audit(actor, "ecosystem_partner_create", "ecosystem_partners", id, payload.partner_name, null, payload);
    return getPartner(id);
  };

  const updatePartner = async (id, data, actor) => {
    const current = await getPartnerOrFail(id);
    const updates = normalizePartnerInput(data);
    await incubationRepository.updatePartner(id, updates);
    await audit(actor, "ecosystem_partner_update", "ecosystem_partners", id, current.partner_name, current, updates);
    return getPartner(id);
  };

  const deletePartner = async (id, actor) => {
    const current = await getPartnerOrFail(id);
    await incubationRepository.softDeletePartner(id);
    await audit(actor, "ecosystem_partner_delete", "ecosystem_partners", id, current.partner_name, { status: current.status }, null);
  };

  const listStartupPartners = async (startupId, query) => {
    await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStartupPartnerConnections(startupId, {
      status: nullable(query.status),
      connectionType: nullable(query.connection_type),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createStartupPartner = async (startupId, data, actor) => {
    const startup = await getStartupOrFail(startupId);
    await getPartnerOrFail(data.partner_id);
    const payload = {
      startup_id: Number(startupId),
      partner_id: Number(data.partner_id),
      connection_type: data.connection_type || "introduction",
      status: data.status || "proposed",
      introduced_by: actor?.id || null,
      contact_date: dateOnly(data.contact_date),
      follow_up_date: dateOnly(data.follow_up_date),
      note: nullable(data.note),
      outcome: nullable(data.outcome),
    };
    const id = await incubationRepository.createStartupPartnerConnection(payload);
    await audit(actor, "startup_partner_connection_create", "startup_partner_connections", startup.id, startup.startup_name, null, payload);
    return incubationRepository.findPartnerConnectionById(id);
  };

  const updatePartnerConnectionStatus = async (id, data, actor) => {
    const current = await incubationRepository.findPartnerConnectionById(id);
    if (!current) throw NotFound("Startup partner connection");
    const updates = compactValues({
      status: data.status,
      follow_up_date: data.follow_up_date !== undefined ? dateOnly(data.follow_up_date) : undefined,
      outcome: data.outcome !== undefined ? nullable(data.outcome) : undefined,
      note: data.note !== undefined ? nullable(data.note) : undefined,
    });
    await incubationRepository.updatePartnerConnection(id, updates);
    await audit(actor, "startup_partner_connection_status", "startup_partner_connections", current.startup_id, current.startup_name, current, updates);
    return incubationRepository.findPartnerConnectionById(id);
  };

  const normalizeOpportunityInput = (data) => compactValues({
    partner_id: data.partner_id === undefined ? undefined : data.partner_id || null,
    opportunity_type: data.opportunity_type,
    title: data.title !== undefined ? String(data.title).trim() : undefined,
    description: data.description !== undefined ? nullable(data.description) : undefined,
    eligibility: data.eligibility !== undefined ? nullable(data.eligibility) : undefined,
    deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
    external_url: data.external_url !== undefined ? nullable(data.external_url) : undefined,
    status: data.status,
    visibility: data.visibility,
  });

  const getOpportunityOrFail = async (id) => {
    const opportunity = await incubationRepository.findOpportunityById(id);
    if (!opportunity) throw NotFound("Ecosystem opportunity");
    return opportunity;
  };

  const listOpportunities = async (query, actor = null, scope = "admin") => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listOpportunities({
      search: nullable(query.search),
      partnerId: query.partner_id || null,
      opportunityType: nullable(query.opportunity_type),
      status: nullable(query.status),
      visibility: nullable(query.visibility),
      studentVisible: scope === "student" || (actor && !isAdminLike(actor) && scope !== "admin"),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getOpportunity = async (id, actor = null, scope = "admin") => {
    const opportunity = await getOpportunityOrFail(id);
    if (scope === "student" && (opportunity.status !== "open" || !["internal", "public"].includes(opportunity.visibility))) throw Forbidden("Opportunity is not visible");
    return opportunity;
  };

  const createOpportunity = async (data, actor) => {
    if (data.partner_id) await getPartnerOrFail(data.partner_id);
    const payload = {
      partner_id: null,
      opportunity_type: "other",
      title: "",
      description: null,
      eligibility: null,
      deadline: null,
      external_url: null,
      status: "draft",
      visibility: "internal",
      ...normalizeOpportunityInput(data),
      status: data.status || "draft",
      visibility: data.visibility || "internal",
      created_by: actor?.id || null,
    };
    const id = await incubationRepository.createOpportunity(payload);
    await audit(actor, "ecosystem_opportunity_create", "ecosystem_opportunities", id, payload.title, null, payload);
    return getOpportunity(id);
  };

  const updateOpportunity = async (id, data, actor) => {
    const current = await getOpportunityOrFail(id);
    if (data.partner_id) await getPartnerOrFail(data.partner_id);
    const updates = normalizeOpportunityInput(data);
    await incubationRepository.updateOpportunity(id, updates);
    await audit(actor, "ecosystem_opportunity_update", "ecosystem_opportunities", id, current.title, current, updates);
    return getOpportunity(id);
  };

  const updateOpportunityStatus = async (id, data, actor) => {
    const current = await getOpportunityOrFail(id);
    await incubationRepository.updateOpportunity(id, { status: data.status });
    await audit(actor, "ecosystem_opportunity_status", "ecosystem_opportunities", id, current.title, { status: current.status }, { status: data.status });
    return getOpportunity(id);
  };

  const listStartupOpportunities = async (startupId, query, actor = null, scope = "admin") => {
    if (scope === "student") await assertFounderCanAccessStartup(startupId, actor);
    else await getStartupOrFail(startupId);
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStartupOpportunityApplications(startupId, pagination);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const applyOpportunity = async (startupId, opportunityId, data, actor, scope = "admin") => {
    const startup = await getStartupOrFail(startupId);
    if (scope === "student") await assertFounderCanAccessStartup(startupId, actor);
    const opportunity = await getOpportunity(opportunityId, actor, scope);
    if (opportunity.status !== "open") throw BadRequest("Opportunity must be open before startup can apply");
    const applicationStatus = data.application_status || "interested";
    const existing = await incubationRepository.findOpportunityApplication(startupId, opportunityId);
    const payload = {
      startup_id: Number(startupId),
      opportunity_id: Number(opportunityId),
      applied_by: actor?.id || null,
      application_status: applicationStatus,
      application_note: nullable(data.application_note),
      submitted_at: applicationStatus === "applied" ? new Date() : null,
    };
    let applicationId = existing?.id;
    if (existing) {
      await incubationRepository.updateOpportunityApplication(existing.id, compactValues({
        applied_by: actor?.id || null,
        application_status: applicationStatus,
        application_note: nullable(data.application_note),
        submitted_at: applicationStatus === "applied" ? new Date() : existing.submitted_at,
      }));
      await audit(actor, "startup_opportunity_application_update", "startup_opportunity_applications", startup.id, startup.startup_name, existing, payload);
    } else {
      applicationId = await incubationRepository.createOpportunityApplication(payload);
      await audit(actor, "startup_opportunity_application_create", "startup_opportunity_applications", startup.id, startup.startup_name, null, payload);
    }
    return incubationRepository.findOpportunityApplicationById(applicationId);
  };

  const updateOpportunityApplicationStatus = async (id, data, actor) => {
    const current = await incubationRepository.findOpportunityApplicationById(id);
    if (!current) throw NotFound("Startup opportunity application");
    const updates = {
      application_status: data.application_status,
      result_note: nullable(data.result_note),
    };
    await incubationRepository.updateOpportunityApplication(id, updates);
    await audit(actor, "startup_opportunity_application_status", "startup_opportunity_applications", current.startup_id, current.startup_name, current, updates);
    return incubationRepository.findOpportunityApplicationById(id);
  };

  const analyticsQuery = (query = {}, actor = null) => ({
    semesterId: query.semester_id || null,
    subjectId: query.subject_id || null,
    classId: query.class_id || null,
    category: nullable(query.category),
    stageId: query.stage_id || null,
    startupStatus: nullable(query.startup_status),
    productStage: nullable(query.product_stage),
    dateFrom: nullable(query.date_from),
    dateTo: nullable(query.date_to),
    lecturerId: actor && !isAdminLike(actor) ? actor.id : null,
  });

  const getAnalyticsOverview = (query, actor) => incubationRepository.getAnalyticsOverview(analyticsQuery(query, actor));
  const getPipelineAnalytics = (query, actor) => incubationRepository.getPipelineAnalytics(analyticsQuery(query, actor));
  const getProgressAnalytics = (query, actor) => incubationRepository.getProgressAnalytics(analyticsQuery(query, actor));
  const getEventAnalytics = (query, actor) => incubationRepository.getEventAnalytics(analyticsQuery(query, actor));
  const getAlumniPartnerAnalytics = (query, actor) => incubationRepository.getAlumniPartnerAnalytics(analyticsQuery(query, actor));
  const getEcosystemHealth = (query, actor) => incubationRepository.getEcosystemHealth(analyticsQuery(query, actor));

  const listStartupReports = async (query, actor) => {
    const pagination = parsePagination(query);
    const result = await incubationRepository.listStartupReports({ ...analyticsQuery(query, actor), search: nullable(query.search), limit: pagination.limit, offset: pagination.offset });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getStartupReport = async (startupId, actor = null) => {
    const startup = await getStartup(startupId);
    if (actor && !isAdminLike(actor) && startup.class_id && !await incubationRepository.userOwnsClass(actor.id, startup.class_id)) throw Forbidden("You can only view reports for your classes");
    const [metrics, progress, supportNeeds, supportActivities, partners, opportunities, awards] = await Promise.all([
      incubationRepository.listMetrics(startupId, { limit: 5, offset: 0 }),
      incubationRepository.listProgress(startupId, { limit: 5, offset: 0 }),
      incubationRepository.listSupportNeeds(startupId, { limit: 20, offset: 0 }),
      incubationRepository.listSupportActivities(startupId, { limit: 20, offset: 0 }),
      incubationRepository.listStartupPartnerConnections(startupId, { limit: 50, offset: 0 }),
      incubationRepository.listStartupOpportunityApplications(startupId, { limit: 50, offset: 0 }),
      incubationRepository.listAwards(startupId, { limit: 50, offset: 0 }),
    ]);
    return {
      startup,
      latest_metrics: metrics.rows,
      latest_progress: progress.rows,
      support_needs: supportNeeds.rows,
      support_activities: supportActivities.rows,
      partner_connections: partners.rows,
      opportunity_applications: opportunities.rows,
      awards: awards.rows,
    };
  };

  return {
    listStartups,
    getStartup,
    createStartup,
    updateStartup,
    deleteStartup,
    createStartupFromGroup,
    listSelectionReviews,
    createSelectionReview,
    reviewSelection,
    listStages,
    createStage,
    updateStage,
    updateStartupStage,
    getStartupHistory,
    listDocuments,
    initiateDocumentUpload,
    confirmDocumentUpload,
    deleteDocument,
    listMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    listProgress,
    createProgress,
    updateProgress,
    deleteProgress,
    listMetrics,
    createMetrics,
    listSupportNeeds,
    createSupportNeed,
    updateSupportNeedStatus,
    listSupportActivities,
    createSupportActivity,
    listEvents,
    createEvent,
    getEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    listEventStartups,
    addEventStartup,
    deleteEventStartup,
    listEventJudges,
    addEventJudge,
    deleteEventJudge,
    listEventFeedbacks,
    createEventFeedback,
    listAwards,
    createAward,
    listEventMedia,
    createEventMedia,
    listAlumni,
    getAlumni,
    createAlumni,
    updateAlumni,
    deleteAlumni,
    listPartners,
    getPartner,
    createPartner,
    updatePartner,
    deletePartner,
    listStartupPartners,
    createStartupPartner,
    updatePartnerConnectionStatus,
    listOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    updateOpportunityStatus,
    listStartupOpportunities,
    applyOpportunity,
    updateOpportunityApplicationStatus,
    getAnalyticsOverview,
    getPipelineAnalytics,
    getProgressAnalytics,
    getEventAnalytics,
    getAlumniPartnerAnalytics,
    getEcosystemHealth,
    listStartupReports,
    getStartupReport,
    listMyStartupProfiles,
    getMyStartupProfile,
    updateMyStartupProfile,
    listFounderProgress,
    createFounderProgress,
    listFounderSupportNeeds,
    createFounderSupportNeed,
    getMentorStartup,
    listMentorProgress,
  };
};
