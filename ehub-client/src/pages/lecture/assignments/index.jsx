import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ListChecks, CheckSquare } from "lucide-react";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Dropdown from "@/components/ui/filter/DropDown";
import AssignmentCard from "./components/AssignmentCard";
import AssignmentDetailForm from "@/components/form/lecturer/AssignmentDetailForm";
import CreateAssignmentForm from "@/components/form/lecturer/CreateAssignmentForm";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";
import AssignmentApi from "@/api/assignment";
import CheckpointApi from "@/api/checkpoint";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";

// Components for Checkpoint
import CheckpointCard from "./checkpoint/components/CheckpointCard";
import EditCheckpointForm from "@/components/form/lecturer/EditCheckpointForm";
import CheckpointDetailForm from "@/components/form/lecturer/CheckpointDetailForm";

// Components for Assignment
import EditAssignmentForm from "@/components/form/lecturer/EditAssignmentForm";


export default function AssignmentManagement() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL, default to assignments
  const activeTab = (searchParams.get("tab") === "assignments" || searchParams.get("tab") === "checkpoints") 
    ? (searchParams.get("tab") === "checkpoints" ? "checkpoint" : "assignments")
    : "assignments";

  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "assignments") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    setSearchParams(params);
  };

  // Filter state (shared)
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [classes, setClasses] = useState([]);

  // Assignment states
  const [selectedId, setSelectedId] = useState(null);
  const [viewedAssignment, setViewedAssignment] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const [checkpoints, setCheckpoints] = useState([]);
  const [allCheckpoints, setAllCheckpoints] = useState([]);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [isEditCheckpointOpen, setIsEditCheckpointOpen] = useState(false);
  const [isCheckpointDetailOpen, setIsCheckpointDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [checkpointToDelete, setCheckpointToDelete] = useState(null);
  const [isDeleteAssignmentOpen, setIsDeleteAssignmentOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  // Fetch Semesters (Shared)
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const list = await SemesterApi.getList();
        const safeList = Array.isArray(list) ? list : [];
        setSemesterList(safeList);
        if (safeList.length) {
          // Tự động tìm học kỳ đang diễn ra
          const ongoing = safeList.find(s => s.status === 'ongoing');
          if (ongoing) {
            setFilterYear(ongoing.year);
            setFilterSemesterId(ongoing.id);
          } else {
            const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
            const currentYear = new Date().getFullYear();
            const selectedYear = years.includes(currentYear) ? currentYear : years[0];
            
            setFilterYear(selectedYear);
            const inYear = safeList.filter((s) => s.year === selectedYear);
            // Mặc định chọn học kỳ đầu tiên (không dùng "Tất cả")
            setFilterSemesterId(inYear[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch semesters:", err);
      }
    };
    fetchSemesters();
  }, []);

  const yearOptions = useSemesterYearOptions(semesterList);

  const semesterOptions = useMemo(() => {
    if (!filterYear) return [];
    return semesterList.filter((s) => s.year === filterYear).map((s) => ({
      value: s.id,
      label: formatSemesterLabel(s, t),
    }));
  }, [filterYear, semesterList, t]);

  // Fetch Classes (Shared)
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const params = { year: filterYear, semester_id: filterSemesterId };
        const res = await ClassApi.getList({ lecturerScope: "mine", limit: 100, ...params });
        const list = res?.data || [];
        const mappedClasses = list.map(c => ({ id: c.id, code: c.class_code }));
        setClasses(mappedClasses);

        // Mặc định chọn lớp đầu tiên nếu có dữ liệu
        if (mappedClasses.length > 0) {
          setFilterClass(mappedClasses[0].id);
        } else {
          setFilterClass(null);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setClasses([]);
        setFilterClass(null);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId]);

  const classFilterOptions = useMemo(
    () => classes.map(c => ({ label: c.code, value: c.id })),
    [classes]
  );

  // Fetch functions defined in component scope
  const fetchAssignments = async () => {
    try {
      setIsLoadingAssignments(true);
      const params = { 
        lecturerScope: "mine", 
        page: 1, 
        limit: 100, 
        year: filterYear,
        semester_id: filterSemesterId,
        class_id: filterClass
      };
      const res = await AssignmentApi.getList(params);
      setAssignments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchCheckpoints = async () => {
    let nextCheckpoints = [];
    let nextAll = [];
    try {
      setIsLoadingCheckpoints(true);

      if (filterClass) {
        const res = await CheckpointApi.getList({ class_id: filterClass });
        nextCheckpoints = Array.isArray(res?.data) ? res.data : [];
        setCheckpoints(nextCheckpoints);
      } else {
        setCheckpoints([]);
      }

      if (filterSemesterId) {
        const resAll = await CheckpointApi.getList({
          lecturerScope: "mine",
          semester_id: filterSemesterId,
          year: filterYear,
        });
        nextAll = Array.isArray(resAll?.data) ? resAll.data : [];
        setAllCheckpoints(nextAll);
      } else {
        setAllCheckpoints([]);
      }
    } catch (err) {
      console.error("Failed to fetch checkpoints:", err);
      setCheckpoints([]);
      setAllCheckpoints([]);
    } finally {
      setIsLoadingCheckpoints(false);
    }
    return { checkpoints: nextCheckpoints, allCheckpoints: nextAll };
  };

  // Fetch Data based on active tab
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;

    if (activeTab === "assignments") {
      fetchAssignments();
    } else if (activeTab === "checkpoint" && filterClass) {
      fetchCheckpoints();
    }

    // Clear checkpoints if no class selected
    if (activeTab === "checkpoint" && !filterClass) {
      setCheckpoints([]);
    }
  }, [filterYear, filterSemesterId, filterClass, activeTab]);

  // Handlers for Assignments
  const handleDeleteAssignment = (assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteAssignmentOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    try {
      await AssignmentApi.remove(assignmentToDelete.id);
      setAssignments(prev => prev.filter(item => item.id !== assignmentToDelete.id));
      toast.success("Xoá bài tập thành công");
      setIsDeleteAssignmentOpen(false);
      setAssignmentToDelete(null);
    } catch (err) {
      toast.error(err?.message || "Không thể xoá bài tập.");
    }
  };

  const handleUpdateAssignment = async (data) => {
    try {
      if (!editingAssignment) return;
      const res = await AssignmentApi.update(editingAssignment.id, {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
        max_score: Number(data.max_score),
      });
      const updated = res?.data || { ...editingAssignment, ...data };
      setAssignments(prev => prev.map(item => item.id === editingAssignment.id ? { ...item, ...updated } : item));
      toast.success("Cập nhật bài tập thành công");
      setIsEditAssignmentOpen(false);
    } catch (err) {
      toast.error(err?.message || "Không thể cập nhật bài tập.");
    }
  };

  // Handlers for Checkpoints
  const handleSaveCheckpoint = async (data) => {
    const editedId = selectedCheckpoint?.id != null ? Number(selectedCheckpoint.id) : null;
    try {
      if (selectedCheckpoint?.id) {
        await CheckpointApi.update(selectedCheckpoint.id, data);
        toast.success("Cập nhật checkpoint thành công");
      } else if (data.class_ids?.length > 0) {
        const res = await CheckpointApi.createBulk(data);
        toast.success(`Đã tạo checkpoint cho ${res.data.length} lớp học`);
      } else {
        await CheckpointApi.create({ ...data, class_id: filterClass });
        toast.success("Tạo checkpoint thành công");
      }
      setIsEditCheckpointOpen(false);
      const { checkpoints: list } = await fetchCheckpoints();
      if (editedId != null && Array.isArray(list)) {
        const fresh = list.find((c) => Number(c.id) === editedId);
        if (fresh) setSelectedCheckpoint(fresh);
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Không thể lưu checkpoint");
    }
  };

  const handleDeleteCheckpoint = async () => {
    if (!checkpointToDelete) return;
    try {
      await CheckpointApi.remove(checkpointToDelete.id);
      toast.success("Xóa checkpoint thành công");
      setIsDeleteConfirmOpen(false);
      setCheckpointToDelete(null);
      await fetchCheckpoints();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Không thể xóa checkpoint");
    }
  };

  return (
    <div className="min-h-screen w-full pb-10">
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Quản lý học tập
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 font-medium">
              Thiết lập bài tập và các mốc checkpoint cho lớp học
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === "assignments") {
                setIsCreateOpen(true);
              } else if (filterClass) {
                setSelectedCheckpoint(null); // Reset for creation
                setIsEditCheckpointOpen(true);
              }
            }}
            disabled={activeTab === "checkpoint" && !filterClass}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            {activeTab === "assignments" ? "Tạo bài tập" : "Thêm Checkpoint"}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-gray-100/50 rounded-2xl mb-8 w-fit border border-gray-100">
          <button
            onClick={() => handleTabChange("assignments")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "assignments" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ListChecks size={16} />
            Bài tập (Assignments)
          </button>
          <button
            onClick={() => handleTabChange("checkpoints")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "checkpoint" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <CheckSquare size={16} />
            Mốc quan trọng (Checkpoints)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2.5 mb-8 w-full flex-wrap">
          <Dropdown label={t("lecturer.filterYear")} options={yearOptions} value={filterYear} onChange={setFilterYear} />
          <Dropdown label={t("lecturer.filterSemester")} options={semesterOptions} value={filterSemesterId} onChange={setFilterSemesterId} disabled={!filterYear} />
          <div className="h-10 w-[1px] bg-gray-100 mx-1 hidden sm:block" />
          <Dropdown label={t("lecturer.filterClass")} options={classFilterOptions} value={filterClass} onChange={setFilterClass} disabled={!filterSemesterId} />
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "assignments" ? (
            <div className="flex flex-col gap-3">
              {isLoadingAssignments ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium">Đang tải bài tập...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="bg-white rounded-[32px] border border-gray-100 py-20 text-center shadow-sm">
                  <p className="text-gray-400 text-sm font-medium">Không có bài tập nào được tìm thấy.</p>
                </div>
              ) : (
                assignments.map(item => (
                  <AssignmentCard
                    key={item.id}
                    assignment={item}
                    isSelected={selectedId === item.id}
                    onEdit={(item) => {
                      setEditingAssignment(item);
                      setIsEditAssignmentOpen(true);
                    }}
                    onDelete={() => handleDeleteAssignment(item)}
                    onClick={() => {
                      setSelectedId(item.id);
                      setViewedAssignment(item);
                      Promise.all([
                        AssignmentApi.getById(item.id),
                        AssignmentApi.getSubmissions(item.id).catch(() => ({ data: [] })),
                      ]).then(([detailRes, subRes]) => {
                        const a = detailRes?.data;
                        if (!a) return;
                        setViewedAssignment({ ...a, groupSubmissions: subRes?.data || [] });
                      });
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="w-full">
              {isLoadingCheckpoints ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium">Đang tải checkpoint...</p>
                </div>
              ) : checkpoints.length === 0 ? (
                <div className="bg-white rounded-[32px] border border-gray-100 py-20 text-center shadow-sm">
                  <p className="text-gray-400 text-sm font-medium">Chưa có checkpoint nào cho lớp này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {checkpoints.map(cp => (
                    <CheckpointCard 
                      key={cp.id} 
                      checkpoint={cp} 
                      onEdit={() => { setSelectedCheckpoint(cp); setIsEditCheckpointOpen(true); }} 
                      onDetail={() => { setSelectedCheckpoint(cp); setIsCheckpointDetailOpen(true); }}
                      onDelete={() => { setCheckpointToDelete(cp); setIsDeleteConfirmOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals for Assignments */}
        <AssignmentDetailForm
          key={viewedAssignment?.id ?? "assignment-detail-closed"}
          assignment={viewedAssignment}
          onClose={() => setViewedAssignment(null)}
          onAfterGrade={async (assignmentId) => {
            try {
              const [detailRes, subRes] = await Promise.all([
                AssignmentApi.getById(assignmentId),
                AssignmentApi.getSubmissions(assignmentId).catch(() => ({ data: [] })),
              ]);
              if (detailRes?.data) {
                setViewedAssignment({ ...detailRes.data, groupSubmissions: subRes?.data || [] });
              }
              await fetchAssignments();
            } catch {
              /* noop */
            }
          }}
          onConfirm={async (assign) => {
            try {
              const nextStatus = assign.status === "open" ? "closed" : "open";
              const res = await AssignmentApi.updateStatus(assign.id, nextStatus);
              const updated = res?.data || { ...assign, status: nextStatus };
              setAssignments(prev => prev.map(i => i.id === assign.id ? { ...i, ...updated } : i));
              setViewedAssignment(prev => prev?.id === assign.id ? { ...prev, ...updated } : prev);
              toast.success("Cập nhật trạng thái thành công");
            } catch (err) {
              toast.error(err?.message || "Lỗi cập nhật.");
            }
          }}
        />

        {isCreateOpen && (
          <CreateAssignmentForm
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={async (data) => {
              try {
                const res = await AssignmentApi.createBulk({
                  class_ids: data.classCodes,
                  title: data.title,
                  description: data.description,
                  deadline: new Date(data.deadline).toISOString(),
                  max_score: data.max_score,
                  required_file_types: data.required_file_types,
                  max_file_size_mb: data.max_file_size_mb,
                  max_files: data.max_files,
                  attachment_url: data.attachment_url,
                });
                const createdList = Array.isArray(res?.data) ? res.data : [];
                if (createdList.length && (!filterClass || data.classCodes.includes(filterClass))) {
                  setAssignments(prev => [...createdList, ...prev]);
                }
                setIsCreateOpen(false);
                toast.success("Tạo bài tập thành công");
              } catch (err) {
                toast.error(err?.message || "Lỗi tạo bài tập.");
              }
            }}
            classOptions={classes.map(c => ({ label: c.code, value: c.id }))}
          />
        )}

        {isEditAssignmentOpen && (
          <EditAssignmentForm
            isOpen={isEditAssignmentOpen}
            assignment={editingAssignment}
            onClose={() => setIsEditAssignmentOpen(false)}
            onSave={handleUpdateAssignment}
          />
        )}

        {/* Modals for Checkpoints */}
          <EditCheckpointForm
            isOpen={isEditCheckpointOpen}
            checkpoint={selectedCheckpoint}
            onClose={() => setIsEditCheckpointOpen(false)}
            onSave={handleSaveCheckpoint}
            existingOrders={checkpoints.map(cp => cp.order_index)}
            allCheckpoints={allCheckpoints}
            classOptions={classFilterOptions}
          />

        {isCheckpointDetailOpen && (
          <CheckpointDetailForm
            isOpen={isCheckpointDetailOpen}
            checkpoint={selectedCheckpoint}
            onClose={() => setIsCheckpointDetailOpen(false)}
            onSaveGrade={() => {
               fetchCheckpoints();
            }}
          />
        )}

        {isDeleteConfirmOpen && (
          <ConfirmModal
            isOpen={isDeleteConfirmOpen}
            title="Xóa checkpoint bản nháp"
            subtitle={`Bạn có chắc chắn muốn xóa "${checkpointToDelete?.title}"? Hành động này không thể hoàn tác.`}
            variant="delete"
            color="red"
            yesLabel="Xóa ngay"
            onYes={handleDeleteCheckpoint}
            onClose={() => setIsDeleteConfirmOpen(false)}
          />
        )}

        {isDeleteAssignmentOpen && (
          <ConfirmModal
            isOpen={isDeleteAssignmentOpen}
            title="Xóa bài tập"
            subtitle={`Bạn có chắc chắn muốn xóa bài tập "${assignmentToDelete?.title}"? Hành động này sẽ gỡ bài tập khỏi tất cả các lớp đã chọn.`}
            variant="delete"
            color="red"
            yesLabel="Xóa ngay"
            onYes={confirmDeleteAssignment}
            onClose={() => setIsDeleteAssignmentOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
