import { Sparkles } from "lucide-react";

/**
 * Trang placeholder — empty state khi tính năng đang phát triển.
 *
 * Props: title, description, icon? (lucide component)
 */
export default function PlaceholderPage({ title, description, icon: Icon = Sparkles }) {
  return (
    <div className="relative overflow-hidden rounded-card bg-surface shadow-card">
      {/* Lưới chấm nhẹ nền */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(var(--color-subtle) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative flex flex-col items-center text-center px-6 py-16 sm:py-24">
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-linear-to-br from-accent-100 to-accent-200 text-accent ring-1 ring-accent-100">
          <Icon size={28} />
        </div>
        <h1 className="mt-6 text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed">{description}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1 text-xs font-medium text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Đang phát triển
        </span>
      </div>
    </div>
  );
}
