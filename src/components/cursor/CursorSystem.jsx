import { useEffect, useMemo, useState } from "react";
import { useBloomStore } from "../../store/bloomStore";
import CursorText from "../dialogue/CursorText";

export default function CursorSystem({ cursorRef, proximityRef }) {
  const finale = useBloomStore((s) => s.finaleStarted);
  const [renderPos, setRenderPos] = useState({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5
  });
  const cursor = useMemo(
    () => ({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      tx: window.innerWidth * 0.5,
      ty: window.innerHeight * 0.5
    }),
    []
  );

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      cursor.x += (cursorRef.current.x - cursor.x) * (finale ? 0.12 : 0.18);
      cursor.y += (cursorRef.current.y - cursor.y) * (finale ? 0.12 : 0.18);
      cursor.tx += (cursorRef.current.x - cursor.tx) * 0.09;
      cursor.ty += (cursorRef.current.y - cursor.ty) * 0.09;

      const orb = document.getElementById("cursor-orb");
      const trail = document.getElementById("cursor-trail");
      if (orb && trail) {
        const scale = 1 + Math.min(0.22, (proximityRef?.current ?? 0) * 0.22);
        orb.style.transform = `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%) scale(${scale})`;
        trail.style.transform = `translate(${cursor.tx}px, ${cursor.ty}px) translate(-50%, -50%)`;
      }
      cursorRef.current.sx = cursor.x;
      cursorRef.current.sy = cursor.y;
      setRenderPos({ x: cursor.x, y: cursor.y });
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [cursor, cursorRef, finale, proximityRef]);

  return <CursorText x={renderPos.x} y={renderPos.y} />;
}
