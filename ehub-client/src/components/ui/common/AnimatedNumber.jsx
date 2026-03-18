import { useEffect, useRef, useState, useCallback } from "react";
 
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const DIGIT_HEIGHT = 1; // em
 
function DigitRoller({ char, delay = 0, fontSize = "inherit" }) {
  const [prevChar, setPrevChar] = useState(char);
  const [current, setCurrent] = useState(char);
  const [animating, setAnimating] = useState(false);
 
  useEffect(() => {
    if (char === current) return;
    setPrevChar(current);
    setAnimating(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCurrent(char);
        setAnimating(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [char]);
 
  if (!DIGITS.includes(char)) {
    return (
      <span style={{ fontSize, display: "inline-block", lineHeight: 1 }}>
        {char}
      </span>
    );
  }
 
  const from = DIGITS.includes(prevChar) ? parseInt(prevChar) : parseInt(char);
  const to = parseInt(char);
  const direction = to >= from ? -1 : 1;
 
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        height: `${DIGIT_HEIGHT}em`,
        lineHeight: 1,
        verticalAlign: "bottom",
        fontSize,
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(${animating ? to * -DIGIT_HEIGHT : from * -DIGIT_HEIGHT}em)`,
          transition: animating
            ? `transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
            : "none",
          willChange: "transform",
        }}
      >
        {DIGITS.map((d, i) => (
          <span
            key={d}
            style={{
              display: "block",
              height: `${DIGIT_HEIGHT}em`,
              lineHeight: `${DIGIT_HEIGHT}em`,
              textAlign: "center",
              minWidth: "0.6em",
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}
 
/**
 * AnimatedNumber — Slot-machine digit roller edition
 *
 * Props:
 * - value     : number        — target value
 * - duration  : number (ms)   — ignored (kept for API compat), animation is CSS-driven
 * - className : string        — Tailwind classes
 * - fontSize  : string        — e.g. "2rem", "inherit"
 * - stagger   : number (ms)   — delay between digits (right→left), default 30ms
 */
export default function AnimatedNumber({
  value = 0,
  duration = 600,
  className = "",
  fontSize = "inherit",
  stagger = 30,
}) {
  const target = Number(value);
 
  if (!Number.isFinite(target)) {
    return <span className={className}>{value}</span>;
  }
 
  const formatted = Math.round(target).toLocaleString("vi-VN");
  const chars = formatted.split("");
 
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        fontVariantNumeric: "tabular-nums",
        fontSize,
      }}
    >
      {chars.map((char, i) => {
        const digitIndex = chars.length - 1 - i;
        const delay = digitIndex * stagger;
        return (
          <DigitRoller
            key={i}
            char={char}
            delay={delay}
            fontSize={fontSize}
          />
        );
      })}
    </span>
  );
}
 
// ─── Demo Showcase ────────────────────────────────────────────────────────────
 
const PRESETS = [
  { label: "Doanh thu", value: 1284750, suffix: "₫", color: "#10b981" },
  { label: "Đơn hàng", value: 4829, suffix: "", color: "#6366f1" },
  { label: "Tỉ lệ chuyển đổi", value: 73, suffix: "%", color: "#f59e0b" },
  { label: "Khách hàng mới", value: 312, suffix: "", color: "#ec4899" },
];
 
function StatCard({ label, value, suffix, color }) {
  const [current, setCurrent] = useState(0);
  const [tick, setTick] = useState(0);
 
  useEffect(() => {
    const t = setTimeout(() => setCurrent(value), 200 + Math.random() * 300);
    return () => clearTimeout(t);
  }, [value, tick]);
 
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        transition: "border-color 0.2s",
      }}
      onClick={() => {
        setCurrent(0);
        setTimeout(() => {
          setCurrent(value + Math.floor(Math.random() * value * 0.3));
          setTick((t) => t + 1);
        }, 80);
      }}
      title="Click để animate lại"
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          color,
        }}
      >
        <AnimatedNumber
          value={current}
          fontSize="2rem"
          stagger={40}
        />
        {suffix && (
          <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{suffix}</span>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 2,
        }}
      >
        click để replay ↺
      </span>
    </div>
  );
}
 
function CustomDemo() {
  const [inputVal, setInputVal] = useState(123456);
  const [displayed, setDisplayed] = useState(0);
 
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(inputVal), 100);
    return () => clearTimeout(t);
  }, [inputVal]);
 
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
          Thử số tùy ý:
        </label>
        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(Number(e.target.value))}
          style={{ flex: 1, maxWidth: 200 }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1.5rem 0",
        }}
      >
        <AnimatedNumber
          value={displayed}
          fontSize="3.5rem"
          stagger={50}
          className=""
        />
      </div>
    </div>
  );
}