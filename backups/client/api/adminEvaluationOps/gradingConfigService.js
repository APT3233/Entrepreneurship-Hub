import instance from "../instance";

const basePath = "/admin/evaluation/grading-config";

export const gradingConfigService = {
  get: () => instance.get(basePath),
  update: (body) => instance.put(basePath, body),
};

export default gradingConfigService;
