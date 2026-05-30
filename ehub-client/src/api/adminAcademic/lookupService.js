import instance from "../instance";

export const academicLookupService = {
  getAll: () => instance.get("/admin/academic/lookups"),
};

export default academicLookupService;
