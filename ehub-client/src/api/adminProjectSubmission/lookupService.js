import instance from "../instance";

export const projectSubmissionLookupService = {
  getAll: () => instance.get("/admin/project-submission/lookups"),
};

export default projectSubmissionLookupService;
