import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import ClassInfo from "./components/ClassInfo";
import StudentList from "./components/StudentList";
import CreateGroupModal from "@/components/modal/lecturer/CreateGroupModal";
import {
  getClassDetail,
  mockClasses,
  mockYearOptions,
  mockSemesterOptions,
  mockClassFilterOptions,
} from "./mockData";

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detail = useMemo(() => getClassDetail(id), [id]);

  const [filterYear, setFilterYear] = useState(mockYearOptions[1]?.value ?? 2026);
  const [filterSemester, setFilterSemester] = useState("Spring");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);

  useEffect(() => {
    if (id != null && !detail) navigate("/lecturer/classes", { replace: true });
  }, [id, detail, navigate]);

  const groupOptions = useMemo(
    () => [
      { label: "Tất cả", value: "all" },
      ...(detail?.groups || []).map((g) => ({ label: g.name, value: String(g.id) })),
    ],
    [detail?.groups]
  );

  const filteredStudents = useMemo(() => {
    const list = detail?.students || [];
    const byGroup =
      selectedGroup === "all"
        ? list
        : list.filter((s) => String(s.groupId) === selectedGroup);
    if (!searchQuery.trim()) return byGroup;
    const q = searchQuery.trim().toLowerCase();
    return byGroup.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.mssv && s.mssv.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [detail?.students, selectedGroup, searchQuery]);

  const studentsWithGroupName = useMemo(() => {
    const groups = detail?.groups || [];
    const map = Object.fromEntries(groups.map((g) => [g.id, g.name]));
    return filteredStudents.map((s) => ({
      ...s,
      groupName: s.groupId != null ? map[s.groupId] : undefined,
    }));
  }, [detail?.groups, filteredStudents]);

  if (!detail) return null;

  const handleClassChange = (value) => {
    if (value === "all") {
      navigate("/lecturer/classes");
      return;
    }
    const c = mockClasses.find((x) => x.code === value);
    if (c) navigate(`/lecturer/classes/${c.id}`);
  };

  return (
    <>
      {/* Section 1: Thống kê */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Số sinh viên"
          value={detail.studentCount}
          icon={<Users size={22} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Nhóm sinh viên"
          value={detail.groupCount}
          icon={<StatIconGroups />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Bài tập"
          value={detail.assignmentCount}
          icon={<StatIconAssignment />}
          iconBg="bg-purple-100"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Cần chấm"
          value={detail.needGradingCount}
          icon={<StatIconGrading />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </section>

      {/* Section 2: Filter + Tạo nhóm */}
      <section className="mt-4 sm:mt-6 w-full p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Dropdown
              label="Tất cả lớp"
              options={mockClassFilterOptions}
              value={detail.classCode}
              onChange={handleClassChange}
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
            onClick={() => setCreateGroupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo nhóm
          </button>
        </div>
      </section>

      {/* Section 3: Thông tin lớp học */}
      <section className="mt-4 sm:mt-6">
        <ClassInfo
          classCode={detail.classCode}
          lecturer={detail.lecturer}
          subject={detail.subject}
          semester={detail.semester}
        />
      </section>

      {/* Section 4: Danh sách sinh viên (sau khi tạo nhóm: cột Nhóm*, lọc nhóm, Nhóm trưởng) */}
      <section className="mt-4 sm:mt-6">
        <StudentList
          students={studentsWithGroupName}
          totalCount={detail.studentCount}
          groupCount={detail.groupCount > 0 ? detail.groupCount : null}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          groupOptions={groupOptions}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
        />
      </section>

      <CreateGroupModal
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onSubmit={() => {
          setCreateGroupModalOpen(false);
          // TODO: gọi API tạo nhóm, sau đó cập nhật detail (refresh hoặc thêm nhóm mới)
        }}
        students={(detail.students || [])
          .filter((s) => s.groupId == null)
          .map((s) => ({ id: s.id, name: s.name, mssv: s.mssv, student_code: s.student_code, major: s.major || "" }))}
      />
    </>
  );
}
