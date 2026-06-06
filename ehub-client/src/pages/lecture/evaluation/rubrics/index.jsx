import AdminRubrics from "@/pages/admin/evaluation-ops/rubrics";
import {
  lecturerRubricBasePath,
  loadLecturerRubricSubjects,
} from "@/pages/lecture/evaluation/shared";

export default function LecturerRubricsPage() {
  return (
    <AdminRubrics
      basePath={lecturerRubricBasePath}
      loadSubjects={loadLecturerRubricSubjects}
    />
  );
}
