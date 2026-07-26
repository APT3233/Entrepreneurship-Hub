import { useState, useMemo, useEffect, useRef } from "react";
import { Upload, File, Trash2, AlertTriangle, Users, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import StatCard from "@/components/ui/Card/StatCard";
import { ALLOWED_EXT, getFileExt, mapHeaders, buildStudent, validateStudent } from "@/utils/importStudents";

export default function ImportStudentsStep({ onParsed, expectedClassCodes = [] }) {
  const [file, setFile] = useState(null);
  const [rawStudents, setRawStudents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [genericError, setGenericError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef(null);

  const { students, summary } = useMemo(() => {
    const codes = Array.isArray(expectedClassCodes) ? expectedClassCodes : [];
    const hasClassCheck = codes.length > 0;
    const withClass = rawStudents.map((s) => {
      const classMatch = !hasClassCheck || !s.classCode?.trim() || codes.includes(String(s.classCode).trim());
      const needReview = s.status === "need_review" || !classMatch;
      return { ...s, status: needReview ? "need_review" : "valid" };
    });
    const needReview = withClass.filter((s) => s.status === "need_review").length;
    return {
      students: withClass,
      summary: { total: withClass.length, valid: withClass.length - needReview, needReview },
    };
  }, [rawStudents, expectedClassCodes]);

  useEffect(() => {
    if (students.length > 0 && onParsed) {
      onParsed({ students, summary, errors });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onParsed/errors thay đổi không cần gọi lại
  }, [students, summary]);

  const handleFile = (incoming) => {
    
    const f = incoming?.[0];
    if (!f) return;
    const ext = getFileExt(f.name);
    if (!ALLOWED_EXT.includes(ext)) {
      setGenericError("File không hợp lệ. Chỉ chấp nhận .xls, .xlsx, .csv.");
      setErrorModalOpen(true);
      return;
    }
    setFile(f);
    parseFile(f);
  };

  const parseFile = (f) => {
    setParsing(true);
    setGenericError("");
    setErrors([]);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Use binary string for better compatibility with Excel formats.
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!rows.length) {
          setGenericError("File không có dữ liệu.");
          setErrorModalOpen(true);
          setParsing(false);
          return;
        }
        const [header, ...body] = rows;
        const headerMap = mapHeaders(header);
        const requiredKeys = ["class", "rollnumber", "email", "membercode", "fullname"];
        const missing = requiredKeys.filter((k) => headerMap[k] == null);
        if (missing.length) {
          setGenericError(
            `Không tìm thấy các cột: ${missing.join(", ")}. Hãy đảm bảo file có đầy đủ thông tin: Lớp, MSSV, Email, Mã thành viên, Họ và tên.`
          );
          setErrorModalOpen(true);
          setParsing(false);
          return;
        }

        const codes = Array.isArray(expectedClassCodes) ? expectedClassCodes : [];
        const hasClassCheck = codes.length > 0;
        const parsedStudents = [];
        const rowErrors = [];
        body.forEach((row, idx) => {
          const student = buildStudent(row, headerMap);
          if (!student.classCode && !student.rollNumber && !student.email && !student.memberCode && !student.fullname) {
            return;
          }
          const excelRowIndex = idx + 2;
          const validation = validateStudent(student, excelRowIndex);
          const classMatch = !hasClassCheck || !student.classCode?.trim() || codes.includes(String(student.classCode).trim());
          if (!validation.ok) rowErrors.push(validation);
          if (!classMatch && validation.ok) rowErrors.push({ index: excelRowIndex, student, ok: false, messages: ["Cột Class không khớp với lớp đã chọn"] });
          const needReview = !validation.ok || !classMatch;
          parsedStudents.push({ ...student, _idx: idx, status: needReview ? "need_review" : "valid", rowIndex: excelRowIndex });
        });

        setRawStudents(parsedStudents);
        setPage(1);
        setErrors(rowErrors);
        setParsing(false);
        const needReview = parsedStudents.filter((s) => s.status === "need_review").length;
        const nextSummary = { total: parsedStudents.length, valid: parsedStudents.length - needReview, needReview };
        if (onParsed) onParsed({ students: parsedStudents, summary: nextSummary, errors: rowErrors });
      } catch {
        setGenericError("Không thể đọc file. Vui lòng kiểm tra lại định dạng hoặc nội dung.");
        setErrorModalOpen(true);
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setGenericError("Không thể đọc file. Vui lòng thử lại.");
      setErrorModalOpen(true);
      setParsing(false);
    };

    reader.readAsBinaryString(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    handleFile(e.target.files);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setRawStudents([]);
    setErrors([]);
    setPage(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onParsed) onParsed({ students: [], summary: { total: 0, valid: 0, needReview: 0 }, errors: [] });
  };

  const totalPages = useMemo(() => {
    if (!summary.total) return 1;
    return Math.max(1, Math.ceil(summary.total / pageSize));
  }, [summary.total, pageSize]);

  const visibleStudents = useMemo(() => {
    if (!students.length) return [];
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, page, pageSize]);

  const handleChangePage = (next) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  const handlePageSizeChange = (e) => {
    const raw = e.target.value;
    const n = Number(raw);
    if (Number.isNaN(n)) { setPageSize(10); setPage(1); return; }
    const safe = Math.min(100, Math.max(1, Math.floor(n)));
    setPageSize(safe);
    setPage(1);
  };

  // Compute validated list + summary + errors from raw list (no setState; safe to call from event handler).
  const computeValidation = (nextStudents) => {
    const rowErrors = [];
    const codes = Array.isArray(expectedClassCodes) ? expectedClassCodes : [];
    const hasClassCheck = codes.length > 0;
    const validated = nextStudents.map((stu) => {
      const validation = validateStudent(stu, stu.rowIndex ?? stu._idx ?? 0);
      if (!validation.ok) rowErrors.push(validation);
      const classMatch = !hasClassCheck || !stu.classCode?.trim() || codes.includes(String(stu.classCode).trim());
      if (!classMatch && validation.ok) rowErrors.push({ index: stu.rowIndex ?? 0, student: stu, ok: false, messages: ["Cột Class không khớp với lớp đã chọn"] });
      const needReview = !validation.ok || !classMatch;
      return { ...stu, status: needReview ? "need_review" : "valid" };
    });
    const needReview = validated.filter((s) => s.status === "need_review").length;
    const valid = validated.length - needReview;
    const nextSummary = { total: validated.length, valid, needReview };
    return { validated, nextSummary, rowErrors };
  };

  const handleCellChange = (localIndex, field, value) => {
    const globalIndex = (page - 1) * pageSize + localIndex;
    if (globalIndex < 0 || globalIndex >= rawStudents.length) return;
    const nextRaw = [...rawStudents];
    nextRaw[globalIndex] = { ...nextRaw[globalIndex], [field]: value };
    const { validated, nextSummary, rowErrors } = computeValidation(nextRaw);
    setRawStudents(validated);
    setErrors(rowErrors);
    if (onParsed) onParsed({ students: validated, summary: nextSummary, errors: rowErrors });
  };

  const handleFixAllClassCode = () => {
    const codes = Array.isArray(expectedClassCodes) ? expectedClassCodes : [];
    const targetCode = codes[0] || "";
    if (!targetCode || !rawStudents.length) return;
    const nextRaw = rawStudents.map((s) => ({ ...s, classCode: targetCode }));
    const { validated, nextSummary, rowErrors } = computeValidation(nextRaw);
    setRawStudents(validated);
    setErrors(rowErrors);
    if (onParsed) onParsed({ students: validated, summary: nextSummary, errors: rowErrors });
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl
          flex flex-col items-center justify-center
          py-8 sm:py-10 gap-2
          cursor-pointer transition-colors
          ${dragging
            ? "border-accent-400 bg-accent-50"
            : "border-gray-200 bg-gray-50 hover:border-accent-300 hover:bg-accent-50/40"}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id="import-students-input"
          type="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          onChange={handleChange}
        />
        <div className="w-10 h-10 flex items-center justify-center text-accent-600">
          <Upload size={28} strokeWidth={1.8} />
        </div>
        <p className="text-sm font-semibold text-gray-700">
          {file ? "Chọn file khác để thay thế" : "Kéo thả file danh sách sinh viên vào đây"}
        </p>
        <p className="text-xs text-gray-400">
          Chấp nhận file: .xls, .xlsx, .csv — Tự động nhận diện: Lớp, MSSV, Email, Mã thành viên, Họ và tên (Chuyên ngành - tùy chọn).
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2">
            <File size={15} className="text-accent-400 shrink-0" />
            <span className="text-xs text-gray-700 truncate max-w-[220px] sm:max-w-xs">{file.name}</span>
            {parsing && <span className="text-[11px] text-gray-400 ml-1">Đang phân tích...</span>}
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {summary.total > 0 && (
        <div className="mt-1">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <StatCard
              title="Tổng số học sinh"
              value={summary.total}
              icon={<Users size={22} />}
              iconBg="bg-blue-100"
              iconColor="text-blue-500"
            />
            <StatCard
              title="Dữ liệu hợp lệ"
              value={summary.valid}
              icon={<CheckCircle size={22} />}
              iconBg="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Cần kiểm tra"
              value={summary.needReview}
              icon={<AlertTriangle size={22} />}
              iconBg="bg-orange-100"
              iconColor="text-orange-500"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {expectedClassCodes?.length > 0 && summary.needReview > 0 && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-800">Cột Class không khớp với lớp đã chọn</span>
                <button
                  type="button"
                  onClick={handleFixAllClassCode}
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
                >
                  Sửa tất cả thành {expectedClassCodes[0]}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {["STT", "LỚP", "EMAIL", "MÃ THÀNH VIÊN", "HỌ VÀ TÊN", "CHUYÊN NGÀNH"].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-400 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleStudents.map((s, i) => {
                    const stt = (page - 1) * pageSize + i + 1;
                    const hasError = s.status === "need_review";
                    return (
                      <tr
                        key={s._idx}
                        className={`transition-colors duration-100 ${
                          hasError ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-500 text-sm">{stt}</td>
                        <td className="px-4 py-3 text-gray-800">
                          <input
                            type="text"
                            value={s.classCode}
                            onChange={(e) => handleCellChange(i, "classCode", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <input
                            type="email"
                            value={s.email}
                            onChange={(e) => handleCellChange(i, "email", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          <input
                            type="text"
                            value={s.memberCode}
                            onChange={(e) => handleCellChange(i, "memberCode", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          <input
                            type="text"
                            value={s.fullname}
                            onChange={(e) => handleCellChange(i, "fullname", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400 bg-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          <input
                            type="text"
                            value={s.major}
                            onChange={(e) => handleCellChange(i, "major", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400 bg-white"
                          />
                        </td>
                      </tr>
                  );})}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 text-[11px] text-gray-400 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>
                  Hiển thị{" "}
                  {summary.total === 0 ? 0 : (page - 1) * pageSize + 1}
                  {" - "}
                  {summary.total === 0 ? 0 : Math.min(page * pageSize, summary.total)}
                  {" trên tổng số "}
                  {summary.total} bản ghi
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-400">Số bản ghi / trang:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="w-14 px-1 py-0.5 border border-gray-200 rounded-md text-[11px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-400"
                  />
                </div>
              </div>
              {summary.total > pageSize && (
                <div className="inline-flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 1}
                    className={`px-2 py-1 rounded-lg border text-xs ${
                      page === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChangePage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                        p === page
                          ? "bg-accent-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={page === totalPages}
                    className={`px-2 py-1 rounded-lg border text-xs ${
                      page === totalPages
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>

          {summary.needReview > 0 && (
            <button
              type="button"
              onClick={() => setErrorModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600"
            >
              <AlertTriangle size={14} />
              <span>Xem chi tiết các dòng cần kiểm tra</span>
            </button>
          )}
        </div>
      )}

      {errorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={18} />
                <h3 className="text-sm font-semibold text-gray-900">Chi tiết lỗi import</h3>
              </div>
              <button
                type="button"
                onClick={() => setErrorModalOpen(false)}
                className="text-gray-300 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-3 space-y-3 overflow-y-auto max-h-[60vh]">
              {genericError && (
                <p className="text-xs text-red-500">
                  {genericError}
                </p>
              )}
              {!genericError && errors.length === 0 && (
                <p className="text-xs text-gray-500">Không có lỗi nào cần hiển thị.</p>
              )}
              {errors.length > 0 && (
                <ul className="space-y-1.5">
                  {errors.slice(0, 100).map((err) => (
                    <li key={err.index} className="text-xs text-gray-700">
                      <span className="font-semibold">Dòng {err.index}:</span>{" "}
                      <span className="text-red-500">{err.messages.join(" ")}</span>
                    </li>
                  ))}
                  {errors.length > 100 && (
                    <li className="text-[11px] text-gray-400">
                      ... và còn {errors.length - 100} dòng lỗi khác.
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="px-5 pb-4 pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-accent-600 text-white text-xs font-semibold hover:bg-accent-700"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

