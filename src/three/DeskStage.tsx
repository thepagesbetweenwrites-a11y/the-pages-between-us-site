import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { FluidBackground } from "./FluidBackground";
import { DustMotes } from "./DustMotes";
import { motion } from "../lib/motion";
import type { InkState } from "../components/InkTransition";

// The Desk never floods with ink; the shader just needs a resting value.
const STILL_INK: InkState = { current: 0, x: 0, y: 0 };

/** Camera sways with the pointer and sinks slightly as the page scrolls. */
function Drift() {
  const camera = useThree((s) => s.camera);
  const t = useRef({ x: 0, y: 0 });
  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.03, delta);
    t.current.x += (motion.pointer.x * 0.6 - t.current.x) * k;
    t.current.y += (motion.pointer.y * 0.35 - motion.scroll * 1.2 - t.current.y) * k;
    camera.position.set(t.current.x, t.current.y, 6 - motion.scroll * 4);
    camera.lookAt(t.current.x * 0.3, t.current.y * 0.3, -10);
  });
  return null;
}

export function DeskStage() {
  const reduced = motion.reducedMotion;
  return (
    <Canvas
      className="webgl"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "default" }}
      camera={{ fov: 50, near: 0.1, far: 80, position: [0, 0, 6] }}
    >
      <color attach="background" args={["#0A0A0C"]} />
      <FluidBackground ink={STILL_INK} />
      <DustMotes count={reduced ? 350 : 900} zStart={6} zEnd={-26} />
      <Drift />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.7} />
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.26} />
        <Vignette offset={0.3} darkness={0.85} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
