import { AnimatePresence, motion as m, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ArrowDown, X, BookOpen } from "lucide-react";
import { CAMERA_END, CAMERA_START, STATIONS } from "../three/Experience";
import { setState, useUI } from "../lib/store";
import type { ArtifactId } from "../lib/store";
import { BOOK_TITLE, chapters } from "../data/chapters";
import { WalkMap } from "./WalkMap";
import { CTA_RANGE } from "../lib/journey";

const span = CAMERA_START - CAMERA_END;
/** Scroll progress at which the camera sits `lead` units in front of station z. */
const at = (z: number, lead = 6) => (CAMERA_START - (z + lead)) / span;

function useBand(p: MotionValue<number>, center: number, width = 0.07) {
  return useTransform(p, [center - width, center - width * 0.4, center + width * 0.4, center + width], [0, 1, 1, 0]);
}

const INSPECT_COPY: Record<ArtifactId, { kicker: string; title: string; body: string; cite: string }> = {
  ticket: {
    kicker: "Artifact 01",
    title: "Platform 02 · Fujinomachi",
    body: "I step onto the platform and the quiet hits me as the train pulls away, taking the last familiar sound with it.",
    cite: "Chapter 01 · Aru",
  },
  note: {
    kicker: "Artifact 02",
    title: "Ma’s note, rolled inside a sock",
    body: "“Eat properly. Don’t just have maggi. Call on Sundays.” It is Sunday. I fold the note back along its own creases and tuck it under the jar.",
    cite: "Chapter 01 · Aru",
  },
  letter: {
    kicker: "Artifact 03",
    title: "University archive, 1913",
    body: "Letters between a forgotten Indian poet and a Japanese writer, written in English across a century. One line survives the foxing.",
    cite: "Waiting in Chapter 03",
  },
};

export function JourneyOverlay({ progress, onEnter }: { progress: MotionValue<number>; onEnter: (x: number, y: number) => void }) {
  const inspect = useUI((s) => s.inspect);
  const heroOpacity = useTransform(progress, [0, 0.06], [1, 0]);
  const heroY = useTransform(progress, [0, 0.08], [0, -60]);
  const cal = useBand(progress, at(STATIONS.calligraphy, 5), 0.07);
  const epi = useBand(progress, at(STATIONS.epigraph, 4), 0.06);
  const tix = useBand(progress, at(STATIONS.ticket, 4), 0.05);
  const note = useBand(progress, at(STATIONS.note, 4), 0.05);
  const letter = useBand(progress, at(STATIONS.letter, 4), 0.05);
  const cta = useTransform(progress, CTA_RANGE, [0, 1]);
  const ctaY = useTransform(progress, CTA_RANGE, [40, 0]);
  const bar = useTransform(progress, [0, 1], ["0%", "100%"]);
  const ch = chapters[0];

  return (
    <div className="overlay">
      <m.section className="hero" style={{ opacity: heroOpacity, y: heroY }}>
        <p className="kicker">A novel</p>
        <h1 className="hero-title">
          {BOOK_TITLE.split(" ").map((w, i) => (
            <span key={i} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
              {w}
            </span>
          ))}
        </h1>
        <p className="hero-sub">Fujinomachi · a small coastal town in rural Japan · autumn</p>
        <div className="scroll-hint">
          <ArrowDown size={16} strokeWidth={1.5} />
          <span>Scroll to arrive</span>
        </div>
      </m.section>

      <m.aside className="caption caption-left" style={{ opacity: cal }}>
        <span className="caption-jp">月読書店</span>
        <span>Tsukiyomi Books. Closed. Curtain drawn, lights off.</span>
      </m.aside>
      <m.aside className="caption caption-left caption-low" style={{ opacity: epi }}>
        <span className="caption-kicker">Chapter 01</span>
        <span>{ch?.title}</span>
      </m.aside>
      <m.aside className="caption caption-right caption-low" style={{ opacity: inspect ? 0 : tix, visibility: inspect ? "hidden" : "visible" }}>
        <span className="caption-kicker">Click to inspect</span>
        <span>The ticket from Platform 02.</span>
      </m.aside>
      <m.aside className="caption caption-left caption-low" style={{ opacity: inspect ? 0 : note, visibility: inspect ? "hidden" : "visible" }}>
        <span className="caption-kicker">Click to inspect</span>
        <span>Rolled inside a pair of socks.</span>
      </m.aside>
      <m.aside className="caption caption-right caption-low" style={{ opacity: inspect ? 0 : letter, visibility: inspect ? "hidden" : "visible" }}>
        <span className="caption-kicker">Click to inspect</span>
        <span>A letter from the archive, 1913.</span>
      </m.aside>

      <WalkMap progress={progress} />

      <m.div className="enter" style={{ opacity: cta, y: ctaY }}>
        <p className="enter-meta">
          Chapter 01 · {ch?.title} · {ch ? Math.round(ch.words / 230) : 14} min read
        </p>
        <button
          className="enter-btn"
          onClick={(e) => onEnter(e.clientX / window.innerWidth, e.clientY / window.innerHeight)}
        >
          <BookOpen size={18} strokeWidth={1.5} />
          <span>Enter Chapter 01</span>
        </button>
      </m.div>

      <div className="progress-rail" aria-hidden>
        <m.div className="progress-fill" style={{ height: bar }} />
      </div>

      <AnimatePresence>
        {inspect && (
          <m.div
            key={inspect}
            className="inspect-panel"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label={INSPECT_COPY[inspect].title}
          >
            <button className="icon-btn inspect-close" onClick={() => setState({ inspect: null })} aria-label="Close">
              <X size={18} strokeWidth={1.5} />
            </button>
            <p className="kicker">{INSPECT_COPY[inspect].kicker}</p>
            <h2>{INSPECT_COPY[inspect].title}</h2>
            <p className="inspect-body">{INSPECT_COPY[inspect].body}</p>
            <p className="inspect-cite">{INSPECT_COPY[inspect].cite}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
