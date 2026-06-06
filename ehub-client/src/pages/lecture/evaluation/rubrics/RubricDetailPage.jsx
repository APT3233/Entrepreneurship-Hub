import AdminRubricDetail from "@/pages/admin/evaluation-ops/rubrics/RubricDetailPage";
import {
  lecturerRubricBasePath,
  lecturerRubricTargetServices,
  loadLecturerRubricSubjects,
} from "@/pages/lecture/evaluation/shared";

export default function LecturerRubricDetailPage() {
  return (
    <AdminRubricDetail
      basePath={lecturerRubricBasePath}
      loadSubjects={loadLecturerRubricSubjects}
      targetServices={lecturerRubricTargetServices}
    />
  );
}
