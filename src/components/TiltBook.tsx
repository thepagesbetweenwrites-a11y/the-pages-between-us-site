import { useRef } from "react";
import { motion as m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { motion } from "../lib/motion";
import { navigate } from "../lib/router";
import { SITE } from "../config/site";

/** A CSS-3D hardback that tilts toward the pointer and opens the Fujinomachi room. */
export function TiltBook() {
  const ref = useRef<HTMLButtonElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 140, damping: 18 });
  const sy = useSpring(py, { stiffness: 140, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-28, 8]);
  const rotateX = useTransform(sy, [0, 1], [12, -12]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(60% 50% at ${glareX} ${glareY}, rgba(255, 236, 200, 0.22), transparent 70%)`;

  const onMove = (e: React.PointerEvent) => {
    if (motion.reducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };
  const words = SITE.book.title.split(" ");

  return (
    <div className="book-stage">
      <m.button
        ref={ref}
        className="book"
        style={{ rotateX, rotateY }}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onClick={() => navigate(SITE.book.path)}
        aria-label={`Enter Fujinomachi: ${SITE.book.title}, by ${SITE.author}`}
      >
        <span className="book-pages" aria-hidden />
        <span className="book-spine" aria-hidden>
          <span>{SITE.book.title}</span>
        </span>
        <span className="book-cover" aria-hidden>
          <span className="book-moon">月</span>
          <span className="book-title">
            {words.map((w, i) => (
              <span key={i} className={w.toLowerCase() === "at" ? "is-amber" : ""}>
                {w}
              </span>
            ))}
          </span>
          <span className="book-rule" />
          <span className="book-author">{SITE.author}</span>
          <m.span className="book-glare" style={{ background: glare }} />
        </span>
      </m.button>
      <span className="book-shadow" aria-hidden />
    </div>
  );
}
