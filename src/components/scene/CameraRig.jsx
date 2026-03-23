import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useBloomStore } from "../../store/bloomStore";

export default function CameraRig({ cursorRef, finaleActive }) {
  const { camera } = useThree();
  const base = useMemo(() => ({ x: 0.35, y: 3.45, z: 7.9 }), []);
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const milestoneBump = useRef(0);
  const lastPetalCount = useRef(0);

  useFrame((state) => {
    const cx = cursorRef.current.sx ?? cursorRef.current.x;
    const cy = cursorRef.current.sy ?? cursorRef.current.y;
    const nx = (cx / window.innerWidth) * 2 - 1;
    const ny = (cy / window.innerHeight) * 2 - 1;
    const driftX = Math.sin(state.clock.elapsedTime * 0.2) * 0.06;
    const driftY = Math.cos(state.clock.elapsedTime * 0.16) * 0.04;

    const pc = useBloomStore.getState().petalCount;
    const prev = lastPetalCount.current;
    if (pc > prev && [3, 6, 10, 15].includes(pc)) {
      milestoneBump.current = 0.28;
    }
    lastPetalCount.current = pc;

    milestoneBump.current = THREE.MathUtils.lerp(milestoneBump.current, 0, 0.04);

    const parallaxX = finaleActive ? 0.06 : nx * 0.14;
    const parallaxY = finaleActive ? 3.02 : base.y + ny * 0.1;
    const targetZ = finaleActive ? 6.05 : base.z - milestoneBump.current * 0.6;

    camera.position.x += (parallaxX + driftX - camera.position.x) * 0.03;
    camera.position.y += (parallaxY + driftY - camera.position.y) * 0.03;
    camera.position.z += (targetZ - camera.position.z) * 0.025;

    look.current.set(0, finaleActive ? 1.05 : 1, 0);
    camera.lookAt(look.current);
  });

  return null;
}
