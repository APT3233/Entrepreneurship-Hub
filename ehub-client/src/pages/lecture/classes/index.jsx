import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHero from "@/components/ui/PageHero";
import { BookOpenIcon, Plus } from "lucide-react";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import EmptyClasses from "./components/EmptyClasses";
import ClassCard from "./components/ClassCard";
import CreateClassForm from "@/components/form/lecturer/CreateClassForm";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";

/** Khớp với BE: semester 1/2/3 → SP/SU/FA + năm → semester_code */
const semesterTypeToCode = (semesterType, year) => {
  const prefix = { 1: "SP", 2: "SU", 3: "FA" }[Number(semesterType)] || "SP";
  return `${prefix}${Number(year)}`;
};

export default function ClassesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({
    classCount: 0,
    groupCount: 0,
    assignmentCount: 0,
    needGradingCount: 0,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  /** Tăng sau khi tạo lớp thành công để ép refetch dù filterYear/filterSemesterId không đổi (React không re-run effect nếu deps bằng nhau). */
  const [classesDataKey, setClassesDataKey] = useState(0);

  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      const safeList = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : [];
      setSemesterList(safeList);
      if (safeList.length) {
        // Tìm học kỳ đang diễn ra (ongoing)
        const ongoingSemester = safeList.find((s) => s.status === "ongoing");

        if (ongoingSemester) {
          setFilterYear(ongoingSemester.year);
          setFilterSemesterId(ongoingSemester.id);
        } else {
          const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
          const currentYear = new Date().getFullYear();
          const selectedYear = years.includes(currentYear) ? currentYear : years[0];
          const inYear = safeList.filter((s) => s.year === selectedYear);
          setFilterYear(selectedYear);
          setFilterSemesterId(inYear[0].id);
        }
        setFilterClass(null);
      } else {
        setPageLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  const yearOptions = useSemesterYearOptions(semesterList);

  const semestersInYear = useMemo(
    () => semesterList.filter((s) => s.year === filterYear),
    [semesterList, filterYear]
  );

  // const activatableSemestersInYear = useMemo(
  //   () => semestersInYear.filter((s) => s.status === "ongoing" || s.status === "upcoming"),
  //   [semestersInYear]
  // );

  // Kỳ chỉ hiện khi đã chọn năm; options = các kỳ trong năm đó
  const semesterOptions = useMemo(() => {
    if (!filterYear) return [];
    return semestersInYear.map((s) => ({
      value: s.id,
      label: formatSemesterLabel(s, t),
    }));
  }, [filterYear, semestersInYear, t]);

  const handleYearChange = (year) => {
    setFilterYear(year);
    const inYear = semesterList.filter((s) => s.year === year);
    if (inYear.length > 0) {
      setFilterSemesterId(inYear[0].id);
    } else {
      setFilterSemesterId(null);
    }
    setFilterClass(null);
  };

  const handleSemesterChange = (value) => {
    setFilterSemesterId(value);
    setFilterClass(null);
  };

  const canCreateClass = useMemo(() => {
    if (!filterYear || !semestersInYear.length) return false;

    // Đang chọn 1 kỳ cụ thể → cho tạo khi kỳ đó đang ongoing hoặc upcoming
    if (filterSemesterId) {
      const sem = semesterList.find((s) => s.id === filterSemesterId);
      return sem?.status === "ongoing" || sem?.status === "upcoming";
    }

    return false;
  }, [filterYear, filterSemesterId, semestersInYear, semesterList]);

  // Fetch stats + danh sách lớp chỉ khi đã chọn Năm và Kỳ (thứ tự: Năm → Kỳ → Lớp)
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchData = async () => {
      const baseParams = { year: filterYear };
      const semesterId = filterSemesterId;
      const params = {
        ...baseParams,
        ...(semesterId != null && { semester_id: semesterId }),
      };

      try {
        const [statsRes, listRes] = await Promise.all([
          ClassApi.getStats(params),
          ClassApi.getList({
            lecturerScope: "mine",
            limit: 50,
            page: 1,
            ...params,
          }),
        ]);
        const s = statsRes?.data || {};
        setStats({
          classCount: s.classCount ?? 0,
          groupCount: s.groupCount ?? 0,
          assignmentCount: s.assignmentCount ?? 0,
          needGradingCount: s.needGradingCount ?? 0,
        });

        const list = listRes?.data || [];
        setClasses(
          list.map((c) => ({
            id: c.id,
            code: c.class_code,
            subject: c.class_name || "",
            students: c.student_count ?? 0,
            groups: c.group_count ?? 0,
            completion: 0,
            semester_id: c.semester_id,
            semester_status: c.semester_status,
            avatars: c.avatars ?? [],
          }))
        );
      } catch {
        setStats({
          classCount: 0,
          groupCount: 0,
          assignmentCount: 0,
          needGradingCount: 0,
        });
        setClasses([]);
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [filterYear, filterSemesterId, classesDataKey]);

  // Dropdown lọc lớp — các lớp hiện tại
  const classFilterOptions = useMemo(
    () => [
      ...classes.map((c) => ({
        label: c.code.split("_")[0] || c.code,
        value: c.id,
      })),
    ],
    [classes]
  );

  const visibleClasses = useMemo(() => {
    if (!filterClass) return classes;
    return classes.filter((c) => c.id === filterClass);
  }, [classes, filterClass]);

  const handleCreateClass = async (data) => {
    setCreateError(null);
    setCreateLoading(true);
    const studentList = (data?.students?.list || []).map((s) => ({
        memberCode: String(s.memberCode || s.rollNumber || "").trim(),
        rollNumber: String(s.rollNumber || "").trim(),
        email: String(s.email || "").trim(),
        fullname: String(s.fullname || "").trim(),
        major: String(s.major || "").trim(),
        status: s.status || "inactive",
      }));
    const body = {
      subject: data.subject,
      classSection: data.classSection,
      year: data.year,
      semester: data.semester,
      students: { list: studentList, summary: data?.students?.summary },
    };
    try {
      await ClassApi.create(body);
      setCreateFormOpen(false);
      toast.success("Tạo lớp học thành công");

      // Làm mới danh sách học kỳ (kỳ có thể vừa được auto-create trên server), rồi chọn đúng kỳ vừa tạo lớp
      // để useEffect [filterYear, filterSemesterId] gọi getStats/getList kèm semester_id — không lấy lớp mọi kỳ.
      const rawSemesters = await SemesterApi.getList();
      const safeSemesters = Array.isArray(rawSemesters)
        ? rawSemesters
        : Array.isArray(rawSemesters?.data)
          ? rawSemesters.data
          : [];
      setSemesterList(safeSemesters);

      const targetYear = data.year != null ? Number(data.year) : filterYear;
      const semCode = semesterTypeToCode(data.semester, targetYear);
      const matchedSem = safeSemesters.find((s) => String(s.semester_code) === semCode);

      if (targetYear != null) setFilterYear(targetYear);
      if (matchedSem) {
        setFilterSemesterId(matchedSem.id);
      } else if (targetYear != null && safeSemesters.length > 0) {
        const inYear = safeSemesters.filter((s) => Number(s.year) === targetYear);
        if (inYear.length > 0) setFilterSemesterId(inYear[0].id);
      }
      setFilterClass(null);
      // Luôn refetch stats + danh sách lớp theo kỳ vừa chọn (kể cả khi năm/kỳ trùng filter hiện tại → vẫn có GET /classes & /classes/stats)
      setClassesDataKey((k) => k + 1);
    } catch (err) {
      const mainMsg = err?.message || "Không thể tạo lớp";
      let detailMsg = "";
      if (err.details && Array.isArray(err.details)) {
        detailMsg = err.details
          .map((d) => {
            const match = d.field.match(/students\.list\.(\d+)\.(.+)/);
            if (match) {
              const row = parseInt(match[1]) + 1;
              const field = match[2];
              const fieldName = field === "email" ? "Email" : field;
              return `Dòng ${row} (${fieldName} sai)`;
            }
            return d.message;
          })
          .join(", ");
      }
      const fullMsg = detailMsg ? `${mainMsg}: ${detailMsg}` : mainMsg;
      
      setCreateError(fullMsg);
      toast.error(mainMsg, detailMsg);
      console.error("Create class error:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      {/* Hero: tiêu đề + KPI + hành động chính */}
      <PageHero
        title="Lớp học"
        subtitle="Quản lý các lớp khởi nghiệp, nhóm sinh viên và tiến độ giảng dạy của bạn."
        kpis={[
          { label: "Lớp học", value: stats.classCount, icon: BookOpenIcon, tone: "accent" },
          { label: "Nhóm sinh viên", value: stats.groupCount, icon: StatIconGroups, tone: "blue" },
          { label: "Bài tập", value: stats.assignmentCount, icon: StatIconAssignment, tone: "amber" },
          { label: "Cần chấm", value: stats.needGradingCount, icon: StatIconGrading, tone: "green" },
        ]}
        actions={
          <button
            type="button"
            disabled={!canCreateClass}
            onClick={canCreateClass ? () => setCreateFormOpen(true) : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-control text-sm font-medium transition-all duration-150 shrink-0 ${
              canCreateClass
                ? "bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-md cursor-pointer"
                : "bg-subtle text-text-muted cursor-not-allowed"
            }`}
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo lớp học
          </button>
        }
      />

      {/* Thanh lọc gọn */}
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3">
        <Dropdown
          label={t("lecturer.filterYear")}
          options={yearOptions}
          value={filterYear}
          onChange={handleYearChange}
        />
        <Dropdown
          label={t("lecturer.filterSemester")}
          options={semesterOptions}
          value={filterSemesterId}
          onChange={handleSemesterChange}
          disabled={filterYear == null}
        />
        <Dropdown
          label="Lớp"
          options={classFilterOptions}
          value={filterClass}
          onChange={(v) => setFilterClass(v)}
          disabled={filterYear == null || filterSemesterId == null}
        />
      </div>

      {/* Nội dung chính: empty state nếu chưa có lớp, ngược lại hiển thị danh sách ClassCard */}
      <div className="mt-4 sm:mt-6">
        {pageLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 full-width">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface rounded-3xl shadow-card p-5 h-[200px] animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : visibleClasses.length === 0 ? (
          <EmptyClasses onCreate={canCreateClass ? () => setCreateFormOpen(true) : undefined} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 full-width">
            {visibleClasses.map((c) => (
              <ClassCard
                key={c.id}
                code={c.code}
                subject={c.subject}
                students={c.students}
                groups={c.groups}
                completion={c.completion}
                semesterStatus={c.semester_status}
                avatars={c.avatars ?? []}
                onDetail={() => navigate(`/lecturer/classes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateClassForm
        key={createFormOpen ? "open" : "closed"}
        isOpen={createFormOpen}
        onClose={() => {
          setCreateFormOpen(false);
          setCreateError(null);
        }}
        onCreate={handleCreateClass}
        onClearError={() => setCreateError(null)}
        loading={createLoading}
        error={createError}
      />
    </>
  );
}
