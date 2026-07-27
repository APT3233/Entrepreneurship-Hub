import bcrypt from "bcryptjs";
import { OUTBOX_MENTOR_NOTIFICATION_EMAIL_DISPATCH } from "app/core/constants/outboxEventTypes.js";
import { AlreadyExists, BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { getFileProxyUrl } from "app/core/utils/file.js";
import { parsePagination } from "app/core/utils/pagination.js";

const REVIEW_STATUSES = new Set(["active", "rejected"]);
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;

const nullable = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const hasPermission = (user, permission) => (user?.permissions || []).includes(permission);

const dateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const normalizeProfileInput = (data, allowedKeys) => {
  const out = {};
  for (const key of allowedKeys) {
    if (data[key] === undefined) continue;
    if (["full_name", "email"].includes(key)) out[key] = String(data[key]).trim();
    else if (["years_of_experience", "user_id"].includes(key)) out[key] = data[key] === null || data[key] === "" ? null : Number(data[key]);
    else out[key] = nullable(data[key]);
  }
  if (out.email) out.email = normalizeEmail(out.email);
  return out;
};

const sanitizeDocument = (doc) => {
  if (!doc) return null;
  const { file_path: _filePath, ...safe } = doc;
  return safe;
};

const makeSafeName = (fileName) => String(fileName || "file")
  .replace(/[\\/]/g, "_")
  .replace(/\s+/g, "_")
  .replace(/[^a-zA-Z0-9._-]/g, "_")
  .slice(0, 180) || "file";

const compactValues = (row = {}) => Object.fromEntries(
  Object.entries(row).filter(([, value]) => value !== undefined),
);

export const createMentorService = ({ mentorRepository, outboxRepository, transaction, auditService, storageService, tokenService }) => {
  const getMentorOrFail = async (id) => {
    const mentor = await mentorRepository.findMentorById(id);
    if (!mentor) throw NotFound("Mentor");
    return mentor;
  };

  const getMyMentorOrFail = async (actor) => {
    const mentor = await mentorRepository.findMentorByUserId(actor?.id);
    if (!mentor) throw NotFound("Mentor profile");
    return mentor;
  };

  const assertCanReviewStatus = (status, actor) => {
    if (REVIEW_STATUSES.has(status) && !hasPermission(actor, "mentor.profile.review")) {
      throw Forbidden("Only reviewers can approve or reject mentors");
    }
  };

  const assertLinkedUserAvailable = async (userId, excludeMentorId = null) => {
    if (!userId) return;
    const user = await mentorRepository.findUserById(userId);
    if (!user) throw BadRequest("Linked user does not exist");
    const existing = await mentorRepository.findActiveMentorByUserId(userId, excludeMentorId);
    if (existing) throw AlreadyExists("User is already linked to another mentor profile");
  };

  const assertActiveEmailAvailable = async (email, excludeMentorId = null) => {
    const existing = await mentorRepository.findActiveMentorByEmail(email, excludeMentorId);
    if (existing) throw AlreadyExists("Active mentor email already exists");
  };

  const listMentors = async (query) => {
    const pagination = parsePagination(query);
    const result = await mentorRepository.listMentors({
      search: nullable(query.search),
      mentorType: nullable(query.mentor_type),
      status: nullable(query.status),
      visibility: nullable(query.visibility),
      expertiseId: query.expertise_id || null,
      minYears: query.min_years === "" ? null : query.min_years,
      maxYears: query.max_years === "" ? null : query.max_years,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const getMentor = async (id) => {
    const mentor = await getMentorOrFail(id);
    const [expertise, availability, documents, activityLogs] = await Promise.all([
      mentorRepository.listExpertiseForMentor(id),
      mentorRepository.listAvailabilityForMentor(id),
      mentorRepository.listDocumentsForMentor(id),
      mentorRepository.getMentorActivity(id),
    ]);
    return {
      ...mentor,
      expertise,
      availability,
      documents: documents.map(sanitizeDocument),
      activity_logs: activityLogs,
      stats: {
        status: mentor.status,
        mentor_type: mentor.mentor_type,
        total_expertise: mentor.total_expertise,
        active_availability_slots: mentor.active_availability_slots,
        total_documents: mentor.total_documents,
        total_assignments: 0,
        total_mentoring_hours: 0,
        last_updated: mentor.updated_at,
      },
    };
  };

  /** Tạo user đăng nhập cho mentor chưa có tài khoản. Username lấy từ phần trước @ của email, thêm hậu tố nếu trùng. */
  const createLoginAccount = async (payload, password, conn) => {
    const base = (payload.email.split("@")[0] || "mentor").slice(0, 50);
    let username = base;
    for (let n = 1; await mentorRepository.findUserByUsername(username, conn); n += 1) {
      const suffix = `_${n}`;
      username = `${base.slice(0, Math.max(1, 50 - suffix.length))}${suffix}`;
    }
    return mentorRepository.createUser({
      username,
      email: payload.email,
      password: await bcrypt.hash(password, 12),
      full_name: payload.full_name,
      phone: payload.phone,
      avatar_url: payload.avatar_url,
    }, conn);
  };

  const createMentor = async (data, actor) => {
    assertCanReviewStatus(data.status, actor);
    const allowed = [
      "user_id", "full_name", "email", "phone", "avatar_url", "mentor_type", "organization",
      "position_title", "bio", "years_of_experience", "linkedin_url", "portfolio_url",
      "cv_file_url", "status", "visibility",
    ];
    const payload = normalizeProfileInput(data, allowed);
    for (const key of allowed) {
      if (payload[key] === undefined) payload[key] = null;
    }
    payload.status = payload.status || "pending";
    payload.visibility = payload.visibility || "internal";
    payload.created_by = actor?.id || null;
    payload.reviewed_by = REVIEW_STATUSES.has(payload.status) ? actor?.id || null : null;
    payload.reviewed_at = REVIEW_STATUSES.has(payload.status) ? new Date() : null;

    if (payload.user_id) await assertLinkedUserAvailable(payload.user_id);
    if (payload.status === "active") await assertActiveEmailAvailable(payload.email);

    const createAccount = data.create_account !== false && !payload.user_id;
    if (createAccount) {
      if (!data.password) throw BadRequest("Cần đặt mật khẩu để tạo tài khoản đăng nhập cho mentor");
      if (await mentorRepository.findUserByEmail(payload.email)) {
        throw AlreadyExists("Email đã được dùng cho một tài khoản khác");
      }
    }

    const mentorId = await transaction.run(async (conn) => {
      if (createAccount) payload.user_id = await createLoginAccount(payload, data.password, conn);
      const id = await mentorRepository.createMentor(payload, conn);
      if (payload.user_id) await mentorRepository.assignUserRole(payload.user_id, "mentor", actor?.id, conn);
      return id;
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_create",
      tableName: "mentor_profiles",
      recordId: mentorId,
      title: payload.full_name,
      newValues: { email: payload.email, mentor_type: payload.mentor_type, status: payload.status },
    });
    const mentor = await getMentor(mentorId);
    if (!mentor.user_id) {
      mentor.warnings = ["Mentor chưa có tài khoản đăng nhập nên không truy cập được portal. Hãy liên kết user hoặc tạo tài khoản ở Access Control."];
    }
    return mentor;
  };

  const updateMentor = async (id, data, actor) => {
    const current = await getMentorOrFail(id);
    const allowed = [
      "user_id", "full_name", "email", "phone", "avatar_url", "mentor_type", "organization",
      "position_title", "bio", "years_of_experience", "linkedin_url", "portfolio_url",
      "cv_file_url", "visibility",
    ];
    const updates = normalizeProfileInput(data, allowed);
    if (updates.user_id !== undefined) await assertLinkedUserAvailable(updates.user_id, id);
    const nextEmail = updates.email || current.email;
    if (current.status === "active" && updates.email) await assertActiveEmailAvailable(nextEmail, id);

    await transaction.run(async (conn) => {
      await mentorRepository.updateMentor(id, updates, conn);
      if (updates.user_id) await mentorRepository.assignUserRole(updates.user_id, "mentor", actor?.id, conn);
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_update",
      tableName: "mentor_profiles",
      recordId: id,
      title: current.full_name,
      oldValues: { email: current.email, status: current.status },
      newValues: updates,
    });
    return getMentor(id);
  };

  /** Giữ role `mentor` của user khớp với trạng thái hồ sơ: chỉ mentor active mới được vào portal. */
  const syncMentorRole = async (userId, status, actor) => {
    if (!userId) return;
    if (status === "active") {
      await mentorRepository.assignUserRole(userId, "mentor", actor?.id || null);
      return;
    }
    await mentorRepository.revokeUserRole(userId, "mentor");
    await tokenService.revokeAllTokens(userId);
  };

  const updateMentorStatus = async (id, status, actor) => {
    const current = await getMentorOrFail(id);
    if (status === "active") await assertActiveEmailAvailable(current.email, id);
    const updates = { status };
    if (REVIEW_STATUSES.has(status)) {
      updates.reviewed_by = actor?.id || null;
      updates.reviewed_at = new Date();
    }
    await transaction.run(async (conn) => {
      await mentorRepository.updateMentor(id, updates, conn);
      if (REVIEW_STATUSES.has(status) && current.email) {
        await outboxRepository.insertWithConn(conn, {
          eventType: OUTBOX_MENTOR_NOTIFICATION_EMAIL_DISPATCH,
          payload: { kind: "profile_status", recipients: [current.email], mentorName: current.full_name, status },
        });
      }
    });
    await syncMentorRole(current.user_id, status, actor);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_status_update",
      tableName: "mentor_profiles",
      recordId: id,
      title: current.full_name,
      oldValues: { status: current.status, reviewed_by: current.reviewed_by, reviewed_at: current.reviewed_at },
      newValues: updates,
    });
    return getMentor(id);
  };

  const deleteMentor = async (id, actor) => {
    const current = await getMentorOrFail(id);
    if (await mentorRepository.countActiveAssignmentsForMentor(id)) {
      throw BadRequest("Mentor còn assignment đang hoạt động, hãy hủy hoặc kết thúc trước khi xóa");
    }
    await mentorRepository.softDeleteMentor(id);
    await syncMentorRole(current.user_id, "deleted", actor);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_delete",
      tableName: "mentor_profiles",
      recordId: id,
      title: current.full_name,
      oldValues: { status: current.status, email: current.email },
    });
  };

  const listExpertiseAreas = async (query) => {
    const pagination = parsePagination(query);
    const result = await mentorRepository.listExpertiseAreas({
      search: nullable(query.search),
      category: nullable(query.category),
      status: nullable(query.status),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createExpertiseArea = async (data, actor) => {
    const payload = compactValues({
      code: String(data.code).trim().toLowerCase(),
      name: String(data.name).trim(),
      description: nullable(data.description),
      category: data.category || "other",
      status: data.status || "active",
    });
    if (await mentorRepository.findExpertiseAreaByCode(payload.code)) throw AlreadyExists("Expertise code already exists");
    const id = await mentorRepository.createExpertiseArea(payload);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_expertise_area_create",
      tableName: "mentor_expertise_areas",
      recordId: id,
      title: payload.code,
      newValues: payload,
    });
    return mentorRepository.findExpertiseAreaById(id);
  };

  const updateExpertiseArea = async (id, data, actor) => {
    const current = await mentorRepository.findExpertiseAreaById(id);
    if (!current) throw NotFound("Expertise area");
    const updates = compactValues({
      code: data.code !== undefined ? String(data.code).trim().toLowerCase() : undefined,
      name: data.name !== undefined ? String(data.name).trim() : undefined,
      description: data.description !== undefined ? nullable(data.description) : undefined,
      category: data.category,
      status: data.status,
    });
    if (updates.code && await mentorRepository.findExpertiseAreaByCode(updates.code, id)) {
      throw AlreadyExists("Expertise code already exists");
    }
    await mentorRepository.updateExpertiseArea(id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_expertise_area_update",
      tableName: "mentor_expertise_areas",
      recordId: id,
      title: current.code,
      oldValues: current,
      newValues: updates,
    });
    return mentorRepository.findExpertiseAreaById(id);
  };

  const deleteExpertiseArea = async (id, actor) => {
    const current = await mentorRepository.findExpertiseAreaById(id);
    if (!current) throw NotFound("Expertise area");
    const usage = await mentorRepository.countExpertiseUsage(id);
    if (usage > 0) throw BadRequest("Cannot delete expertise area that is being used by mentors");
    await mentorRepository.deleteExpertiseArea(id);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_expertise_area_delete",
      tableName: "mentor_expertise_areas",
      recordId: id,
      title: current.code,
      oldValues: current,
    });
  };

  const normalizeExpertiseItems = async (items) => {
    const byId = new Map();
    for (const item of items || []) {
      byId.set(Number(item.expertise_id), {
        expertise_id: Number(item.expertise_id),
        level: item.level || "intermediate",
        years_experience: item.years_experience === null || item.years_experience === "" ? null : Number(item.years_experience || 0),
        note: nullable(item.note),
      });
    }
    const normalized = Array.from(byId.values());
    const areas = await mentorRepository.listExpertiseByIds(normalized.map((item) => item.expertise_id));
    if (areas.length !== normalized.length) throw BadRequest("One or more expertise areas do not exist");
    return normalized;
  };

  const replaceMentorExpertise = async (mentorId, items, actor) => {
    const mentor = await getMentorOrFail(mentorId);
    const normalized = await normalizeExpertiseItems(items);
    const oldValues = await mentorRepository.listExpertiseForMentor(mentorId);
    await transaction.run((conn) => mentorRepository.replaceExpertiseForMentor(mentorId, normalized, conn));
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_expertise_replace",
      tableName: "mentor_expertise_map",
      recordId: mentorId,
      title: mentor.full_name,
      oldValues,
      newValues: normalized,
    });
    return mentorRepository.listExpertiseForMentor(mentorId);
  };

  const getMentorExpertise = async (mentorId) => {
    await getMentorOrFail(mentorId);
    return mentorRepository.listExpertiseForMentor(mentorId);
  };

  const normalizeAvailabilityItems = (items) => (items || []).map((item) => {
    const start = nullable(item.start_time);
    const end = nullable(item.end_time);
    if (start && end && start >= end) throw BadRequest("Availability start time must be before end time");
    return {
      day_of_week: item.day_of_week === null || item.day_of_week === "" ? null : Number(item.day_of_week),
      start_time: start,
      end_time: end,
      timezone: nullable(item.timezone) || "Asia/Ho_Chi_Minh",
      available_from: dateOnly(item.available_from),
      available_to: dateOnly(item.available_to),
      max_sessions_per_week: item.max_sessions_per_week === null || item.max_sessions_per_week === "" ? null : Number(item.max_sessions_per_week),
      note: nullable(item.note),
      status: item.status || "active",
    };
  });

  const getMentorAvailability = async (mentorId) => {
    await getMentorOrFail(mentorId);
    return mentorRepository.listAvailabilityForMentor(mentorId);
  };

  const replaceMentorAvailability = async (mentorId, items, actor) => {
    const mentor = await getMentorOrFail(mentorId);
    const normalized = normalizeAvailabilityItems(items);
    const oldValues = await mentorRepository.listAvailabilityForMentor(mentorId);
    await transaction.run((conn) => mentorRepository.replaceAvailabilityForMentor(mentorId, normalized, conn));
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_availability_replace",
      tableName: "mentor_availability",
      recordId: mentorId,
      title: mentor.full_name,
      oldValues,
      newValues: normalized,
    });
    return mentorRepository.listAvailabilityForMentor(mentorId);
  };

  const getMentorDocuments = async (mentorId) => {
    await getMentorOrFail(mentorId);
    const rows = await mentorRepository.listDocumentsForMentor(mentorId);
    return rows.map(sanitizeDocument);
  };

  const listAllDocuments = async (query) => {
    const pagination = parsePagination(query);
    const result = await mentorRepository.listAllDocuments({
      search: nullable(query.search),
      mentorId: query.mentor_id || null,
      documentType: nullable(query.document_type),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return { data: result.rows.map(sanitizeDocument), ...pagination, total: result.total };
  };

  const initiateDocumentUpload = async (mentorId, file, documentType, actor) => {
    const mentor = await getMentorOrFail(mentorId);
    if (Number(file.size) > MAX_DOCUMENT_SIZE) throw BadRequest("Mentor document exceeds 25MB limit");
    const safeName = makeSafeName(file.name);
    const objectKey = `mentors/documents/${mentor.id}/${Date.now()}_${safeName}`;
    const uploadUrl = await storageService.generatePresignedPutUrl(objectKey, 900);
    const uploadToken = tokenService.signPayload({
      p: "mentor_document_upload",
      m: Number(mentor.id),
      u: Number(actor?.id),
      d: documentType || "other",
      k: objectKey,
      n: safeName,
      t: file.type || "application/octet-stream",
      s: Number(file.size),
    }, "15m");
    return { uploadToken, uploadUrl, fileName: safeName };
  };

  const confirmDocumentUpload = async (mentorId, uploadToken, actor) => {
    const mentor = await getMentorOrFail(mentorId);
    let payload;
    try {
      payload = tokenService.verifyPayload(uploadToken);
    } catch {
      throw BadRequest("Upload token is invalid");
    }
    if (payload?.p !== "mentor_document_upload") throw BadRequest("Upload token is not for mentor documents");
    if (Number(payload.m) !== Number(mentor.id)) throw Forbidden("Upload token does not belong to this mentor");
    if (Number(payload.u) !== Number(actor?.id)) throw Forbidden("Upload token does not belong to you");
    const stat = await storageService.statObject(payload.k);
    if (!stat) throw BadRequest("Uploaded file was not found in storage");

    const fileUrl = getFileProxyUrl(payload.k, payload.n);
    const documentId = await transaction.run(async (conn) => {
      const id = await mentorRepository.createDocument({
        mentor_id: Number(mentor.id),
        document_type: payload.d || "other",
        file_name: payload.n,
        file_url: fileUrl,
        file_path: payload.k,
        mime_type: payload.t || "application/octet-stream",
        file_size: Number(payload.s || stat.size || 0),
        uploaded_by: actor?.id || null,
      }, conn);
      if (["cv", "resume"].includes(payload.d)) {
        await mentorRepository.updateMentor(mentor.id, { cv_file_url: fileUrl }, conn);
      }
      return id;
    });

    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_document_upload",
      tableName: "mentor_documents",
      recordId: mentor.id,
      title: mentor.full_name,
      newValues: { document_id: documentId, document_type: payload.d, file_name: payload.n, file_size: payload.s },
    });
    return sanitizeDocument(await mentorRepository.findDocumentById(documentId));
  };

  const deleteDocument = async (mentorId, documentId, actor) => {
    const mentor = await getMentorOrFail(mentorId);
    const doc = await mentorRepository.findDocumentById(documentId);
    if (!doc || Number(doc.mentor_id) !== Number(mentorId)) throw NotFound("Mentor document");
    await mentorRepository.softDeleteDocument(documentId);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_document_delete",
      tableName: "mentor_documents",
      recordId: mentor.id,
      title: mentor.full_name,
      oldValues: { document_id: doc.id, document_type: doc.document_type, file_name: doc.file_name },
    });
  };

  const getMyProfile = async (actor) => getMentor(await getMyMentorOrFail(actor).then((mentor) => mentor.id));

  const updateMyProfile = async (data, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    const allowed = [
      "full_name", "email", "phone", "avatar_url", "mentor_type", "organization", "position_title",
      "bio", "years_of_experience", "linkedin_url", "portfolio_url", "cv_file_url", "visibility",
    ];
    const updates = normalizeProfileInput(data, allowed);
    if (mentor.status === "active" && updates.email) await assertActiveEmailAvailable(updates.email, mentor.id);
    await mentorRepository.updateMentor(mentor.id, updates);
    await auditService.log({
      userId: actor?.id || null,
      action: "mentor_self_profile_update",
      tableName: "mentor_profiles",
      recordId: mentor.id,
      title: mentor.full_name,
      newValues: updates,
    });
    return getMentor(mentor.id);
  };

  const getMyExpertise = async (actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return getMentorExpertise(mentor.id);
  };

  const replaceMyExpertise = async (items, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return replaceMentorExpertise(mentor.id, items, actor);
  };

  const getMyAvailability = async (actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return getMentorAvailability(mentor.id);
  };

  const replaceMyAvailability = async (items, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return replaceMentorAvailability(mentor.id, items, actor);
  };

  const getMyDocuments = async (actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return getMentorDocuments(mentor.id);
  };

  const initiateMyDocumentUpload = async (file, documentType, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return initiateDocumentUpload(mentor.id, file, documentType, actor);
  };

  const confirmMyDocumentUpload = async (uploadToken, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return confirmDocumentUpload(mentor.id, uploadToken, actor);
  };

  const deleteMyDocument = async (documentId, actor) => {
    const mentor = await getMyMentorOrFail(actor);
    return deleteDocument(mentor.id, documentId, actor);
  };

  const provisionProfileForUser = async (userId, user, actor, conn) => {
    const existing = await mentorRepository.findMentorByUserId(userId);
    const activate = user.account_status === "active";
    if (existing) {
      if (existing.status === "pending" && activate) {
        await assertActiveEmailAvailable(existing.email, existing.id);
        await mentorRepository.updateMentor(existing.id, {
          status: "active",
          reviewed_by: actor?.id || null,
          reviewed_at: new Date(),
        }, conn);
      }
      return mentorRepository.findMentorByUserId(userId);
    }
    const status = activate ? "active" : "pending";
    if (status === "active") await assertActiveEmailAvailable(user.email);
    await mentorRepository.createMentor({
      user_id: Number(userId),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || null,
      avatar_url: user.avatar_url || null,
      mentor_type: "business",
      organization: null,
      position_title: null,
      bio: null,
      years_of_experience: null,
      linkedin_url: null,
      portfolio_url: null,
      cv_file_url: null,
      status,
      visibility: "internal",
      created_by: actor?.id || null,
      reviewed_by: activate ? (actor?.id || null) : null,
      reviewed_at: activate ? new Date() : null,
    }, conn);
    return mentorRepository.findMentorByUserId(userId);
  };

  return {
    listMentors,
    getMentor,
    createMentor,
    updateMentor,
    updateMentorStatus,
    deleteMentor,
    listExpertiseAreas,
    createExpertiseArea,
    updateExpertiseArea,
    deleteExpertiseArea,
    getMentorExpertise,
    replaceMentorExpertise,
    getMentorAvailability,
    replaceMentorAvailability,
    getMentorDocuments,
    listAllDocuments,
    initiateDocumentUpload,
    confirmDocumentUpload,
    deleteDocument,
    getMyProfile,
    updateMyProfile,
    getMyExpertise,
    replaceMyExpertise,
    getMyAvailability,
    replaceMyAvailability,
    getMyDocuments,
    initiateMyDocumentUpload,
    confirmMyDocumentUpload,
    deleteMyDocument,
    provisionProfileForUser,
  };
};
