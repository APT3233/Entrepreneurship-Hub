import { useTranslation } from "@/context/TranslationContext";
import StatusBadge from "@/components/ui/StatusBadge";

const TONE = {
  submitted: "neutral",
  resubmitted: "warning",
  graded: "success",
  not_submitted: "neutral",
};

export default function SubmissionStatusBadge({ value }) {
  const { t } = useTranslation();
  const key = value || "not_submitted";
  return (
    <StatusBadge
      status={TONE[key] || "neutral"}
      label={t(`status.${key}`, { defaultValue: key })}
    />
  );
}
