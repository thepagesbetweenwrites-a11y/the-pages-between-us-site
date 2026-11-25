import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "../components/Link";
import { ARCHIVE, DISPATCHES } from "../data/notes";
import type { ArchivePiece } from "../data/notes";
import { SITE } from "../config/site";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function Piece({ p }: { p: ArchivePiece }) {
  const [open, setOpen] = useState(false);
  const id = `piece-${p.slug}`;
  return (
    <article className={`piece ${open ? "is-open" : ""}`}>
      <button className="piece-head" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id}>
        <span className="piece-date">{fmt(p.date)}</span>
        <span className="piece-title">{p.title}</span>
        <ChevronDown className="piece-chev" size={16} strokeWidth={1.5} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={id}
            className="piece-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="piece-inner">
              {p.lede && <p className="piece-lede">{p.lede}</p>}
              {p.text.split(/\n{2,}/).map((stanza, i) => (
                <p key={i} className="stanza">
                  {stanza.split("\n").map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
              {p.coda && <p className="piece-coda">{p.coda}</p>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export default function Notes() {
  const [archiveOpen, setArchiveOpen] = useState(() => window.location.hash === "#archive");
  const archiveRef = useRef<HTMLElement>(null);
  // Deep link from the Desk: open the archive and bring it into view.
  useEffect(() => {
    if (window.location.hash !== "#archive") return;
    const id = window.setTimeout(() => archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 650);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="notes">
      <div className="notes-glow" aria-hidden />
      <SiteHeader />
      <main className="notes-main">
        <header className="notes-head">
          <p className="kicker">Field Notes</p>
          <h1>From the desk</h1>
          <p className="notes-sub">Dispatches from the writing of {SITE.book.title}.</p>
        </header>

        <section className="dispatches" aria-label="Dispatches">
          {DISPATCHES.map((d) => (
            <article key={d.date + d.title} className="dispatch">
              <time dateTime={d.date}>{fmt(d.date)}</time>
              <h2>{d.title}</h2>
              {d.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>
          ))}
        </section>

        <section className="archive" id="archive" ref={archiveRef} aria-labelledby="archive-title">
          <button
            className="archive-toggle"
            onClick={() => setArchiveOpen((o) => !o)}
            aria-expanded={archiveOpen}
            aria-controls="archive-list"
          >
            <span>
              <span className="kicker">2018–2020 Archive</span>
              <span id="archive-title" className="archive-title">
                Early Verse &amp; Essays
              </span>
            </span>
            <span className="archive-count">{ARCHIVE.length} pieces</span>
            <ChevronDown className={`piece-chev ${archiveOpen ? "is-up" : ""}`} size={18} strokeWidth={1.5} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {archiveOpen && (
              <m.div
                id="archive-list"
                className="archive-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="archive-note">
                  First posted on an old blog. Re-cased from all-caps, otherwise as written.
                </p>
                {ARCHIVE.map((p) => (
                  <Piece key={p.slug} p={p} />
                ))}
              </m.div>
            )}
          </AnimatePresence>
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
