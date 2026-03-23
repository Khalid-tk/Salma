import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { useBloomStore, PETAL_GOAL } from "../../store/bloomStore";

const BURST_GEO = new THREE.SphereGeometry(0.035, 6, 5);

const BASE_RADIUS_XZ = 0.62;
const TOUCH_RADIUS_XZ = 0.92;
const MAX_FLOATING = 18;

function isCoarsePointer() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia?.("(pointer: coarse)")?.matches ?? "ontouchstart" in window;
}

function makePetalMaterial() {
  return new THREE.MeshStandardMaterial({
    color: "#ffd6ea",
    emissive: "#ffb8d9",
    emissiveIntensity: 0.55,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 1
  });
}

/** Horizontal distance from petal to cursor ground point (petals float above y). */
function distXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function burstCountFor(n) {
  if ([3, 6, 10, 15, 20].includes(n)) {
    return 48;
  }
  if ([5, 8, 12, 16, 18].includes(n)) {
    return 34;
  }
  if (n > 0 && n % 4 === 0) {
    return 26;
  }
  return 16;
}

export default function PetalField({ cursorRef, proximityRef, windRef, guideFocusRef }) {
  const group = useRef();
  const petalMeshes = useRef([]);
  const burstDone = useRef(false);
  const finaleRun = useRef(false);
  const collectRadiusRef = useRef(BASE_RADIUS_XZ);
  const bursts = useRef([]);

  const burstSpawned = useBloomStore((s) => s.burstSpawned);
  const finaleStarted = useBloomStore((s) => s.finaleStarted);
  const startFinaleDialogue = useBloomStore((s) => s.startFinaleDialogue);

  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.75), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    collectRadiusRef.current = isCoarsePointer() ? TOUCH_RADIUS_XZ : BASE_RADIUS_XZ;
  }, []);

  const spawnPetal = (angleOffset = 0) => {
    if (!group.current) {
      return;
    }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), makePetalMaterial());
    const r = 0.85 + Math.random() * 2.3;
    const a = Math.random() * Math.PI * 2 + angleOffset;
    mesh.position.set(Math.cos(a) * r, 0.65 + Math.random() * 0.85, Math.sin(a) * r);
    mesh.userData = {
      phase: Math.random() * Math.PI * 2,
      speed: 0.32 + Math.random() * 0.38,
      base: mesh.position.clone(),
      swirl: (Math.random() - 0.5) * 0.2
    };
    group.current.add(mesh);
    petalMeshes.current.push(mesh);
  };

  useEffect(() => {
    for (let i = 0; i < 2; i += 1) {
      spawnPetal(i * 0.4);
    }
    const guideT = window.setTimeout(() => {
      useBloomStore.getState().guideFirstPetals();
    }, 3200);
    return () => window.clearTimeout(guideT);
  }, []);

  const addCollectBurst = (origin, count = 16) => {
    if (!group.current) {
      return;
    }
    for (let i = 0; i < count; i += 1) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.92 + Math.random() * 0.06, 0.55, 0.75),
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(BURST_GEO, mat);
      mesh.position.copy(origin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.4 + Math.random() * 0.5;
      const vel = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.5 + 0.3, Math.sin(phi) * Math.sin(theta)).multiplyScalar(speed * 0.06);
      bursts.current.push({ mesh, vel, life: 1 });
      group.current.add(mesh);
    }
  };

  useEffect(() => {
    if (!burstSpawned || burstDone.current) {
      return;
    }
    burstDone.current = true;
    for (let i = 0; i < 10; i += 1) {
      spawnPetal(i * 0.55);
    }
  }, [burstSpawned]);

  useFrame((state, delta) => {
    const store = useBloomStore.getState();
    if (store.finaleStarted) {
      if (guideFocusRef?.current) {
        guideFocusRef.current.hasNearest = false;
      }
      return;
    }

    bursts.current = bursts.current.filter((b) => {
      b.life -= delta * 1.35;
      b.mesh.position.addScaledVector(b.vel, delta * 14);
      b.mesh.material.opacity = Math.max(0, b.life);
      if (b.life <= 0) {
        group.current?.remove(b.mesh);
        b.mesh.material.dispose();
        return false;
      }
      return true;
    });

    const pc = store.petalCount;
    if (pc >= 8 && pc < PETAL_GOAL) {
      windRef.current = THREE.MathUtils.lerp(windRef.current, 0.3, 0.02);
    }
    if (pc >= 12) {
      windRef.current = THREE.MathUtils.lerp(windRef.current, 0.4, 0.015);
    }

    const cx = cursorRef.current.sx ?? cursorRef.current.x;
    const cy = cursorRef.current.sy ?? cursorRef.current.y;
    const rect = gl.domElement.getBoundingClientRect();
    const nx = ((cx - rect.left) / rect.width) * 2 - 1;
    const ny = -((cy - rect.top) / rect.height) * 2 + 1;
    ndc.set(nx, ny);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, target);

    const wind = windRef.current;
    const t = state.clock.elapsedTime;
    let nearest = 1;

    for (let i = 0; i < petalMeshes.current.length; i += 1) {
      const mesh = petalMeshes.current[i];
      if (!mesh.parent) {
        continue;
      }
      const u = mesh.userData;
      u.phase += delta * u.speed;
      const wobble = Math.sin(u.phase) * 0.08 + Math.cos(u.phase * 0.7) * 0.05;
      mesh.position.y = u.base.y + wobble;
      mesh.position.x = u.base.x + Math.sin(u.phase * 0.6) * 0.12 + wind * Math.sin(t * 0.9 + u.swirl);
      mesh.position.z = u.base.z + Math.cos(u.phase * 0.5) * 0.12 + wind * Math.cos(t * 0.75 + u.swirl);

      const d = distXZ(mesh.position, target);
      nearest = Math.min(nearest, d / 2.8);
    }

    if (guideFocusRef?.current) {
      const list = petalMeshes.current;
      if (list.length === 0) {
        guideFocusRef.current.hasNearest = false;
      } else {
        let best = list[0].position;
        let bestD = distXZ(best, target);
        for (let j = 1; j < list.length; j += 1) {
          const d = distXZ(list[j].position, target);
          if (d < bestD) {
            bestD = d;
            best = list[j].position;
          }
        }
        guideFocusRef.current.nearest.copy(best);
        guideFocusRef.current.hasNearest = true;
      }
    }

    proximityRef.current = THREE.MathUtils.clamp(1 - nearest, 0, 1);

    const rCollect = collectRadiusRef.current;

    if (pc < PETAL_GOAL) {
      for (let i = 0; i < petalMeshes.current.length; i += 1) {
        const mesh = petalMeshes.current[i];
        const d = distXZ(mesh.position, target);
        if (d < rCollect) {
          store.onCollectPetal();
          const n = useBloomStore.getState().petalCount;
          addCollectBurst(mesh.position, burstCountFor(n));
          gsap.to(mesh.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.32, ease: "power2.in" });
          gsap.to(mesh.material, {
            opacity: 0,
            duration: 0.32,
            ease: "power2.in",
            onComplete: () => {
              group.current?.remove(mesh);
              mesh.geometry.dispose();
              mesh.material.dispose();
            }
          });
          petalMeshes.current.splice(i, 1);
          break;
        }
      }
    }

    if (pc < PETAL_GOAL && petalMeshes.current.length < MAX_FLOATING) {
      const rate = pc > 12 ? 0.038 : pc > 6 ? 0.022 : 0.012;
      if (Math.random() < rate) {
        spawnPetal();
      }
    }
  });

  useLayoutEffect(() => {
    if (!finaleStarted || finaleRun.current) {
      return;
    }
    finaleRun.current = true;

    const safety = window.setTimeout(() => {
      startFinaleDialogue();
    }, 4500);

    petalMeshes.current.forEach((mesh) => {
      group.current?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    petalMeshes.current = [];

    const holder = new THREE.Group();
    holder.position.set(0, 1.05, 0);
    group.current?.add(holder);

    const stems = [];
    for (let i = 0; i < PETAL_GOAL; i += 1) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), makePetalMaterial());
      m.material.emissiveIntensity = 0.65;
      const a = (i / PETAL_GOAL) * Math.PI * 2;
      m.position.set(Math.cos(a) * 2.2, 0.55 + Math.random() * 0.85, Math.sin(a) * 2.2);
      holder.add(m);
      stems.push(m);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        window.clearTimeout(safety);
        startFinaleDialogue();
        gsap.to(holder.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 2.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
    });

    stems.forEach((mesh, i) => {
      const angle = (i / PETAL_GOAL) * Math.PI * 2;
      const tx = Math.cos(angle) * 0.24;
      const tz = Math.sin(angle) * 0.24;
      const ty = 0.12 + (i % 4) * 0.045;
      tl.to(mesh.position, { x: tx, y: ty, z: tz, duration: 2.5, ease: "power3.inOut", delay: i * 0.012 }, 0);
    });
  }, [finaleStarted, startFinaleDialogue]);

  return <group ref={group} />;
}
