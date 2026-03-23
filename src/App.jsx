import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import CursorSystem from "./components/cursor/CursorSystem";
import ProgressHint from "./components/dialogue/ProgressHint";
import WorldScene from "./components/scene/WorldScene";
import { useCursorTracking } from "./hooks/useCursorTracking";
import { useBloomStore } from "./store/bloomStore";

export default function App() {
  const cursorRef = useRef({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    sx: window.innerWidth * 0.5,
    sy: window.innerHeight * 0.5
  });
  const proximityRef = useRef(0);
  const windRef = useRef(0);

  const startIntro = useBloomStore((s) => s.startIntro);
  const registerMove = useBloomStore((s) => s.registerMove);
  const finaleStarted = useBloomStore((s) => s.finaleStarted);
  const petalCount = useBloomStore((s) => s.petalCount);
  const worldPulse = useBloomStore((s) => s.worldPulse);

  /** Cap pixel ratio on touch devices for smoother mobile performance */
  const [maxDpr, setMaxDpr] = useState(2);

  useEffect(() => {
    const compute = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const r = window.devicePixelRatio || 1;
      setMaxDpr(Math.min(coarse ? 1.65 : 2, r));
    };
    compute();
    window.addEventListener("resize", compute);
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener("change", compute);
    return () => {
      window.removeEventListener("resize", compute);
      mq.removeEventListener("change", compute);
    };
  }, []);

  useCursorTracking((x, y) => {
    cursorRef.current.x = x;
    cursorRef.current.y = y;
    registerMove();
  });

  useEffect(() => {
    startIntro();
  }, [startIntro]);

  useEffect(() => {
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const touch = coarse ?? "ontouchstart" in window;
    document.body.classList.toggle("is-touch", Boolean(touch));
    return () => document.body.classList.remove("is-touch");
  }, []);

  const bloomConfig = useMemo(
    () => ({
      luminanceThreshold: 0.62 - Math.min(0.08, petalCount * 0.003 + worldPulse * 0.04),
      luminanceSmoothing: 0.32,
      intensity: 0.22 + Math.min(0.26, petalCount * 0.014) + worldPulse * 0.55
    }),
    [petalCount, worldPulse]
  );

  return (
    <div className="experience">
      <Canvas
        shadows="percentage"
        dpr={[1, maxDpr]}
        camera={{ fov: 42, position: [0.35, 3.45, 7.9] }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <WorldScene cursorRef={cursorRef} proximityRef={proximityRef} windRef={windRef} finaleActive={finaleStarted} />
        <EffectComposer>
          <Bloom
            intensity={finaleStarted ? bloomConfig.intensity * 0.85 : bloomConfig.intensity}
            luminanceThreshold={bloomConfig.luminanceThreshold}
            luminanceSmoothing={bloomConfig.luminanceSmoothing}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
      <ProgressHint />
      <div id="cursor-orb" />
      <div id="cursor-trail" />
      <CursorSystem cursorRef={cursorRef} proximityRef={proximityRef} />
    </div>
  );
}
