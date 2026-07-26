/**
 * Avatar — vòng tròn chữ cái đầu, màu suy ra từ tên (ổn định) để hàng bảng có nhận diện.
 *
 * Props: name, size ("sm" | "md")
 */
const AVATAR_TONES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-accent-100 text-accent",
];

export default function Avatar({ name, size = "sm" }) {
  const label = (name || "?").trim();
  const initial = label.split(" ").pop()?.charAt(0)?.toUpperCase() || "?";
  const hash = [...label].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const dim = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <span className={`grid place-items-center rounded-full font-bold shrink-0 ${dim} ${tone}`}>
      {initial}
    </span>
  );
}
