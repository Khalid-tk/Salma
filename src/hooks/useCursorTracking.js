import { useEffect, useRef } from "react";

function viewportSize() {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  const w = vv?.width ?? window.innerWidth;
  const h = vv?.height ?? window.innerHeight;
  return { w, h };
}

/**
 * Tracks pointer position for both mouse and touch (full viewport).
 * Clamps on resize / visualViewport changes (mobile rotation, address bar).
 */
export function useCursorTracking(onMove) {
  const raw = useRef({
    x: typeof window !== "undefined" ? window.innerWidth * 0.5 : 0,
    y: typeof window !== "undefined" ? window.innerHeight * 0.5 : 0
  });

  useEffect(() => {
    const clampAndNotify = () => {
      const { w, h } = viewportSize();
      raw.current.x = Math.max(0, Math.min(raw.current.x, w - 1));
      raw.current.y = Math.max(0, Math.min(raw.current.y, h - 1));
      onMove?.(raw.current.x, raw.current.y);
    };

    const update = (event) => {
      raw.current.x = event.clientX;
      raw.current.y = event.clientY;
      onMove?.(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("pointerdown", update, { passive: true });
    window.addEventListener("pointerup", update, { passive: true });
    window.addEventListener("pointercancel", update, { passive: true });

    window.addEventListener("resize", clampAndNotify);
    window.visualViewport?.addEventListener("resize", clampAndNotify);
    window.visualViewport?.addEventListener("scroll", clampAndNotify);

    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerdown", update);
      window.removeEventListener("pointerup", update);
      window.removeEventListener("pointercancel", update);
      window.removeEventListener("resize", clampAndNotify);
      window.visualViewport?.removeEventListener("resize", clampAndNotify);
      window.visualViewport?.removeEventListener("scroll", clampAndNotify);
    };
  }, [onMove]);

  return { raw };
}
