import { useEffect, useMemo, useState } from "react";
import { Eye, SquarePen } from "lucide-react";
import {
  assignmentSubmissionService,
  projectSubmissionLookupService,
} from "@/api/adminProjectSubmission";
import { useToast } from "@/components/ui/Toast";
import { useAssignmentSubmissions } from "@/hooks/admin/useAssignmentSubmissions";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import GradeModal from "@/pages/admin/project-submission/components/GradeModal";
import SubmissionDetailModal from "@/pages/admin/project-submission/components/SubmissionDetailModal";
import { useTranslation } from "@/context/TranslationContext";
import {
  buildClassLabel,
  formatDate,
  getBooleanOptions,
  getSubmissionStatusOptions,
  pageLimit,
  toSelectOptions,
} from "@/pages/admin/project-submission/shared";

export default function AdminAssignmentSubmissions() {
  const { t } = useTranslation();
  const toast = useToast();
  const submissionStatusOptions = useMemo(() => getSubmissionStatusOptions(t), [t]);
  const booleanOptions = useMemo(() => getBooleanOptions(t), [t]);
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", semester_id: "", class_id: "", assignment_id: "", status: "", is_late: "", graded_by: "" });
  const { rows, meta, loading, error, refetch } = useAssignmentSubmissions(query);
  const [lookups, setLookups] = useState({ classes: [], semesters: [], assignments: [], graders: [] });
  const [detail, setDetail] = useState(null);
  const [gradeTarget, setGradeTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectSubmissionLookupService.getAll()
      .then((res) => setLookups(res?.data || { classes: [], semesters: [], assignments: [], graders: [] }))
      .catch(() => setLookups({ classes: [], semesters: [], assignments: [], graders: [] }));
  }, []);

  const classOptions = useMemo(() => toSelectOptions(lookups.classes, (item) => item.id, buildClassLabel, t("lookupAll.classes")), [lookups.classes, t]);
  const semesterOptions = useMemo(() => toSelectOptions(lookups.semesters, (item) => item.id, (item) => `${item.semester_code} - ${item.semester_name}`, t("lookupAll.semesters")), [lookups.semesters, t]);
  const assignmentOptions = useMemo(() => toSelectOptions(lookups.assignments, (item) => item.id, (item) => item.title, t("lookupAll.assignments")), [lookups.assignments, t]);
  const graderOptions = useMemo(() => toSelectOptions(lookups.graders, (item) => item.id, (item) => item.full_name || item.email, t("lookupAll.graders")), [lookups.graders, t]);

  const openDetail = async (row) => {
    if (!row.submission_id) {
      toast.error("Nhóm chưa có bài nộp.");
      return;
    }
    try {
      const res = await assignmentSubmissionService.get(row.submission_id);
      setDetail(res?.data || null);
    } catch (err) {
      toast.error(err.message || "Không tải được submission.");
    }
  };

  const grade = async (payload) => {
    if (!gradeTarget?.submission_id) return;
    setSaving(true);
    try {
      await assignmentSubmissionService.grade(gradeTarget.submission_id, payload);
      toast.success("Đã chấm điểm assignment");
      setGradeTarget(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || "Không chấm được bài.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "assignment_title", label: "Assignment", render: (row) => <span className="font-semibold text-gray-900">{row.assignment_title}</span> },
    { key: "class_code", label: "Class" },
    { key: "group", label: "Group", render: (row) => row.group_name || "—" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "submitted_at", label: "Submitted", render: (row) => formatDate(row.submitted_at) },
    { key: "is_late", label: "Late", render: (row) => Number(row.is_late || 0) ? <StatusBadge value="late" /> : "—" },
    { key: "score", label: "Score", render: (row) => row.score ?? "—" },
    { key: "feedback", label: "Feedback", render: (row) => <span className="line-clamp-2">{row.feedback || "—"}</span> },
    { key: "graded_by", label: "Graded by", render: (row) => row.graded_by_name || row.graded_by || "—" },
    { key: "graded_at", label: "Graded at", render: (row) => formatDate(row.graded_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title="View"><Eye size={16} /></ActionButton>
          {row.submission_id ? <ActionButton onClick={() => setGradeTarget(row)} title="Grade" tone="indigo"><SquarePen size={16} /></ActionButton> : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.assignmentSubmissions")} />
        <FilterSelect label={t("filterLabels.semester")} value={query.semester_id} onChange={(semester_id) => setQuery((prev) => ({ ...prev, page: 1, semester_id }))} options={semesterOptions} />
        <FilterSelect label={t("filterLabels.class")} value={query.class_id} onChange={(class_id) => setQuery((prev) => ({ ...prev, page: 1, class_id }))} options={classOptions} />
        <FilterSelect label={t("filterLabels.assignment")} value={query.assignment_id} onChange={(assignment_id) => setQuery((prev) => ({ ...prev, page: 1, assignment_id }))} options={assignmentOptions} />
        <FilterSelect label={t("filterLabels.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={submissionStatusOptions} />
        <FilterSelect label={t("filterLabels.late")} value={query.is_late} onChange={(is_late) => setQuery((prev) => ({ ...prev, page: 1, is_late }))} options={booleanOptions} />
        <FilterSelect label={t("filterLabels.grader")} value={query.graded_by} onChange={(graded_by) => setQuery((prev) => ({ ...prev, page: 1, graded_by }))} options={graderOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("admin.empty.assignmentSubmissions")} />

      <GradeModal open={!!gradeTarget} submission={gradeTarget} maxScore={gradeTarget?.max_score} onClose={() => setGradeTarget(null)} onSubmit={grade} saving={saving} />
      <SubmissionDetailModal open={!!detail} submission={detail} title="Assignment submission detail" onClose={() => setDetail(null)} />
    </>
  );
}
