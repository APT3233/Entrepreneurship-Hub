import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import GroupCard from "./components/GroupCard";
import ClassApi from "@/api/class";
import GroupApi from "@/api/group";
import SemesterApi from "@/api/semester";
import { useTranslation } from "@/context/TranslationContext";
import {
  LECTURE_VALUE_ALL,
  useGroupStatusFilterOptions,
  useSemesterOptions,
  useSemesterYearOptions,
} from "@/hooks/useLectureFilterOptions";

const VALUE_ALL = LECTURE_VALUE_ALL;

export default function GroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusFilterOptions = useGroupStatusFilterOptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState(null);
  const [filterStatus, setFilterStatus] = useState(VALUE_ALL);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
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
      const safeList = Array.isArray(list) ? list : [];
      setSemesterList(safeList);
      
      if (safeList.length) {
        // Tự động chọn học kỳ đang diễn ra
        const ongoing = safeList.find(s => s.status === 'ongoing');
        if (ongoing) {
          setFilterYear(ongoing.year);
          setFilterSemesterId(String(ongoing.id));
        } else {
          const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
          const currentYear = new Date().getFullYear();
          const selectedYear = years.includes(currentYear) ? currentYear : years[0];
          setFilterYear(selectedYear);
          
          const inYear = safeList.filter(s => s.year === selectedYear);
          setFilterSemesterId(String(inYear[0].id));
        }
      }
    };
    fetchSemesters();
  }, []);

  // Fetch Classes when Semester changes
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const res = await ClassApi.getList({ 
          lecturerScope: "mine", 
          limit: 100, 
          year: filterYear,
          semester_id: filterSemesterId
        });
        const list = res?.data || [];
        const mapped = list.map((c) => ({ id: c.id, class_code: c.class_code }));
        setClassList(mapped);

        // Mặc định chọn lớp đầu tiên
        if (mapped.length > 0) {
          setFilterClass(String(mapped[0].id));
        } else {
          setFilterClass(null);
        }
      } catch {
        setClassList([]);
        setFilterClass(null);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await ClassApi.getStats({});
        const s = statsRes?.data || {};
        setStats({
          classCount: s.classCount ?? 0,
          groupCount: s.groupCount ?? 0,
          assignmentCount: s.assignmentCount ?? 0,
          needGradingCount: s.needGradingCount ?? 0,
        });
      } catch {
        setStats({ classCount: 0, groupCount: 0, assignmentCount: 0, needGradingCount: 0 });
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!filterClass) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await GroupApi.getList({
          lecturerScope: "mine",
          limit: 100,
          page: 1,
          class_id: filterClass,
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
  }, [filterClass]);

  const yearOptions = useSemesterYearOptions(semesterList);
  const semesterOptions = useSemesterOptions(semesterList, filterYear);

  const classOptions = useMemo(
    () => classList.map((c) => ({
      label: c.class_code,
      value: String(c.id),
    })),
    [classList]
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

  const isReady = (g) => g.majors.every((m) => m.count >= (m.minRequired ?? 1));
  const attentionGroups = useMemo(() => filteredGroups.filter((g) => !isReady(g)), [filteredGroups]);
  const readyGroups = useMemo(() => filteredGroups.filter(isReady), [filteredGroups]);
  const totalTeams = filteredGroups.length;
  const readyPct = totalTeams ? Math.round((readyGroups.length / totalTeams) * 100) : 0;

  const renderCard = (g) => (
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
  );

  return (
    <>
      {/* Portfolio: câu chuyện mức độ sẵn sàng của các đội */}
      <section className="rounded-card bg-surface shadow-card p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{t("lecturer.groups")}</h1>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed max-w-2xl">
          Danh mục các đội khởi nghiệp bạn phụ trách — theo dõi mức độ sẵn sàng và thành phần ngành.
        </p>

        {totalTeams > 0 && (
          <div className="mt-6 border-t border-border pt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-accent tracking-tight">{totalTeams}</span>
              <span className="text-sm text-text-muted">đội</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-sm text-text-secondary">Đủ điều kiện</span>
              <span className="text-sm font-bold text-success-text">{readyGroups.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="text-sm text-text-secondary">Cần bổ sung</span>
              <span className="text-sm font-bold text-warning-text">{attentionGroups.length}</span>
            </div>
            <div className="flex-1 min-w-[180px] max-w-md ml-auto">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                <span>Mức độ sẵn sàng</span>
                <span className="font-medium text-text-primary">{readyPct}%</span>
              </div>
              <div className="flex h-2 w-full rounded-full bg-subtle overflow-hidden">
                <div className="h-full bg-success transition-[width] duration-500" style={{ width: `${readyPct}%` }} />
                <div className="h-full bg-warning transition-[width] duration-500" style={{ width: `${100 - readyPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 sm:mt-6 w-full">
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 w-full">
          <div className="relative w-full md:flex-1 md:min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="search"
              placeholder={t("lecturer.groupsPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm text-text-secondary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-400"
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full md:w-auto md:flex">
          <Dropdown
            label={t("lecturer.filterYear")}
            options={yearOptions}
            value={filterYear}
            onChange={(v) => setFilterYear(v)}
          />
          <Dropdown
            label={t("lecturer.filterSemester")}
            options={semesterOptions}
            value={filterSemesterId}
            onChange={(v) => setFilterSemesterId(v)}
            disabled={!filterYear}
          />
          <Dropdown
            label={t("filterLabels.class")}
            options={classOptions}
            value={filterClass}
            onChange={(v) => setFilterClass(v)}
            disabled={!filterSemesterId}
          />
          <Dropdown
            label={t("filterLabels.status")}
            options={statusFilterOptions}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
          />
          </div>
        </div>
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-44 rounded-card bg-surface shadow-card animate-pulse" />
            ))}
          </div>
        ) : totalTeams === 0 ? (
          <div className="rounded-card bg-surface shadow-card p-10 text-center">
            <p className="text-sm text-text-secondary">
              {filterClass ? t("lecturer.groupsPage.noResults") : "Chọn lớp để xem danh sách các đội."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {attentionGroups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <h2 className="text-sm font-semibold text-text-primary">Cần chú ý</h2>
                  <span className="text-xs font-medium text-text-muted">{attentionGroups.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attentionGroups.map(renderCard)}
                </div>
              </div>
            )}
            {readyGroups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <h2 className="text-sm font-semibold text-text-primary">Đủ điều kiện</h2>
                  <span className="text-xs font-medium text-text-muted">{readyGroups.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {readyGroups.map(renderCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

    </>
  );
}
