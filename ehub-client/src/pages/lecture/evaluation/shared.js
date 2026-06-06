import AssignmentApi from "@/api/assignment";
import CheckpointApi from "@/api/checkpoint";
import SubjectApi from "@/api/subject";

export const lecturerRubricBasePath = "/lecturer/evaluation/rubrics";

export const loadLecturerRubricSubjects = async () => {
  const res = await SubjectApi.list({ limit: 100, status: "active" });
  return res?.data || [];
};

const filterTargets = (res, search) => {
  const keyword = String(search || "").trim().toLowerCase();
  if (!keyword) return res;
  return {
    ...res,
    data: (res?.data || []).filter((item) => [
      item.title,
      item.class_code || item.classCode,
      item.subject_code || item.subjectCode,
      item.semester_code || item.semesterCode,
    ].filter(Boolean).join(" ").toLowerCase().includes(keyword)),
  };
};

export const lecturerRubricTargetServices = {
  checkpoint: {
    list: async (query = {}) => {
      const res = await CheckpointApi.getList({
        lecturerScope: "mine",
        class_id: query.class_id,
        semester_id: query.semester_id,
        status: query.status,
        year: query.year,
      });
      return filterTargets(res, query.search);
    },
  },
  assignment: {
    list: async (query = {}) => {
      const res = await AssignmentApi.getList({
        lecturerScope: "mine",
        page: query.page || 1,
        limit: query.limit || 100,
        class_id: query.class_id,
        semester_id: query.semester_id,
        status: query.status,
        year: query.year,
      });
      return filterTargets(res, query.search);
    },
  },
};
