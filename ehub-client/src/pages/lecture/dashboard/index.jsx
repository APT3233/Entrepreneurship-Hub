import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";
import StatCard from "@/components/ui/Card/StatCard";
import Card from "@/components/ui/Card/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useNavigate } from "react-router-dom";
import { BookOpenIcon } from "lucide-react";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import RecentClasses from "@/components/ui/lecture/RecentClasses";
import RecentClassesEmpty from "@/pages/lecture/dashboard/components/RecentClassesEmpty";
import GroupStatus from "@/components/ui/lecture/GroupStatus";
import AssignmentStatus from "@/components/ui/lecture/AssignmentStatus";
import GradingOverview from "@/components/ui/lecture/GradingOverview";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";

const VALUE_ALL_SEMESTERS = "all";

const LectureDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      <PageHeader
        title="Bảng điều khiển"
        description="Tổng quan lớp học, nhóm và tiến độ chấm điểm."
      />
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Lớp học" 
          value={stats.classCount} 
          icon={<BookOpenIcon />} 
          iconBg="bg-blue-100" 
          iconColor="text-blue-500" 
          onClick={() => navigate("/lecturer/classes")}
        />
        <StatCard 
          title="Nhóm sinh viên" 
          value={stats.groupCount} 
          icon={<StatIconGroups />} 
          iconBg="bg-amber-100" 
          iconColor="text-amber-600" 
          onClick={() => navigate("/lecturer/groups")}
        />
        <StatCard 
          title="Checkpoint" 
          value={stats.assignmentCount} 
          icon={<StatIconAssignment />} 
          iconBg="bg-purple-100" 
          iconColor="text-violet-600" 
          onClick={() => navigate("/lecturer/assignments?tab=checkpoints")}
        />
        <StatCard 
          title="Cần chấm" 
          value={stats.needGradingCount} 
          icon={<StatIconGrading />} 
          iconBg="bg-green-100" 
          iconColor="text-green-600" 
          onClick={() => navigate("/lecturer/assignments")}
        />
      </div>
      <Card className="w-full p-4 mt-4">
        <div className="flex justify-start gap-4">
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
      </Card>

      {/* Main content: empty state nếu chưa có lớp, ngược lại grid + grading */}
      {pageLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-48 w-full md:col-span-2 xl:col-span-1 bg-surface rounded-card border border-border p-6 animate-pulse">
            <div className="h-4 bg-subtle rounded-control w-1/3 mb-4" />
            <div className="h-10 bg-subtle rounded-control w-full mb-3" />
            <div className="h-10 bg-subtle rounded-control w-full" />
          </div>
          <div className="h-48 w-full bg-surface rounded-card border border-border p-6 animate-pulse">
             <div className="h-4 bg-subtle rounded-control w-1/3 mb-4" />
             <div className="h-20 bg-subtle w-20 mx-auto rounded-full" />
          </div>
          <div className="h-48 w-full bg-surface rounded-card border border-border p-6 animate-pulse">
             <div className="h-4 bg-subtle rounded-control w-1/3 mb-4" />
             <div className="h-16 bg-subtle rounded-control w-full" />
          </div>
        </div>
      ) : recentClasses.length === 0 ? (
        <div className="mt-4">
          <RecentClassesEmpty
            onViewAll={() => navigate("/lecturer/classes")}
            onCreate={() => navigate("/lecturer/classes")}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-full w-full md:col-span-2 xl:col-span-1">
              <RecentClasses
                classes={recentClasses}
                onViewAll={() => navigate("/lecturer/classes")}
                onSelect={(item) => navigate(`/lecturer/classes/${item.id}`)}
              />
            </div>
            <div className="h-full w-full">
              <GroupStatus
                stats={stats.groupStats || { eligible: 0, needsReview: 0, ineligible: 0 }}
                onDetail={() => navigate("/lecturer/groups")}
              />
            </div>
            <div className="h-full w-full">
              <AssignmentStatus
                stats={stats.checkpointStats || { submitted: 0, pending: 0, late: 0 }}
                unit=""
                onCreate={() => navigate("/lecturer/assignments?tab=checkpoints")}
              />
            </div>
          </div>

          <div className="mt-4">
            <GradingOverview items={[]} />
          </div>
        </>
      )}
    </>
  );
};

export default LectureDashboard;
