import { useState, useRef, useMemo } from "react";
import { X } from "lucide-react";
import Dropdown from "@/components/ui/filter/DropDown";
import ImportStudentsStep from "./ImportStudentsStep";

const SUBJECTS_OPTIONS = [
  { label: "EXE101", value: "EXE101" },
  { label: "EXE201", value: "EXE201" },
];

const CLASS_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: i + 1,
}));

/** Trả về các giá trị class hợp lệ cho subject + classSection (vd: EXE101_04, EXE101_4) */
const getExpectedClassCodes = (subject, classSection) => {
  if (!subject) return [];
  const c = Number(classSection);
  const partPad = String(c).padStart(2, "0");
  const partShort = String(c);
  return [
    `${subject}_${partPad}`,
    `${subject}_${partShort}`,
    `${subject}-${partPad}`,
    `${subject}-${partShort}`,
  ];
};

export default function CreateClassModal({ isOpen, onClose, onCreate, loading = false, error: apiError }) {
  const currentYear = new Date().getFullYear();

  const YEAR_OPTIONS = Array.from({ length: 2 }, (_, i) => {
    const y = currentYear + i;
    return { label: String(y), value: y };
  });

  const [subject, setSubject] = useState("");
  const [classSection, setClassSection] = useState(1);
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState(1);
  const [files, setFiles] = useState([]);
  const [importSummary, setImportSummary] = useState({
    total: 0,
    valid: 0,
    needReview: 0,
  });
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");

  const backdropPressedRef = useRef(false);

  const expectedClassCodes = useMemo(
    () => (subject ? getExpectedClassCodes(subject, classSection) : []),
    [subject, classSection]
  );

  const classMismatchError = useMemo(() => {
    if (!subject || files.length === 0) return null;
    const codes = getExpectedClassCodes(subject, classSection);
    const invalid = files.filter((s) => {
      const code = String(s.classCode || "").trim();
      return code && !codes.includes(code);
    });
    if (invalid.length === 0) return null;
    const wrong = [...new Set(invalid.map((r) => r.classCode).filter(Boolean))];
    return `Cột Class trong file không khớp với lớp đã chọn (${subject}_${String(classSection).padStart(2, "0")}). Các giá trị sai: ${wrong.join(", ")}.`;
  }, [subject, classSection, files]);

  const displayImportError = classMismatchError || importError;

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) backdropPressedRef.current = true;
  };

  const handleBackdropMouseUp = (e) => {
    if (e.target === e.currentTarget) backdropPressedRef.current = false;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && backdropPressedRef.current) onClose();
    backdropPressedRef.current = false;
  };

  const handleSubmit = () => {
    if (loading) return;
    if (!subject) {
      setError("* Vui lòng nhập thông tin còn thiếu");
      return;
    }

    if (importSummary.needReview > 0) {
      setImportError("Danh sách sinh viên vẫn còn lỗi. Vui lòng sửa hết trước khi tạo lớp.");
      return;
    }

    if (classMismatchError) return;

    setError("");
    setImportError("");

    onCreate?.({
      subject,
      classSection,
      year,
      semester,
      students: {
        list: files.map((s) => ({ ...s, status: "inactive" })),
        summary: importSummary,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
      onClick={handleBackdropClick}
    >
      <div
        className="
        relative w-full bg-white shadow-2xl
        rounded-t-2xl sm:rounded-2xl
        max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto
        sm:mx-4 sm:max-w-4xl lg:max-w-5xl
      "
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>

          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Tạo lớp mới
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Nhập thông tin lớp và import danh sách sinh viên
          </p>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-7 py-5 flex flex-col gap-6">
          {/* Thông tin lớp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Môn học <span className="text-red-500">*</span>
              </label>

              <Dropdown
                label="Chọn môn học"
                options={SUBJECTS_OPTIONS}
                value={subject}
                onChange={(v) => {
                  setSubject(v);
                  setError("");
                }}
              />

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Class <span className="text-red-500">*</span>
              </label>

              <Dropdown
                label="Class"
                options={CLASS_OPTIONS}
                value={classSection}
                onChange={(v) => setClassSection(v)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Năm
              </label>

              <Dropdown
                label="Chọn năm học"
                options={YEAR_OPTIONS}
                value={year}
                onChange={(v) => {
                  if (v >= currentYear) setYear(v);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">
                Semester
              </label>

              <Dropdown
                label="Semester"
                options={[
                  { label: "Spring", value: 1 },
                  { label: "Summer", value: 2 },
                  { label: "Fall", value: 3 },
                ]}
                value={semester}
                onChange={setSemester}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-800">
              Import danh sách sinh viên
            </label>
            <p className="text-xs text-gray-500">
              Cột Class trong file phải có format {subject ? `${subject}_` : "EXExxx_"}số lớp (vd: {subject || "EXE101"}_{String(classSection).padStart(2, "0")})
            </p>

            <ImportStudentsStep
              expectedClassCodes={expectedClassCodes}
              onParsed={({ students, summary }) => {
                setFiles(students);
                setImportSummary(summary);
                let err = "";
                if (summary.needReview > 0) {
                  err = "Danh sách sinh viên vẫn còn lỗi. Vui lòng sửa hết trước khi tạo lớp.";
                } else if (expectedClassCodes.length && students.some((s) => {
                  const code = String(s.classCode || "").trim();
                  return code && !expectedClassCodes.includes(code);
                })) {
                  const wrong = [...new Set(students.filter((s) => {
                    const code = String(s.classCode || "").trim();
                    return code && !expectedClassCodes.includes(code);
                  }).map((r) => r.classCode).filter(Boolean))];
                  err = `Cột Class trong file không khớp với lớp đã chọn (${subject}_${String(classSection).padStart(2, "0")}). Các giá trị sai: ${wrong.join(", ")}.`;
                }
                setImportError(err);
              }}
            />
            {displayImportError && (
              <p className="text-xs text-red-500 mt-1">
                {displayImportError}
              </p>
            )}
            {apiError && (
              <p className="text-xs text-red-500 mt-1">
                {apiError}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 pb-6 sm:pb-7 pt-2 sticky bottom-0 bg-white">
          <button
            onClick={handleSubmit}
            disabled={loading || !!displayImportError || importSummary.needReview > 0}
            className="
              w-full py-3 rounded-xl
              bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
              text-white text-sm font-bold tracking-wide
              shadow-md shadow-indigo-200 transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loading ? "Đang tạo..." : "Tạo lớp"}
          </button>
        </div>
      </div>
    </div>
  );
}