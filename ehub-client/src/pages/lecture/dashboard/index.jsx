import { useState } from "react";
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
import {
  mockStats,
  mockYearOptions,
  mockSemesterOptions,
  mockRecentClasses,
  mockGroupStatus,
  mockAssignmentStatus,
  mockAssignmentUnit,
  mockGradingOverviewItems,
} from "./mockData";

const LectureDashboard = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(mockYearOptions[1]?.value ?? 2026);
  const [selectedSemester, setSelectedSemester] = useState(mockSemesterOptions[0]?.value ?? "Spring");

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Lớp học" value={mockStats.classCount} icon={<BookOpenIcon />} iconBg="bg-blue-100" iconColor="text-blue-500" />
        <StatCard title="Nhóm sinh viên" value={mockStats.groupCount} icon={<StatIconGroups />} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard title="Bài tập" value={mockStats.assignmentCount} icon={<StatIconAssignment />} iconBg="bg-purple-100" iconColor="text-violet-600" />
        <StatCard title="Cần chấm" value={mockStats.needGradingCount} icon={<StatIconGrading />} iconBg="bg-green-100" iconColor="text-green-600" />
      </div>
      <div className="w-full p-4 bg-white rounded-2xl shadow-sm mt-4">
        <div className="flex justify-start gap-4">
          <Dropdown
            label="Chọn năm học"
            options={mockYearOptions}
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
          />
          <Dropdown
            label="Kỳ"
            options={mockSemesterOptions}
            value={selectedSemester}
            onChange={(value) => setSelectedSemester(value)}
          />
        </div>
      </div>

      {/* Main content: empty state nếu chưa có lớp, ngược lại grid + grading */}
      {mockRecentClasses.length === 0 ? (
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
                classes={mockRecentClasses}
                onViewAll={() => navigate("/lecturer/classes")}
                onSelect={(item) => navigate(`/lecturer/classes/${item.id}`)}
              />
            </div>
            <div className="h-full w-full">
              <GroupStatus
                stats={mockGroupStatus}
                onDetail={() => navigate("/lecturer/groups")}
              />
            </div>
            <div className="h-full w-full">
              <AssignmentStatus
                stats={mockAssignmentStatus}
                unit={mockAssignmentUnit}
                onCreate={() => navigate("/lecturer/assignments")}
              />
            </div>
          </div>

          <div className="mt-4">
            <GradingOverview items={mockGradingOverviewItems} />
          </div>
        </>
      )}
    </>
  );
};

export default LectureDashboard;
