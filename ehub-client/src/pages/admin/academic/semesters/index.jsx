import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, SquarePen, Info, Calendar } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import { useSelector } from "react-redux";
import { academicLookupService, semesterService } from "@/api/adminAcademic";
import { useToast } from "@/components/ui/Toast";
import { selectAuthUser } from "@/store/slices/authSlice";
import { checkPermission } from "@/utils/permissions";
import { useSemesters } from "@/hooks/admin/useSemesters";
import AdminTable from "@/pages/admin/components/AdminTable";
import FilterBar, { FilterSelect } from "@/pages/admin/components/FilterBar";
import SearchInput from "@/pages/admin/components/SearchInput";
import StatusBadge from "@/pages/admin/components/StatusBadge";
import FormModal, { Field, inputClass } from "@/pages/admin/components/FormModal";
import ActionButton from "@/pages/admin/academic/components/ActionButton";
import DetailGrid from "@/pages/admin/academic/components/DetailGrid";
import { useTranslation } from "@/context/TranslationContext";
import {
  formatDate,
  formatDateOnly,
  formatDateOnlyText,
  pageLimit,
  getSemesterStatusOptions,
  toDateInputValue,
} from "@/pages/admin/academic/shared";

const isSemesterCompleted = (semester) => semester?.status === "completed";

const CurrentSemesterBadge = ({ t }) => (
  <span className="inline-flex shrink-0 items-center rounded-full border border-accent-bg bg-accent-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
    {t("admin.fields.currentSemester")}
  </span>
);

const emptyForm = {
  semester_code: "",
  semester_name: "",
  year: new Date().getFullYear(),
  start_date: "",
  end_date: "",
  status: "upcoming",
};

export default function AdminSemesters() {
  const { t, language } = useTranslation();
  const semesterStatusOptions = useMemo(() => getSemesterStatusOptions(t), [t]);
  const toast = useToast();
  const authUser = useSelector(selectAuthUser);
  const canCreate = checkPermission(authUser, "core.semester.create");
  const canUpdate = checkPermission(authUser, "core.semester.update");
  const [query, setQuery] = useState({ page: 1, limit: pageLimit, search: "", year: "", status: "" });
  const { rows, meta, loading, error, refetch } = useSemesters(query);
  const [years, setYears] = useState([]);
  const [modal, setModal] = useState({ type: null, semester: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicLookupService.getAll()
      .then((res) => setYears(res?.data?.years || []))
      .catch(() => setYears([]));
  }, []);

  const yearOptions = useMemo(() => [
    { value: "", label: t("lookupAll.years") },
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ], [years, t]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: "create", semester: null });
  };

  const openEdit = (semester) => {
    if (isSemesterCompleted(semester)) {
      toast.error(t("admin.errors.semesterCompleted"));
      return;
    }
    setForm({
      semester_code: semester.semester_code || "",
      semester_name: semester.semester_name || "",
      year: semester.year || new Date().getFullYear(),
      start_date: toDateInputValue(semester.start_date),
      end_date: toDateInputValue(semester.end_date),
      status: semester.status || "upcoming",
    });
    setModal({ type: "edit", semester });
  };

  const openDetail = async (semester) => {
    try {
      const res = await semesterService.get(semester.id);
      setModal({ type: "detail", semester: res?.data || semester });
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (new Date(form.start_date).getTime() >= new Date(form.end_date).getTime()) {
      toast.error(t("admin.errors.startBeforeEnd"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        semester_code: form.semester_code.toUpperCase(),
        year: Number(form.year),
      };
      if (modal.type === "create") {
        await semesterService.create(payload);
        toast.success(t("admin.toasts.createSuccess"));
      } else if (isSemesterCompleted(modal.semester)) {
        toast.error(t("admin.errors.semesterCompleted"));
        return;
      } else {
        await semesterService.update(modal.semester.id, payload);
        toast.success(t("admin.toasts.updateSuccess"));
      }
      setModal({ type: null, semester: null });
      await refetch();
    } catch (err) {
      toast.error(err.message || t("admin.toasts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: "semester_code",
      label: t("admin.fields.semesterCode"),
      width: 160,
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-accent">{row.semester_code}</span>
          {row.is_current ? <CurrentSemesterBadge t={t} /> : null}
        </div>
      ),
    },
    { key: "semester_name", label: t("admin.fields.semesterName"), width: 250, render: (row) => <span className="font-semibold text-gray-900">{row.semester_name}</span> },
    { key: "year", label: t("admin.fields.year"), width: 120 },
    { key: "start_date", label: t("admin.fields.startDate"), width: 150, render: (row) => formatDateOnly(row.start_date) },
    { key: "end_date", label: t("admin.fields.endDate"), width: 150, render: (row) => formatDateOnly(row.end_date) },
    { key: "status", label: t("admin.fields.status"), width: 120, render: (row) => <StatusBadge value={row.status} /> },
    { key: "total_classes", label: t("nav.classes"), width: 120, render: (row) => Number(row.total_classes || 0) },
    { key: "created_at", label: t("common.created"), width: 180, render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      width: 150,
      render: (row) => (
        <div className="flex justify-end gap-1">
          <ActionButton onClick={() => openDetail(row)} title={t("admin.actions.detail")}><Eye size={16} /></ActionButton>
          {canUpdate ? (
            <ActionButton
              onClick={() => openEdit(row)}
              title={isSemesterCompleted(row) ? t("admin.errors.semesterEnded") : t("admin.actions.edit")}
              disabled={isSemesterCompleted(row)}
            >
              <SquarePen size={16} />
            </ActionButton>
          ) : null}
        </div>
      ),
    },
  ], [t, canUpdate]);

  return (
    <>
      <FilterBar
        right={canCreate ? (
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover cursor-pointer">
            <Plus size={16} /> {t("admin.actions.create")}
          </button>
        ) : null}
      >
        <SearchInput value={query.search} onChange={(search) => setQuery((prev) => ({ ...prev, page: 1, search }))} placeholder={t("searchPlaceholders.semesters")} />
        <FilterSelect label={t("filterLabels.year")} value={query.year} onChange={(year) => setQuery((prev) => ({ ...prev, page: 1, year }))} options={yearOptions} />
        <FilterSelect label={t("admin.fields.status")} value={query.status} onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))} options={semesterStatusOptions} />
      </FilterBar>

      <AdminTable columns={columns} rows={rows} loading={loading} error={error} meta={meta} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} emptyText={t("common.noData")} />

      <FormModal open={["create", "edit"].includes(modal.type)} title={modal.type === "create" ? t("admin.dialogs.createSemester") : t("admin.dialogs.editSemester")} onClose={() => setModal({ type: null, semester: null })} onSubmit={save} saving={saving}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-bg text-accent">
                <Info size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">{t("admin.sections.basicInfo")}</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.semesterCode")}>
                <input className={inputClass} value={form.semester_code} onChange={(e) => setForm({ ...form, semester_code: e.target.value.toUpperCase() })} required />
              </Field>
              <Field label={t("admin.fields.year")}>
                <input type="number" min="2020" max="2100" className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
              </Field>
              <Field label={t("admin.fields.semesterName")}>
                <input className={inputClass} value={form.semester_name} onChange={(e) => setForm({ ...form, semester_name: e.target.value })} required />
              </Field>
              <Field label={t("admin.fields.status")}>
                <Dropdown
                  label={t("admin.fields.status")}
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  direction="up"
                  options={[
                    { value: "upcoming", label: t("status.upcoming") },
                    { value: "ongoing", label: t("status.ongoing") },
                    { value: "completed", label: t("status.completed") },
                  ]}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Calendar size={16} />
              </span>
              <h4 className="text-sm font-bold text-gray-800">{t("admin.sections.semesterTimeline")}</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("admin.fields.startDate")}>
                <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </Field>
              <Field label={t("admin.fields.endDate")}>
                <input type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
              </Field>
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal open={modal.type === "detail"} title={t("admin.dialogs.semesterDetail")} onClose={() => setModal({ type: null, semester: null })} onSubmit={(e) => { e.preventDefault(); setModal({ type: null, semester: null }); }} submitLabel={t("common.close")}>
        {modal.semester ? (
          <div className="space-y-4">
            <DetailGrid items={[
              [t("admin.fields.semesterCode"), modal.semester.semester_code],
              [t("admin.fields.semesterName"), modal.semester.semester_name],
              [t("admin.fields.year"), modal.semester.year],
              [
                t("admin.fields.dateRange"),
                `${formatDateOnlyText(modal.semester.start_date, language)} - ${formatDateOnlyText(modal.semester.end_date, language)}`,
              ],
              [
                t("admin.fields.status"),
                modal.semester.is_current
                  ? `${t(`status.${modal.semester.status}`)} · ${t("admin.fields.currentSemester")}`
                  : t(`status.${modal.semester.status}`),
              ],
              [t("nav.classes"), Number(modal.semester.total_classes || 0)],
            ]} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t("nav.classes")}</p>
              <div className="max-h-64 overflow-auto rounded-xl border border-border">
                {(modal.semester.classes || []).length ? (modal.semester.classes || []).map((cls) => (
                  <div key={cls.id} className="grid grid-cols-3 gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <span className="font-semibold text-gray-800">{cls.class_code}</span>
                    <span className="text-gray-500">{cls.subject_code}</span>
                    <span className="text-gray-500">{cls.lecturer_name || "—"}</span>
                  </div>
                )) : <div className="px-3 py-6 text-center text-sm text-gray-400">{t("common.noData")}</div>}
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>

    </>
  );
}
