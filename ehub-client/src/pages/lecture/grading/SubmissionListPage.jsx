import { useParams } from "react-router-dom";
import { useTranslation } from "@/context/TranslationContext";
import SubmissionListSection from "./components/SubmissionListSection";

export default function SubmissionListPage() {
  const { sourceType, checkpointId, assignmentId } = useParams();
  const { t } = useTranslation();
  const fixedFilters = {
    source_type: sourceType,
    ...(sourceType === "checkpoint" ? { checkpoint_id: checkpointId } : { assignment_id: assignmentId }),
  };
  const label = sourceType === "checkpoint"
    ? t("lecturer.gradingPage.checkpointSubmissionsTitle")
    : t("lecturer.gradingPage.assignmentSubmissionsTitle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("lecturer.gradingPage.scopedListSubtitle")}</p>
      </div>
      <SubmissionListSection fixedFilters={fixedFilters} title={label} showSourceFilter={false} />
    </div>
  );
}
