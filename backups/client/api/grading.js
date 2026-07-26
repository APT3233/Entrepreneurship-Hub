import instance from "./instance";
import { compactQuery } from "./adminAcademic/utils";

const targetTypeBySource = {
  checkpoint: "checkpoint_submission",
  assignment: "assignment_submission",
};

const gradingService = {
  dashboard: (query = {}) => instance.get("/evaluations/grading/dashboard", { params: compactQuery(query) }),
  submissions: (query = {}) => instance.get("/evaluations/grading/submissions", { params: compactQuery(query) }),
  gradingForm: (sourceType, submissionId) =>
    instance.get(`/evaluations/grading-form/${targetTypeBySource[sourceType] || sourceType}/${submissionId}`),
  saveDraft: (body) => instance.post("/evaluations/drafts", body),
  submit: (body) => instance.post("/evaluations/submit", body),
  getEvaluation: (id) => instance.get(`/evaluations/${id}`),
};

export default gradingService;
