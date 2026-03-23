import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useBloomStore, PETAL_GOAL } from "../../store/bloomStore";

const POI = {
  island: new THREE.Vector3(0, 0.92, 0),
  tree: new THREE.Vector3(-1.12, 2.05, 0.48),
  lamp: new THREE.Vector3(2.18, 1.62, -0.98),
  flowers: new THREE.Vector3(-0.14, 0.88, 1.32),
  center: new THREE.Vector3(0.35, 1.12, -0.02)
};

const COL_A = new THREE.Color("#fff6ef");
const COL_B = new THREE.Color("#ffd4c8");
const COL_C = new THREE.Color("#ffc9dd");

function blendInterest(out, pc, finale, cursorWorld, nearestVec, hasNearest) {
  out.copy(cursorWorld);
  if (finale) {
    out.lerp(POI.center, 0.92);
    return out;
  }

  const p = pc / PETAL_GOAL;

  if (pc < 4 && hasNearest) {
    out.lerp(nearestVec, 0.38);
  } else if (pc < 6) {
    out.lerp(POI.island, 0.18);
  }

  if (pc >= 5 && pc < 9) {
    out.lerp(POI.tree, 0.28 + p * 0.1);
  }
  if (pc >= 9 && pc < 13) {
    out.lerp(POI.lamp, 0.26);
  }
  if (pc >= 13 && pc < 17) {
    out.lerp(POI.flowers, 0.32);
  }
  if (pc >= 16) {
    out.lerp(POI.center, 0.35 + (pc - 16) * 0.08);
  }

  if (hasNearest && pc < 17) {
    out.lerp(nearestVec, 0.14 + (1 - p) * 0.12);
  }

  return out;
}

export default function GuideSpirit({ cursorRef, guideFocusRef }) {
  const root = useRef();
  const core = useRef();
  const midGlow = useRef();
  const outerGlow = useRef();
  const glint = useRef();
  const moteA = useRef();
  const moteB = useRef();
  const moteC = useRef();
  const pointer = useRef();
  const lightRef = useRef();

  const pos = useRef(new THREE.Vector3(0.25, 1.18, 0.55));
  const vel = useRef(new THREE.Vector3(0, 0, 0));
  const pull = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const nearest = useRef(new THREE.Vector3());
  const coreCol = useRef(new THREE.Color());
  const lightCol = useRef(new THREE.Color("#ffe8d4"));
  const lightWarm = useRef(new THREE.Color("#ffc4d8"));
  const pulseScale = useRef(1);
  const emissiveBoost = useRef(0);
  const lastPulse = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petalCount = useBloomStore((s) => s.petalCount);
  const collectPulse = useBloomStore((s) => s.collectPulse);
  const finaleStarted = useBloomStore((s) => s.finaleStarted);

  const { camera, gl } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.75), []);
  const cursorHit = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pc = petalCount;
    const warmth = Math.min(1, pc / PETAL_GOAL);
    const towardEnd = Math.min(1, Math.max(0, (pc - 14) / 6));
    const calm = finaleStarted ? 0.38 : 1 - towardEnd * 0.5;

    const cx = cursorRef.current.sx ?? cursorRef.current.x;
    const cy = cursorRef.current.sy ?? cursorRef.current.y;
    const rect = gl.domElement.getBoundingClientRect();
    ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, cursorHit);
    cursorHit.y += 0.92;

    const hasNearest = guideFocusRef?.current?.hasNearest ?? false;
    if (hasNearest && guideFocusRef?.current?.nearest) {
      nearest.current.copy(guideFocusRef.current.nearest);
    }

    blendInterest(desired.current, pc, finaleStarted, cursorHit, nearest.current, hasNearest);

    const breathe = Math.sin(t * 0.85 * calm) * 0.04 * calm;
    const drift = Math.cos(t * 0.55) * Math.sin(t * 0.31) * 0.05 * calm;
    desired.current.y += breathe;
    desired.current.x += drift;
    desired.current.z += Math.sin(t * 0.62 * calm) * 0.035 * calm;

    const spring = 5.2 - towardEnd * 1.1;
    const damp = 4.8 + towardEnd * 0.8;
    pull.current.copy(desired.current).sub(pos.current);
    vel.current.addScaledVector(pull.current, delta * spring);
    vel.current.multiplyScalar(Math.exp(-damp * delta));
    pos.current.addScaledVector(vel.current, delta);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y += delta * (0.22 * calm + warmth * 0.08);
      root.current.rotation.z = Math.sin(t * 0.4) * 0.04 * calm;
    }

    if (collectPulse !== lastPulse.current) {
      lastPulse.current = collectPulse;
      pulseScale.current = 1.12;
      emissiveBoost.current = 0.45;
    }
    pulseScale.current = THREE.MathUtils.lerp(pulseScale.current, 1, 0.1);
    emissiveBoost.current = THREE.MathUtils.lerp(emissiveBoost.current, 0, 0.08);
    const ps = pulseScale.current * (finaleStarted ? 0.96 : 1);

    coreCol.current.copy(COL_A).lerp(COL_B, warmth * 0.85).lerp(COL_C, warmth * 0.15);
    if (core.current?.material) {
      core.current.scale.setScalar(0.1 * ps);
      core.current.material.color.copy(coreCol.current);
      core.current.material.emissive.copy(coreCol.current);
      core.current.material.emissiveIntensity = 0.75 + warmth * 0.35 + emissiveBoost.current;
    }
    if (midGlow.current?.material) {
      midGlow.current.scale.setScalar(0.2 * ps);
      midGlow.current.material.opacity = 0.18 + warmth * 0.12;
      midGlow.current.material.emissiveIntensity = 0.28 + warmth * 0.2 + emissiveBoost.current * 0.4;
    }
    if (outerGlow.current?.material) {
      outerGlow.current.scale.setScalar(0.38 * ps);
      outerGlow.current.material.opacity = 0.06 + warmth * 0.06;
      outerGlow.current.material.emissiveIntensity = 0.12 + warmth * 0.1;
    }
    if (glint.current?.material) {
      glint.current.scale.setScalar(0.035 * ps);
      glint.current.material.emissiveIntensity = 1.1 + emissiveBoost.current * 0.6;
    }

    const orbit = 0.34 * (0.85 + warmth * 0.15);
    const slow = t * (0.45 + calm * 0.2);
    if (moteA.current) {
      moteA.current.position.set(Math.cos(slow) * orbit, Math.sin(slow * 1.3) * 0.08, Math.sin(slow) * orbit);
    }
    if (moteB.current) {
      moteB.current.position.set(
        Math.cos(slow + 2.1) * orbit * 0.92,
        Math.sin(slow * 1.1) * 0.06,
        Math.sin(slow + 2.1) * orbit * 0.92
      );
    }
    if (moteC.current) {
      moteC.current.position.set(
        Math.cos(slow + 4.2) * orbit * 0.78,
        -Math.sin(slow * 0.9) * 0.07,
        Math.sin(slow + 4.2) * orbit * 0.78
      );
    }

    if (lightRef.current) {
      const breath = 0.42 + Math.sin(t * 1.8 * calm) * 0.08 * calm;
      lightRef.current.intensity = breath + warmth * 0.35 + emissiveBoost.current * 0.5;
      lightCol.current.set("#ffe8d4").lerp(lightWarm.current, warmth);
      lightRef.current.color.copy(lightCol.current);
    }

    if (root.current && pointer.current) {
      root.current.getWorldPosition(dummy.position);
      dummy.lookAt(desired.current);
      pointer.current.quaternion.slerp(dummy.quaternion, 0.06 * calm + 0.05);
      const cone = pointer.current.children[0];
      const showPointer = finaleStarted ? 0.55 : 0.2 + towardEnd * 0.35 + (hasNearest ? 0.12 : 0);
      if (cone?.material) {
        cone.material.opacity = showPointer * 0.32 * calm;
      }
    }
  });

  return (
    <group ref={root}>
      <mesh ref={outerGlow}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#fff0e6"
          emissive="#ffd6c4"
          emissiveIntensity={0.12}
          transparent
          opacity={0.08}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={midGlow}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial
          color="#fff5ec"
          emissive="#ffccb8"
          emissiveIntensity={0.28}
          transparent
          opacity={0.18}
          roughness={0.75}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color="#fff6ef" emissive="#ffd4c8" emissiveIntensity={0.75} roughness={0.32} metalness={0.02} />
      </mesh>
      <mesh ref={glint}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8f2" emissiveIntensity={1.1} roughness={0.2} />
      </mesh>

      <mesh ref={moteA}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#ffeef8" emissive="#ffd0ea" emissiveIntensity={0.55} roughness={0.5} />
      </mesh>
      <mesh ref={moteB}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color="#fff6ea" emissive="#ffe0c8" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={moteC}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#f0f4ff" emissive="#d8e4ff" emissiveIntensity={0.45} roughness={0.5} />
      </mesh>

      <group ref={pointer} position={[0, 0, 0.22]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.045, 0.55, 12, 1, true]} />
          <meshStandardMaterial
            color="#ffe8dc"
            emissive="#ffc8b0"
            emissiveIntensity={0.25}
            transparent
            opacity={0.1}
            roughness={1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      <pointLight ref={lightRef} color="#ffe8d4" intensity={0.48} distance={4.2} decay={2} />
    </group>
  );
}
