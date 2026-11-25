import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { motion } from "../lib/motion";
import { backMaps, coverMaps, endpaper, pageEdge, shadowTexture, spineMaps, titlePage } from "../lib/bookTextures";

// A cloth-bound hardcover: linen boards with gold-foil embossing, a cream page
// block, and a front board hinged at the spine so it can swing open.
const W = 2; // board width
const H = 3; // board height
const B = 0.07; // board thickness
const T = 0.5; // total thickness
const ZF = T / 2 - B / 2; // front board centre (z)
const BASE_Y = -0.42; // resting turn: shows the fore-edge of the page block
const OPEN_SECONDS = 1.7;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Image-based lighting from three's procedural room (no HDR download). */
function LocalEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Book({ epigraph, openSignal, onOpened }: { epigraph: string; openSignal: number; onOpened: () => void }) {
  const group = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const anim = useRef({ opening: false, t: 0, fired: false, hover: 0, lift: 0 });
  const [hovered, setHovered] = useState(false);

  const mats = useMemo(() => {
    const cover = coverMaps();
    const spine = spineMaps();
    const back = backMaps();
    const cloth = (m: ReturnType<typeof coverMaps>) =>
      new THREE.MeshStandardMaterial({
        map: m.map,
        roughnessMap: m.roughnessMap,
        metalnessMap: m.metalnessMap,
        bumpMap: m.bumpMap,
        bumpScale: 2.2,
        roughness: 1,
        metalness: 1,
        envMapIntensity: 0.9,
      });
    const plain = cloth(back);
    const edgeAcross = new THREE.MeshStandardMaterial({ map: pageEdge(true), roughness: 0.9 });
    const edgeAlong = new THREE.MeshStandardMaterial({ map: pageEdge(false), roughness: 0.9 });
    const cream = new THREE.MeshStandardMaterial({ color: "#e9dcbf", roughness: 0.95 });
    const first = new THREE.MeshStandardMaterial({ map: titlePage(epigraph), roughness: 0.92 });
    const ends = new THREE.MeshStandardMaterial({ map: endpaper(), roughness: 0.85 });
    const shadow = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 });
    return {
      // BoxGeometry face order: +x, -x, +y, -y, +z, -z
      front: [plain, plain, plain, plain, cloth(cover), ends],
      back: [plain, plain, plain, plain, ends, plain],
      spine: [plain, cloth(spine), plain, plain, plain, plain],
      pages: [edgeAcross, cream, edgeAlong, edgeAlong, first, cream],
      shadow,
    };
  }, [epigraph]);

  // Free GPU textures when the Desk unmounts.
  useEffect(
    () => () => {
      const seen = new Set<THREE.Material>();
      [...mats.front, ...mats.back, ...mats.spine, ...mats.pages, mats.shadow].forEach((m) => {
        if (seen.has(m)) return;
        seen.add(m);
        Object.values(m).forEach((v) => v instanceof THREE.Texture && v.dispose());
        m.dispose();
      });
    },
    [mats],
  );

  useEffect(() => {
    if (openSignal > 0 && !anim.current.opening) {
      anim.current.opening = true;
      if (motion.reducedMotion) onOpened();
    }
  }, [openSignal, onOpened]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const g = group.current;
    const h = hinge.current;
    if (!g || !h) return;
    const a = anim.current;
    const k = 1 - Math.pow(0.004, delta);
    a.hover += ((hovered ? 1 : 0) - a.hover) * k;
    if (a.opening) {
      a.t = Math.min(1, a.t + delta / OPEN_SECONDS);
      const e = ease(a.t);
      // Turn to face us, swing the board open, and dolly into the first page.
      g.rotation.y += (0 - g.rotation.y) * k * 1.4;
      g.rotation.x += (0 - g.rotation.x) * k * 1.4;
      g.position.y += (0 - g.position.y) * k;
      h.rotation.y = -e * 2.55;
      camera.position.set(THREE.MathUtils.lerp(0, 0.35, e), 0, THREE.MathUtils.lerp(7.2, 1.25, ease(Math.max(0, (a.t - 0.25) / 0.75))));
      camera.lookAt(0.35 * e, 0, 0);
      if (a.t > 0.62 && !a.fired) {
        a.fired = true;
        onOpened();
      }
      return;
    }
    const time = state.clock.elapsedTime;
    const px = motion.pointer.x;
    const py = motion.pointer.y;
    const ry = BASE_Y + px * (0.32 + a.hover * 0.12);
    const rx = 0.06 - py * (0.16 + a.hover * 0.06);
    g.rotation.y += (ry - g.rotation.y) * k;
    g.rotation.x += (rx - g.rotation.x) * k;
    g.position.y = Math.sin(time * 0.8) * 0.05 + a.hover * 0.06;
    // A hint of the board lifting when hovered.
    h.rotation.y = -a.hover * 0.12;
  });

  return (
    <>
      <group
        ref={group}
        rotation={[0.06, BASE_Y, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Back board */}
        <mesh position={[0, 0, -ZF]} material={mats.back}>
          <boxGeometry args={[W, H, B]} />
        </mesh>
        {/* Spine */}
        <mesh position={[-W / 2 - B / 2, 0, 0]} material={mats.spine}>
          <boxGeometry args={[B, H, T]} />
        </mesh>
        {/* Page block (recessed from the board edges) */}
        <mesh position={[-0.03, 0, 0]} material={mats.pages}>
          <boxGeometry args={[W - 0.06, H - 0.08, T - 2 * B - 0.004]} />
        </mesh>
        {/* Front board, hinged at the spine */}
        <group ref={hinge} position={[-W / 2, 0, ZF]}>
          <mesh position={[W / 2, 0, 0]} material={mats.front}>
            <boxGeometry args={[W, H, B]} />
          </mesh>
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, -1.72, 0]} material={mats.shadow}>
        <planeGeometry args={[3.4, 1.4]} />
      </mesh>
    </>
  );
}

export function HardcoverBook({
  epigraph,
  openSignal,
  onOpen,
  onOpened,
}: {
  epigraph: string;
  openSignal: number;
  onOpen: () => void;
  onOpened: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Pause rendering while the book is scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="book3d" ref={wrap}>
      <Canvas
        dpr={[1, 2]}
        frameloop={inView || openSignal > 0 ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "default" }}
        camera={{ fov: 32, near: 0.1, far: 40, position: [0, 0, 7.2] }}
        onPointerMissed={() => undefined}
      >
        <LocalEnvironment />
        <ambientLight intensity={0.18} color="#ffe2bd" />
        {/* The desk lamp: warm key from the upper left, matching the beam behind. */}
        <spotLight position={[-4.5, 5, 5]} angle={0.5} penumbra={0.8} intensity={140} color="#ffc27a" decay={2} />
        <pointLight position={[3.5, -1, 3]} intensity={6} color="#8fa3b8" />
        <group onClick={(e) => (e.stopPropagation(), onOpen())}>
          <Book epigraph={epigraph} openSignal={openSignal} onOpened={onOpened} />
        </group>
      </Canvas>
    </div>
  );
}
