// Shared, mutable per-frame motion state. Written by DOM listeners / Lenis,
// read inside useFrame loops so the render loop never triggers React renders.
export interface Ripple {
  x: number; // NDC -1..1
  y: number;
  t: number; // seconds (performance clock)
}

export const motion = {
  scroll: 0, // 0..1 journey progress
  velocity: 0, // Lenis velocity, px/frame-ish
  pointer: { x: 0, y: 0 }, // NDC
  pointerVel: { x: 0, y: 0 }, // NDC units / second, smoothed
  ripples: [] as Ripple[],
  lastRippleAt: 0,
  reducedMotion: false,
};

export const MAX_RIPPLES = 10;

export function now() {
  return performance.now() / 1000;
}

let lastX = 0;
let lastY = 0;
let lastT = 0;

export function installPointerTracking() {
  motion.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const onMove = (e: PointerEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    const t = now();
    const dt = Math.max(1 / 240, t - lastT);
    const vx = (x - lastX) / dt;
    const vy = (y - lastY) / dt;
    motion.pointerVel.x += (vx - motion.pointerVel.x) * 0.25;
    motion.pointerVel.y += (vy - motion.pointerVel.y) * 0.25;
    motion.pointer.x = x;
    motion.pointer.y = y;
    lastX = x;
    lastY = y;
    lastT = t;
    const speed = Math.hypot(vx, vy);
    // Drop a ripple when the cursor moves with intent, rate-limited.
    if (speed > 0.6 && t - motion.lastRippleAt > 0.09) {
      motion.lastRippleAt = t;
      motion.ripples.push({ x, y, t });
      if (motion.ripples.length > MAX_RIPPLES) motion.ripples.shift();
    }
  };
  const onDown = (e: PointerEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    motion.ripples.push({ x, y, t: now() });
    if (motion.ripples.length > MAX_RIPPLES) motion.ripples.shift();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  };
}
