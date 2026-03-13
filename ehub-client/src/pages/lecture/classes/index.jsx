import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/Card/StatCard";
import { BookOpenIcon, Plus } from "lucide-react";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import EmptyClasses from "./components/EmptyClasses";
import ClassCard from "./components/ClassCard";
import CreateClassModal from "@/components/modal/lecturer/CreateClassModal";
import {
  mockClasses as initialMockClasses,
  mockStats,
  mockYearOptions,
  mockSemesterOptions,
  mockClassFilterOptions,
} from "./mockData";

export default function ClassesPage() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterClass, setFilterClass] = useState("all");
  const [filterYear, setFilterYear] = useState(2026);
  const [filterSemester, setFilterSemester] = useState("Spring");
  // Danh sách lớp — khởi tạo bằng mock; khi gắn API thay bằng useState([]) + fetch
  const [classes, setClasses] = useState(initialMockClasses);

  const handleCreateClass = (data) => {
    console.log("onCreate class", data);
    setCreateModalOpen(false);
    // Sau khi tạo thành công, thêm lớp vào list (hoặc gọi lại API)
    setClasses((prev) => [
      ...prev,
      {
        id: Date.now(),
        code: data.name?.trim() || "Lớp mới",
        subject: `Học kì ${data.ky || "Spring"} ${data.year || 2026}`,
        students: 0,
        groups: 0,
        completion: 0,
        avatars: [],
      },
    ]);
  };

  return (
    <>
      {/* Section 1: Thống kê tổng quan */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Lớp học"
          value={classes.length}
          icon={<BookOpenIcon />}
          iconBg="bg-blue-100"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Nhóm sinh viên"
          value={mockStats.groupCount}
          icon={<StatIconGroups />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Bài tập"
          value={mockStats.assignmentCount}
          icon={<StatIconAssignment />}
          iconBg="bg-purple-100"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Cần chấm"
          value={mockStats.needGradingCount}
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
              label="Tất cả lớp"
              options={mockClassFilterOptions}
              value={filterClass}
              onChange={(v) => setFilterClass(v)}
            />
            <Dropdown
              label="Năm"
              options={mockYearOptions}
              value={filterYear}
              onChange={(v) => setFilterYear(v)}
            />
            <Dropdown
              label="Kỳ"
              options={mockSemesterOptions}
              value={filterSemester}
              onChange={(v) => setFilterSemester(v)}
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo lớp học
          </button>
        </div>
      </section>

      {/* Nội dung chính: empty state nếu chưa có lớp, ngược lại hiển thị danh sách ClassCard */}
      <div className="mt-4 sm:mt-6">
        {classes.length === 0 ? (
          <EmptyClasses onCreate={() => setCreateModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 full-width">
            {classes.map((c) => (
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
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateClass}
      />
    </>
  );
}
