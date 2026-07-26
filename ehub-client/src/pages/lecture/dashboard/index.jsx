import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthUser } from "@/store/slices/authSlice";
import Dropdown from "@/components/ui/filter/DropDown";
import DashboardHero from "@/pages/lecture/dashboard/components/DashboardHero";
import RecentClasses from "@/components/ui/lecture/RecentClasses";
import RecentClassesEmpty from "@/pages/lecture/dashboard/components/RecentClassesEmpty";
import GroupStatus from "@/components/ui/lecture/GroupStatus";
import AssignmentStatus from "@/components/ui/lecture/AssignmentStatus";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";

const VALUE_ALL_SEMESTERS = "all";

const LectureDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const heroName = (user?.full_name || user?.username || "")
    .replace(/\s*\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(-1)[0] || "";
  const [semesterList, setSemesterList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [stats, setStats] = useState({
    classCount: 0,
    groupCount: 0,
    assignmentCount: 0,
    needGradingCount: 0,
  });
  const [recentClasses, setRecentClasses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch first
  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      const safeList = Array.isArray(list) ? list : [];
      setSemesterList(safeList);
      if (safeList.length) {
        // Tự động chọn học kỳ đang diễn ra
        const ongoing = safeList.find((s) => s.status === "ongoing");
        if (ongoing) {
          setSelectedYear(ongoing.year);
          setSelectedSemesterId(ongoing.id);
        } else {
          const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
          const currentYear = new Date().getFullYear();
          const selectedYear = years.includes(currentYear) ? currentYear : years[0];
          const inYear = safeList.filter((s) => s.year === selectedYear);
          setSelectedYear(selectedYear);
          setSelectedSemesterId(inYear.length > 1 ? VALUE_ALL_SEMESTERS : inYear[0].id);
        }
      } else {
        setPageLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  const yearOptions = useSemesterYearOptions(semesterList);
  const semestersInYear = semesterList.filter((s) => s.year === selectedYear);
  const semesterOptions = useMemo(
    () => [
      { value: VALUE_ALL_SEMESTERS, label: t("lecturer.allSemesters") },
      ...semestersInYear.map((s) => ({
        value: s.id,
        label: formatSemesterLabel(s, t),
      })),
    ],
    [semestersInYear, t],
  );

  const handleYearChange = (year) => {
    setSelectedYear(year);
    const inYear = semesterList.filter((s) => s.year === year);
    if (inYear.length > 1) {
      setSelectedSemesterId(VALUE_ALL_SEMESTERS);
    } else if (inYear.length === 1) {
      setSelectedSemesterId(inYear[0].id);
    }
  };

  // Fetch stats và lớp gần đây theo kỳ đã chọn
  useEffect(() => {
    if (selectedYear == null && selectedSemesterId == null) return;
    const fetchData = async () => {
      setPageLoading(true);
      const baseParams = { year: selectedYear };
      let params = baseParams;
      if (selectedSemesterId && selectedSemesterId !== VALUE_ALL_SEMESTERS) {
        const sem = semesterList.find((s) => s.id === selectedSemesterId);
        if (sem?.semester_code) {
          params = { ...baseParams, semester_code: sem.semester_code };
        }
      }
      try {
        const [statsRes, listRes] = await Promise.all([
          ClassApi.getStats(params),
          ClassApi.getList({
            lecturerScope: "mine",
            limit: 10,
            page: 1,
            ...params,
          }),
        ]);
        setStats({
          classCount: statsRes?.data?.classCount ?? 0,
          groupCount: statsRes?.data?.groupCount ?? 0,
          assignmentCount: statsRes?.data?.assignmentCount ?? 0,
          needGradingCount: statsRes?.data?.needGradingCount ?? 0,
          groupStats: statsRes?.data?.groupStats,
          checkpointStats: statsRes?.data?.checkpointStats,
        });
        const list = listRes?.data ?? [];
        setRecentClasses(
          list.map((c) => ({
            id: c.id,
            code: c.class_code,
            studentCount: c.student_count ?? 0,
            groupCount: c.group_count ?? 0,
          }))
        );
      } catch {
        setStats({ classCount: 0, groupCount: 0, assignmentCount: 0, needGradingCount: 0 });
        setRecentClasses([]);
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedSemesterId, semesterList]);

  return (
    <>
      <DashboardHero
        name={heroName}
        stats={[
          { label: "Lớp học", value: stats.classCount },
          { label: "Nhóm sinh viên", value: stats.groupCount },
          { label: "Checkpoint", value: stats.assignmentCount },
          { label: "Cần chấm", value: stats.needGradingCount },
        ]}
      />

      {/* Thanh lọc gọn */}
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3">
        <Dropdown
          label={t("lecturer.selectYear")}
          options={yearOptions}
          value={selectedYear}
          onChange={handleYearChange}
        />
        <Dropdown
          label={t("lecturer.filterSemester")}
          options={semesterOptions}
          value={selectedSemesterId}
          onChange={(value) => setSelectedSemesterId(value)}
        />
      </div>

      {/* Bố cục bất đối xứng (bento): khối lớn trái + cột phải xếp chồng */}
      {pageLoading ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 lg:row-span-2 h-80 rounded-card bg-surface shadow-card animate-pulse" />
          <div className="h-40 rounded-card bg-surface shadow-card animate-pulse" />
          <div className="h-40 rounded-card bg-surface shadow-card animate-pulse" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 lg:row-span-2 min-w-0">
            {recentClasses.length === 0 ? (
              <RecentClassesEmpty
                onViewAll={() => navigate("/lecturer/classes")}
                onCreate={() => navigate("/lecturer/classes")}
              />
            ) : (
              <RecentClasses
                classes={recentClasses}
                onViewAll={() => navigate("/lecturer/classes")}
                onSelect={(item) => navigate(`/lecturer/classes/${item.id}`)}
              />
            )}
          </div>
          <GroupStatus
            stats={stats.groupStats || { eligible: 0, needsReview: 0, ineligible: 0 }}
            onDetail={() => navigate("/lecturer/groups")}
          />
          <AssignmentStatus
            stats={stats.checkpointStats || { submitted: 0, pending: 0, late: 0 }}
            unit=""
            onCreate={() => navigate("/lecturer/assignments?tab=checkpoints")}
          />
        </div>
      )}
    </>
  );
};

export default LectureDashboard;
