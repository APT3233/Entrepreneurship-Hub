import { useState, useEffect, useCallback, memo } from "react";
import { X, History, ChevronLeft, ChevronRight, Monitor, MapPin, Clock } from "lucide-react";
import { authApi } from "@/api/auth";
import DateTimeCell from "@/components/ui/DateTimeCell";

const ActivityLogsModal = memo(({ isOpen, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await authApi.getActivities({ page, limit: 10 });
      setActivities(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLogs(1);
    }
  }, [isOpen, fetchLogs]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-10 pt-10 pb-6 border-b border-gray-50 bg-white z-10">
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95"
          >
            <X size={28} />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Toàn bộ hoạt động</h2>
              <p className="text-sm text-gray-500 font-medium">Lịch sử tương tác của bạn với hệ thống</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar bg-gray-50/30">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-5 animate-pulse bg-white p-5 rounded-[24px] border border-gray-50">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 shrink-0"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 bg-gray-100 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-50 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((act) => {
                const entityName = act.title || "";
                
                const getActionLabel = (action, title) => {
                  const labels = {
                    login: "Đăng nhập hệ thống",
                    register: "Đăng ký tài khoản",
                    update_profile: "Cập nhật hồ sơ",
                    change_password: "Thay đổi mật khẩu",
                    create_class: "Tạo lớp học",
                    update_class: "Cập nhật lớp học",
                    delete_class: "Xóa lớp học",
                    create_group: "Tạo nhóm",
                    update_group: "Cập nhật nhóm",
                    delete_group: "Xóa nhóm",
                    create_assignment: "Tạo bài tập",
                    update_assignment: "Cập nhật bài tập",
                    update_assignment_status: "Thay đổi trạng thái bài tập",
                    delete_assignment: "Xóa bài tập",
                    grade_assignment: "Chấm điểm bài tập",
                    submit_assignment: "Nộp bài tập",
                    create_checkpoint: "Tạo checkpoint",
                    update_checkpoint: "Cập nhật checkpoint",
                    delete_checkpoint: "Xóa checkpoint",
                    grade_checkpoint: "Chấm điểm checkpoint",
                    submit_checkpoint: "Nộp checkpoint",
                  };
                  const base = labels[action] || action;
                  return title ? `${base} ${title}` : base;
                };

                const actionLabel = getActionLabel(act.action, entityName);

                return (
                  <div key={act.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 group">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-gray-50 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:bg-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <p className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {actionLabel}
                          </p>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={12} className="shrink-0" />
                            <DateTimeCell
                              value={act.created_at}
                              dateClassName="text-[10px] font-semibold uppercase tracking-widest text-gray-500"
                              timeClassName="text-[10px] font-medium text-gray-400"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                          {act.ip_address && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg">
                              <MapPin size={12} className="text-gray-400" />
                              <span>IP: {act.ip_address}</span>
                            </div>
                          )}
                          {act.user_agent && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg max-w-xs truncate">
                              <Monitor size={12} className="text-gray-400" />
                              <span className="truncate" title={act.user_agent}>{act.user_agent}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
              <History size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Chưa có hoạt động nào được ghi lại</p>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="px-10 py-6 border-t border-gray-50 bg-white flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Tổng số: <span className="text-indigo-600">{pagination.total}</span> bản ghi
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-100">
                {pagination.page}
              </span>
              <span className="text-gray-300 mx-1">/</span>
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 text-xs font-semibold">
                {pagination.totalPages}
              </span>
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ActivityLogsModal.displayName = "ActivityLogsModal";

export default ActivityLogsModal;
