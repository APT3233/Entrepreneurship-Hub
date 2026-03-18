import { useEffect, useState } from "react";
import StatCard from "@/components/ui/Card/StatCard";
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

  // Fetch first
  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      setSemesterList(Array.isArray(list) ? list : []);
      if (list?.length) {
        const firstYear = list[0].year;
        const inFirstYear = list.filter((s) => s.year === firstYear);
        setSelectedYear(firstYear);
        setSelectedSemesterId(inFirstYear.length > 1 ? VALUE_ALL_SEMESTERS : inFirstYear[0].id);
      }
    };
    fetchSemesters();
  }, []);

  const yearOptions = [...new Set(semesterList.map((s) => s.year))]
    .sort((a, b) => b - a)
    .map((year) => ({ value: year, label: `${year}` }));

  const semestersInYear = semesterList.filter((s) => s.year === selectedYear);
  const semesterOptions = [
    { value: VALUE_ALL_SEMESTERS, label: "Tất cả kỳ" },
    ...semestersInYear.map((s) => ({ value: s.id, label: s.semester_name })),
  ];

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
      }
    };
    fetchData();
  }, [selectedYear, selectedSemesterId, semesterList]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Lớp học" value={stats.classCount} icon={<BookOpenIcon />} iconBg="bg-blue-100" iconColor="text-blue-500" />
        <StatCard title="Nhóm sinh viên" value={stats.groupCount} icon={<StatIconGroups />} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard title="Bài tập" value={stats.assignmentCount} icon={<StatIconAssignment />} iconBg="bg-purple-100" iconColor="text-violet-600" />
        <StatCard title="Cần chấm" value={stats.needGradingCount} icon={<StatIconGrading />} iconBg="bg-green-100" iconColor="text-green-600" />
      </div>
      <div className="w-full p-4 bg-white rounded-2xl shadow-sm mt-4">
        <div className="flex justify-start gap-4">
          <Dropdown
            label="Chọn năm học"
            options={yearOptions}
            value={selectedYear}
            onChange={handleYearChange}
          />
          <Dropdown
            label="Kỳ"
            options={semesterOptions}
            value={selectedSemesterId}
            onChange={(value) => setSelectedSemesterId(value)}
          />
        </div>
      </div>

      {/* Main content: empty state nếu chưa có lớp, ngược lại grid + grading */}
      {recentClasses.length === 0 ? (
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
                stats={{ eligible: 0, needsReview: 0, ineligible: 0 }}
                onDetail={() => navigate("/lecturer/groups")}
              />
            </div>
            <div className="h-full w-full">
              <AssignmentStatus
                stats={{ submitted: 0, pending: 0, late: 0 }}
                unit="%"
                onCreate={() => navigate("/lecturer/assignments")}
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
