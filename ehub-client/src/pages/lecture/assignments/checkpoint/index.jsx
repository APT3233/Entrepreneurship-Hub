import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Dropdown from "@/components/ui/filter/DropDown";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";
import CheckpointApi from "@/api/checkpoint";
import { useToast } from "@/components/ui/Toast";
import CheckpointCard from "./components/CheckpointCard";
import EditCheckpointForm from "@/components/form/lecturer/EditCheckpointForm";
import { useTranslation } from "@/context/TranslationContext";
import { formatSemesterLabel, useSemesterOptions, useSemesterYearOptions } from "@/hooks/useLectureFilterOptions";

const VALUE_ALL_SEMESTERS = "all";

export default function CheckpointManagement() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Filter state
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClassId, setFilterClassId] = useState(null);
  const [classes, setClasses] = useState([]);

  // Data state
  const [checkpoints, setCheckpoints] = useState([]);
  const [allCheckpoints, setAllCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initial fetch for semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const list = await SemesterApi.getList();
        const safeList = Array.isArray(list) ? list : [];
        setSemesterList(safeList);
        if (safeList.length) {
          const years = [...new Set(safeList.map((s) => s.year))].sort((a, b) => b - a);
          const currentYear = new Date().getFullYear();
          const selectedYear = years.includes(currentYear) ? currentYear : years[0];
          const inYear = safeList.filter((s) => s.year === selectedYear);
          
          setFilterYear(selectedYear);
          setFilterSemesterId(inYear.length > 1 ? VALUE_ALL_SEMESTERS : inYear[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch semesters:", err);
      }
    };
    fetchSemesters();
  }, []);

  // Compute Options
  const yearOptions = useSemesterYearOptions(semesterList);
  const semesterOptions = useSemesterOptions(semesterList, filterYear, {
    prependAll: true,
    allValue: VALUE_ALL_SEMESTERS,
  });

  // Fetch Classes
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const params = { year: filterYear, lecturerScope: "mine", limit: 100 };
        if (filterSemesterId !== VALUE_ALL_SEMESTERS) params.semester_id = filterSemesterId;
        const res = await ClassApi.getList(params);
        const list = res?.data || [];
        setClasses(list);
        if (list.length > 0) setFilterClassId(list[0].id);
        else setFilterClassId(null);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setClasses([]);
      }
    };
    fetchClasses();
  }, [filterYear, filterSemesterId]);

  const classOptions = useMemo(
    () => classes.map((c) => ({ label: c.class_code, value: c.id })),
    [classes]
  );

  // Fetch Checkpoints
  useEffect(() => {
    if (!filterClassId) {
      setCheckpoints([]);
      return;
    }
    const fetchCheckpoints = async () => {
      try {
        setIsLoading(true);
        
        // Fetch specific class checkpoints
        if (filterClassId) {
          const res = await CheckpointApi.getList({ class_id: filterClassId });
          setCheckpoints(Array.isArray(res?.data) ? res.data : []);
        }

        // Fetch ALL lecturer checkpoints in this semester/year for validation
        if (filterSemesterId) {
          const resAll = await CheckpointApi.getList({ 
            lecturerScope: "mine", 
            semester_id: filterSemesterId !== VALUE_ALL_SEMESTERS ? filterSemesterId : undefined,
            year: filterYear
          });
          setAllCheckpoints(Array.isArray(resAll?.data) ? resAll.data : []);
        }
      } catch (err) {
        console.error("Failed to fetch checkpoints:", err);
        setCheckpoints([]);
        setAllCheckpoints([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCheckpoints();
  }, [filterClassId, filterSemesterId, filterYear]);

  const handleEdit = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setIsEditModalOpen(true);
  };

  const handleSave = async (data) => {
    const editedId = selectedCheckpoint?.id != null ? Number(selectedCheckpoint.id) : null;
    try {
      if (selectedCheckpoint) {
        await CheckpointApi.update(selectedCheckpoint.id, data);
        toast.success("Cập nhật checkpoint thành công");
      } else if (data.class_ids?.length > 0) {
        await CheckpointApi.createBulk(data);
        toast.success(`Đã tạo checkpoint cho ${data.class_ids.length} lớp học`);
      } else {
        await CheckpointApi.create({ ...data, class_id: filterClassId });
        toast.success("Tạo checkpoint mới thành công");
      }
      setIsEditModalOpen(false);

      const [res, resAll] = await Promise.all([
        CheckpointApi.getList({ class_id: filterClassId }),
        filterSemesterId
          ? CheckpointApi.getList({
              lecturerScope: "mine",
              semester_id: filterSemesterId !== VALUE_ALL_SEMESTERS ? filterSemesterId : undefined,
              year: filterYear,
            })
          : Promise.resolve({ data: [] }),
      ]);
      const list = Array.isArray(res?.data) ? res.data : [];
      const all = Array.isArray(resAll?.data) ? resAll.data : [];
      setCheckpoints(list);
      setAllCheckpoints(all);

      if (editedId != null) {
        const fresh = list.find((c) => Number(c.id) === editedId);
        if (fresh) setSelectedCheckpoint(fresh);
      }
    } catch (err) {
      toast.error(err?.message || "Thao tác thất bại");
    }
  };

  return (
    <div className="min-h-screen w-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/lecturer/assignments")}
            className="p-2.5 rounded-2xl bg-white border border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Checkpoint</h1>
            <p className="text-sm text-gray-500 font-medium">Thiết lập các mốc nộp bài cho lớp học</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedCheckpoint(null); setIsEditModalOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Thêm Checkpoint
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Dropdown label={t("lecturer.filterYear")} options={yearOptions} value={filterYear} onChange={setFilterYear} />
        <Dropdown label={t("lecturer.filterSemester")} options={semesterOptions} value={filterSemesterId} onChange={setFilterSemesterId} disabled={!filterYear} />
        <div className="h-10 w-[1px] bg-gray-100 mx-1 hidden sm:block" />
        <Dropdown label={t("lecturer.filterClass")} options={classOptions} value={filterClassId} onChange={setFilterClassId} disabled={!filterSemesterId} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-medium">Đang tải danh sách checkpoint...</p>
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có checkpoint nào</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8 text-sm">Chọn một lớp học hoặc bắt đầu tạo mới checkpoint cho lớp này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {checkpoints.map((cp) => (
            <CheckpointCard key={cp.id} checkpoint={cp} onEdit={() => handleEdit(cp)} />
          ))}
        </div>
      )}

      {isEditModalOpen && (
        <EditCheckpointForm
          isOpen={isEditModalOpen}
          checkpoint={selectedCheckpoint}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
          existingOrders={checkpoints.map(cp => cp.order_index)}
          allCheckpoints={allCheckpoints}
          classOptions={classOptions}
        />
      )}
    </div>
  );
}
