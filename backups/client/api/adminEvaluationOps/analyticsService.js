import instance from "../instance";

export const analyticsService = {
  get: () => instance.get("/admin/evaluation/analytics"),
};

export default analyticsService;
