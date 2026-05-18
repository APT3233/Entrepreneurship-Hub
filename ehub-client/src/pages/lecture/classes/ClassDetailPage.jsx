import { useState, useMemo, useEffect } from "react"; // Trigger reload
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Users, Trash2, AlertTriangle, Settings2 } from "lucide-react";
import StatCard from "@/components/ui/Card/StatCard";
import { StatIconGrading, StatIconAssignment, StatIconGroups } from "@/components/icons/lecture";
import Dropdown from "@/components/ui/filter/DropDown";
import ClassInfo from "./components/ClassInfo";
import StudentList from "./components/StudentList";
import CreateGroupForm from "@/components/form/lecturer/CreateGroupForm";
import EditClassForm from "@/components/form/lecturer/EditClassForm";
import ManualStudentForm from "@/components/form/lecturer/ManualStudentForm";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import ClassApi from "@/api/class";
import SemesterApi from "@/api/semester";
import GroupApi from "@/api/group";
import EnrollmentApi from "@/api/enrollment";


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
   
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   
   const [editClassModalOpen, setEditClassModalOpen] = useState(false);
   const [updateLoading, setUpdateLoading] = useState(false);
   
   const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
   const [enrollLoading, setEnrollLoading] = useState(false);
   const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);

   const [isDeleteStudentModalOpen, setIsDeleteStudentModalOpen] = useState(false);
   const [studentToDelete, setStudentToDelete] = useState(null);
   const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  useEffect(() => {
    const fetchSemesters = async () => {
      const list = await SemesterApi.getList();
      const safeList = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : [];
      setSemesterList(safeList);
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
        if (data.year != null) setFilterYear(Number(data.year));
        if (data.semester_id != null) setFilterSemesterId(Number(data.semester_id));
      } catch {
        navigate("/lecturer/classes", { replace: true });
      }
    };
    fetchDetail();
  }, [id, navigate]);

  // Danh sách lớp đúng kỳ đã chọn (dropdown "Lớp") — luôn gửi semester_id để BE lọc theo 1 kỳ, không chỉ year (year = mọi kỳ trong năm).
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const params = {
          year: filterYear,
          semester_id: Number(filterSemesterId),
          lecturerScope: "mine",
          limit: 100,
          page: 1,
        };
        const res = await ClassApi.getList(params);
        const list = (res?.data?.data || res?.data) || [];
        const rows = Array.isArray(list) ? list : [];
        setClassList(rows.map((c) => ({ id: c.id, class_code: c.class_code })));
      } catch {
        setClassList([]);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId]);

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
        : semestersInYear.map((s) => ({ value: Number(s.id), label: s.semester_name })),
    [filterYear, semestersInYear]
  );

  const classFilterOptions = useMemo(
    () => classList.map((c) => ({ label: c.class_code, value: c.id })),
    [classList]
  );

  const handleYearChange = (year) => {
    setFilterYear(year);
    const inYear = semesterList.filter((s) => s.year === year);
    if (inYear.length > 0) {
      setFilterSemesterId(Number(inYear[0].id));
    } else {
      setFilterSemesterId(null);
    }
    setClassList([]);
  };

  const handleSemesterChange = (semesterId) => {
    setFilterSemesterId(semesterId != null ? Number(semesterId) : null);
    setClassList([]);
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
  const isNewlyCreated = useMemo(() => {
    if (!detail?.createdAt) return false;
    const diff = Date.now() - new Date(detail.createdAt).getTime();
    const days = detail.manipulationDays || 7;
    return diff <= days * 24 * 60 * 60 * 1000;
  }, [detail?.createdAt, detail?.manipulationDays]);

  const handleClassChange = (value) => {
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

  const refreshData = async () => {
    if (!id) return;
    try {
      const resp = await ClassApi.getOverview(id);
      if (resp.data) setDetail(resp.data);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };

  const handleUpdateClass = async (data) => {
    if (!detail?.id) return;
    setUpdateLoading(true);
    try {
      await ClassApi.update(detail.id, data);
      toast.success("Cập nhật thông tin lớp học thành công.");
      setEditClassModalOpen(false);
      refreshData();
    } catch (err) {
      const msg = err?.message || "Không thể cập nhật lớp học.";
      toast.error(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEnrollStudent = async (data) => {
    if (!detail?.id) return;
    setEnrollLoading(true);
    try {
      if (selectedStudentForEdit) {
        await EnrollmentApi.update(detail.id, selectedStudentForEdit.id, data);
        toast.success(`Đã cập nhật thông tin sinh viên ${data.student_code}.`);
      } else {
        await EnrollmentApi.enroll(detail.id, data);
        toast.success(`Đã thêm sinh viên ${data.student_code} vào lớp.`);
      }
      setAddStudentModalOpen(false);
      setSelectedStudentForEdit(null);
      refreshData();
    } catch (err) {
      const msg = err?.message || "Không thể thực hiện thao tác.";
      toast.error(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenrollStudent = (student) => {
    if (!detail?.id || !student?.id) return;
    setStudentToDelete(student);
    setIsDeleteStudentModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!detail?.id || !studentToDelete?.id || isDeletingStudent) return;
    setIsDeletingStudent(true);
    try {
      await EnrollmentApi.unenroll(detail.id, studentToDelete.id);
      toast.success(`Đã xóa sinh viên ${studentToDelete.mssv} khỏi lớp.`);
      setIsDeleteStudentModalOpen(false);
      setStudentToDelete(null);
      refreshData();
    } catch (err) {
      const msg = err?.message || "Không thể xóa sinh viên.";
      toast.error(msg);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleDeleteClass = () => {
    if (!detail?.id) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!detail?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      await ClassApi.remove(detail.id);
      toast.success("Xóa lớp học thành công.");
      setIsDeleteModalOpen(false);
      navigate("/lecturer/classes", { replace: true });
    } catch (err) {
      const msg = err?.message || "Không thể xóa lớp học. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
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
              onChange={handleSemesterChange}
              disabled={filterYear == null}
            />
            <Dropdown
              label="Lớp"
              options={classFilterOptions}
              value={Number(id)}
              onChange={handleClassChange}
              disabled={filterYear == null || filterSemesterId == null}
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
            isNewlyCreated={isNewlyCreated}
            createdAt={detail?.createdAt}
            updatedAt={detail?.updatedAt}
            manipulationDays={detail?.manipulationDays}
            onDelete={handleDeleteClass}
            onEdit={() => setEditClassModalOpen(true)}
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
            canEdit={semesterStatus === "upcoming" || isNewlyCreated}
            onAddStudent={() => {
              setSelectedStudentForEdit(null);
              setAddStudentModalOpen(true);
            }}
            onEditStudent={(s) => {
              setSelectedStudentForEdit(s);
              setAddStudentModalOpen(true);
            }}
            onDeleteStudent={handleUnenrollStudent}
          />
        </section>
      )}

      <CreateGroupForm
        key={groupFormKey}
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onSubmit={handleCreateGroupSubmit}
        loading={createGroupLoading}
        students={(detail?.students || [])
          .filter((s) => s.groupId == null)
          .map((s) => ({ id: s.id, name: s.name, student_code: s.student_code, major: s.major || "" }))}
      />

      <EditClassForm
        isOpen={editClassModalOpen}
        onClose={() => setEditClassModalOpen(false)}
        onUpdate={handleUpdateClass}
        initialData={detail}
        loading={updateLoading}
      />

      <ManualStudentForm
        isOpen={addStudentModalOpen}
        onClose={() => {
          setAddStudentModalOpen(false);
          setSelectedStudentForEdit(null);
        }}
        onSubmit={handleEnrollStudent}
        initialData={selectedStudentForEdit}
        loading={enrollLoading}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onYes={confirmDelete}
        title="Xóa lớp học"
        subtitle={`Bạn có chắc chắn muốn xóa lớp học "${detail?.classCode}"? Tất cả dữ liệu liên quan sẽ bị xóa và không thể khôi phục.`}
        color="red"
        yesLabel={isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
        yesIcon={<Trash2 />}
      />

      <ConfirmModal
        isOpen={isDeleteStudentModalOpen}
        onClose={() => {
          setIsDeleteStudentModalOpen(false);
          setStudentToDelete(null);
        }}
        onYes={confirmDeleteStudent}
        title="Xóa sinh viên"
        subtitle={`Bạn có chắc chắn muốn xóa sinh viên ${studentToDelete?.name} (${studentToDelete?.mssv}) khỏi lớp học?`}
        color="red"
        yesLabel={isDeletingStudent ? "Đang xóa..." : "Xác nhận xóa"}
        yesIcon={<Trash2 />}
      />
    </>
  );
}
