import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpenIcon } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import GroupCard from "./components/GroupCard";
import ClassApi from "@/api/class";
import GroupApi from "@/api/group";
import SemesterApi from "@/api/semester";

const VALUE_ALL = "all";

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: VALUE_ALL },
  { label: "Đang lập nhóm", value: "forming" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Ngưng hoạt động", value: "inactive" },
  { label: "Đã hoàn thành", value: "completed" },
  { label: "Đã giải tán", value: "dissolved" },
];

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState(VALUE_ALL);
  const [filterStatus, setFilterStatus] = useState(VALUE_ALL);
  const [filterSemesterId, setFilterSemesterId] = useState(VALUE_ALL);
  const [semesterList, setSemesterList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [stats, setStats] = useState({
    classCount: 0,
    groupCount: 0,
    assignmentCount: 0,
    needGradingCount: 0,
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      setSemesterList(Array.isArray(list) ? list : []);
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    const fetchStatsAndClasses = async () => {
      try {
        const [statsRes, classesRes] = await Promise.all([
          ClassApi.getStats({}),
          ClassApi.getList({ lecturerScope: "mine", limit: 100, page: 1 }),
        ]);
        const s = statsRes?.data || {};
        setStats({
          classCount: s.classCount ?? 0,
          groupCount: s.groupCount ?? 0,
          assignmentCount: s.assignmentCount ?? 0,
          needGradingCount: s.needGradingCount ?? 0,
        });
        const list = classesRes?.data || [];
        setClassList(list.map((c) => ({ id: c.id, class_code: c.class_code })));
      } catch {
        setStats({ classCount: 0, groupCount: 0, assignmentCount: 0, needGradingCount: 0 });
        setClassList([]);
      }
    };
    fetchStatsAndClasses();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await GroupApi.getList({
          lecturerScope: "mine",
          limit: 100,
          page: 1,
        });
        const data = res?.data?.data ?? res?.data ?? [];
        setGroups(
          data.map((g) => ({
            id: g.id,
            name: g.group_name || g.group_code,
            classCode: g.class_code,
            topic: g.topic || g.description,
            class_id: g.class_id,
            semester_id: g.semester_id,
            semester_name: g.semester_name,
            members: Number(g.member_count) || 0,
            status: g.status,
            majors: [
              { name: "DE",    count: Number(g.de_count) || 0,   minRequired: 2 },
              { name: "DS/DA", count: Number(g.dsda_count) || 0, minRequired: 2 }
            ],
            avatars: g.avatars || [],
          }))
        );
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const classOptions = useMemo(
    () => [
      { label: "Tất cả lớp", value: VALUE_ALL },
      ...classList.map((c) => ({
        label: c.class_code.split("_")[0] || c.class_code,
        value: String(c.id),
      })),
    ],
    [classList]
  );

  const semesterOptions = useMemo(
    () => [
      { label: "Tất cả kỳ", value: VALUE_ALL },
      ...semesterList.map((s) => ({
        label: s.semester_name.replace(/\s?\d{4}$/, ""),
        value: String(s.id),
      })),
    ],
    [semesterList]
  );

  const filteredGroups = useMemo(() => {
    let list = [...groups];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          (g.name && g.name.toLowerCase().includes(q)) ||
          (g.classCode && g.classCode.toLowerCase().includes(q)) ||
          (g.topic && g.topic.toLowerCase().includes(q))
      );
    }
    if (filterClass !== VALUE_ALL) {
      list = list.filter((g) => String(g.class_id) === filterClass);
    }
    if (filterStatus !== VALUE_ALL) {
      list = list.filter((g) => g.status === filterStatus);
    }
    if (filterSemesterId !== VALUE_ALL) {
      list = list.filter((g) => String(g.semester_id) === filterSemesterId);
    }
    return list;
  }, [groups, searchQuery, filterClass, filterStatus, filterSemesterId]);

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Lớp học"
          value={stats.classCount}
          icon={<BookOpenIcon size={22} />}
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

      <section className="mt-4 sm:mt-6 w-full p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 w-full">
          <div className="relative w-full md:flex-1 md:min-w-[200px]">
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
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto md:flex">
          <Dropdown
            label="Tất cả lớp"
            options={classOptions}
            value={filterClass}
            onChange={(v) => setFilterClass(v)}
          />
          <Dropdown
            label="Trạng thái"
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
          />
          <Dropdown
            label="Học kì"
            options={semesterOptions}
            value={filterSemesterId}
            onChange={(v) => setFilterSemesterId(v)}
          />
          </div>
        </div>
      </section>

      <section className="mt-4 sm:mt-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">Đang tải...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
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
                topic={g.topic}
                members={g.members}
                majors={g.majors}
                avatars={g.avatars}
                onDetail={() => navigate(`/lecturer/groups/${g.id}`)}
              />
            ))}
          </div>
        )}
      </section>

    </>
  );
}
