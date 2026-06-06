import { BadRequest, Forbidden, NotFound } from "app/core/errors/errorFactory.js";
import { chatCompletion } from "app/core/ai/aiClient.js";
import { parseAiJson } from "app/core/ai/aiJsonExtractor.js";
import { getActiveProvider } from "app/core/ai/aiProviderManager.js";
import { logger } from "app/core/logger/index.js";
import { parsePagination } from "app/core/utils/pagination.js";

const roles = (actor) => (actor?.roles || []).map((role) => String(role).toLowerCase());
const hasRole = (actor, ...allowed) => roles(actor).some((role) => allowed.includes(role));
const isAdminOrDept = (actor) => hasRole(actor, "admin", "department_head");
const nullable = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const tokenize = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((item) => item.length >= 3);
const overlapRatio = (left, right) => {
  const a = new Set(left);
  const b = new Set(right);
  if (!a.size || !b.size) return 0;
  let matches = 0;
  a.forEach((item) => { if (b.has(item)) matches += 1; });
  return matches / Math.min(a.size, b.size);
};
const matchLevel = (score) => (score >= 85 ? "excellent" : score >= 70 ? "high" : score >= 50 ? "medium" : "low");
const assignmentTypeFor = (request) => {
  if (request.preferred_mentor_type === "business") return "business";
  if (request.preferred_mentor_type === "technical") return "technical";
  return "supporting";
};

const FACTORS = [
  ["expertise_match", "Expertise match", 35],
  ["mentor_type_fit", "Mentor type fit", 15],
  ["project_topic_match", "Project category/topic match", 15],
  ["availability", "Availability", 10],
  ["workload", "Current workload", 10],
  ["feedback", "Previous feedback", 10],
  ["conflict", "Same group/class conflict", 5],
];

const buildBreakdown = (scores) => FACTORS.map(([code, name, weight]) => ({
  factor_code: code,
  factor_name: name,
  score: clamp(scores[code]?.score),
  weight,
  reason: scores[code]?.reason || null,
}));

const finalScore = (breakdown) => Number(breakdown.reduce((sum, item) => sum + (Number(item.score) * Number(item.weight)) / 100, 0).toFixed(2));

const typeScore = (mentor, preferred) => {
  if (!preferred || preferred === "any") return { score: 80, reason: "No preferred mentor type specified." };
  if (mentor.mentor_type === preferred) return { score: 100, reason: `Mentor type matches ${preferred}.` };
  if (preferred === "business" && mentor.expertise.some((item) => item.category === "business")) return { score: 75, reason: "Business expertise exists even though mentor type differs." };
  if (preferred === "technical" && mentor.expertise.some((item) => ["technical", "ai", "data"].includes(item.category))) return { score: 75, reason: "Technical expertise exists even though mentor type differs." };
  return { score: 35, reason: `Mentor type is ${mentor.mentor_type}, preferred ${preferred}.` };
};

const expertiseScore = (mentor, requiredExpertise, contextTokens) => {
  if (requiredExpertise.length) {
    const requiredIds = new Set(requiredExpertise.map((item) => Number(item.id)));
    const matched = mentor.expertise.filter((item) => requiredIds.has(Number(item.id)));
    const ratio = matched.length / requiredExpertise.length;
    return {
      score: Math.round(ratio * 100),
      reason: matched.length ? `Matched ${matched.length}/${requiredExpertise.length} required expertise areas.` : "No required expertise area matched.",
    };
  }
  const expertiseTokens = mentor.expertise.flatMap((item) => tokenize(`${item.code} ${item.name} ${item.category}`));
  const ratio = overlapRatio(expertiseTokens, contextTokens);
  if (!contextTokens.length) return { score: 45, reason: "Project/support text is limited; confidence reduced." };
  return { score: Math.round(Math.min(1, ratio * 2) * 100), reason: ratio ? "Expertise keywords overlap with project/support text." : "No clear expertise keyword overlap found." };
};

const topicScore = (mentor, request, contextTokens) => {
  const expertiseTokens = mentor.expertise.flatMap((item) => tokenize(`${item.code} ${item.name} ${item.category}`));
  const categoryTokens = tokenize(request.category);
  const ratio = overlapRatio([...expertiseTokens, mentor.mentor_type], [...contextTokens, ...categoryTokens]);
  return { score: Math.round(Math.min(1, ratio * 2) * 100), reason: ratio ? "Mentor expertise/type aligns with project category or topic terms." : "No strong project category/topic alignment found." };
};

const availabilityScore = (mentor) => {
  if (!mentor.active_availability_count) return { score: 45, reason: "No active availability slots recorded." };
  if (mentor.max_sessions_per_week && mentor.scheduled_session_count >= mentor.max_sessions_per_week) return { score: 35, reason: "Scheduled sessions are at or above mentor weekly capacity." };
  return { score: 100, reason: `${mentor.active_availability_count} active availability slot(s) recorded.` };
};

const workloadScore = (mentor) => {
  const count = Number(mentor.active_assignment_count || 0);
  if (count <= 1) return { score: 100, reason: "Low active assignment workload." };
  if (count <= 3) return { score: 75, reason: "Normal active assignment workload." };
  if (count <= 5) return { score: 45, reason: "High active assignment workload; review before assigning." };
  return { score: 15, reason: "Mentor appears overloaded." };
};

const feedbackScore = (mentor) => {
  if (mentor.average_rating == null) return { score: 60, reason: "No previous mentor rating; confidence reduced." };
  return { score: Math.round(clamp(mentor.average_rating, 0, 5) * 20), reason: `Average previous rating is ${Number(mentor.average_rating).toFixed(1)}/5.` };
};

export const createMentorMatchingService = ({ mentorMatchingRepository, mentorWorkflowService, auditService }) => {
  const assertLecturerOwnsClass = async (actor, classId) => {
    if (isAdminOrDept(actor)) return;
    if (!hasRole(actor, "lecturer")) throw Forbidden("Lecturer access required");
    if (!await mentorMatchingRepository.userOwnsClass(actor.id, classId)) throw Forbidden("Class does not belong to you");
  };

  const assertRequestAccess = async (actor, request) => {
    if (!request) throw NotFound("Mentor matching request");
    if (!isAdminOrDept(actor)) await assertLecturerOwnsClass(actor, request.class_id);
  };

  const listRequests = async (query, actor) => {
    const pagination = parsePagination(query);
    const filters = {
      groupId: query.group_id || null,
      classId: query.class_id || null,
      semesterId: query.semester_id || null,
      status: nullable(query.status),
      priority: nullable(query.priority),
      search: nullable(query.search),
      limit: pagination.limit,
      offset: pagination.offset,
    };
    if (!isAdminOrDept(actor)) filters.lecturerId = actor.id;
    const result = await mentorMatchingRepository.listRequests(filters);
    return { data: result.rows, ...pagination, total: result.total };
  };

  const createRequest = async (data, actor) => {
    const group = await mentorMatchingRepository.findGroupContext(data.group_id);
    if (!group) throw NotFound("Group");
    await assertLecturerOwnsClass(actor, group.class_id);
    const payload = {
      group_id: Number(group.id),
      class_id: Number(group.class_id),
      semester_id: Number(group.semester_id),
      requested_by: actor?.id || null,
      support_needed: String(data.support_needed).trim(),
      preferred_mentor_type: data.preferred_mentor_type || "any",
      required_expertise: data.required_expertise || null,
      priority: data.priority || "normal",
      status: "pending",
    };
    const id = await mentorMatchingRepository.createRequest(payload);
    await auditService.log({ userId: actor?.id || null, action: "mentor_matching_request_create", tableName: "mentor_matching_requests", recordId: id, newValues: payload });
    return getRequest(id, actor);
  };

  const getRequest = async (id, actor) => {
    const request = await mentorMatchingRepository.findRequestById(id);
    await assertRequestAccess(actor, request);
    const suggestions = await mentorMatchingRepository.listSuggestions(id);
    return { ...request, suggestions };
  };

  const scoreCandidate = async (request, mentor, requiredExpertise) => {
    const contextTokens = tokenize(`${request.topic} ${request.topic_desc} ${request.category} ${request.support_needed}`);
    const conflictCount = await mentorMatchingRepository.countOpenAssignmentForPair(mentor.id, request.group_id);
    const scores = {
      expertise_match: expertiseScore(mentor, requiredExpertise, contextTokens),
      mentor_type_fit: typeScore(mentor, request.preferred_mentor_type),
      project_topic_match: topicScore(mentor, request, contextTokens),
      availability: availabilityScore(mentor),
      workload: workloadScore(mentor),
      feedback: feedbackScore(mentor),
      conflict: conflictCount ? { score: 0, reason: "Mentor already has an open assignment for this group." } : { score: 100, reason: "No open assignment conflict for this group." },
    };
    const breakdown = buildBreakdown(scores);
    const score = finalScore(breakdown);
    const risks = [];
    if (mentor.active_assignment_count >= 4) risks.push("High current mentor workload.");
    if (!mentor.active_availability_count) risks.push("Availability data is missing.");
    if (conflictCount) risks.push("Existing open assignment with this group.");
    return {
      request_id: Number(request.id),
      mentor_id: Number(mentor.id),
      score,
      match_level: matchLevel(score),
      reason: `${mentor.full_name} scored ${score}/100 from rule-based matching. ${scores.expertise_match.reason}`,
      strengths: mentor.expertise.slice(0, 5).map((item) => item.name),
      risks,
      matching_method: "rule_based",
      recommended_assignment_type: assignmentTypeFor(request),
      model_name: null,
      provider_key: null,
      breakdown,
      mentor,
    };
  };

  const buildAiMessages = (request, candidates, requiredExpertise) => ([
    {
      role: "system",
      content: "You suggest mentors for university startup project groups. Return only valid JSON. Do not use markdown. Do not invent missing information. AI suggestions are advisory only and must not auto-assign mentors.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "Rank candidate mentors for this project group.",
        output_schema: {
          suggestions: [{ mentor_id: 1, score: 86, match_level: "high", reason: "string", strengths: ["string"], risks: ["string"], recommended_assignment_type: "business/technical/primary/supporting" }],
        },
        rules: [
          "Use only provided data.",
          "If data is missing, mention that as a risk.",
          "Do not decide or assign mentors automatically.",
          "Scores must be 0..100.",
        ],
        group: {
          id: request.group_id,
          name: request.group_name,
          topic: request.topic,
          topic_desc: request.topic_desc,
          category: request.category,
          support_needed: request.support_needed,
          preferred_mentor_type: request.preferred_mentor_type,
          required_expertise: requiredExpertise,
        },
        candidates: candidates.map((item) => ({
          mentor_id: item.mentor.id,
          full_name: item.mentor.full_name,
          mentor_type: item.mentor.mentor_type,
          organization: item.mentor.organization,
          position_title: item.mentor.position_title,
          expertise: item.mentor.expertise.map((expertise) => ({ code: expertise.code, name: expertise.name, category: expertise.category, level: expertise.level })),
          workload: { active_assignments: item.mentor.active_assignment_count, scheduled_sessions: item.mentor.scheduled_session_count },
          availability: { active_slots: item.mentor.active_availability_count, max_sessions_per_week: item.mentor.max_sessions_per_week },
          previous_feedback: { average_rating: item.mentor.average_rating },
          rule_based_score: item.score,
        })),
      }),
    },
  ]);

  const applyAiSuggestions = async (request, scored, requiredExpertise) => {
    const provider = getActiveProvider();
    const rawText = await chatCompletion({
      providerKey: provider.key,
      model: provider.model,
      stream: false,
      temperature: 0.1,
      maxTokens: 1800,
      messages: buildAiMessages(request, scored.slice(0, 15), requiredExpertise),
      responseFormat: { type: "json_object" },
    });
    const parsed = parseAiJson(rawText);
    const byMentor = new Map(scored.map((item) => [Number(item.mentor_id), item]));
    for (const item of Array.isArray(parsed?.suggestions) ? parsed.suggestions : []) {
      const suggestion = byMentor.get(Number(item?.mentor_id));
      if (!suggestion) continue;
      const aiScore = clamp(item.score);
      const hybridScore = Number(((suggestion.score + aiScore) / 2).toFixed(2));
      suggestion.score = hybridScore;
      suggestion.match_level = ["low", "medium", "high", "excellent"].includes(item.match_level) ? item.match_level : matchLevel(hybridScore);
      suggestion.reason = nullable(item.reason) || suggestion.reason;
      suggestion.strengths = Array.isArray(item.strengths) ? item.strengths.slice(0, 6).map(String) : suggestion.strengths;
      suggestion.risks = Array.isArray(item.risks) ? item.risks.slice(0, 6).map(String) : suggestion.risks;
      suggestion.recommended_assignment_type = ["primary", "supporting", "business", "technical"].includes(item.recommended_assignment_type) ? item.recommended_assignment_type : suggestion.recommended_assignment_type;
      suggestion.matching_method = "hybrid";
      suggestion.model_name = provider.model;
      suggestion.provider_key = provider.key;
    }
    return { provider_key: provider.key, model_name: provider.model };
  };

  const generateSuggestions = async (id, body, actor) => {
    const request = await mentorMatchingRepository.findRequestById(id);
    await assertRequestAccess(actor, request);
    const [requiredExpertise, candidates] = await Promise.all([
      mentorMatchingRepository.listRequiredExpertise(request.required_expertise || []),
      mentorMatchingRepository.listCandidateMentors(),
    ]);
    const scored = [];
    for (const mentor of candidates) scored.push(await scoreCandidate(request, mentor, requiredExpertise));
    scored.sort((a, b) => b.score - a.score);

    const warnings = [];
    if (["ai", "hybrid"].includes(body.matching_method || "hybrid")) {
      try {
        await applyAiSuggestions(request, scored, requiredExpertise);
        scored.sort((a, b) => b.score - a.score);
      } catch (err) {
        warnings.push("AI matching failed; rule-based suggestions were used.");
        logger.warn("[MentorMatching] AI matching fallback", { requestId: Number(id), message: err?.message });
      }
    }

    await mentorMatchingRepository.deleteSuggestionsForRequest(id);
    const limit = Number(body.limit || 10);
    for (const suggestion of scored.slice(0, limit)) {
      await mentorMatchingRepository.createSuggestion({
        request_id: suggestion.request_id,
        mentor_id: suggestion.mentor_id,
        score: suggestion.score,
        match_level: suggestion.match_level,
        reason: suggestion.reason,
        strengths: suggestion.strengths,
        risks: suggestion.risks,
        matching_method: suggestion.matching_method,
        recommended_assignment_type: suggestion.recommended_assignment_type,
        model_name: suggestion.model_name,
        provider_key: suggestion.provider_key,
      }, suggestion.breakdown);
    }
    await mentorMatchingRepository.updateRequestStatus(id, "generated");
    await auditService.log({ userId: actor?.id || null, action: "mentor_matching_generate", tableName: "mentor_matching_requests", recordId: id, newValues: { matching_method: body.matching_method || "hybrid", warnings } });
    return { ...(await getRequest(id, actor)), warnings };
  };

  const listSuggestions = async (id, actor) => {
    const request = await mentorMatchingRepository.findRequestById(id);
    await assertRequestAccess(actor, request);
    return mentorMatchingRepository.listSuggestions(id);
  };

  const recordAction = async (suggestionId, data, actor) => {
    const suggestion = await mentorMatchingRepository.findSuggestionById(suggestionId);
    if (!suggestion) throw NotFound("Mentor matching suggestion");
    const request = await mentorMatchingRepository.findRequestById(suggestion.request_id);
    await assertRequestAccess(actor, request);
    const actionId = await mentorMatchingRepository.createAction({ suggestion_id: Number(suggestionId), user_id: actor?.id || null, action: data.action, note: nullable(data.note) });
    const statusByAction = { approved: "approved", rejected: "rejected" };
    if (statusByAction[data.action]) await mentorMatchingRepository.updateRequestStatus(request.id, statusByAction[data.action]);
    await auditService.log({ userId: actor?.id || null, action: "mentor_matching_action", tableName: "mentor_matching_actions", recordId: actionId, newValues: { suggestion_id: Number(suggestionId), action: data.action } });
    return { id: actionId, suggestion_id: Number(suggestionId), action: data.action };
  };

  const convertToAssignment = async (suggestionId, data, actor) => {
    const suggestion = await mentorMatchingRepository.findSuggestionById(suggestionId);
    if (!suggestion) throw NotFound("Mentor matching suggestion");
    const request = await mentorMatchingRepository.findRequestById(suggestion.request_id);
    await assertRequestAccess(actor, request);
    if (await mentorMatchingRepository.countOpenAssignmentForPair(suggestion.mentor_id, request.group_id)) {
      throw BadRequest("Mentor already has an open assignment for this group");
    }
    const assignment = await mentorWorkflowService.createAssignment({
      group_id: request.group_id,
      mentor_id: suggestion.mentor_id,
      assignment_type: data.assignment_type || suggestion.recommended_assignment_type || "supporting",
      status: data.status || "proposed",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      expected_sessions: data.expected_sessions ?? null,
      note: data.note || `Converted from mentor matching suggestion #${suggestionId}`,
    }, actor);
    const actionId = await mentorMatchingRepository.createAction({ suggestion_id: Number(suggestionId), user_id: actor?.id || null, action: "converted_to_assignment", note: nullable(data.note) });
    await mentorMatchingRepository.updateRequestStatus(request.id, "converted_to_assignment");
    await auditService.log({ userId: actor?.id || null, action: "mentor_matching_convert_to_assignment", tableName: "mentor_matching_actions", recordId: actionId, newValues: { suggestion_id: Number(suggestionId), assignment_id: assignment.id } });
    return { assignment, action_id: actionId };
  };

  return {
    listRequests,
    createRequest,
    getRequest,
    generateSuggestions,
    listSuggestions,
    recordAction,
    convertToAssignment,
  };
};
