import { useEffect, useState } from "react";
import Lenis from "lenis";
import { motion as m } from "framer-motion";
import { ArrowDown, ArrowUpRight, BookOpen, Feather } from "lucide-react";
import { WebGLBoundary, hasWebGL } from "../components/WebGLBoundary";
import { DeskStage } from "../three/DeskStage";
import { Link, SiteHeader } from "../components/Link";
import { Magnetic } from "../components/Magnetic";
import { TiltBook } from "../components/TiltBook";
import { motion } from "../lib/motion";
import { SITE } from "../config/site";
import { chapters } from "../data/chapters";

// Draft manifesto: the author's to rewrite.
const MANIFESTO = [
  "I write about small places and the people who keep them open.",
  "A bookshop after closing. A note folded into a sock. A platform so quiet you can hear the sea behind it.",
  "Two languages at one counter, and everything neither person says out loud.",
];

const reveal = {
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-12% 0px" },
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
  const ch = chapters[0];

  // Smooth inertia scroll; its progress gently drifts the lantern shader.
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

  return (
    <div className="desk">
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
          <p className="desk-line">Literary fiction about small towns, second languages, and the people who stay.</p>
          <div className="scroll-hint">
            <ArrowDown size={16} strokeWidth={1.5} />
            <span>The quiet desk</span>
          </div>
        </section>

        <section className="manifesto" aria-label="Manifesto">
          {MANIFESTO.map((line, i) => (
            <m.p key={i} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }}>
              {line}
            </m.p>
          ))}
          <m.p className="manifesto-sign" {...reveal}>
            {SITE.author}
          </m.p>
        </section>

        <section className="featured" aria-labelledby="featured-title">
          <m.div className="featured-book" {...reveal}>
            <TiltBook />
          </m.div>
          <m.div className="featured-copy" {...reveal} transition={{ ...reveal.transition, delay: 0.15 }}>
            <p className="kicker">The first novel</p>
            <h2 id="featured-title">{SITE.book.title}</h2>
            <p className="featured-blurb">{SITE.book.blurb}</p>
            <p className="featured-meta">
              Chapter 01 · {ch?.title} · {ch ? Math.round(ch.words / 230) : 14} min read · free sample
            </p>
            <Link to={SITE.book.path} className="enter-btn featured-cta">
              <BookOpen size={18} strokeWidth={1.5} />
              <span>Enter Fujinomachi</span>
            </Link>
          </m.div>
        </section>

        <m.section className="coming-next" aria-label="Coming next" {...reveal}>
          <p className="kicker">Coming next</p>
          <p className="coming-title">Chapter 02 · Tsukiyomi Books</p>
          <p className="coming-sub">Told by Hana. The shop opens.</p>
        </m.section>

        <section className="elsewhere" aria-label="Elsewhere">
          <m.p className="kicker" {...reveal}>
            Elsewhere
          </m.p>
          <div className="elsewhere-links">
            {SITE.socials.map((s) => (
              <Magnetic key={s.handle}>
                <a className="social-link" href={s.href} target="_blank" rel="noopener noreferrer">
                  <span className="social-handle">{s.handle}</span>
                  <span className="social-note">{s.note}</span>
                  <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
                </a>
              </Magnetic>
            ))}
            <Magnetic>
              <Link to="/notes" className="social-link">
                <span className="social-handle">Field Notes</span>
                <span className="social-note">Dispatches and early verse</span>
                <Feather size={16} strokeWidth={1.5} aria-hidden />
              </Link>
            </Magnetic>
          </div>
        </section>

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
