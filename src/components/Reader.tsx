import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { AnimatePresence, motion as m, useMotionValue, useSpring } from "framer-motion";
import { ArrowLeft, Moon, ScrollText, Minus, Plus, Quote } from "lucide-react";
import { chapters } from "../data/chapters";
import { QuoteComposer } from "./QuoteComposer";
import { soundscape } from "../lib/audio";
import { SITE } from "../config/site";

type Theme = "night" | "parchment";

function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* private mode */
  }
}

export function Reader({ onExit }: { onExit: () => void }) {
  const ch = chapters[0];
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>(() => readPref<Theme>("tpbu.theme", "night"));
  const [size, setSize] = useState(() => Number(readPref("tpbu.size", "21")) || 21);
  const [quote, setQuote] = useState<string | null>(null);
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 120, damping: 30 });

  useEffect(() => writePref("tpbu.theme", theme), [theme]);
  useEffect(() => writePref("tpbu.size", String(size)), [size]);

  useEffect(() => {
    if (!wrap.current || !inner.current) return;
    const lenis = new Lenis({ wrapper: wrap.current, content: inner.current, lerp: 0.09 });
    lenis.on("scroll", (l: Lenis) => {
      progress.set(l.progress || 0);
      soundscape.setVelocity(l.velocity * 0.6);
    });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [progress]);

  if (!ch) return null;
  let paraIndex = 0;

  return (
    <div className={`reader theme-${theme}`} style={{ ["--reader-size" as string]: `${size}px` }}>
      <m.div className="reader-progress" style={{ scaleX: smooth }} />
      <div className="reader-tools">
        <button className="pill" onClick={onExit}>
          <ArrowLeft size={15} strokeWidth={1.5} />
          <span>Fujinomachi</span>
        </button>
        <div className="reader-tools-right">
          <button className="icon-btn" onClick={() => setSize((s) => Math.max(17, s - 1))} aria-label="Smaller text">
            <Minus size={15} strokeWidth={1.5} />
          </button>
          <button className="icon-btn" onClick={() => setSize((s) => Math.min(26, s + 1))} aria-label="Larger text">
            <Plus size={15} strokeWidth={1.5} />
          </button>
          <button
            className="pill"
            onClick={() => setTheme((t) => (t === "night" ? "parchment" : "night"))}
            aria-label="Toggle reading theme"
          >
            {theme === "night" ? <ScrollText size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            <span>{theme === "night" ? "Parchment" : "Night"}</span>
          </button>
        </div>
      </div>

      <div className="reader-scroll" ref={wrap}>
        <article className="reader-page" ref={inner}>
          <header className="chapter-head">
            <p className="kicker">Chapter {String(ch.number).padStart(2, "0")}</p>
            <h1>{ch.title}</h1>
            {ch.epigraph && <p className="epigraph">{ch.epigraph}</p>}
            <p className="tap-hint">
              <Quote size={13} strokeWidth={1.5} /> Tap any paragraph to make a quote card
            </p>
          </header>
          {ch.scenes.map((scene, si) => (
            <section className="scene" key={si}>
              {si > 0 && (
                <div className="ornament" aria-hidden>
                  <span>❦</span>
                </div>
              )}
              {scene.map((p, pi) => {
                const first = si === 0 && pi === 0;
                const idx = paraIndex++;
                return (
                  <p
                    key={pi}
                    className={`para ${first ? "dropcap" : ""}`}
                    style={{ animationDelay: `${Math.min(idx, 6) * 0.06}s` }}
                    onClick={() => {
                      const sel = window.getSelection()?.toString().trim();
                      setQuote(sel && sel.length > 12 ? sel : p);
                    }}
                  >
                    {p}
                  </p>
                );
              })}
            </section>
          ))}
          <footer className="chapter-end">
            <div className="ornament" aria-hidden>
              <span>❦</span>
            </div>
            <p className="kicker">End of Chapter 01</p>
            <p className="chapter-next">Chapter 02 · Tsukiyomi Books · told by Hana · coming soon</p>
            <button className="pill" onClick={onExit}>
              <ArrowLeft size={15} strokeWidth={1.5} />
              <span>Back to Fujinomachi</span>
            </button>
            <p className="sample-mark">© {SITE.year} {SITE.author} · End of Chapter 01 Sample</p>
          </footer>
        </article>
      </div>

      <AnimatePresence>{quote && <QuoteComposer text={quote} theme={theme} chapter={ch} onClose={() => setQuote(null)} />}</AnimatePresence>
    </div>
  );
}
