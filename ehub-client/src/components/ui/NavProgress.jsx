import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Thanh tiến trình mỏng ở đầu layout khi chuyển route.
 * Hiện khi location thay đổi, chạy animation ngắn rồi ẩn — tạo cảm giác mượt khi đổi trang.
 */
export default function NavProgress() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 320);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-indigo-500/90 overflow-hidden opacity-100 transition-opacity duration-150"
      style={{ boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
      aria-hidden
    >
      <div className="h-full w-1/3 bg-white/50 rounded-full animate-nav-progress" />
    </div>
  );
}
