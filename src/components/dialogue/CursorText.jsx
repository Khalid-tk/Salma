import { useEffect, useState } from "react";
import { useBloomStore } from "../../store/bloomStore";

export default function CursorText({ x, y }) {
  const text = useBloomStore((s) => s.text);
  const [visible, setVisible] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    setVisible(Boolean(text));
  }, [text]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const ox = coarsePointer ? 20 : 16;
  const oy = coarsePointer ? -14 : -10;

  return (
    <div className={`cursor-text ${visible ? "show" : ""}`} style={{ transform: `translate(${x + ox}px, ${y + oy}px)` }}>
      {text}
    </div>
  );
}
