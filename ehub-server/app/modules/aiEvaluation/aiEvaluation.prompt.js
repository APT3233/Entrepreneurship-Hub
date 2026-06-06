const safeText = (value) => String(value ?? "").trim() || "Không có dữ liệu";

const buildCriteriaText = (criteria = []) =>
  criteria.map((criterion) => ({
    criterion_id: Number(criterion.id),
    name: criterion.name,
    description: criterion.description || "",
    max_score: Number(criterion.max_score),
    required_feedback: Boolean(criterion.is_required_feedback),
  }));

export const buildAiEvaluationPrompt = ({
  context,
  rubric,
  extracted,
  sourceMaterials = null,
}) => {
  const payload = {
    instruction: [
      "Bạn là AI Evaluation Assistant cho E-HUB, chỉ hỗ trợ giảng viên tham khảo khi chấm bài.",
      "Bám sát rubric và nội dung bài nộp. Không bịa thông tin không xuất hiện trong bài nộp.",
      "source_materials là đề/yêu cầu của giảng viên; extraction.submission_text là bài nộp của sinh viên. Không nhầm hai nguồn này.",
      "Nếu thiếu căn cứ, hãy nói rõ thiếu dữ liệu và đặt suggested_score = null.",
      "Không gọi điểm gợi ý là điểm chính thức. Giảng viên là người quyết định điểm cuối cùng.",
      "Evidence text phải trích hoặc tóm lược sát nội dung bài nộp, không tự tạo bằng chứng.",
      "Trả về đúng một JSON object hợp lệ, không markdown, không ```json, không trailing comma.",
    ],
    required_output_schema: {
      summary: "string",
      strengths: ["string"],
      weaknesses: ["string"],
      missing_requirements: ["string"],
      criterion_suggestions: [
        {
          criterion_id: 1,
          suggested_score: 1.5,
          suggested_feedback: "string",
          evidence_text: "string hoặc null",
          confidence_score: 0.75,
        },
      ],
      suggested_overall_feedback: "string",
      suggested_total_score: 8.0,
      confidence_score: 0.7,
      project_potential_level: "low | medium | high | unknown",
      project_potential_reasons: ["string"],
      project_potential_next_steps: ["string"],
      project_potential_confidence_score: 0.7,
    },
    submission_context: {
      target_type: context.target_type,
      target_id: Number(context.target_id),
      source_id: Number(context.source_id),
      title: safeText(context.source_title),
      description: safeText(context.source_description),
      source_max_score:
        context.source_max_score == null
          ? null
          : Number(context.source_max_score),
      deadline: context.source_deadline || null,
      status: context.status || context.source_status || null,
      submitted_at: context.submitted_at || null,
      is_late: Boolean(context.is_late),
      submission_note: safeText(context.note),
      previous_feedback: safeText(context.feedback),
    },
    group_project: {
      class_code: context.class_code,
      group_code: context.group_code,
      group_name: context.group_name,
      category: context.category || null,
      topic: context.topic || null,
      topic_description:
        context.topic_desc || context.group_description || null,
    },
    academic_context: {
      subject_code: context.subject_code || null,
      subject_name: context.subject_name || null,
      semester_code: context.semester_code || null,
      semester_name: context.semester_name || null,
      year: context.year || null,
      class_code: context.class_code || null,
    },
    rubric: {
      id: Number(rubric.id),
      name: rubric.name,
      total_score: Number(rubric.total_score),
      criteria: buildCriteriaText(rubric.criteria),
    },
    source_materials: {
      description_text: safeText(context.source_description),
      truncated: Boolean(sourceMaterials?.truncated),
      note: sourceMaterials?.truncated
        ? "Nội dung file đề/yêu cầu của giảng viên đã bị rút gọn do vượt giới hạn."
        : "File đề/yêu cầu của giảng viên được đọc trong giới hạn xử lý nếu có.",
      files: sourceMaterials?.files || [],
      skipped_files: sourceMaterials?.errors || [],
      extracted_text: sourceMaterials?.text || "",
    },
    extraction: {
      truncated: Boolean(extracted.truncated),
      note: extracted.truncated
        ? "Nội dung bài nộp đã bị rút gọn do vượt giới hạn."
        : "Nội dung đầy đủ trong giới hạn xử lý.",
      files: extracted.files,
      skipped_files: extracted.errors,
      submission_text: extracted.text,
    },
  };

  return [
    {
      role: "system",
      content: [
        "Bạn là AI Evaluation Assistant của E-HUB.",
        "Nhiệm vụ duy nhất: trả về đúng một JSON object hợp lệ theo schema được yêu cầu.",
        "Không trả markdown, không bọc ```json, không giải thích ngoài JSON, không thêm văn bản trước/sau JSON.",
        "Nếu thiếu căn cứ thì dùng null hoặc mảng rỗng theo schema, không bịa dữ liệu.",
      ].join(" "),
    },
    {
      role: "user",
      content: `INPUT_JSON:\n${JSON.stringify(payload)}\n\nOUTPUT: Return only one valid JSON object.`,
    },
  ];
};
