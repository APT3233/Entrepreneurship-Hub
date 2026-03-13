import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpenIcon } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import GroupCard from "./components/GroupCard";
import {
  mockStats,
  mockGroups,
  mockClassOptions,
  mockStatusOptions,
  mockSemesterOptions,
  calcGroupStatus,
} from "./mockData";

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");

  const filteredGroups = useMemo(() => {
    let list = [...mockGroups];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          (g.name && g.name.toLowerCase().includes(q)) ||
          (g.classCode && g.classCode.toLowerCase().includes(q))
      );
    }

    if (filterClass !== "all") {
      list = list.filter((g) => g.classCode === filterClass);
    }

    if (filterStatus !== "all") {
      list = list.filter((g) => calcGroupStatus(g.majors) === filterStatus);
    }

    if (filterSemester !== "all") {
      list = list.filter((g) => g.semester === filterSemester);
    }

    return list;
  }, [searchQuery, filterClass, filterStatus, filterSemester]);

  return (
    <>
      {/* Section 1: Thống kê */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Lớp học"
          value={mockStats.classCount}
          icon={<BookOpenIcon size={22} />}
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

      {/* Section 2: Tìm kiếm + bộ lọc */}
      <section className="mt-4 sm:mt-6 w-full p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Tìm kiếm nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <Dropdown
            label="Tất cả lớp"
            options={mockClassOptions}
            value={filterClass}
            onChange={(v) => setFilterClass(v)}
          />
          <Dropdown
            label="Tất cả trạng thái"
            options={mockStatusOptions}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
          />
          <Dropdown
            label="Học kì"
            options={mockSemesterOptions}
            value={filterSemester}
            onChange={(v) => setFilterSemester(v)}
          />
        </div>
      </section>

      {/* Section 3: Danh sách GroupCard */}
      <section className="mt-4 sm:mt-6">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">Không có nhóm nào phù hợp.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredGroups.map((g) => (
              <GroupCard
                key={g.id}
                name={g.name}
                classCode={g.classCode}
                members={g.members}
                majors={g.majors}
                avatars={g.avatars ?? []}
                onDetail={() => navigate(`/lecturer/groups/${g.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
