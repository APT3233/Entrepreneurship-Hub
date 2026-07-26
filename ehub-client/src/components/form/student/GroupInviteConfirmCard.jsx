import { useState } from "react";
import {
  UserPlus,
  Users,
  BookOpen,
  Presentation,
  Check,
  AlertTriangle,
} from "lucide-react";
import GroupInviteApi from "@/api/groupInvite";
import { useToast } from "@/components/ui/Toast";
import { LastNameAvatar } from "@/components/icons/ui";
import GroupInviteReportModal from "@/components/modal/student/GroupInviteReportModal";

function zaloHref(raw) {
  if (raw == null || !String(raw).trim()) return null;
  const t = String(raw).trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/**
 * Card xác nhận tham gia nhóm (theo lời mời pending).
 *
 * @param {object} invite — một dòng từ GET /groups/invites/pending
 * @param {() => void} onUpdated — gọi lại sau accept / decline thành công
 */
export default function GroupInviteConfirmCard({ invite, onUpdated }) {
  const toast = useToast();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const groupName = invite.group_name || "nhóm";
  const classCode = invite.class_code || "—";
  const mentor =
    invite.mentor_display_name && String(invite.mentor_display_name).trim()
      ? invite.mentor_display_name
      : "—";
  const zalo = zaloHref(invite.zalo_link);
  const cardId = `group-invite-card-${invite.token}`;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await GroupInviteApi.accept(invite.token);
      toast.success("Đã tham gia nhóm", groupName);
      onUpdated?.();
    } catch (err) {
      const msg = err?.message || "Không thể xác nhận. Vui lòng thử lại.";
      toast.error("Lỗi", msg);
    } finally {
      setAccepting(false);
    }
  };

  const statusBadgeClass = (status) => {
    if (status === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (status === "declined") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-100 text-text-secondary border-border";
  };

  const handleReportSubmit = async (payload) => {
    if (declining) return;
    setDeclining(true);
    try {
      await GroupInviteApi.report(invite.token, payload);
      toast.info(
        "Đã gửi báo lỗi",
        "Lời mời đã được chuyển sang trạng thái từ chối."
      );
      setReportOpen(false);
      onUpdated?.();
    } catch (err) {
      const msg = err?.message || "Không thể xử lý. Vui lòng thử lại.";
      toast.error("Lỗi", msg);
    } finally {
      setDeclining(false);
    }
  };

  return (
    <>
      <article
        id={cardId}
        className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition-shadow"
      >
        <header className="flex gap-3 sm:gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
            aria-hidden
          >
            <UserPlus className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-text-primary sm:text-lg">
              Xác nhận tham gia nhóm
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Bạn đã được mời tham gia nhóm{" "}
              <span className="font-semibold text-blue-600">{groupName}</span>.
              Vui lòng kiểm tra thông tin và xác nhận tham gia.
            </p>
          </div>
        </header>

        <div className="mt-4 rounded-lg border border-border bg-subtle/80 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600"
                aria-hidden
              >
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">Tên nhóm</p>
                <p className="truncate text-sm font-bold text-text-primary">{groupName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"
                aria-hidden
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">Lớp học</p>
                <p className="truncate text-sm font-bold text-text-primary">{classCode}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600"
                aria-hidden
              >
                <Presentation className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">Mentor</p>
                <p className="truncate text-sm font-bold text-text-primary">{mentor}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-text-primary">Thành viên nhóm</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Danh sách dự kiến và trạng thái xử lý lời mời.</p>
          <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-border">
            {(invite.membersPreview || []).length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-secondary">Chưa có dữ liệu thành viên.</div>
            ) : (
              (invite.membersPreview || []).map((m, idx) => (
                <div key={`${m.student_id || m.student_code || idx}`} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <LastNameAvatar name={m.full_name || "—"} index={idx} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{m.full_name || "—"}</p>
                      <p className="text-xs text-text-secondary">{m.student_code || "—"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(m.status)}`}>
                    {m.status_label || "Chưa duyệt"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {zalo && (
          <p className="mt-3 text-sm text-text-secondary">
            Link zalo:{" "}
            <a
              href={zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
            >
              {invite.zalo_link?.trim() || zalo}
            </a>
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled={accepting || declining}
            onClick={handleAccept}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60 cursor-pointer"
          >
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            {accepting ? "Đang xử lý…" : "Xác nhận tham gia"}
          </button>
          <button
            type="button"
            disabled={accepting || declining}
            onClick={() => setReportOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-subtle disabled:opacity-60 cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
            Báo sai thông tin
          </button>
        </div>
      </article>

      <GroupInviteReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        submitting={declining}
        onSubmit={handleReportSubmit}
      />
    </>
  );
}
