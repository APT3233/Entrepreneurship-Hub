import { useTranslation } from "@/context/TranslationContext";
import StatusBadge from "@/components/ui/StatusBadge";

const TONE = {
  not_started: "neutral",
  draft: "warning",
  submitted: "success",
  confirmed: "success",
};

export default function EvaluationStatusBadge({ value }) {
  const { t } = useTranslation();
  const key = value || "not_started";
  return (
    <StatusBadge
      status={TONE[key] || "neutral"}
      label={t(`status.${key}`, { defaultValue: key })}
    />
  );
}
