import { useEffect, useRef } from "react";
import gsap from "gsap";
import { setState, useUI } from "../lib/store";
import type { Mode } from "../lib/store";

export interface InkState {
  current: number; // 0 = clear, >=1.25 = screen fully flooded (fluid shader)
  x: number; // origin in NDC
  y: number;
}

// Two cheap layers, no per-frame SVG filtering:
//  1. The WebGL fluid shader floods ink outward from the click point (GPU).
//  2. A DOM veil whose radial CSS mask opens a soft, inky hole onto the next scene.
export function InkTransition({ ink, onCovered }: { ink: InkState; onCovered: (target: Mode) => void }) {
  const t = useUI((s) => s.inkTransition);
  const veil = useRef<HTMLDivElement>(null);
  // Keep the latest callback without restarting the timeline on parent re-renders.
  const covered = useRef(onCovered);
  covered.current = onCovered;

  useEffect(() => {
    const el = veil.current;
    if (!t.active || !el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = t.x * vw;
    const cy = t.y * vh;
    const maxR = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 160;
    ink.x = t.x * 2 - 1;
    ink.y = -(t.y * 2 - 1);
    const s = { o: 0, hole: 0 };
    const apply = () => {
      el.style.setProperty("--x", `${cx}px`);
      el.style.setProperty("--y", `${cy}px`);
      el.style.setProperty("--hole", `${s.hole}px`);
      el.style.opacity = String(s.o);
    };
    apply();
    const toReader = t.target === "reader";
    const tl = gsap.timeline({ onComplete: () => setState({ inkTransition: { ...t, active: false } }) });
    if (toReader) {
      // Flood the 3D scene with ink, then veil it completely.
      tl.to(ink, { current: 1.3, duration: 1.0, ease: "power2.in" }, 0)
        .to(s, { o: 1, duration: 0.35, ease: "power1.in", onUpdate: apply }, 0.7)
        .add(() => covered.current(t.target))
        .to({}, { duration: 0.12 })
        .set(ink, { current: 0 })
        // Open an ink-edged hole onto the reader.
        .to(s, { hole: maxR, duration: 1.05, ease: "power3.inOut", onUpdate: apply })
        .set(s, { o: 0, hole: 0, onComplete: apply });
    } else {
      // Close the veil over the reader, swap, then let the ink recede off the 3D scene.
      s.hole = maxR;
      s.o = 1;
      apply();
      tl.to(s, { hole: 0, duration: 0.8, ease: "power3.inOut", onUpdate: apply })
        .add(() => {
          ink.current = 1.3;
          covered.current(t.target);
        })
        .to({}, { duration: 0.12 })
        .to(s, { o: 0, duration: 0.25, onUpdate: apply })
        .to(ink, { current: 0, duration: 1.2, ease: "power2.out" }, "<");
    }
    return () => {
      tl.kill();
    };
    // Run once per transition start; `t` is read from that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.active]);

  return <div ref={veil} className={`ink-veil ${t.active ? "is-active" : ""}`} aria-hidden />;
}
