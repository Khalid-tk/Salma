import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import GuideSpirit from "../guide/GuideSpirit";
import PetalField from "../petals/PetalField";
import CameraRig from "./CameraRig";
import DriftingPetals from "./DriftingPetals";
import LightingEnvironment from "./LightingEnvironment";
import { STAGE, useBloomStore } from "../../store/bloomStore";

const COL_GRASS_A = new THREE.Color("#3d5c40");
const COL_GRASS_B = new THREE.Color("#6dad72");
const COL_ISLAND_A = new THREE.Color("#151922");
const COL_ISLAND_B = new THREE.Color("#252e38");

function makeGuideFocusRef() {
  return {
    nearest: new THREE.Vector3(),
    hasNearest: false
  };
}

function GrassClump({ position, rot }) {
  return (
    <group position={position} rotation={rot}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.04 - 0.04, 0.12 + i * 0.02, 0]} castShadow>
          <coneGeometry args={[0.06, 0.22, 5]} />
          <meshStandardMaterial color="#5d8a5f" emissive="#2a3d2c" emissiveIntensity={0.08} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

export default function WorldScene({ cursorRef, proximityRef, windRef, finaleActive }) {
  const group = useRef();
  const lampLight = useRef();
  const crown = useRef();
  const grassMat = useRef();
  const flowers = useRef();
  const centerRing = useRef();
  const centerPad = useRef();
  const grassClumpsRef = useRef();
  const islandMesh = useRef();
  const ambientRef = useRef();
  const directionalRef = useRef();
  const guideFocusRef = useRef(makeGuideFocusRef());

  const petalCount = useBloomStore((s) => s.petalCount);
  const worldPulse = useBloomStore((s) => s.worldPulse);

  const progress = useMemo(() => Math.min(1, petalCount / STAGE.full), [petalCount]);

  const bgDim = useMemo(() => new THREE.Color("#0a0c12"), []);
  const bgWarm = useMemo(() => new THREE.Color("#1a2230"), []);

  const grassClumpPositions = useMemo(
    () =>
      [
        [1.1, 0.28, 0.9],
        [-0.8, 0.28, 1.2],
        [0.3, 0.28, -1.4],
        [-1.5, 0.28, -0.5],
        [1.6, 0.28, -0.9],
        [0, 0.28, 1.8],
        [-0.4, 0.28, -1.9],
        [1.9, 0.28, 0.4]
      ].map(([x, y, z], i) => ({
        pos: [x, y, z],
        rot: [0, (i / 8) * Math.PI * 2, 0]
      })),
    []
  );

  useFrame((state) => {
    const pulse = worldPulse;
    const pc = petalCount;
    const speed = 0.055 + pulse * 0.14;

    const grassShow = THREE.MathUtils.smoothstep(pc, 0.5, 3.8);
    if (grassMat.current) {
      grassMat.current.opacity = THREE.MathUtils.lerp(grassMat.current.opacity, grassShow * 0.98, speed);
      grassMat.current.color.lerpColors(COL_GRASS_A, COL_GRASS_B, grassShow);
      grassMat.current.emissive.set("#1a3020");
      grassMat.current.emissiveIntensity = 0.04 + grassShow * 0.22 + pulse * 0.15;
    }

    const treeGrow = THREE.MathUtils.smoothstep(pc, 4.5, 8);
    if (crown.current) {
      const s = THREE.MathUtils.lerp(0.04, 1, treeGrow);
      crown.current.scale.setScalar(THREE.MathUtils.lerp(crown.current.scale.x, s, speed));
      const mat = crown.current.material;
      if (mat) {
        mat.emissiveIntensity = 0.05 + treeGrow * 0.28 + pulse * 0.12;
      }
    }

    const flowerShow = THREE.MathUtils.smoothstep(pc, 12.5, 16);
    if (flowers.current) {
      const fs = THREE.MathUtils.lerp(0.02, 1, flowerShow);
      flowers.current.scale.setScalar(THREE.MathUtils.lerp(flowers.current.scale.x, fs, speed));
      flowers.current.children.forEach((ch) => {
        if (ch.material) {
          ch.material.emissiveIntensity = 0.12 + flowerShow * 0.45 + pulse * 0.1;
        }
      });
    }

    const ringShow = THREE.MathUtils.smoothstep(pc, 13.5, 19);
    if (centerRing.current?.material) {
      centerRing.current.material.opacity = THREE.MathUtils.lerp(centerRing.current.material.opacity, ringShow * 0.72, speed);
      centerRing.current.material.emissiveIntensity = 0.18 + ringShow * 0.55 + pulse * 0.2;
    }
    if (centerPad.current?.material) {
      centerPad.current.material.emissiveIntensity = 0.06 + ringShow * 0.35 + pulse * 0.15;
    }

    const clumpT = THREE.MathUtils.smoothstep(pc, 1.5, 4.5);
    if (grassClumpsRef.current) {
      const sc = 0.1 + clumpT * 0.95 + pulse * 0.06;
      grassClumpsRef.current.scale.setScalar(THREE.MathUtils.lerp(grassClumpsRef.current.scale.x, sc, speed));
    }

    if (islandMesh.current?.material) {
      const m = islandMesh.current.material;
      const islandWarm = THREE.MathUtils.smoothstep(pc, 2, 14);
      m.color.lerpColors(COL_ISLAND_A, COL_ISLAND_B, islandWarm);
      m.emissive.set("#0a0d12");
      m.emissiveIntensity = 0.02 + islandWarm * 0.12 + pulse * 0.08;
    }

    const sky = THREE.MathUtils.smoothstep(pc, 0, 18) + pulse * 0.08;
    if (state.scene.background) {
      state.scene.background.lerpColors(bgDim, bgWarm, Math.min(1, sky * 0.85));
    }
  });

  return (
    <group ref={group}>
      <LightingEnvironment ambientRef={ambientRef} directionalRef={directionalRef} lampRef={lampLight} />

      <color attach="background" args={["#0c0e14"]} />
      <fog attach="fog" args={["#161a24", 6, 22]} />

      <ambientLight ref={ambientRef} intensity={0.05} color="#b8c4e8" />
      <directionalLight
        ref={directionalRef}
        position={[6, 9, 4]}
        intensity={0.08}
        color="#d4ddff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.00025}
      />

      <pointLight ref={lampLight} position={[2.15, 1.7, -0.95]} intensity={0} distance={12} decay={2} color="#ffc8a0" />

      <CameraRig cursorRef={cursorRef} finaleActive={finaleActive} />

      <GuideSpirit cursorRef={cursorRef} guideFocusRef={guideFocusRef} />

      <Float speed={0.45} rotationIntensity={0.04} floatIntensity={0.12}>
        <mesh ref={islandMesh} position={[0, -0.46, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.4, 5, 1.35, 36]} />
          <meshStandardMaterial color="#151922" emissive="#000000" emissiveIntensity={0.02} roughness={0.88} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4.05, 40]} />
          <meshStandardMaterial
            ref={grassMat}
            color="#4a6b4e"
            emissive="#1a3020"
            emissiveIntensity={0.04}
            roughness={0.62}
            transparent
            opacity={0}
          />
        </mesh>
      </Float>

      <group ref={grassClumpsRef} scale={0.12}>
        {grassClumpPositions.map(({ pos, rot }, i) => (
          <GrassClump key={i} position={pos} rot={rot} />
        ))}
      </group>

      <group position={[-1.15, 0.16, 0.45]}>
        <mesh castShadow position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.26, 0.34, 1.75, 12]} />
          <meshStandardMaterial color="#4a3a32" roughness={0.85} />
        </mesh>
        <mesh ref={crown} position={[0, 2.25, 0]} castShadow scale={[0.04, 0.04, 0.04]}>
          <sphereGeometry args={[1.1, 20, 16]} />
          <meshStandardMaterial color="#7aab78" roughness={0.55} />
        </mesh>
      </group>

      <group position={[2.2, 0.18, -1]}>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 1.15, 12]} />
          <meshStandardMaterial color="#5c4a45" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.52, 0]}>
          <sphereGeometry args={[0.16, 14, 10]} />
          <meshStandardMaterial color="#ffd4ab" emissive="#ffbe84" emissiveIntensity={0.12} />
        </mesh>
      </group>

      <mesh position={[1.15, 0.54, 1.65]} castShadow>
        <dodecahedronGeometry args={[0.44, 0]} />
        <meshStandardMaterial color="#6f7078" roughness={0.82} />
      </mesh>

      <group position={[-1.4, 0.12, -1.65]}>
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[1.45, 0.11, 0.42]} />
          <meshStandardMaterial color="#6a5544" roughness={0.78} />
        </mesh>
        <mesh position={[-0.58, 0.39, 0]}>
          <boxGeometry args={[0.09, 0.45, 0.09]} />
          <meshStandardMaterial color="#5a4638" roughness={0.8} />
        </mesh>
        <mesh position={[0.58, 0.39, 0]}>
          <boxGeometry args={[0.09, 0.45, 0.09]} />
          <meshStandardMaterial color="#5a4638" roughness={0.8} />
        </mesh>
      </group>

      <group ref={flowers} position={[-0.15, 0.24, 1.3]} scale={[0.02, 0.02, 0.02]}>
        {[...Array(7)].map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 7) * Math.PI * 2) * 0.32, 0.32 + (i % 2) * 0.05, Math.sin((i / 7) * Math.PI * 2) * 0.28]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#e8c6df" emissive="#f2b9dc" emissiveIntensity={0.18} />
          </mesh>
        ))}
      </group>

      <mesh ref={centerPad} position={[0.35, 0.4, -0.02]} receiveShadow>
        <cylinderGeometry args={[0.38, 0.45, 0.2, 22]} />
        <meshStandardMaterial color="#4a3f38" emissive="#2a221c" emissiveIntensity={0.06} roughness={0.85} />
      </mesh>
      <mesh ref={centerRing} rotation={[-Math.PI / 2, 0, 0]} position={[0.35, 0.52, -0.02]}>
        <ringGeometry args={[0.42, 0.52, 40]} />
        <meshStandardMaterial
          color="#ffd4b8"
          emissive="#ffb088"
          emissiveIntensity={0.15}
          transparent
          opacity={0}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Sparkles
        count={28 + Math.floor(progress * 72) + Math.floor(worldPulse * 45)}
        speed={0.14 + progress * 0.14 + worldPulse * 0.1}
        size={1.45 + progress * 0.35 + worldPulse * 0.4}
        scale={[8, 3.2, 8]}
        color="#f6ead8"
        opacity={0.22 + progress * 0.48 + worldPulse * 0.35}
      />

      <DriftingPetals />

      <PetalField cursorRef={cursorRef} proximityRef={proximityRef} windRef={windRef} guideFocusRef={guideFocusRef} />
    </group>
  );
}
