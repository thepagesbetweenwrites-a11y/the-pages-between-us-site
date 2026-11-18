import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "../lib/motion";
import { mapleTexture } from "../lib/textures";

interface Leaf {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
  phase: number;
}

const COLORS = ["#b8321f", "#c9481c", "#d76a22", "#e08b2c", "#a8261c", "#D4A359"];

// Autumn maple leaves that fall through the camera's neighbourhood and get
// caught in a vortex around the cursor; scroll momentum blows them past.
export function MapleLeaves({ count = 110 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const camera = useThree((s) => s.camera);
  const texture = useMemo(() => mapleTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(
    () => ({ cursor: new THREE.Vector3(), dir: new THREE.Vector3(), d: new THREE.Vector3(), color: new THREE.Color() }),
    [],
  );

  const leaves = useMemo<Leaf[]>(
    () =>
      Array.from({ length: count }, () => ({
        pos: new THREE.Vector3((Math.random() - 0.5) * 18, Math.random() * 12 - 4, 6 - Math.random() * 22),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
        scale: 0.16 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    leaves.forEach((_, i) => m.setColorAt(i, tmp.color.set(COLORS[i % COLORS.length])));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [leaves, tmp]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const camZ = camera.position.z;

    // Cursor projected onto a plane ~6 units in front of the camera.
    tmp.dir.set(motion.pointer.x, motion.pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    tmp.cursor.copy(camera.position).addScaledVector(tmp.dir, 6);
    const pv = Math.hypot(motion.pointerVel.x, motion.pointerVel.y);
    const scrollPush = THREE.MathUtils.clamp(motion.velocity / 25, -2.5, 2.5);

    leaves.forEach((l, i) => {
      // Gravity + flutter.
      l.vel.y += (-0.35 - l.vel.y) * dt * 0.8;
      l.vel.x += Math.sin(t * 0.9 + l.phase) * dt * 0.6;
      l.vel.z += Math.cos(t * 0.7 + l.phase) * dt * 0.3;

      // Cursor vortex: swirl around the cursor axis, stronger with speed.
      tmp.d.subVectors(l.pos, tmp.cursor);
      const dist = tmp.d.length();
      if (dist < 4.5) {
        const f = (1 - dist / 4.5) * (0.6 + Math.min(pv, 6) * 0.9);
        l.vel.x += (-tmp.d.y * 1.4 + motion.pointerVel.x * 0.5) * f * dt;
        l.vel.y += (tmp.d.x * 1.4 + motion.pointerVel.y * 0.5) * f * dt;
        l.vel.z += (Math.sin(t + l.phase) * 0.6) * f * dt;
      }
      // Scroll momentum blows leaves toward / past the camera.
      l.vel.z += scrollPush * dt * 1.6;
      l.vel.multiplyScalar(1 - dt * 0.6);
      l.pos.addScaledVector(l.vel, dt);

      const spinBoost = 1 + Math.min(pv, 5) * 0.2 + Math.abs(scrollPush) * 0.3;
      l.rot.x += l.spin.x * dt * spinBoost;
      l.rot.y += l.spin.y * dt * spinBoost;
      l.rot.z += l.spin.z * dt * spinBoost;

      // Recycle leaves around the camera so the fall never ends.
      const relZ = l.pos.z - camZ;
      if (l.pos.y < -7 || relZ > 3 || relZ < -24 || Math.abs(l.pos.x) > 13) {
        l.pos.set((Math.random() - 0.5) * 18, 6 + Math.random() * 3, camZ - 2 - Math.random() * 20);
        l.vel.set(0, 0, 0);
      }
      dummy.position.copy(l.pos);
      dummy.rotation.copy(l.rot);
      dummy.scale.setScalar(l.scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={texture}
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0}
        emissive={"#3a1408"}
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}
