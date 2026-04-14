import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import ClassInfo from "./components/ClassInfo";
import StudentList from "./components/StudentList";
import CreateGroupModal from "@/components/modal/lecturer/CreateGroupModal";
import { useToast } from "@/components/ui/Toast";
import ClassApi from "@/api/class";
import SemesterApi from "@/api/semester";
import GroupApi from "@/api/group";

const VALUE_ALL_CLASSES = "all";
const VALUE_ALL_SEMESTERS = "all";

export default function ClassDetailPage() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [semesterList, setSemesterList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  /** all | activated | not_activated */
  const [activationFilter, setActivationFilter] = useState("all");
   const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
   const [createGroupLoading, setCreateGroupLoading] = useState(false);
   const [groupFormKey, setGroupFormKey] = useState(0);

  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      setSemesterList(Array.isArray(list) ? list : []);
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await ClassApi.getOverview(id);
        if (!res?.data) {
          navigate("/lecturer/classes", { replace: true });
          return;
        }
        const data = res.data;
        setDetail(data);
        if (data.year != null) setFilterYear(data.year);
        if (data.semester_id != null) setFilterSemesterId(data.semester_id);
      } catch {
        navigate("/lecturer/classes", { replace: true });
      }
    };
    fetchDetail();
  }, [id, navigate]);

  // Danh sách lớp cùng năm/kỳ để chọn nhanh (dropdown "Tất cả lớp")
  useEffect(() => {
    if (filterYear == null || !filterSemesterId) return;
    const fetchClasses = async () => {
      try {
        const sem = filterSemesterId !== VALUE_ALL_SEMESTERS ? semesterList.find((s) => s.id === filterSemesterId) : null;
        const params = { year: filterYear, lecturerScope: "mine", limit: 100, page: 1 };
        if (sem?.semester_code) params.semester_code = sem.semester_code;
        const res = await ClassApi.getList(params);
        const list = (res?.data?.data || res?.data) || [];
        setClassList(list.map((c) => ({ id: c.id, class_code: c.class_code })));
      } catch {
        setClassList([]);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId, semesterList]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const res = await ClassApi.getOverview(id);
      if (res?.data) setDetail(res.data);
    } catch {
      // ignore refetch errors
    }
  };

  const yearOptions = useMemo(
    () =>
      [...new Set(semesterList.map((s) => s.year))]
        .sort((a, b) => b - a)
        .map((y) => ({ value: y, label: `${y}` })),
    [semesterList]
  );

  const semestersInYear = useMemo(
    () => semesterList.filter((s) => s.year === filterYear),
    [semesterList, filterYear]
  );

  // Kỳ chỉ hiện khi đã chọn năm (thứ tự: Năm → Kỳ → Lớp)
  const semesterOptions = useMemo(
    () =>
      !filterYear 
        ? [] 
        : [
            { label: "Tất cả kỳ", value: VALUE_ALL_SEMESTERS },
            ...semestersInYear.map((s) => ({ value: s.id, label: s.semester_name }))
          ],
    [filterYear, semestersInYear]
  );

  const classFilterOptions = useMemo(
    () => [
      { label: "Tất cả lớp", value: VALUE_ALL_CLASSES },
      ...classList.map((c) => ({ label: c.class_code, value: c.id })),
    ],
    [classList]
  );

  const handleYearChange = (year) => {
    setFilterYear(year);
    setFilterSemesterId(VALUE_ALL_SEMESTERS);
  };

  const groupOptions = useMemo(
    () => [
      { label: "Tất cả", value: "all" },
      ...(detail?.groups || []).map((g) => ({ label: g.name, value: String(g.id) })),
    ],
    [detail?.groups]
  );

  const activationOptions = useMemo(
    () => [
      { label: "Trạng thái", value: "all" },
      { label: "Đã kích hoạt", value: "activated" },
      { label: "Chưa kích hoạt", value: "not_activated" },
    ],
    []
  );

  const filteredStudents = useMemo(() => {
    const list = detail?.students || [];
    const byGroup =
      selectedGroup === "all"
        ? list
        : list.filter((s) => String(s.groupId) === selectedGroup);
    const byActivation =
      activationFilter === "activated"
        ? byGroup.filter((s) => s.accountActivated === true)
        : activationFilter === "not_activated"
          ? byGroup.filter((s) => !s.accountActivated)
          : byGroup;
    if (!searchQuery.trim()) return byActivation;
    const q = searchQuery.trim().toLowerCase();
    return byActivation.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.mssv && s.mssv.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [detail?.students, selectedGroup, activationFilter, searchQuery]);

  const studentsWithGroupName = useMemo(() => {
    const groups = detail?.groups || [];
    const map = Object.fromEntries(groups.map((g) => [g.id, g.name]));
    return filteredStudents.map((s) => ({
      ...s,
      groupName: s.groupId != null ? map[s.groupId] : undefined,
    }));
  }, [detail?.groups, filteredStudents]);

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (detail) setPageLoading(false);
  }, [detail]);

  // Chỉ cho phép tạo nhóm nếu học kỳ của lớp đang ở trạng thái ongoing.
  // Nếu backend chưa trả về semester_status thì cho phép (tránh khóa nút khi API chưa có field).
  const semesterStatus = detail?.semester_status ?? detail?.semesterStatus;
  const canCreateGroup = semesterStatus == null || semesterStatus === "ongoing";

  const handleClassChange = (value) => {
    if (value === VALUE_ALL_CLASSES) {
      navigate("/lecturer/classes");
      return;
    }
    if (value && Number(value) !== Number(id)) navigate(`/lecturer/classes/${value}`);
  };

  const handleCreateGroupSubmit = async ({ name, topic, topic_desc, zalo_link, category, mentor, members, leaderId }) => {
    if (!detail?.id || !name?.trim()) return;
    setCreateGroupLoading(true);
    try {
      const groupCode =
        name.trim().replace(/\s+/g, "_").slice(0, 30) + "_" + Date.now().toString(36);
      const body = {
        class_id: Number(detail.id),
        group_code: groupCode,
        group_name: name.trim(),
        topic: topic,
        topic_desc: topic_desc,
        zalo_link: zalo_link,
        category: category,
        mentor_name: mentor,
        mentor_dept: "Khoa Hệ thống Thông tin", // Default as seen in image
        max_members: 6,
        status: "forming",
      };
      if (Array.isArray(members) && members.length > 0 && leaderId != null) {
        body.members = members.map((id) => ({ student_id: Number(id) }));
        body.leader_student_id = Number(leaderId);
      }
      const createRes = await GroupApi.create(body);
      const created = createRes?.data ?? createRes;
      const groupId = created?.id;
      if (!groupId) {
        throw new Error("Phản hồi tạo nhóm không hợp lệ.");
      }
      setCreateGroupModalOpen(false);
      setGroupFormKey((prev) => prev + 1);
      toast.success("Tạo nhóm thành công.");
      if (created?.mail_dispatch_id) {
        toast.info(
          "Đang gửi email mời tham gia nhóm",
          `Mã theo dõi: ${created.mail_dispatch_id}`
        );
      }
      await fetchDetail();
    } catch (err) {
      const msg = err?.message || "Không thể tạo nhóm. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setCreateGroupLoading(false);
    }
  };

  return (
    <>
      {/* Section 1: Thống kê */}
      {pageLoading ? (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </section>
      ) : (
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
      )}

      {/* Section 2: Filter + Tạo nhóm */}
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
              onChange={(v) => setFilterSemesterId(v)}
              disabled={filterYear == null}
            />
            <Dropdown
              label="Lớp"
              options={classFilterOptions}
              value={classList.some(c => Number(c.id) === Number(id)) ? Number(id) : VALUE_ALL_CLASSES}
              onChange={handleClassChange}
              disabled={filterYear == null}
            />
          </div>
          <button
            type="button"
            disabled={!canCreateGroup}
            onClick={canCreateGroup ? () => setCreateGroupModalOpen(true) : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0 ${
              canCreateGroup
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus size={18} strokeWidth={2.5} />
            Tạo nhóm
          </button>
        </div>
      </section>

      {/* Section 3: Thông tin lớp học */}
      {pageLoading ? (
        <section className="mt-4 sm:mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </section>
      ) : (
        <section className="mt-4 sm:mt-6">
          <ClassInfo
            classCode={detail.classCode}
            lecturer={detail.lecturer}
            subject={detail.subject}
            semester={detail.semester}
            semesterStatus={semesterStatus}
          />
        </section>
      )}

      {/* Section 4: Danh sách sinh viên */}
      {pageLoading ? (
        <section className="mt-4 sm:mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg mb-2" />
            ))}
          </div>
        </section>
      ) : (
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
            activationOptions={activationOptions}
            selectedActivation={activationFilter}
            onActivationChange={setActivationFilter}
          />
        </section>
      )}

      <CreateGroupModal
        key={groupFormKey}
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroupSubmit}
        loading={createGroupLoading}
        students={(detail?.students || [])
          .filter((s) => s.groupId == null)
          .map((s) => ({ id: s.id, name: s.name, student_code: s.student_code, major: s.major || "" }))}
      />
    </>
  );
}
