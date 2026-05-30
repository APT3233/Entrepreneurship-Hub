import { useMemo } from "react";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
    </div>
  );
}

export default function GradingSummaryPanel({ submissions = [], maxScore = 10, labels = {} }) {
  const L = {
    total: "Total groups",
    submitted: "Submitted",
    notSubmitted: "Not submitted",
    graded: "Graded",
    pending: "Pending grade",
    late: "Late",
    avgScore: "Average score",
    avgPercent: "Average %",
    ...labels,
  };

  const stats = useMemo(() => {
    const total = submissions.length;
    const submitted = submissions.filter((row) => row.submission_id || row.submitted_at).length;
    const graded = submissions.filter((row) => row.score != null && row.score !== "").length;
    const late = submissions.filter((row) => Number(row.is_late || 0) === 1).length;
    const scores = submissions
      .map((row) => Number(row.score))
      .filter((score) => !Number.isNaN(score));
    const avgScore = scores.length
      ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)
      : "—";
    const max = Number(maxScore) || 10;
    const avgPercent = scores.length
      ? `${((scores.reduce((sum, score) => sum + score, 0) / scores.length / max) * 100).toFixed(1)}%`
      : "—";
    return {
      total,
      submitted,
      notSubmitted: Math.max(0, total - submitted),
      graded,
      pending: Math.max(0, submitted - graded),
      late,
      avgScore,
      avgPercent,
    };
  }, [submissions, maxScore]);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label={L.total} value={stats.total} />
      <StatCard label={L.submitted} value={stats.submitted} />
      <StatCard label={L.notSubmitted} value={stats.notSubmitted} />
      <StatCard label={L.graded} value={stats.graded} />
      <StatCard label={L.pending} value={stats.pending} />
      <StatCard label={L.late} value={stats.late} />
      <StatCard label={L.avgScore} value={stats.avgScore} />
      <StatCard label={L.avgPercent} value={stats.avgPercent} />
    </div>
  );
}
