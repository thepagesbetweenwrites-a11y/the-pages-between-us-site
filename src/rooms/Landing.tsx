import { useCallback, useEffect, useState } from "react";
import Lenis from "lenis";
import { motion as m } from "framer-motion";
import { ArrowDown, BookOpen } from "lucide-react";
import { WebGLBoundary, hasWebGL } from "../components/WebGLBoundary";
import { DeskStage } from "../three/DeskStage";
import { HardcoverBook } from "../three/HardcoverBook";
import { SiteHeader } from "../components/Link";
import { TiltBook } from "../components/TiltBook";
import { BentoDock } from "../components/BentoDock";
import { motion } from "../lib/motion";
import { navigate } from "../lib/router";
import { loadFonts } from "../lib/textures";
import { SITE } from "../config/site";
import { chapters } from "../data/chapters";

const reveal = {
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-10% 0px" },
  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
};

function KineticName({ text }: { text: string }) {
  return (
    <h1 className="desk-name" aria-label={text}>
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
          {c === " " ? " " : c}
        </span>
      ))}
    </h1>
  );
}

export default function Landing() {
  const [webgl] = useState(hasWebGL);
  const [fonts, setFonts] = useState(false);
  const [openSignal, setOpenSignal] = useState(0);
  const ch = chapters[0];

  useEffect(() => {
    let alive = true;
    void loadFonts().then(() => alive && setFonts(true));
    return () => {
      alive = false;
    };
  }, []);

  // Smooth inertia scroll; its progress dims the lamp beam as you read down.
  useEffect(() => {
    const lenis = new Lenis({ lerp: motion.reducedMotion ? 1 : 0.08, smoothWheel: true });
    lenis.on("scroll", (l: Lenis) => {
      motion.scroll = (l.progress || 0) * 0.35;
      motion.velocity = l.velocity;
    });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      if (!lenis.isScrolling) motion.velocity *= 0.9;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      motion.scroll = 0;
      motion.velocity = 0;
    };
  }, []);

  const open = useCallback(() => {
    if (!webgl) return navigate(SITE.book.path);
    setOpenSignal((n) => n + 1);
  }, [webgl]);
  const opened = useCallback(() => navigate(SITE.book.path), []);

  return (
    <div className={`desk ${openSignal ? "is-opening" : ""}`}>
      <div className="stage" aria-hidden>
        {webgl ? (
          <WebGLBoundary>
            <DeskStage />
          </WebGLBoundary>
        ) : (
          <div className="stage-fallback" />
        )}
      </div>
      <SiteHeader />

      <main className="desk-main">
        <section className="desk-hero">
          <p className="kicker desk-kicker">{SITE.name}</p>
          <KineticName text={SITE.author} />
          <p className="desk-line">{SITE.manifesto}</p>
          <div className="scroll-hint">
            <ArrowDown size={16} strokeWidth={1.5} />
            <span>The midnight desk</span>
          </div>
        </section>

        <section className="featured" aria-labelledby="featured-title">
          <div className="featured-book">
            {webgl && fonts ? (
              <WebGLBoundary>
                <HardcoverBook epigraph={ch?.epigraph ?? ""} openSignal={openSignal} onOpen={open} onOpened={opened} />
              </WebGLBoundary>
            ) : webgl ? (
              <div className="book3d" />
            ) : (
              <TiltBook />
            )}
            <p className="featured-tap" aria-hidden>
              Tap the book to open it
            </p>
          </div>
          <m.div className="featured-copy" {...reveal}>
            <p className="kicker">The first novel</p>
            <h2 id="featured-title">{SITE.book.title}</h2>
            <p className="featured-hook">{SITE.book.hook}</p>
            <p className="featured-blurb">{SITE.book.blurb}</p>
            <button className="enter-btn featured-cta" onClick={open}>
              <BookOpen size={18} strokeWidth={1.5} />
              <span>Open the book</span>
            </button>
          </m.div>
        </section>

        <m.section className="dock-wrap" aria-label="From the desk" {...reveal}>
          <BentoDock />
        </m.section>

        <footer className="site-foot">
          <span>
            © {SITE.year} {SITE.author}
          </span>
          <span>{SITE.domain}</span>
        </footer>
      </main>
    </div>
  );
}
