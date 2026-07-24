import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, CheckSquare, BookOpen, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import CheckpointApi from "@/api/checkpoint";
import AssignmentApi from "@/api/assignment";
import SemesterApi from "@/api/semester";
import ClassApi from "@/api/class";
import AssignmentCard from "./components/AssignmentCard";
import CheckpointCard from "./components/CheckpointCard";
import StudentCheckpointModal from "./components/StudentCheckpointModal";
import { useToast } from "@/components/ui/Toast";


export default function StudentAssignmentsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL, default to assignments
  const activeTab = (searchParams.get("tab") === "assignments" || searchParams.get("tab") === "checkpoints") 
    ? searchParams.get("tab") 
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

  // Filter state
  const [semesterList, setSemesterList] = useState([]);
  const [filterYear, setFilterYear] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [classes, setClasses] = useState([]);

  // Data states
  const [assignments, setAssignments] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterYear, filterSemesterId, filterClass, activeTab]);

  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return assignments.slice(start, start + itemsPerPage);
  }, [assignments, currentPage]);


  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-200">
        <span className="text-sm font-bold text-slate-500">
          Hiển thị <span className="text-slate-800 font-black">{startIndex + 1}-{endIndex}</span> trong số <span className="text-slate-800 font-black">{totalItems}</span> mục
        </span>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentPage === page
                  ? "bg-slate-800 text-white shadow-md"
                  : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Fetch Semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const list = await SemesterApi.getList();
        const safeList = Array.isArray(list) ? list : [];
        setSemesterList(safeList);
        
        if (safeList.length) {
          // Tìm học kỳ đang diễn ra (ongoing)
          const ongoingSemester = safeList.find(s => s.status === 'ongoing');
          
          if (ongoingSemester) {
            setFilterYear(ongoingSemester.year);
            setFilterSemesterId(ongoingSemester.id);
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

  const yearOptions = useMemo(
    () => [...new Set(semesterList.map((s) => s.year))].sort((a, b) => b - a).map(y => ({ value: y, label: `${y}` })),
    [semesterList]
  );

  const semesterOptions = useMemo(() => {
    if (!filterYear) return [];
    return semesterList.filter(s => s.year === filterYear).map(s => ({
      value: s.id,
      label: s.status === 'ongoing' 
        ? `${s.semester_name.replace(/\s?\d{4}$/, "")} (Hiện tại)`
        : s.semester_name.replace(/\s?\d{4}$/, ""),
    }));
  }, [filterYear, semesterList]);

  // Fetch Classes (actually Subjects for students)
  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    const fetchClasses = async () => {
      try {
        const params = { year: filterYear, studentScope: "mine", semester_id: filterSemesterId };
        const res = await ClassApi.getList({ ...params });
        const list = res?.data || [];
        
        // Map to subjects for student UX
        const mappedClasses = list.map(c => ({ 
          id: c.id, 
          label: c.subject_code ? `${c.subject_code} (${c.class_code})` : c.class_code 
        }));
        
        setClasses(mappedClasses);
        
        // Mặc định chọn môn đầu tiên nếu có dữ liệu
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

  const classFilterOptions = useMemo(() => classes.map(c => ({ 
    value: c.id, 
    label: c.label 
  })), [classes]);

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const params = {
        year: filterYear,
        semester_id: filterSemesterId,
        class_id: filterClass,
      };
      const res = await AssignmentApi.getList(params);
      setAssignments(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      toast.error("Không thể tải danh sách bài tập.");
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchCheckpoints = async () => {
    setIsLoadingCheckpoints(true);
    try {
      const params = {
        year: filterYear,
        semester_id: filterSemesterId,
        class_id: filterClass,
      };
      const res = await CheckpointApi.getMyAssignments(params);
      setCheckpoints(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch checkpoints:", err);
      toast.error("Không thể tải danh sách checkpoint.");
    } finally {
      setIsLoadingCheckpoints(false);
    }
  };

  useEffect(() => {
    if (filterYear == null || filterSemesterId == null) return;
    if (activeTab === "assignments") {
      fetchAssignments();
    } else {
      fetchCheckpoints();
    }
  }, [filterYear, filterSemesterId, filterClass, activeTab]);

  const filteredCheckpoints = useMemo(() => {
    // Filter checkpoints by class if selected
    let list = checkpoints;
    if (filterClass) {
      list = list.filter(cp => cp.class_id === Number(filterClass));
    }
    // Also filter by year/semester if possible
    return list;
  }, [checkpoints, filterClass]);

  const paginatedCheckpoints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCheckpoints.slice(start, start + itemsPerPage);
  }, [filteredCheckpoints, currentPage]);

  return (
    <div className="min-h-screen w-full pb-10">
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Nhiệm vụ học tập
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 font-medium">
              Theo dõi và nộp bài tập, checkpoint cho các lớp học
            </p>
          </div>
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "checkpoints" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <CheckSquare size={16} />
            Mốc quan trọng (Checkpoints)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2.5 mb-8 w-full flex-wrap">
          <Dropdown label="Năm" options={yearOptions} value={filterYear} onChange={setFilterYear} />
          <Dropdown label="Kỳ" options={semesterOptions} value={filterSemesterId} onChange={setFilterSemesterId} disabled={!filterYear} />
          <div className="h-10 w-[1px] bg-gray-100 mx-1 hidden sm:block" />
          <Dropdown label="Môn học" options={classFilterOptions} value={filterClass} onChange={setFilterClass} disabled={!filterSemesterId} />
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "assignments" ? (
            <div className="w-full">
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedAssignments.map(item => (
                      <AssignmentCard
                        key={item.id}
                        assignment={item}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                  {renderPagination(assignments.length)}
                </>
              )}
            </div>
          ) : (
            <div className="w-full">
              {isLoadingCheckpoints ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium">Đang tải checkpoint...</p>
                </div>
              ) : filteredCheckpoints.length === 0 ? (
                <div className="bg-white rounded-[32px] border border-gray-100 py-20 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <CheckSquare size={32} />
                  </div>
                  <p className="text-gray-500 text-sm font-bold">Không có checkpoint nào được tìm thấy.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedCheckpoints.map(item => (
                      <CheckpointCard
                        key={item.id}
                        checkpoint={item}
                        onDetail={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                  {renderPagination(filteredCheckpoints.length)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <StudentCheckpointModal 
        checkpoint={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (activeTab === "assignments") fetchAssignments();
          else fetchCheckpoints();
        }}
      />
    </div>
  );
}
