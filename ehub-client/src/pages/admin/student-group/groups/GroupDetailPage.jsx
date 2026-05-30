import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Ban, Crown, Plus, RefreshCw, UserMinus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  groupMemberService,
  groupService,
  inviteService,
  reportService,
} from "@/api/adminStudentGroup";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ConfirmDialog from "@/pages/admin/components/ConfirmDialog";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import WarningNote from "@/pages/admin/student-group/components/WarningNote";
import { useTranslation } from "@/context/TranslationContext";
import { buildStudentLabel, formatDate } from "@/pages/admin/student-group/shared";
import GroupSubmissionsTab from "@/pages/admin/components/GroupSubmissionsTab";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function AdminGroupDetail() {
  const { t, language } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canWrite = checkPermission(authUser, "admin.groups.update");
  const [group, setGroup] = useState(null);
  const [invites, setInvites] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null });
  const [memberForm, setMemberForm] = useState({ student_id: "", role: "member" });
  const [saving, setSaving] = useState(false);
  const [confirmMember, setConfirmMember] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [groupRes, invitesRes, reportsRes] = await Promise.all([
        groupService.get(id),
        inviteService.list({ group_id: id, limit: 50 }),
        reportService.list({ group_id: id, limit: 50 }),
      ]);
      setGroup(groupRes?.data || null);
      setInvites(invitesRes?.data || []);
      setReports(reportsRes?.data || []);
    } catch (err) {
      setError(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(() => [
    { key: "overview", label: t("common.confirm") === "Xác nhận" ? "Tổng quan" : "Overview" },
    { key: "members", label: t("common.confirm") === "Xác nhận" ? "Thành viên" : "Members" },
    { key: "invites", label: t("common.confirm") === "Xác nhận" ? "Lời mời" : "Invites" },
    { key: "reports", label: t("common.confirm") === "Xác nhận" ? "Báo cáo" : "Reports" },
    { key: "submissions", label: t("common.confirm") === "Xác nhận" ? "Bài nộp" : "Submissions" },
  ], [t]);

  const title = useMemo(() => {
    if (!group) return t("common.confirm") === "Xác nhận" ? "Chi tiết nhóm" : "Group details";
    return `${group.group_code} - ${group.group_name}`;
  }, [group, t]);
  useDocumentTitle(group ? title : null, 1);

  const openAddMember = () => {
    setMemberForm({ student_id: "", role: "member" });
    setModal({ type: "add-member" });
  };

  const addMember = async (event) => {
    event.preventDefault();
    if (!memberForm.student_id) {
      toast.error(t("common.confirm") === "Xác nhận" ? "Vui lòng chọn sinh viên." : "Please select student.");
      return;
    }
    setSaving(true);
    try {
      await groupMemberService.add(id, {
        student_id: Number(memberForm.student_id),
        role: memberForm.role,
      });
      toast.success(t("admin.toasts.createSuccess"));
      setModal({ type: null });
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (member, body) => {
    try {
      await groupMemberService.update(id, member.student_id, body);
      toast.success(t("admin.toasts.updateSuccess"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const removeMember = async () => {
    if (!confirmMember) return;
    try {
      await groupMemberService.remove(id, confirmMember.student_id);
      toast.success(t("common.confirm") === "Xác nhận" ? "Đã gỡ thành viên" : "Member removed successfully");
      setConfirmMember(null);
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const updateInvite = async (invite, action) => {
    try {
      if (action === "resend") await inviteService.resend(invite.id);
      if (action === "revoke") await inviteService.revoke(invite.id);
      if (action === "expire") await inviteService.expire(invite.id);
      toast.success(t("admin.toasts.statusSuccess"));
      await load();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm font-medium text-red-600">{error}</div>;
  }

  if (!group) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">{t("common.noData")}</div>;
  }

  const memberColumns = [
    { key: "student_code", label: t("admin.fields.studentCode"), render: (row) => <span className="font-mono text-xs font-bold text-gray-700">{row.student_code}</span> },
    { key: "full_name", label: t("admin.fields.fullName"), render: (row) => <span className="font-semibold text-gray-900">{row.full_name}</span> },
    { key: "email", label: t("admin.fields.email") },
    {
      key: "role",
      label: t("common.confirm") === "Xác nhận" ? "Vai trò" : "Role",
      render: (row) => canWrite ? (
        <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 cursor-pointer" value={row.role} onChange={(event) => updateMember(row, { role: event.target.value })}>
          <option value="member">Member</option>
          <option value="leader">Leader</option>
        </select>
      ) : <StatusBadge value={row.role} />,
    },
    {
      key: "status",
      label: t("admin.fields.status"),
      render: (row) => canWrite ? (
        <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 cursor-pointer" value={row.status} onChange={(event) => updateMember(row, { status: event.target.value })}>
          <option value="active">Active</option>
          <option value="left">Left</option>
          <option value="removed">Removed</option>
        </select>
      ) : <StatusBadge value={row.status} />,
    },
    { key: "joined_at", label: t("common.confirm") === "Xác nhận" ? "Ngày gia nhập" : "Joined", render: (row) => formatDate(row.joined_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {canWrite && row.role !== "leader" && row.status === "active" ? (
            <ActionButton onClick={() => updateMember(row, { role: "leader" })} title="Set leader" tone="indigo"><Crown size={16} /></ActionButton>
          ) : null}
          {canWrite && row.status === "active" ? (
            <ActionButton onClick={() => setConfirmMember(row)} title="Remove member" tone="red"><UserMinus size={16} /></ActionButton>
          ) : null}
        </div>
      ),
    },
  ];

  const inviteColumns = [
    { key: "student", label: t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student", render: (row) => `${row.student_code} - ${row.student_name}` },
    { key: "intended_role", label: t("common.confirm") === "Xác nhận" ? "Vai trò" : "Role", render: (row) => <StatusBadge value={row.intended_role} /> },
    { key: "status", label: t("admin.fields.status"), render: (row) => <StatusBadge value={row.status} /> },
    { key: "email_delivery_status", label: "Email", render: (row) => row.email_delivery_status || "—" },
    { key: "expires_at", label: t("common.confirm") === "Xác nhận" ? "Hết hạn" : "Expires", render: (row) => formatDate(row.expires_at) },
    {
      key: "actions",
      label: "",
      render: (row) => canWrite ? (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => updateInvite(row, "resend")} title="Resend" tone="blue"><RefreshCw size={16} /></ActionButton>
          <ActionButton onClick={() => updateInvite(row, "revoke")} title="Revoke" tone="red"><Ban size={16} /></ActionButton>
        </div>
      ) : null,
    },
  ];

  const reportColumns = [
    { key: "student", label: t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student", render: (row) => `${row.student_code} - ${row.student_name}` },
    { key: "issue_type", label: t("common.confirm") === "Xác nhận" ? "Vấn đề" : "Issue", render: (row) => <StatusBadge value={row.issue_type} /> },
    { key: "description", label: t("admin.fields.description"), render: (row) => row.description },
    { key: "created_at", label: t("common.created"), render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={() => navigate("/admin/groups")} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 cursor-pointer">
            <ArrowLeft size={16} /> {t("nav.studentGroups", { defaultValue: "Groups" }) === "Nhóm sinh viên" ? "Nhóm" : "Groups"}
          </button>
          <h2 className="truncate text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{group.class_code} · {group.subject_code} · {group.semester_code}</p>
        </div>
        <StatusBadge value={group.status} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-10 rounded-xl px-4 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === tab.key ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-black text-gray-900">{t("common.confirm") === "Xác nhận" ? "Thông tin Tổng quan" : "Group Overview"}</h3>
            <DetailGrid items={[
              [t("nav.studentGroups", { defaultValue: "Group" }) === "Nhóm sinh viên" ? "Nhóm" : "Group", title],
              [t("admin.fields.classCode", { defaultValue: "Class" }) === "Mã lớp" ? "Lớp học" : "Class", group.class_code],
              [t("nav.subjects"), `${group.subject_code} - ${group.subject_name}`],
              [t("admin.fields.semester"), `${group.semester_code} - ${group.semester_name}`],
              [t("admin.fields.category"), group.category || "—"],
              [t("admin.fields.topic"), group.topic || "—"],
              ["Zalo", group.zalo_link || "—"],
              ["Mentor", group.mentor_name || "—"],
              [t("common.confirm") === "Xác nhận" ? "Bộ môn Mentor" : "Mentor dept", group.mentor_dept || "—"],
              [t("common.confirm") === "Xác nhận" ? "Số thành viên" : "Members", `${Number(group.member_count || 0)}/${Number(group.max_members || 0)}`],
              [t("common.confirm") === "Xác nhận" ? "Trưởng nhóm" : "Leader", group.leader_name || "—"],
              [t("admin.fields.status"), group.status],
            ]} />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-black text-gray-900">{t("admin.fields.topicDesc")}</h3>
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">{group.topic_desc || group.description || (t("common.confirm") === "Xác nhận" ? "Chưa có mô tả." : "No description.")}</p>
          </div>
        </div>
      ) : null}

      {activeTab === "members" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            {canWrite ? (
              <button type="button" onClick={openAddMember} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
                <Plus size={16} /> {t("admin.actions.create")}
              </button>
            ) : null}
          </div>
          <AdminTable columns={memberColumns} rows={group.members || []} loading={false} emptyText={t("common.noData")} />
        </div>
      ) : null}

      {activeTab === "invites" ? <AdminTable columns={inviteColumns} rows={invites} loading={false} emptyText={t("common.noData")} /> : null}
      {activeTab === "reports" ? <AdminTable columns={reportColumns} rows={reports} loading={false} emptyText={t("common.noData")} /> : null}
      {activeTab === "submissions" ? <GroupSubmissionsTab groupId={id} classId={group?.class_id} /> : null}

      <FormModal open={modal.type === "add-member"} title={t("common.confirm") === "Xác nhận" ? "Thêm thành viên nhóm" : "Add group member"} onClose={() => setModal({ type: null })} onSubmit={addMember} saving={saving}>
        <div className="space-y-4">
          <Field label={t("admin.fields.fullName", { defaultValue: "Sinh viên" }) === "Họ và tên" ? "Sinh viên" : "Student"}>
            <select className={inputClass} value={memberForm.student_id} onChange={(e) => setMemberForm({ ...memberForm, student_id: e.target.value })} required>
              <option value="">{t("common.confirm") === "Xác nhận" ? "Chọn sinh viên chưa có nhóm" : "Select student without group"}</option>
              {(group.studentsWithoutGroup || []).map((student) => <option key={student.id} value={student.id}>{buildStudentLabel(student)}</option>)}
            </select>
          </Field>
          <Field label={t("common.confirm") === "Xác nhận" ? "Vai trò" : "Role"}>
            <select className={inputClass} value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
              <option value="member">Member</option>
              <option value="leader">Leader</option>
            </select>
          </Field>
          <WarningNote>
            {t("common.confirm") === "Xác nhận"
              ? "Danh sách chỉ hiển thị các sinh viên đã đăng ký học lớp này và chưa tham gia nhóm hoạt động nào khác. Hệ thống tự động giới hạn số lượng thành viên tối đa."
              : "Dropdown only displays enrolled students under this class who are not in another active group. Backend enforces max_members size constraint."}
          </WarningNote>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!confirmMember}
        title={t("common.confirm") === "Xác nhận" ? "Gỡ thành viên khỏi nhóm" : "Remove member from group"}
        subtitle={confirmMember ? `${confirmMember.student_code} - ${confirmMember.full_name}` : ""}
        variant="remove"
        color="red"
        yesLabel={t("common.confirm") === "Xác nhận" ? "Gỡ thành viên" : "Remove"}
        onYes={removeMember}
        onClose={() => setConfirmMember(null)}
      />
    </div>
  );
}
