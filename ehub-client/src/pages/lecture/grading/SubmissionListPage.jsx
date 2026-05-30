import { useParams } from "react-router-dom";
import SubmissionListSection from "./components/SubmissionListSection";

export default function SubmissionListPage({ sourceType }) {
  const { classId, checkpointId, assignmentId } = useParams();
  const fixedFilters = {
    source_type: sourceType,
    class_id: classId,
    ...(sourceType === "checkpoint" ? { checkpoint_id: checkpointId } : { assignment_id: assignmentId }),
  };
  const label = sourceType === "checkpoint" ? "Bài nộp checkpoint" : "Bài nộp assignment";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
        <p className="mt-1 text-sm text-gray-500">Danh sách bài nộp của lớp đang phụ trách.</p>
      </div>
      <SubmissionListSection fixedFilters={fixedFilters} showSourceFilter={false} title={label} />
    </div>
  );
}
