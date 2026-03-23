import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useBloomStore } from "../../store/bloomStore";

/**
 * Smooth lighting progression — avoids sudden shadow / lamp pop-in.
 */
export default function LightingEnvironment({ ambientRef, directionalRef, lampRef }) {
  const lampRampStart = useRef(null);
  const fogColorA = useRef(new THREE.Color("#161a24"));
  const fogColorB = useRef(new THREE.Color("#283246"));

  useFrame((state) => {
    const { petalCount: pc, worldPulse } = useBloomStore.getState();
    const p = Math.min(1, pc / 20);
    const boost = 1 + worldPulse * 0.55;
    const { clock } = state;
    const { scene } = state;

    if (ambientRef.current) {
      const targetAmb = (0.05 + p * 0.34) * boost;
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetAmb, 0.05 + worldPulse * 0.08);
    }

    if (directionalRef.current) {
      const targetDir = (0.08 + p * 0.48) * boost;
      directionalRef.current.intensity = THREE.MathUtils.lerp(directionalRef.current.intensity, targetDir, 0.04 + worldPulse * 0.06);
    }

    if (lampRef.current) {
      if (pc >= 10) {
        if (lampRampStart.current === null) {
          lampRampStart.current = clock.elapsedTime;
        }
        const t = Math.min(1, (clock.elapsedTime - lampRampStart.current) / 1.9);
        const ease = t * t * (3 - 2 * t);
        const target = ease * 1.38 * (1 + worldPulse * 0.25);
        lampRef.current.intensity = THREE.MathUtils.lerp(lampRef.current.intensity, target, 0.07 + worldPulse * 0.1);
      } else {
        lampRampStart.current = null;
        lampRef.current.intensity = THREE.MathUtils.lerp(lampRef.current.intensity, 0, 0.05);
      }
    }

    if (scene.fog?.color) {
      const fogP = Math.min(1, p + worldPulse * 0.15);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 5 + fogP * 2.2, 0.04 + worldPulse * 0.04);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 14 + fogP * 7.5, 0.04 + worldPulse * 0.04);
      scene.fog.color.lerpColors(fogColorA.current, fogColorB.current, fogP * 0.88);
    }

    useBloomStore.getState().decayWorldPulse(0.935);
  });

  return null;
}
