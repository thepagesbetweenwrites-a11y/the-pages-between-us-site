import { useCallback, useEffect, useRef, useState } from "react";
import { WebGLBoundary, hasWebGL } from "./components/WebGLBoundary";
import Lenis from "lenis";
import { useMotionValue } from "framer-motion";
import { Experience } from "./three/Experience";
import { JourneyOverlay } from "./components/JourneyOverlay";
import { TopBar } from "./components/TopBar";
import { InkTransition } from "./components/InkTransition";
import type { InkState } from "./components/InkTransition";
import { Reader } from "./components/Reader";
import { Guestbook } from "./components/Guestbook";
import { installPointerTracking, motion } from "./lib/motion";
import { getState, setState, useUI } from "./lib/store";
import type { Mode } from "./lib/store";
import { loadFonts } from "./lib/textures";
import { soundscape } from "./lib/audio";

export default function App() {
  const mode = useUI((s) => s.mode);
  const inspect = useUI((s) => s.inspect);
  const ink = useTransitionInk();
  const lenisRef = useRef<Lenis | null>(null);
  const progress = useMotionValue(0);
  const [webgl] = useState(hasWebGL);

  // Fonts first: every 3D text texture is painted with the real web fonts.
  useEffect(() => {
    let alive = true;
    void loadFonts().then(() => alive && setState({ fontsReady: true }));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => installPointerTracking(), []);

  // Lenis smooth inertia scroll drives the whole journey.
  useEffect(() => {
    const lenis = new Lenis({ lerp: motion.reducedMotion ? 1 : 0.075, smoothWheel: true, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    lenis.on("scroll", (l: Lenis) => {
      motion.scroll = l.progress || 0;
      motion.velocity = l.velocity;
      progress.set(motion.scroll);
      soundscape.setVelocity(l.velocity);
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      if (!lenis.isScrolling) motion.velocity *= 0.9;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [progress]);

  // Freeze the journey scroll while inspecting or reading.
  useEffect(() => {
    const l = lenisRef.current;
    if (!l) return;
    if (inspect || mode === "reader") l.stop();
    else l.start();
  }, [inspect, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = getState();
      if (s.guestbookOpen) setState({ guestbookOpen: false });
      else if (s.inspect) setState({ inspect: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (inspect) soundscape.chime(0.8);
  }, [inspect]);

  const go = useCallback((target: Mode, x = 0.5, y = 0.5) => {
    if (getState().inkTransition.active) return;
    setState({ inspect: null, inkTransition: { active: true, x, y, target } });
  }, []);

  return (
    <>
      <div className="stage" aria-hidden={mode === "reader"}>
        {webgl ? (
          <WebGLBoundary>
            <Experience ink={ink} active={mode === "journey"} />
          </WebGLBoundary>
        ) : (
          <div className="stage-fallback" />
        )}
      </div>
      {mode === "journey" && (
        <>
          <div className="scroll-spacer" />
          <JourneyOverlay progress={progress} onEnter={(x, y) => go("reader", x, y)} />
        </>
      )}
      {mode === "reader" && <Reader onExit={() => go("journey")} />}
      <TopBar onHome={() => mode === "reader" && go("journey")} />
      <Guestbook />
      <InkTransition
        ink={ink}
        onCovered={(target) => {
          setState({ mode: target });
          if (target === "journey") {
            requestAnimationFrame(() => lenisRef.current?.scrollTo(lenisRef.current.limit * 0.86, { immediate: true }));
          } else {
            window.scrollTo(0, 0);
          }
        }}
      />
    </>
  );
}

/** Shared numeric ref the shader reads (ink flood) and the DOM transition animates. */
function useTransitionInk(): InkState {
  const ref = useRef<InkState>({ current: 0, x: 0, y: 0 });
  return ref.current;
}
