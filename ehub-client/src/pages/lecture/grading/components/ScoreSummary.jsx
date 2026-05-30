export default function ScoreSummary({ total = 0, rubricTotal, sourceMax, invalidCount = 0, missingFeedbackCount = 0, missingScoreCount = 0 }) {
  const hasProblems = invalidCount > 0 || missingFeedbackCount > 0 || missingScoreCount > 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng điểm</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{Number(total || 0).toFixed(2)}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Rubric: <span className="font-semibold text-gray-800">{rubricTotal ?? "—"}</span></p>
          <p>Bài: <span className="font-semibold text-gray-800">{sourceMax ?? "—"}</span></p>
        </div>
      </div>
      {hasProblems ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
          {invalidCount > 0 ? <p>{invalidCount} tiêu chí có điểm không hợp lệ.</p> : null}
          {missingScoreCount > 0 ? <p>{missingScoreCount} tiêu chí chưa nhập điểm.</p> : null}
          {missingFeedbackCount > 0 ? <p>{missingFeedbackCount} tiêu chí thiếu feedback bắt buộc.</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-emerald-600">Điểm hiện tại hợp lệ.</p>
      )}
    </div>
  );
}
