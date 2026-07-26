import { useCallback, useRef, useState } from "react";

/**
 * useHideOnScroll — ẩn header/bottom-bar khi cuộn xuống, hiện lại khi cuộn lên
 * (giống thanh địa chỉ trình duyệt mobile).
 *
 * Gắn `onScroll` vào phần tử cuộn (thường là <main overflow-auto>).
 * Trả về [hidden, onScroll].
 *
 * - threshold: dưới mốc này (gần đỉnh) luôn hiện.
 * - delta    : ngưỡng chống rung; phải cuộn quá delta mới đổi trạng thái.
 */
export default function useHideOnScroll({ threshold = 8, delta = 6 } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const onScroll = useCallback(
    (e) => {
      const y = e.currentTarget.scrollTop;
      const prev = lastY.current;
      if (y < threshold) {
        setHidden(false);
      } else if (y > prev + delta) {
        setHidden(true); // cuộn xuống
      } else if (y < prev - delta) {
        setHidden(false); // cuộn lên
      }
      lastY.current = y;
    },
    [threshold, delta],
  );

  return [hidden, onScroll];
}
