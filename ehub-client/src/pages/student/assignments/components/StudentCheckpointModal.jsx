import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  X, Calendar, Upload, Download, 
  CheckCircle2, Clock, AlertCircle, FileText, Info, Target, Users
} from "lucide-react";
import pLimit from "p-limit";
import FileIcon from "@/components/icons/FileIcon";
import CheckpointApi from "@/api/checkpoint";
import AssignmentApi from "@/api/assignment";
import { useToast } from "@/components/ui/Toast";
import {
  parseLecturerAttachmentUrls,
  getAttachmentDisplayFileName,
} from "@/utils/lecturerAttachments";
import { formatDateTimeText } from "@/utils/dateTimeDisplay";
import StudentRubricScorePanel from "./StudentRubricScorePanel";

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
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
      evaluation: task.evaluation || null,
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

  // Tab State
  const [activeTab, setActiveTab] = useState(showGradingResultView ? "submission" : "guidelines");

  useEffect(() => {
    if (normalizedTask) {
      setActiveTab(showGradingResultView ? "submission" : "guidelines");
    }
  }, [normalizedTask, showGradingResultView]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-300"
      onMouseDown={(e) => setMouseDownTarget(e.target)}
      onMouseUp={(e) => { if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
               <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                 normalizedTask.isCheckpoint 
                   ? "bg-indigo-50/80 text-indigo-600 border-indigo-100/50" 
                   : "bg-emerald-50/80 text-emerald-600 border-emerald-100/50"
               }`}>
                 {normalizedTask.isCheckpoint ? `Checkpoint ${normalizedTask.orderIndex}` : "Assignment"}
               </span>
               
               {/* Status Badge */}
               {isGraded ? (
                 <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-purple-50 text-purple-600 border-purple-100/50">
                   Đã chấm điểm
                 </span>
               ) : isSubmitted ? (
                 <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100/50">
                   Đã nộp bài
                 </span>
               ) : isOverdue ? (
                 <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-rose-50 text-rose-600 border-rose-100/50">
                   Quá hạn nộp
                 </span>
               ) : (
                 <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-amber-50 text-amber-600 border-amber-100/50">
                   Chưa nộp
                 </span>
               )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-snug truncate">
              {normalizedTask.title}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all shrink-0 ml-4 cursor-pointer border border-transparent hover:border-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 px-8 py-3 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "guidelines"
                ? "bg-indigo-50 text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FileText size={14} />
            Hướng dẫn & Nhiệm vụ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("submission")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "submission"
                ? "bg-indigo-50 text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {showGradingResultView ? <Target size={14} /> : <Upload size={14} />}
            {showGradingResultView ? "Kết quả đánh giá" : "Bài nộp của tôi"}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-slate-50/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Main column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: GUIDELINES & SPECIFICATIONS */}
              {activeTab === "guidelines" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Task Description */}
                  <div className="bg-slate-50/60 rounded-3xl p-6 border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Info size={14} className="text-indigo-500" /> Chi tiết yêu cầu
                    </h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {normalizedTask.description || "Không có mô tả chi tiết cho nhiệm vụ này."}
                    </p>
                  </div>

                  {/* Attachment Materials */}
                  {normalizedTask.attachmentUrls?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <Download size={14} className="text-emerald-500" /> Tài liệu đính kèm từ Giảng viên
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {normalizedTask.attachmentUrls.map((url) => (
                          <div
                            key={url}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm hover:scale-[1.005] transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-emerald-100/50 transition-colors">
                                <FileText size={18} />
                              </div>
                              <div className="flex flex-col overflow-hidden min-w-0">
                                <span className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                                  {getAttachmentDisplayFileName(url)}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Tài liệu tham khảo</span>
                              </div>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider shrink-0 border border-slate-200/60 hover:border-indigo-600"
                            >
                              Tải xuống
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SUBMISSIONS AND GRADES */}
              {activeTab === "submission" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* CASE A: NOT GRADED - Submission Dropzone & Files upload */}
                  {!showGradingResultView ? (
                    <div className="space-y-6">
                      {/* Already Submitted Files List */}
                      {isSubmitted && normalizedTask.files && normalizedTask.files.length > 0 && (
                        <div className="space-y-3 bg-emerald-50/20 p-5 rounded-3xl border border-emerald-100/30">
                          <h4 className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest px-1">
                            Tệp đã nộp thành công
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {normalizedTask.files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-emerald-100/40 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-10 shrink-0">
                                    <FileIcon ext={file.file_type} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{file.file_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{fmtSize(file.file_size)}</p>
                                  </div>
                                </div>
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Drop Zone */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Tải tệp lên bài làm
                        </h4>
                        <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl cursor-pointer hover:bg-indigo-50/10 transition-all duration-200 group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center transition-all mb-3 shadow-inner">
                              <Upload size={20} />
                            </div>
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                              Click hoặc kéo thả tệp tại đây
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-sm">
                              {normalizedTask.requiredFileTypes 
                                ? `Hỗ trợ định dạng: ${normalizedTask.requiredFileTypes}` 
                                : "Chấp nhận tất cả định dạng tài liệu, PDF, zip, hình ảnh..."}
                            </p>
                          </div>
                          <input type="file" multiple className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>

                      {/* Selected Files Queue */}
                      {files.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Tệp được chọn chuẩn bị nộp ({files.length})
                          </h4>
                          <div className="space-y-2.5">
                            {files.map((file, idx) => {
                              const progress = uploadProgress[idx];
                              return (
                                <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 group overflow-hidden shadow-sm transition-all duration-200">
                                  <div className="flex items-center gap-3 p-4">
                                    <div className="w-8 h-10 shrink-0">
                                      <FileIcon ext={file.name.split('.').pop()} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                                        {fmtSize(file.size)}
                                        {progress != null && progress < 100 && <span className="ml-2 text-indigo-500 font-black">{progress}%</span>}
                                        {progress === 100 && <span className="ml-2 text-emerald-500 font-black">✓ Hoàn tất</span>}
                                      </p>
                                    </div>
                                    {!isSubmitting && (
                                      <button 
                                        onClick={() => removeFile(idx)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer rounded-xl hover:bg-rose-50 active:scale-95"
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </div>
                                  {progress != null && progress < 100 && (
                                    <div className="h-1 bg-slate-200">
                                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    
                    // CASE B: GRADED - Score Mesh Banner, Rubrics & Feedback
                    <div className="space-y-6">
                      {/* Premium Mesh Gradient Score Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.25),transparent)] pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5">Kết quả học tập</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tight">
                              {normalizedTask.score != null && normalizedTask.score !== ""
                                ? Number(normalizedTask.score)
                                : "—"}
                            </span>
                            <span className="text-indigo-300 text-xl font-bold">/{Number(normalizedTask.maxScore)}</span>
                          </div>
                        </div>
                        
                        <div className="h-px w-full md:w-px md:h-16 bg-indigo-500/20" />
                        
                        <div className="relative z-10 flex-1 text-center md:text-left w-full">
                          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Giảng viên chấm điểm</p>
                          <p className="text-sm font-bold">
                            {normalizedTask.evaluation?.evaluatorName || "Giảng viên của lớp"}
                          </p>
                          {normalizedTask.evaluation?.evaluatedAt && (
                            <p className="text-[10px] text-indigo-100 mt-1 font-bold uppercase">
                              Thời gian: {formatDateTimeText(normalizedTask.evaluation.evaluatedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rubric Evaluator Details Panel */}
                      <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                        <StudentRubricScorePanel
                          evaluation={normalizedTask.evaluation}
                          fallbackScore={normalizedTask.score}
                          fallbackMaxScore={normalizedTask.maxScore}
                          fallbackFeedback={normalizedTask.feedback}
                        />
                      </div>

                      {/* Submitted Graded Files */}
                      {normalizedTask.files && normalizedTask.files.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Bài làm đã nộp và được đánh giá
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {normalizedTask.files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all duration-200 group shadow-sm">
                                <div className="w-8 h-10 shrink-0">
                                  <FileIcon ext={file.file_type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{file.file_name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{fmtSize(file.file_size)}</p>
                                </div>
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Right Sticky Sidebar (1/3 width) */}
            <div className="space-y-5">
              {/* Status & Deadline Card */}
              <div className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar size={12} className="text-indigo-500" /> Hạn nộp chính thức
                  </p>
                  <p className="text-sm font-bold text-slate-700">{formatDateTimeText(normalizedTask.deadline)}</p>
                </div>
                
                {!isSubmitted && !isOverdue && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock size={12} /> Thời gian còn lại
                    </p>
                    <p className="text-lg font-black text-amber-700">
                      {Math.ceil((new Date(normalizedTask.deadline) - new Date()) / (1000 * 60 * 60 * 24))} ngày nữa
                    </p>
                  </div>
                )}
              </div>

              {/* Technical requirements Card */}
              <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                   <Info size={12} className="text-indigo-500" /> Quy định tệp nộp
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Định dạng</span>
                    <span className="text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider">{normalizedTask.requiredFileTypes || "Tất cả tệp"}</span>
                  </li>
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Số lượng</span>
                    <span className="text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider">Tối đa {normalizedTask.maxFiles} file</span>
                  </li>
                  <li className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Dung lượng</span>
                    <span className="text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider">{normalizedTask.maxFileSizeMb} MB/file</span>
                  </li>
                </ul>
              </div>

              {/* Group Info Card (if exists) */}
              {normalizedTask.groupName && (
                <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-3xl space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                     <Users size={12} className="text-indigo-500" /> Thông tin dự án nhóm
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tên nhóm</p>
                      <p className="text-xs font-bold text-slate-800">{normalizedTask.groupName}</p>
                    </div>
                    {normalizedTask.category && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lĩnh vực startup</p>
                        <p className="text-xs font-bold text-indigo-600">{normalizedTask.category}</p>
                      </div>
                    )}
                    {normalizedTask.topic && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chủ đề dự án</p>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">{normalizedTask.topic}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 active:scale-95 transition-all uppercase tracking-wider cursor-pointer border border-slate-200 bg-white"
          >
            Đóng
          </button>
          {!showGradingResultView && (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || files.length === 0 || isOverdue}
              className={`px-8 py-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wider ${
                !isSubmitting && files.length > 0 && !isOverdue
                ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  {isSubmitted ? "Nộp lại bài tập" : "Nộp bài tập"}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
