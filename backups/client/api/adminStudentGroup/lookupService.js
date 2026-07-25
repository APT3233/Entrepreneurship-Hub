import instance from "../instance";

export const studentGroupLookupService = {
  getAll: () => instance.get("/admin/student-group/lookups"),
};

export default studentGroupLookupService;
