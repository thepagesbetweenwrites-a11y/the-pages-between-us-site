import { useState } from "react";
import { AnimatePresence, motion as m, useMotionValueEvent, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Footprints, X } from "lucide-react";
import { EVENING_PATH, WALK_INTRO, WALK_PATH, WALK_STOPS } from "../data/walk";
import { WALK_BAND } from "../lib/journey";
import { soundscape } from "../lib/audio";

const { center: C, width: W } = WALK_BAND;

/** "The 12-Minute Walk Through Fujinomachi": a brush-stroke route that draws itself
 *  with scroll, with stops that open sensory quotes from Aru's walk. */
export function WalkMap({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [C - W, C - W * 0.4, C + W * 0.4, C + W], [0, 1, 1, 0]);
  const y = useTransform(progress, [C - W, C - W * 0.4, C + W * 0.4, C + W], [40, 0, 0, -30]);
  const draw = useTransform(progress, [C - W * 0.85, C - W * 0.1], [0, 1]);
  const evening = useTransform(progress, [C - W * 0.2, C + W * 0.3], [0, 1]);
  const [live, setLive] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  useMotionValueEvent(opacity, "change", (v) => {
    const on = v > 0.4;
    setLive(on);
    if (!on) setPicked(null);
  });
  const stop = WALK_STOPS.find((s) => s.id === picked) ?? null;

  return (
    <m.section
      className={`walk ${live ? "is-live" : ""}`}
      style={{ opacity, y, visibility: live ? "visible" : "hidden" }}
      aria-label="The 12-minute walk through Fujinomachi"
      aria-hidden={!live}
    >
      <header className="walk-head">
        <p className="kicker">
          <Footprints size={13} strokeWidth={1.6} aria-hidden /> Chapter 01 · Aru’s route
        </p>
        <h2>The 12-Minute Walk Through Fujinomachi</h2>
        <p className="walk-intro">{WALK_INTRO}</p>
      </header>

      <div className="walk-map">
        <svg viewBox="0 0 1000 560" role="img" aria-label="Brush-stroke map of Aru's walk" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
            </filter>
            <filter id="dry" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="g" />
              <feComponentTransfer in="g" result="g2">
                <feFuncA type="discrete" tableValues="0 0 1 1 1" />
              </feComponentTransfer>
              <feComposite in="SourceGraphic" in2="g2" operator="in" />
            </filter>
            <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#8fa3b8" stopOpacity="0" />
              <stop offset="1" stopColor="#8fa3b8" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* The sea at the bottom edge, the way it reaches the town: as a sound and a strip. */}
          <rect x="0" y="500" width="1000" height="60" fill="url(#sea)" />
          {[512, 528, 544].map((yy, i) => (
            <path
              key={yy}
              className="walk-wave"
              style={{ animationDelay: `${i * 0.8}s` }}
              d={`M0 ${yy} Q 62 ${yy - 6} 125 ${yy} T 250 ${yy} T 375 ${yy} T 500 ${yy} T 625 ${yy} T 750 ${yy} T 875 ${yy} T 1000 ${yy}`}
            />
          ))}
          <text className="walk-sea" x="970" y="492" textAnchor="end">
            the sea
          </text>

          {/* Landmarks the chapter passes without stopping. */}
          <g className="walk-landmark">
            <rect x="452" y="262" width="34" height="22" rx="3" />
            <text x="469" y="304" textAnchor="middle">
              konbini
            </text>
          </g>
          <g className="walk-landmark">
            <path d="M372 252 q 8 -14 16 0 q 4 6 -2 8 l -12 0 q -6 -2 -2 -8 z" />
            <text x="382" y="240" textAnchor="middle">
              cat, ear notched
            </text>
          </g>

          {/* Evening detour (dotted), then the afternoon route (brush). */}
          <m.path d={EVENING_PATH} className="walk-evening" style={{ opacity: evening }} />
          <m.path d={WALK_PATH} className="walk-route walk-route-under" filter="url(#brush)" style={{ pathLength: draw }} />
          <m.path d={WALK_PATH} className="walk-route" filter="url(#dry)" style={{ pathLength: draw }} />
        </svg>

        {WALK_STOPS.map((s) => (
          <button
            key={s.id}
            className={`walk-stop ${s.evening ? "is-evening" : ""} ${picked === s.id ? "is-on" : ""}`}
            style={{ left: `${s.x / 10}%`, top: `${(s.y / 560) * 100}%` }}
            onClick={() => {
              setPicked(picked === s.id ? null : s.id);
              soundscape.chime(0.6);
            }}
            aria-pressed={picked === s.id}
            tabIndex={live ? 0 : -1}
          >
            <span className="walk-dot" aria-hidden>
              {s.n}
            </span>
            <span className="walk-name">{s.name}</span>
          </button>
        ))}
      </div>

      <div className="walk-card-slot">
        <AnimatePresence mode="wait">
          {stop ? (
            <m.article
              key={stop.id}
              className="walk-card"
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <button className="icon-btn icon-btn-sm walk-card-close" onClick={() => setPicked(null)} aria-label="Close">
                <X size={14} strokeWidth={1.5} />
              </button>
              <p className="kicker">
                Stop {stop.n} of {WALK_STOPS.length} · {stop.note}
              </p>
              <h3>{stop.name}</h3>
              <blockquote>{stop.quote}</blockquote>
              <p className="walk-cite">Chapter 01 · Aru</p>
            </m.article>
          ) : (
            <m.p key="hint" className="walk-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Tap a stop to stand where Aru stood.
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </m.section>
  );
}
