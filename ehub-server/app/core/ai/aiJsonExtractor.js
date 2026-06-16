import { createAiError, AiErrorCodes } from "./aiErrors.js";

const asArray = (value) => (Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : []);
const asNullableString = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};
const asConfidence = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(1, number));
};
const asNullableScore = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const criterionIdOf = (criterion) => Number(criterion?.id);
const defaultCriterionSuggestion = (criterion) => ({
  criterion_id: criterionIdOf(criterion),
  suggested_score: null,
  suggested_feedback: `AI không trả về đánh giá cho tiêu chí "${criterion?.name || criterionIdOf(criterion)}". Giảng viên cần tự kiểm tra tiêu chí này.`,
  evidence_text: null,
  confidence_score: null,
});

const findFirstJsonObject = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const first = raw.indexOf("{");
  if (first < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = first; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) return raw.slice(first, i + 1);
  }
  return null;
};

export const parseAiJson = (rawText) => {
  const raw = String(rawText || "").trim();
  if (!raw) throw createAiError(AiErrorCodes.EMPTY_RESPONSE, "AI returned an empty response.");
  try {
    return JSON.parse(raw);
  } catch {
    const jsonText = findFirstJsonObject(raw);
    if (!jsonText) throw createAiError(AiErrorCodes.INVALID_JSON, "AI response did not contain a valid JSON object.");
    try {
      return JSON.parse(jsonText);
    } catch {
      throw createAiError(AiErrorCodes.INVALID_JSON, "AI response JSON could not be parsed.");
    }
  }
};

export const normalizeAiSuggestionJson = (rawText, criteria = []) => {
  const parsed = parseAiJson(rawText);
  const warnings = [];
  const orderedCriteria = criteria
    .map((criterion) => ({ ...criterion, id: criterionIdOf(criterion) }))
    .filter((criterion) => Number.isFinite(criterion.id));
  const byCriterion = new Map(orderedCriteria.map((criterion) => [criterion.id, criterion]));

  const suggestionByCriterion = new Map();
  for (const item of Array.isArray(parsed.criterion_suggestions) ? parsed.criterion_suggestions : []) {
    const criterionId = Number(item?.criterion_id);
    const criterion = byCriterion.get(criterionId);
    if (!criterion) {
      warnings.push({ code: "unknown_criterion", criterion_id: item?.criterion_id ?? null });
      continue;
    }
    if (suggestionByCriterion.has(criterionId)) {
      warnings.push({ code: "duplicate_criterion", criterion_id: criterionId });
      continue;
    }
    let suggestedScore = asNullableScore(item?.suggested_score);
    if (item?.suggested_score !== null && item?.suggested_score !== undefined && item?.suggested_score !== "" && suggestedScore === null) {
      warnings.push({ code: "invalid_score", criterion_id: criterionId });
    }
    if (suggestedScore !== null && suggestedScore > Number(criterion.max_score)) {
      warnings.push({ code: "score_exceeds_max", criterion_id: criterionId, max_score: Number(criterion.max_score) });
      suggestedScore = null;
    }
    suggestionByCriterion.set(criterionId, {
      criterion_id: criterionId,
      suggested_score: suggestedScore,
      suggested_feedback: asNullableString(item?.suggested_feedback) || "Không đủ dữ liệu để đưa ra feedback.",
      evidence_text: asNullableString(item?.evidence_text),
      confidence_score: asConfidence(item?.confidence_score),
    });
  }

  const criterionSuggestions = orderedCriteria.map((criterion) => {
    const suggestion = suggestionByCriterion.get(criterion.id);
    if (suggestion) return suggestion;
    warnings.push({ code: "missing_criterion_suggestion", criterion_id: criterion.id });
    return defaultCriterionSuggestion(criterion);
  });

  const summary = asNullableString(parsed.summary);
  const overallFeedback = asNullableString(parsed.suggested_overall_feedback);
  if (!summary || !overallFeedback) {
    throw createAiError(AiErrorCodes.INVALID_JSON, "AI JSON is missing required summary or suggested_overall_feedback.");
  }

  return {
    data: {
      summary,
      strengths: asArray(parsed.strengths),
      weaknesses: asArray(parsed.weaknesses),
      missing_requirements: asArray(parsed.missing_requirements),
      criterion_suggestions: criterionSuggestions,
      suggested_overall_feedback: overallFeedback,
      suggested_total_score: asNullableScore(parsed.suggested_total_score),
      confidence_score: asConfidence(parsed.confidence_score),
      project_potential_level: asNullableString(parsed.project_potential_level),
      project_potential_reasons: asArray(parsed.project_potential_reasons),
      project_potential_next_steps: asArray(parsed.project_potential_next_steps),
      project_potential_confidence_score: asConfidence(parsed.project_potential_confidence_score),
    },
    warnings,
  };
};
