import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useBloomStore } from "../../store/bloomStore";

/** Soft floating planes — drifting petals in the air after mid game. */
export default function DriftingPetals() {
  const group = useRef();
  const petalCount = useBloomStore((s) => s.petalCount);
  const seeds = useMemo(
    () =>
      [...Array(28)].map((_, i) => ({
        x: (Math.random() - 0.5) * 7,
        y: 0.5 + Math.random() * 2.2,
        z: (Math.random() - 0.5) * 7,
        s: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.35
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const show = THREE.MathUtils.smoothstep(petalCount, 12, 16);
    if (!group.current) {
      return;
    }
    group.current.visible = petalCount >= 11;
    group.current.children.forEach((mesh, i) => {
      const u = seeds[i];
      if (!u) {
        return;
      }
      mesh.position.x = u.x + Math.sin(t * u.speed + u.phase) * 0.35;
      mesh.position.y = u.y + Math.sin(t * 0.4 + i) * 0.15;
      mesh.position.z = u.z + Math.cos(t * u.speed * 0.8 + u.phase) * 0.35;
      mesh.rotation.z = t * 0.15 + i;
      if (mesh.material) {
        mesh.material.opacity = show * 0.38;
      }
    });
  });

  return (
    <group ref={group}>
      {seeds.map((u, i) => (
        <mesh key={i} position={[u.x, u.y, u.z]} rotation={[0.4, 0.2, 0]}>
          <planeGeometry args={[u.s * 2.2, u.s * 1.6]} />
          <meshStandardMaterial
            color="#ffd8ec"
            emissive="#f5a8d0"
            emissiveIntensity={0.35}
            transparent
            opacity={0}
            roughness={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
