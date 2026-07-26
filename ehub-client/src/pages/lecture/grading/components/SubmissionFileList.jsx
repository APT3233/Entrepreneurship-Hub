import { Download, FileText } from "lucide-react";
import { formatBytes } from "@/pages/admin/project-submission/shared";
import DateTimeCell from "@/components/ui/DateTimeCell";
import { useTranslation } from "@/context/TranslationContext";

export default function SubmissionFileList({ files = [] }) {
  const { t } = useTranslation();

  if (!files.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-text-muted">
        {t("lecturer.gradingPage.fileList.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      {files.map((file) => (
        <div key={file.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{file.file_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                <span>{file.file_type || file.mime_type || "file"}</span>
                <span>{formatBytes(file.file_size)}</span>
                <DateTimeCell value={file.uploaded_at} multiline={false} dateClassName="text-xs text-text-secondary" timeClassName="text-xs text-text-muted" />
              </div>
            </div>
          </div>
          {file.download_url ? (
            <a
              href={file.download_url}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-subtle"
            >
              <Download size={16} />
              {t("lecturer.gradingPage.fileList.download")}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
