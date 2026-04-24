import React, { useState, useMemo, useCallback } from "react";
import { 
  X, Calendar, Upload, Download, 
  CheckCircle2, Clock, AlertCircle, FileText, Info, Target, Users
} from "lucide-react";
import pLimit from "p-limit";
import FileIcon from "@/components/icons/FileIcon";
import CheckpointApi from "@/api/checkpoint";
import AssignmentApi from "@/api/assignment";
import { useToast } from "@/components/ui/Toast";
import { parseLecturerAttachmentUrls } from "@/utils/lecturerAttachments";

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} | ${hours}:${minutes}`;
}

function getDisplayFileName(url = "") {
  const fileWithQuery = String(url).split("/").pop() || "";
  const fileName = decodeURIComponent(fileWithQuery.split("?")[0] || "");
  return fileName.replace(/^\d+_/, "");
}

export default function StudentCheckpointModal({ checkpoint: task, isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [mouseDownTarget, setMouseDownTarget] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({}); // { [index]: 0-100 }

  // Normalize properties
  const normalizedTask = useMemo(() => {
    if (!task) return null;
    const fromApi = task.submissionFiles?.length
      ? task.submissionFiles.map((f) => ({
          file_name: f.fileName ?? f.file_name,
          file_url: f.fileUrl ?? f.file_url,
          file_size: f.fileSize ?? f.file_size,
          file_type:
            f.fileName?.split(".").pop() ||
            f.file_name?.split(".").pop() ||
            f.file_type ||
            "",
        }))
      : [];
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      submissionStatus: task.submissionStatus || task.submission_status || "not_submitted",
      score: task.score,
      maxScore: task.maxScore || task.max_score || 10,
      orderIndex: task.order_index,
      requiredFileTypes: task.required_file_types || "",
      maxFiles: task.max_files || 1,
      maxFileSizeMb: Math.min(task.max_file_size_mb || 15, 25),
      feedback: task.feedback || "",
      files: task.files?.length ? task.files : fromApi,
      isCheckpoint: task.order_index !== undefined && task.order_index !== null,
      groupName: task.group_name || "",
      category: task.category || "",
      topic: task.topic || "",
      attachmentUrls:
        task.attachmentUrls?.length > 0
          ? task.attachmentUrls
          : parseLecturerAttachmentUrls(task.attachment_url || task.attachmentUrl),
    };
  }, [task]);

  const isSubmitted = normalizedTask?.submissionStatus === "submitted" || normalizedTask?.submissionStatus === "graded" || normalizedTask?.submissionStatus === "resubmitted";
  const isGraded = normalizedTask?.submissionStatus === "graded";
  
  const scoreValue =
    normalizedTask?.score != null && normalizedTask?.score !== ""
      ? Number(normalizedTask.score)
      : null;
  const hasGradedScore = scoreValue != null && !Number.isNaN(scoreValue);
  const isLockedAfterGrading =
    isGraded || (hasGradedScore && normalizedTask?.submissionStatus !== "not_submitted");

  const showGradingResultView = normalizedTask?.isCheckpoint ? isLockedAfterGrading : isGraded;
  const isOverdue = !isSubmitted && normalizedTask?.deadline && new Date(normalizedTask.deadline) < new Date();

  const handleFileChange = useCallback((e) => {
    if (showGradingResultView) return;
    const input = e.target;
    try {
      const selectedFiles = Array.from(input.files);
      const allowedExtensions = normalizedTask?.requiredFileTypes
        ? normalizedTask.requiredFileTypes.split(",").map((ext) => ext.trim().toLowerCase())
        : [];

      const maxSizeBytes = (normalizedTask?.maxFileSizeMb || 25) * 1024 * 1024;
      const validFiles = [];

      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop().toLowerCase();

        if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
          toast.error(`File "${file.name}" không đúng định dạng cho phép (${normalizedTask.requiredFileTypes})`);
          continue;
        }

        if (file.size > maxSizeBytes) {
          toast.error(`File "${file.name}" vượt quá dung lượng cho phép (${normalizedTask.maxFileSizeMb} MB)`);
          continue;
        }

        if (file.size > 25 * 1024 * 1024) {
          toast.error(`File "${file.name}" vượt quá giới hạn hệ thống (25 MB)`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      if (normalizedTask?.maxFiles && validFiles.length + files.length > normalizedTask.maxFiles) {
        toast.error(`Tổng số file nộp không được vượt quá ${normalizedTask.maxFiles}`);
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);
    } finally {
      input.value = "";
    }
  }, [showGradingResultView, normalizedTask, files, toast]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (showGradingResultView) {
      toast.error("Bài đã được chấm điểm. Không thể nộp lại.");
      return;
    }
    if (files.length === 0) {
      toast.error("Vui lòng chọn file để nộp");
      return;
    }
    setIsSubmitting(true);
    setUploadProgress({});

    const Api = normalizedTask?.isCheckpoint ? CheckpointApi : AssignmentApi;

    try {
      const initRes = await Api.initiateUpload(normalizedTask.id, files);
      const { sessionId, files: uploadTargets } = initRes?.data || {};

      if (!sessionId || !uploadTargets) {
        throw new Error("Không thể khởi tạo phiên nộp bài");
      }

      const limit = pLimit(3);
      const uploadPromises = files.map((file, index) => {
        const target = uploadTargets.find(
          (t) => (t.fileName || t.originalName) === file.name
        );
        if (!target) return Promise.reject(new Error(`Lỗi khởi tạo file "${file.name}"`));
        
        const putUrl = target.presignedUrl || target.uploadUrl;
        if (!putUrl) return Promise.reject(new Error(`Thiếu upload URL cho "${file.name}"`));

        return limit(() => new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", putUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(prev => ({ ...prev, [index]: progress }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ fileId: target.fileId, etag: xhr.getResponseHeader("ETag") });
            } else {
              reject(new Error(`Lỗi tải file ${file.name}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Lỗi kết nối file ${file.name}`));
          xhr.send(file);
        }));
      });

      await Promise.all(uploadPromises);
      await Api.confirmUpload(normalizedTask.id, sessionId);

      toast.success("Nộp bài thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  }, [showGradingResultView, files, normalizedTask, toast, onSuccess, onClose]);

  if (!isOpen || !normalizedTask) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => { if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-[24px] shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${normalizedTask.isCheckpoint ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                 {normalizedTask.isCheckpoint ? `Checkpoint ${normalizedTask.orderIndex}` : "Assignment"}
               </span>
               <h2 className="text-xl font-black text-gray-900 truncate">
                 {normalizedTask.title}
               </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Calendar size={12} />
                <span>Hạn nộp: {formatDate(normalizedTask.deadline)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 ml-4 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Mô tả nhiệm vụ</h3>
                </div>
                <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100/50">
                  <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {normalizedTask.description || "Không có mô tả chi tiết cho nhiệm vụ này."}
                  </p>
                </div>
              </section>

              {/* Attachment Section */}
              {normalizedTask.attachmentUrls?.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Download size={18} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Tài liệu đính kèm</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {normalizedTask.attachmentUrls.map((url) => (
                      <div
                        key={url}
                        className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 group hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-sm font-bold text-emerald-900 truncate">
                              {getDisplayFileName(url)}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">Tài liệu tham khảo từ GV</span>
                          </div>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all font-bold text-[10px] uppercase tracking-widest shrink-0"
                        >
                          Tải xuống
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Status & Deadline Info (Compact for mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Điểm tối đa</p>
                    <p className="text-sm font-black text-indigo-700">{normalizedTask.maxScore} điểm</p>
                  </div>
                </div>
                {!isSubmitted && !isOverdue && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Thời gian còn lại</p>
                      <p className="text-sm font-black text-amber-700">
                        {Math.ceil((new Date(normalizedTask.deadline) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="hidden lg:block space-y-6">
                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Điểm tối đa</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{normalizedTask.maxScore}</span>
                      <span className="text-indigo-200 text-lg font-bold">điểm</span>
                    </div>
                  </div>
                </div>
                {!isSubmitted && !isOverdue && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Clock size={14} /> Thời gian còn lại
                    </p>
                    <p className="text-2xl font-black text-amber-700">
                      {Math.ceil((new Date(normalizedTask.deadline) - new Date()) / (1000 * 60 * 60 * 24))} ngày
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <Info size={14} /> Yêu cầu tệp tin
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400 uppercase tracking-tight">Định dạng</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{normalizedTask.requiredFileTypes || "Tất cả"}</span>
                  </li>
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400 uppercase tracking-tight">Số lượng</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Tối đa {normalizedTask.maxFiles} file</span>
                  </li>
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400 uppercase tracking-tight">Dung lượng</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{normalizedTask.maxFileSizeMb} MB/file</span>
                  </li>
                </ul>
              </div>

              {normalizedTask.groupName && (
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Users size={14} /> Thông tin nhóm
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Tên nhóm</p>
                      <p className="text-sm font-bold text-gray-900">{normalizedTask.groupName}</p>
                    </div>
                    {normalizedTask.category && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Lĩnh vực</p>
                        <p className="text-xs font-bold text-indigo-600">{normalizedTask.category}</p>
                      </div>
                    )}
                    {normalizedTask.topic && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Đề tài</p>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">{normalizedTask.topic}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div> {/* End Grid */}


          {/* Submission Section or Results */}
          {!showGradingResultView ? (
             <section className="pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                         <Upload size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Nộp bài tập</h3>
                   </div>
                   {isSubmitted && (
                     <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                       Đã nộp bài
                     </span>
                   )}
                </div>

                <div className="space-y-6">
                   {/* Already submitted files */}
                   {isSubmitted && normalizedTask.files && normalizedTask.files.length > 0 && (
                      <div className="space-y-3 bg-emerald-50/20 p-6 rounded-3xl border border-emerald-100/50">
                         <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1 px-1">Các tệp đã nộp</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {normalizedTask.files.map((file, idx) => (
                               <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100/50 group hover:border-emerald-200 transition-all shadow-sm">
                                  <div className="w-10 h-12 shrink-0">
                                     <FileIcon ext={file.file_type} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-sm font-bold text-gray-700 truncate">{file.file_name}</p>
                                     <p className="text-[10px] text-gray-400 font-bold uppercase">{fmtSize(file.file_size)}</p>
                                  </div>
                                  <a 
                                    href={file.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  >
                                     <Download size={18} />
                                  </a>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                   {/* File drop zone */}
                   <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-gray-50 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         <div className="w-12 h-12 bg-gray-50 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center transition-all mb-3">
                            <Upload size={24} />
                         </div>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Click hoặc kéo thả tệp vào đây</p>
                         <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">Hỗ trợ các định dạng file tài liệu, PDF, hình ảnh</p>
                      </div>
                      <input type="file" multiple className="hidden" onChange={handleFileChange} />
                   </label>

                   {/* File list */}
                   {files.length > 0 && (
                      <div className="space-y-3 pt-2">
                         {files.map((file, idx) => {
                           const progress = uploadProgress[idx];
                           return (
                             <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 group animate-in slide-in-from-top-2 duration-200 overflow-hidden shadow-sm">
                                <div className="flex items-center gap-4 p-4">
                                   <div className="w-10 h-12 shrink-0">
                                      <FileIcon ext={file.name.split('.').pop()} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-700 truncate">{file.name}</p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        {fmtSize(file.size)}
                                        {progress != null && progress < 100 && <span className="ml-2 text-indigo-500">{progress}%</span>}
                                        {progress === 100 && <span className="ml-2 text-emerald-500">✓</span>}
                                      </p>
                                   </div>
                                   {!isSubmitting && (
                                     <button 
                                       onClick={() => removeFile(idx)}
                                       className="p-2 text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                                     >
                                        <X size={18} />
                                     </button>
                                   )}
                                </div>
                                {progress != null && progress < 100 && (
                                  <div className="h-1 bg-gray-100">
                                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                  </div>
                                )}
                             </div>
                           );
                         })}
                      </div>
                   )}

                </div>
             </section>
          ) : (
            /* Results Section */
            <section className="pt-6 border-t border-gray-50 space-y-8">
               <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                       <CheckCircle2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Kết quả đánh giá</h3>
                  </div>
                  
                  <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div>
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Điểm số đạt được</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-5xl font-black">
                             {normalizedTask.score != null && normalizedTask.score !== ""
                               ? Number(normalizedTask.score)
                               : "—"}
                           </span>
                           <span className="text-indigo-300 text-xl font-bold">/{Number(normalizedTask.maxScore)}</span>
                        </div>
                     </div>
                     <div className="h-px w-full md:w-px md:h-12 bg-indigo-500/50" />
                     <div className="flex-1">
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Nhận xét chi tiết</p>
                        <p className="text-sm font-medium leading-relaxed italic opacity-90 whitespace-pre-wrap">
                           {normalizedTask.feedback?.trim()
                             ? normalizedTask.feedback
                             : "Chưa có nhận xét chi tiết từ giảng viên."}
                        </p>
                     </div>
                  </div>
               </div>

               <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Bài nộp đã đánh giá</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {normalizedTask.files?.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                           <div className="w-8 h-10 shrink-0">
                              <FileIcon ext={file.file_type} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-700 truncate">{file.file_name}</p>
                           </div>
                           <a 
                             href={file.file_url} 
                             target="_blank" 
                             rel="noreferrer"
                             className="p-2 text-gray-300 group-hover:text-indigo-500 transition-colors"
                           >
                              <Download size={18} />
                           </a>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
          )}
        </div>

        {/* Footer — không hiện nút nộp khi đã chấm (checkpoint: kể cả stale có điểm) */}
        {!showGradingResultView && (
          <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest cursor-pointer"
            >
              Đóng
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || files.length === 0 || isOverdue}
              className={`px-10 py-4 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest ${
                !isSubmitting && files.length > 0 && !isOverdue
                ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  {isSubmitted ? "Xác nhận nộp lại bài" : "Xác nhận nộp bài"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
