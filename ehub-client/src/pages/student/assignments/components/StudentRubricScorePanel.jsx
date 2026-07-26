import React from "react";
import { Award, CheckCircle2, MessageSquareText } from "lucide-react";

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const scorePercent = (score, maxScore) => {
  const scoreNumber = Number(score || 0);
  const maxNumber = Number(maxScore || 0);
  if (!maxNumber) return 0;
  return Math.min(100, Math.max(0, (scoreNumber / maxNumber) * 100));
};

export default function StudentRubricScorePanel({ evaluation, fallbackScore, fallbackMaxScore, fallbackFeedback }) {
  const scores = evaluation?.scores || [];
  const hasCriteria = scores.length > 0;
  const totalScore = evaluation?.totalScore ?? fallbackScore;
  const maxScore = evaluation?.maxScore ?? fallbackMaxScore;
  const overallFeedback = evaluation?.overallFeedback || fallbackFeedback;

  if (!evaluation && !fallbackFeedback) return null;

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2 text-accent min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-50 border border-accent-100/30">
            <Award size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-accent-400 leading-none">
              Kết quả đánh giá
            </p>
            <h4 className="truncate text-xs font-semibold text-text-secondary mt-1">
              Bảng điểm chi tiết
            </h4>
          </div>
        </div>
        
        {/* Total Score Badge */}
        <div className="rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 px-4 py-2 text-right text-white shadow-md shadow-accent-100/40 shrink-0 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-100">Tổng điểm:</span>
          <span className="text-base font-semibold leading-none">
            {formatScore(totalScore)}
            <span className="text-[10px] text-accent-200 font-bold">/{formatScore(maxScore)}</span>
          </span>
        </div>
      </div>

      {/* Overall Feedback Hero Card */}
      {overallFeedback && (
        <div className="rounded-xl border border-accent-50/60 bg-gradient-to-r from-accent-50/20 to-purple-50/20 p-4 relative overflow-hidden shadow-inner">
          <div className="absolute right-3 bottom-1 opacity-5 pointer-events-none select-none text-6xl font-serif text-accent-900">”</div>
          <div className="flex items-center gap-1.5 mb-1.5 text-accent">
            <MessageSquareText size={14} className="text-accent-500" />
            <p className="text-[9px] font-semibold uppercase tracking-widest text-accent-500">Nhận xét của Giảng viên</p>
          </div>
          <p className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-text-secondary italic pl-0.5">
            "{overallFeedback}"
          </p>
        </div>
      )}

      {/* Criteria Detail List */}
      {hasCriteria ? (
        <div className="divide-y divide-slate-100 pt-1">
          {scores.map((item) => {
            const percent = scorePercent(item.score, item.maxScore);
            return (
              <div 
                key={item.criterionId} 
                className="py-3 hover:bg-subtle/30 transition-all duration-200 group rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-text-secondary group-hover:text-accent transition-colors">
                        {item.criterionName}
                      </span>
                      {item.weight != null && (
                        <span className="text-[8px] font-semibold text-accent-500 bg-accent-50/80 px-1.5 py-0.5 rounded uppercase tracking-wider border border-accent-100/30">
                          w{formatScore(item.weight)}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-[10px] text-text-muted font-semibold truncate max-w-[280px] sm:max-w-lg" title={item.description}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Score Tag */}
                  <div className="shrink-0">
                    <span className="text-xs font-semibold text-text-secondary bg-slate-100/80 px-2 py-1 rounded-lg">
                      {formatScore(item.score)}
                      <span className="text-[9px] text-text-muted font-bold">/{formatScore(item.maxScore)}</span>
                    </span>
                  </div>
                </div>
                
                {/* Score Progress Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100/80 border border-border/20">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-500 transition-all duration-500" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-accent-500 w-7 text-right leading-none">{Math.round(percent)}%</span>
                </div>
                
                {/* Specific feedback for this criteria */}
                {item.feedback && (
                  <div className="mt-2 flex items-start gap-1.5 text-[10px] font-semibold text-text-secondary bg-subtle/50 px-2.5 py-1.5 rounded-lg border border-border/40">
                    <MessageSquareText size={12} className="mt-0.5 shrink-0 text-violet-400" />
                    <p className="whitespace-pre-wrap leading-relaxed"><span className="font-bold text-text-secondary">Ghi chú:</span> {item.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-[10px] text-amber-700 font-semibold shadow-sm">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p>
            Bài tập này hiện có điểm tổng và nhận xét chung từ giảng viên. Chưa có dữ liệu điểm theo từng tiêu chí.
          </p>
        </div>
      )}
    </div>
  );
}
