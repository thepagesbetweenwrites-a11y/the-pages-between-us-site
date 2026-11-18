import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { FluidBackground } from "./FluidBackground";
import { DustMotes } from "./DustMotes";
import { MapleLeaves } from "./MapleLeaves";
import { InkText } from "./InkText";
import { Artifact } from "./Artifact";
import { motion } from "../lib/motion";
import { useUI } from "../lib/store";
import { calligraphyTexture, epigraphTexture, letterTexture, noteTexture, ticketTexture } from "../lib/textures";
import { chapters } from "../data/chapters";
import type { InkState } from "../components/InkTransition";

export const CAMERA_START = 6;
export const CAMERA_END = -50;

// Journey stations along -z (the camera flies from CAMERA_START to CAMERA_END).
export const STATIONS = {
  calligraphy: -6,
  kana: -11,
  epigraph: -19,
  ticket: -27,
  note: -34,
  letter: -41,
};

function CameraRig() {
  const camera = useThree((s) => s.camera);
  const inspect = useUI((s) => s.inspect);
  const look = useRef(new THREE.Vector3(0, 0, -10));
  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.02, delta);
    const z = THREE.MathUtils.lerp(CAMERA_START, CAMERA_END, motion.scroll);
    const px = inspect ? 0 : motion.pointer.x * 0.45;
    const py = inspect ? 0 : motion.pointer.y * 0.3;
    camera.position.x += (px - camera.position.x) * k;
    camera.position.y += (py - camera.position.y) * k;
    camera.position.z += (z - camera.position.z) * k;
    // Slight banking with scroll velocity.
    const bank = THREE.MathUtils.clamp(motion.velocity * 0.0015, -0.06, 0.06);
    camera.rotation.z += (bank - camera.rotation.z) * k;
    look.current.set(camera.position.x * 0.4, camera.position.y * 0.4, camera.position.z - 10);
    camera.lookAt(look.current);
    camera.rotation.z = bank;
  });
  return null;
}

function Lantern() {
  const light = useRef<THREE.PointLight>(null);
  const camera = useThree((s) => s.camera);
  useFrame((state) => {
    const l = light.current;
    if (!l) return;
    l.position.set(camera.position.x + motion.pointer.x * 3, camera.position.y + motion.pointer.y * 2, camera.position.z - 3);
    l.intensity = 28 + Math.sin(state.clock.elapsedTime * 3.1) * 1.5 + Math.sin(state.clock.elapsedTime * 7.3) * 0.8;
  });
  return <pointLight ref={light} color="#ffb766" distance={16} decay={1.6} />;
}

function Journey() {
  const fontsReady = useUI((s) => s.fontsReady);
  // Pull side-placed pieces toward the centre (and shrink them) on narrow/portrait screens.
  const aspect = useThree((s) => s.size.width / s.size.height);
  const xs = THREE.MathUtils.clamp(aspect / 1.6, 0.3, 1);
  const ws = aspect < 0.8 ? 0.78 : 1;
  const viewW = useThree((s) => s.size.width);
  const narrow = viewW < 480;
  const fov = useThree((s) => (s.camera as THREE.PerspectiveCamera).fov);
  // World-space width visible at a given camera distance.
  const visibleW = (dist: number) => 2 * dist * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect;
  const tex = useMemo(() => {
    if (!fontsReady) return null;
    const ch = chapters[0];
    return {
      cal: calligraphyTexture("月読書店"),
      kana: calligraphyTexture("ふじのまち"),
      epi: epigraphTexture(ch?.epigraph ?? "The silence here has a sound. I just don't know its name yet.", narrow),
      ticket: ticketTexture(),
      note: noteTexture(),
      letter: letterTexture(),
    };
  }, [fontsReady, narrow]);

  if (!tex) return null;
  return (
    <>
      <InkText
        texture={tex.cal.texture}
        aspect={tex.cal.aspect}
        height={4.6 * (aspect < 0.8 ? 0.85 : 1)}
        position={[2.35 * xs, 0.35, STATIONS.calligraphy]}
        revealFrom={13}
        revealTo={6.5}
        ink="#e3c48f"
        glow="#ff9a3c"
        opacity={0.8}
      />
      <InkText
        texture={tex.kana.texture}
        aspect={tex.kana.aspect}
        height={5}
        position={[-3.1 * xs, 0.6, STATIONS.kana]}
        revealFrom={12}
        revealTo={6}
        opacity={0.55}
        ink="#d9c7a6"
      />
      <InkText
        texture={tex.epi.texture}
        aspect={tex.epi.aspect}
        // Narrow: size the block to 84% of the width visible where the reveal completes.
        height={narrow ? (visibleW(5.5) * 0.84) / tex.epi.aspect : aspect < 0.8 ? 1.5 : 2.6}
        position={[0, 0.15, STATIONS.epigraph]}
        revealFrom={11}
        revealTo={5.5}
      />
      <Artifact
        id="ticket"
        texture={tex.ticket.texture}
        aspect={tex.ticket.aspect}
        // Narrow: centred, flatter, and sized to sit inside the frame at the viewing stop (~6 units).
        width={narrow ? Math.min(1.6, visibleW(6) * 0.72) : 2.4 * ws}
        position={narrow ? [0, -0.15, STATIONS.ticket] : [-1.7 * xs, -0.2, STATIONS.ticket]}
        rotation={narrow ? [0.04, 0.14, -0.04] : [0.05, 0.35, -0.08]}
        brightness={0.86}
        // Narrow: centred, so hold it back until the epigraph has passed.
        fadeStart={narrow ? 11.5 : 17}
        fadeLen={narrow ? 4 : 6}
      />
      <Artifact id="note" texture={tex.note.texture} aspect={tex.note.aspect} width={1.55 * ws} position={[1.8 * xs, 0.1, STATIONS.note]} rotation={[-0.05, -0.4, 0.06]} brightness={0.8} />
      <Artifact id="letter" texture={tex.letter.texture} aspect={tex.letter.aspect} width={1.7 * ws} position={[-1.6 * xs, 0.05, STATIONS.letter]} rotation={[0.04, 0.3, -0.03]} brightness={0.9} />
    </>
  );
}

export function Experience({ ink, active }: { ink: InkState; active: boolean }) {
  const reduced = motion.reducedMotion;
  return (
    <Canvas
      className="webgl"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      // "default" (not R3F's "high-performance") so software/locked-down GPUs still get a context.
      gl={{ antialias: false, alpha: false, powerPreference: "default" }}
      camera={{ fov: 50, near: 0.1, far: 120, position: [0, 0, CAMERA_START] }}
      onCreated={(s) => {
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = s;
      }}
    >
      <color attach="background" args={["#0A0A0C"]} />
      <ambientLight intensity={0.55} color="#ffe2bd" />
      <directionalLight position={[3, 5, 4]} intensity={0.6} color="#ffd9a8" />
      <Lantern />
      <FluidBackground ink={ink} />
      <DustMotes count={reduced ? 500 : 1400} />
      <MapleLeaves count={reduced ? 30 : 110} />
      <Journey />
      <CameraRig />
      <EffectComposer multisampling={0}>
        {/* Threshold 0.6 sits above the paper (max ~0.47 linear lum) and the amber rim,
            so only lantern light, dust and the ink bleed bloom. */}
        <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.6} luminanceSmoothing={0.2} radius={0.75} />
        {/* Not premultiplied: uniform film grain instead of speckle on bright surfaces. */}
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.28} />
        <Vignette offset={0.28} darkness={0.82} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
