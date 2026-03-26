import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import AssignmentCard from "./components/AssignmentCard";
import AssignmentDetailModal from "@/components/modal/lecturer/AssignmentDetailModal";
import CreateAssignmentForm from "@/components/form/lecturer/CreateAssignmentForm";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";
import AssignmentApi from "@/api/assignment";
import { useToast } from "@/components/ui/Toast";

const VALUE_ALL_SEMESTERS = "all";
const VALUE_ALL_CLASSES = "all";

export default function AssignmentManagement() {
  const toast = useToast();
  // Filter state
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClass, setFilterClass] = useState(VALUE_ALL_CLASSES);
  const [classes, setClasses] = useState([]);

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [viewedAssignment, setViewedAssignment] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Fetch API for Semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const list = await SemesterApi.getList();
        const safeList = Array.isArray(list) ? list : [];
        setSemesterList(safeList);
        if (safeList.length) {
          const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
          const currentYear = new Date().getFullYear();
          const hasCurrentYear = years.includes(currentYear);
          const selectedYear = hasCurrentYear ? currentYear : years[0];
          const inYear = safeList.filter((s) => s.year === selectedYear);
          
          setFilterYear(selectedYear);
          setFilterSemesterId(inYear.length > 1 ? VALUE_ALL_SEMESTERS : inYear[0].id);
          setFilterClass(VALUE_ALL_CLASSES);
        }
      } catch (err) {
        console.error("Failed to fetch semesters:", err);
      }
    };
    fetchSemesters();
  }, []);

  // Compute Options
  const yearOptions = useMemo(
    () =>
      [...new Set(semesterList.map((s) => s.year))]
        .sort((a, b) => b - a)
        .map((year) => ({ value: year, label: `${year}` })),
    [semesterList]
  );

  const semestersInYear = useMemo(
    () => semesterList.filter((s) => s.year === filterYear),
    [semesterList, filterYear]
  );

  const semesterOptions = useMemo(() => {
    if (!filterYear) return [];
    return [
      { value: VALUE_ALL_SEMESTERS, label: "Tất cả" },
      ...semestersInYear.map((s) => ({
        value: s.id,
        label: s.semester_name.replace(/\s?\d{4}$/, ""), // Bỏ năm ở cuối (vd: Spring 2026 -> Spring)
      })),
    ];
  }, [filterYear, semestersInYear]);

  // Fetch Classes when Year or Semester changes
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const params = { year: filterYear };
        if (filterSemesterId !== VALUE_ALL_SEMESTERS) {
          params.semester_id = filterSemesterId;
        }
        const res = await ClassApi.getList({
          lecturerScope: "mine",
          limit: 50,
          page: 1,
          ...params,
        });
        const list = res?.data || [];
        setClasses(list.map((c) => ({ id: c.id, code: c.class_code })));
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setClasses([]);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId]);

  const classFilterOptions = useMemo(
    () => [
      { label: "Tất cả", value: VALUE_ALL_CLASSES },
      ...classes.map((c) => ({
        label: c.code.split("_")[0] || c.code, // Lấy phần đầu trước dấu gạch dưới (vd: SP24_SE1701 -> SE1701)
        value: c.id,
      })),
    ],
    [classes]
  );

  // Handlers
  const handleYearChange = (year) => {
    setFilterYear(year);
    const inYear = semesterList.filter((s) => s.year === year);
    if (inYear.length > 1) {
      setFilterSemesterId(VALUE_ALL_SEMESTERS);
    } else if (inYear.length === 1) {
      setFilterSemesterId(inYear[0].id);
    } else {
      setFilterSemesterId(null);
    }
    setFilterClass(VALUE_ALL_CLASSES);
  };

  const handleSemesterChange = (value) => {
    setFilterSemesterId(value);
    setFilterClass(VALUE_ALL_CLASSES);
  };

  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchAssignments = async () => {
      try {
        setIsLoadingAssignments(true);
        const params = { lecturerScope: "mine", page: 1, limit: 100, year: filterYear };
        if (filterSemesterId !== VALUE_ALL_SEMESTERS) params.semester_id = filterSemesterId;
        if (filterClass !== VALUE_ALL_CLASSES) params.class_id = filterClass;
        const res = await AssignmentApi.getList(params);
        const list = Array.isArray(res?.data) ? res.data : [];
        setAssignments(list);
        if (list.length === 0) {
          setSelectedId(null);
          setViewedAssignment(null);
        } else if (!list.some((item) => item.id === selectedId)) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        setAssignments([]);
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [filterYear, filterSemesterId, filterClass]);

  const handleEdit = (assignment) => console.log("Edit", assignment);
  const handleDelete = async (assignment) => {
    const confirmDelete = window.confirm(`Bạn có chắc muốn xoá bài tập "${assignment.title}"?`);
    if (!confirmDelete) return;
    try {
      await AssignmentApi.remove(assignment.id);
      const nextList = assignments.filter((item) => item.id !== assignment.id);
      setAssignments(nextList);
      if (viewedAssignment?.id === assignment.id) setViewedAssignment(null);
      if (selectedId === assignment.id) setSelectedId(nextList[0]?.id || null);
      toast.success("Xoá bài tập thành công");
    } catch (err) {
      console.error("Delete assignment failed:", err);
      toast.error(err?.message || "Không thể xoá bài tập.");
    }
  };
  const handleCreate = () => setIsCreateOpen(true);
  
  const classOptionsForCreate = classes.map((c) => ({ label: c.code, value: c.id }));

  return (
    <div className="min-h-screen w-full">
      <div className="w-full">

        {/* ── Page Header ── */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Quản lý bài tập
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Tạo và chỉnh sửa bài tập cho các lớp học
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} />
            Tạo bài tập
          </button>
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 mb-5 w-full">
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
            value={filterClass}
            onChange={setFilterClass}
            disabled={filterYear == null || filterSemesterId == null}
          />
        </div>

        {/* ── Assignment List ── */}
        <div className="flex flex-col gap-3">
          {isLoadingAssignments ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">Đang tải bài tập...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">Không có bài tập nào.</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                isSelected={selectedId === assignment.id}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClick={() => {
                  setSelectedId(assignment.id);
                  setViewedAssignment(assignment);
                  AssignmentApi.getById(assignment.id)
                    .then((res) => {
                      if (res?.data) setViewedAssignment(res.data);
                    })
                    .catch((err) => {
                      console.error("Failed to fetch assignment detail:", err);
                    });
                }}
              />
            ))
          )}
        </div>

        {/* ── Modal ── */}
        <AssignmentDetailModal
          assignment={viewedAssignment}
          onClose={() => setViewedAssignment(null)}
          onConfirm={async (assign) => {
            try {
              const nextStatus = assign.status === "open" ? "closed" : "open";
              const res = await AssignmentApi.updateStatus(assign.id, nextStatus);
              const updated = res?.data || { ...assign, status: nextStatus };
              setAssignments((prev) => prev.map((item) => (item.id === assign.id ? { ...item, ...updated } : item)));
              setViewedAssignment((prev) => (prev?.id === assign.id ? { ...prev, ...updated } : prev));
              toast.success("Cập nhật trạng thái thành công");
            } catch (err) {
              console.error("Update assignment status failed:", err);
              toast.error(err?.message || "Không thể cập nhật trạng thái bài tập.");
            }
          }}
        />

        {isCreateOpen && (
          <CreateAssignmentForm
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={async (data) => {
              try {
                const payload = {
                  class_ids: data.classCodes,
                  title: data.title,
                  description: data.description,
                  deadline: new Date(data.deadline).toISOString(),
                  max_score: data.maxScore,
                };
                const res = await AssignmentApi.createBulk(payload);
                const createdList = Array.isArray(res?.data) ? res.data : [];
                const shouldAppend = filterClass === VALUE_ALL_CLASSES || data.classCodes.includes(filterClass);
                if (createdList.length && shouldAppend) setAssignments((prev) => [...createdList, ...prev]);
                setIsCreateOpen(false);
                toast.success("Tạo bài tập thành công", `Đã tạo ${createdList.length} bài tập.`);
              } catch (err) {
                console.error("Create assignment failed:", err);
                toast.error(err?.message || "Không thể tạo bài tập.");
              }
            }}
            classOptions={classOptionsForCreate}
          />
        )}

      </div>
    </div>
  );
}
