import { Sparkles } from "lucide-react";

/**
 * DashboardHero — dải chào mừng khơi cảm hứng (gradient cam ấm + ánh sáng mềm).
 *
 * Props:
 * - name?     : string  — tên hiển thị (rút gọn)
 * - subtitle? : string
 * - meta?     : string  — dòng ngữ cảnh nhỏ (vd học kỳ hiện tại)
 */
export default function DashboardHero({ name, subtitle, meta, stats = [], badge = "Cổng giảng viên · E-HUB" }) {
  return (
    <section className="relative overflow-hidden rounded-card bg-linear-to-br from-accent-600 via-accent-500 to-accent-400 px-6 py-7 sm:px-8 sm:py-9 text-white shadow-card">
      {/* Ánh sáng mềm */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-8 h-56 w-56 rounded-full bg-surface/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-28 h-44 w-44 rounded-full bg-accent-300/40 blur-3xl" />
      {/* Lưới chấm nhẹ — chất "innovation lab" */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/15 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-sm">
          <Sparkles size={13} />
          {badge}
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Chào mừng trở lại{name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm sm:text-[15px] leading-relaxed text-white/90">
          {subtitle || "Khơi nguồn ý tưởng, đồng hành cùng sinh viên trên hành trình khởi nghiệp và đổi mới sáng tạo."}
        </p>
        {meta && (
          <p className="mt-4 text-xs font-medium text-white/75">{meta}</p>
        )}

        {stats.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/20 pt-5">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-2xl sm:text-[26px] font-bold leading-none">{s.value}</p>
                <p className="mt-1.5 text-xs text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
