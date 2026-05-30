import FormModal from "@/pages/admin/components/FormModal";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { formatBytes, formatDate } from "@/pages/admin/project-submission/shared";

export default function SubmissionDetailModal({ open, submission, title, onClose }) {
  return (
    <FormModal
      open={open}
      title={title || "Submission detail"}
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); onClose?.(); }}
      submitLabel="Đóng"
    >
      {submission ? (
        <div className="space-y-4">
          <DetailGrid items={[
            ["Group", `${submission.group_code || ""} - ${submission.group_name || ""}`],
            ["Status", submission.status || submission.submission_status || submission.display_status],
            ["Submitted by", submission.submitted_by_name || submission.submitted_by || "—"],
            ["Submitted at", formatDate(submission.submitted_at)],
            ["Late", Number(submission.is_late || 0) ? "Yes" : "No"],
            ["Score", submission.score ?? "—"],
            ["Feedback", submission.feedback || "—"],
            ["Graded by", submission.graded_by_name || submission.graded_by || "—"],
            ["Graded at", formatDate(submission.graded_at)],
            ["Note", submission.note || "—"],
          ]} />
          <div>
            <h3 className="mb-2 text-sm font-black text-gray-900">Files</h3>
            <div className="space-y-2">
              {(submission.files || []).length ? submission.files.map((file) => (
                <a
                  key={`${file.id}-${file.file_name}`}
                  href={file.file_url || file.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-gray-100 p-3 text-sm hover:bg-gray-50"
                >
                  <div className="font-bold text-gray-900">{file.file_name}</div>
                  <div className="mt-1 text-gray-500">{file.mime_type || file.file_type || "file"} · {formatBytes(file.file_size)}</div>
                </a>
              )) : <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-400">Chưa có file.</div>}
            </div>
          </div>
        </div>
      ) : null}
    </FormModal>
  );
}
