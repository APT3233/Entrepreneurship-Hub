import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/Card/StatCard";
import { BookOpenIcon, Plus } from "lucide-react";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import EmptyClasses from "./components/EmptyClasses";
import ClassCard from "./components/ClassCard";
import CreateClassModal from "@/components/modal/lecturer/CreateClassModal";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";

const VALUE_ALL_SEMESTERS = "all";
const VALUE_ALL_CLASSES = "all";

export default function ClassesPage() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClass, setFilterClass] = useState(VALUE_ALL_CLASSES);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({
    classCount: 0,
    groupCount: 0,
    assignmentCount: 0,
    needGradingCount: 0,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      const safeList = Array.isArray(list) ? list : [];
      setSemesterList(safeList);
      if (safeList.length) {
        const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
        const currentYear = new Date().getFullYear();
        const hasCurrentYear = years.includes(currentYear);
        const selectedYear = hasCurrentYear ? currentYear : years[0];
        const inYear = safeList.filter((s) => s.year === selectedYear);
        setFilterYear(selectedYear);
        setFilterSemesterId(inYear.length > 1 ? VALUE_ALL_SEMESTERS : inYear[0].id);
        setFilterClass(VALUE_ALL_CLASSES);
      }
    };
    fetchSemesters();
  }, []);

  const yearOptions = useMemo(
    () =>
      [...new Set(semesterList.map((s) => s.year))]
        .sort((a, b) => b - a)
        .map((year) => ({ value: year, label: `${year}` })),
    [semesterList]
  );

  const semestersInYear = useMemo(
    () => semesterList.filter((s) => s.year === filterYear),
    [semesterList, filterYear]
  );

  const ongoingSemestersInYear = useMemo(
    () => semestersInYear.filter((s) => s.status === "ongoing"),
    [semestersInYear]
  );

  // Kỳ chỉ hiện khi đã chọn năm; options = các kỳ trong năm đó
  const semesterOptions = useMemo(() => {
    if (!filterYear) return [];
    return [
      { value: VALUE_ALL_SEMESTERS, label: "Tất cả kỳ" },
      ...semestersInYear.map((s) => ({ value: s.id, label: s.semester_name })),
    ];
  }, [filterYear, semestersInYear]);

  const handleYearChange = (year) => {
    setFilterYear(year);
    const inYear = semesterList.filter((s) => s.year === year);
    if (inYear.length > 1) {
      setFilterSemesterId(VALUE_ALL_SEMESTERS);
    } else if (inYear.length === 1) {
      setFilterSemesterId(inYear[0].id);
    } else {
      setFilterSemesterId(null);
    }
    setFilterClass(VALUE_ALL_CLASSES);
  };

  const handleSemesterChange = (value) => {
    setFilterSemesterId(value);
    setFilterClass(VALUE_ALL_CLASSES);
  };

  const canCreateClass = useMemo(() => {
    if (!filterYear || !semestersInYear.length) return false;

    // Đang chọn 1 kỳ cụ thể → chỉ cho tạo khi kỳ đó đang ongoing
    if (filterSemesterId && filterSemesterId !== VALUE_ALL_SEMESTERS) {
      const sem = semesterList.find((s) => s.id === filterSemesterId);
      return sem?.status === "ongoing";
    }

    // Chọn "Tất cả kỳ" trong năm → cho tạo nếu trong năm có ít nhất 1 kỳ ongoing
    return ongoingSemestersInYear.length > 0;
  }, [filterYear, filterSemesterId, semestersInYear, ongoingSemestersInYear, semesterList]);

  // Fetch stats + danh sách lớp chỉ khi đã chọn Năm và Kỳ (thứ tự: Năm → Kỳ → Lớp)
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchData = async () => {
      const baseParams = { year: filterYear };
      const semesterId =
        filterSemesterId && filterSemesterId !== VALUE_ALL_SEMESTERS
          ? filterSemesterId
          : undefined;
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
      }
    };
    fetchData();
  }, [filterYear, filterSemesterId]);

  // Dropdown lọc lớp — luôn gồm "Tất cả lớp" + các lớp hiện tại
  const classFilterOptions = useMemo(
    () => [
      { label: "Tất cả lớp", value: VALUE_ALL_CLASSES },
      ...classes.map((c) => ({ label: c.code, value: c.id })),
    ],
    [classes]
  );

  const visibleClasses = useMemo(() => {
    if (filterClass === VALUE_ALL_CLASSES) return classes;
    return classes.filter((c) => c.id === filterClass);
  }, [classes, filterClass]);

  const handleCreateClass = async (data) => {
    setCreateError(null);
    setCreateLoading(true);
    const studentList = (data?.students?.list || []).map((s) => ({
        memberCode: s.memberCode || s.rollNumber,
        rollNumber: s.rollNumber,
        email: s.email,
        fullname: s.fullname,
        major: s.major,
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
      setCreateModalOpen(false);
      // Refetch stats and list to stay in sync
      const baseParams = { year: filterYear };
      const semesterId =
        filterSemesterId && filterSemesterId !== VALUE_ALL_SEMESTERS ? filterSemesterId : undefined;
      const params = { ...baseParams, ...(semesterId != null && { semester_id: semesterId }) };
      const [statsRes, listRes] = await Promise.all([
        ClassApi.getStats(params),
        ClassApi.getList({ lecturerScope: "mine", limit: 50, page: 1, ...params }),
      ]);
      const s = statsRes?.data?.data || statsRes?.data || {};
      setStats({
        classCount: s.classCount ?? 0,
        groupCount: s.groupCount ?? 0,
        assignmentCount: s.assignmentCount ?? 0,
        needGradingCount: s.needGradingCount ?? 0,
      });
      const list = listRes?.data?.data || listRes?.data || [];
      setClasses(
        list.map((c) => ({
          id: c.id,
          code: c.class_code,
          subject: c.class_name || "",
          students: c.student_count ?? 0,
          groups: c.group_count ?? 0,
          completion: 0,
          semester_id: c.semester_id,
        }))
      );
    } catch (err) {
      setCreateError(err?.response?.data?.message || err?.message || "Không thể tạo lớp");
      console.error("Create class error:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      {/* Section 1: Thống kê tổng quan */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Lớp học"
          value={stats.classCount}
          icon={<BookOpenIcon />}
          iconBg="bg-blue-100"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Nhóm sinh viên"
          value={stats.groupCount}
          icon={<StatIconGroups />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Bài tập"
          value={stats.assignmentCount}
          icon={<StatIconAssignment />}
          iconBg="bg-purple-100"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Cần chấm"
          value={stats.needGradingCount}
          icon={<StatIconGrading />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </section>

      {/* Section 2: Bộ lọc + nút Tạo lớp học */}
      <section className="mt-4 sm:mt-6 w-full p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Dropdown
              label="Năm"
              options={yearOptions}
              value={filterYear}
              onChange={handleYearChange}
            />
            <Dropdown
              label="Kỳ"
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
          <button
            type="button"
            disabled={!canCreateClass}
            onClick={canCreateClass ? () => setCreateModalOpen(true) : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0 ${
              canCreateClass
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo lớp học
          </button>
        </div>
      </section>

      {/* Nội dung chính: empty state nếu chưa có lớp, ngược lại hiển thị danh sách ClassCard */}
      <div className="mt-4 sm:mt-6">
        {visibleClasses.length === 0 ? (
          <EmptyClasses onCreate={canCreateClass ? () => setCreateModalOpen(true) : undefined} />
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
                avatars={c.avatars ?? []}
                onDetail={() => navigate(`/lecturer/classes/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateClassModal
        key={createModalOpen ? "open" : "closed"}
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        onCreate={handleCreateClass}
        loading={createLoading}
        error={createError}
      />
    </>
  );
}
