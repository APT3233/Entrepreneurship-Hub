let normalizeAiSuggestionJson;
let parseAiJson;

beforeAll(async () => {
  ({ normalizeAiSuggestionJson, parseAiJson } = await import("../aiJsonExtractor.js"));
});

const criteria = [
  { id: 1, max_score: 2 },
  { id: 2, max_score: 3 },
];

const validPayload = {
  summary: "Bài nộp mô tả rõ ý tưởng chính.",
  strengths: ["Có vấn đề khách hàng rõ"],
  weaknesses: ["Thiếu số liệu kiểm chứng"],
  missing_requirements: [],
  criterion_suggestions: [
    {
      criterion_id: 1,
      suggested_score: 1.5,
      suggested_feedback: "Đạt phần lớn yêu cầu.",
      evidence_text: "Nhóm nêu khách hàng mục tiêu.",
      confidence_score: 0.75,
    },
  ],
  suggested_overall_feedback: "Nên bổ sung validation.",
  suggested_total_score: 1.5,
  confidence_score: 0.7,
};

describe("parseAiJson", () => {
  it("parses strict JSON", () => {
    expect(parseAiJson(JSON.stringify(validPayload))).toMatchObject({ summary: validPayload.summary });
  });

  it("extracts the first JSON object from noisy text", () => {
    const parsed = parseAiJson(`prefix ${JSON.stringify(validPayload)} suffix`);
    expect(parsed.summary).toBe(validPayload.summary);
  });

  it("rejects text without a JSON object", () => {
    expect(() => parseAiJson("not json")).toThrow(expect.objectContaining({ aiCode: "invalid_ai_json" }));
  });
});

describe("normalizeAiSuggestionJson", () => {
  it("normalizes valid AI suggestion JSON", () => {
    const output = normalizeAiSuggestionJson(JSON.stringify(validPayload), criteria);

    expect(output.data.summary).toBe(validPayload.summary);
    expect(output.data.criterion_suggestions).toHaveLength(1);
    expect(output.data.criterion_suggestions[0]).toMatchObject({
      criterion_id: 1,
      suggested_score: 1.5,
      confidence_score: 0.75,
    });
    expect(output.warnings).toEqual([]);
  });

  it("ignores unknown criteria and rejects scores above max_score", () => {
    const output = normalizeAiSuggestionJson(JSON.stringify({
      ...validPayload,
      criterion_suggestions: [
        { criterion_id: 99, suggested_score: 1, suggested_feedback: "unknown" },
        { criterion_id: 1, suggested_score: 9, suggested_feedback: "too high" },
        { criterion_id: 2, suggested_score: 2.5, suggested_feedback: "ok" },
      ],
    }), criteria);

    expect(output.data.criterion_suggestions).toEqual([
      expect.objectContaining({ criterion_id: 2, suggested_score: 2.5 }),
    ]);
    expect(output.warnings).toEqual([
      { code: "unknown_criterion", criterion_id: 99 },
      { code: "score_exceeds_max", criterion_id: 1, max_score: 2 },
    ]);
  });

  it("rejects missing required schema fields", () => {
    expect(() => normalizeAiSuggestionJson(JSON.stringify({ ...validPayload, summary: "" }), criteria)).toThrow(
      expect.objectContaining({ aiCode: "invalid_ai_json" }),
    );
  });
});
