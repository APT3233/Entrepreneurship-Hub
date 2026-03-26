import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * NavProgress — Thanh tiến trình mỏng ở đầu layout khi chuyển route.
 * Hiện ngay khi location thay đổi, chạy animation mượt rồi ẩn.
 */
export default function NavProgress() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 500);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 rounded-full"
        style={{
          animation: "navProgressSlide 0.5s ease-out forwards",
          boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
        }}
      />
    </div>
  );
}
