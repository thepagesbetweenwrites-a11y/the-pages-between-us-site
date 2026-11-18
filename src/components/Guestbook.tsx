import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { X, Send, Trash2, MessagesSquare } from "lucide-react";
import { setState, useUI } from "../lib/store";
import { giscusConfig, giscusReady } from "../config/giscus";

interface Note {
  id: string;
  name: string;
  text: string;
  tint: number;
  at: number;
}

const KEY = "tpbu.counter.notes";
const TINTS = ["#D4A359", "#c9481c", "#8fa3b8", "#9bb08a"];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}
function saveNotes(n: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* storage unavailable */
  }
}

function GiscusFrame() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el || !giscusReady) return;
    el.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    const c = giscusConfig;
    const attrs: Record<string, string> = {
      "data-repo": c.repo,
      "data-repo-id": c.repoId,
      "data-category": c.category,
      "data-category-id": c.categoryId,
      "data-mapping": c.mapping,
      "data-term": c.term,
      "data-strict": "0",
      "data-reactions-enabled": c.reactionsEnabled,
      "data-emit-metadata": c.emitMetadata,
      "data-input-position": c.inputPosition,
      "data-theme": c.theme,
      "data-lang": c.lang,
      "data-loading": "lazy",
    };
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    el.appendChild(s);
  }, []);

  if (!giscusReady) {
    return (
      <div className="giscus-setup">
        <MessagesSquare size={20} strokeWidth={1.5} />
        <p>
          Reader discussion runs on <strong>Giscus</strong> (GitHub Discussions). It switches on once you fill in{" "}
          <code>src/config/giscus.ts</code>:
        </p>
        <ol>
          <li>Make the repo public and enable Discussions.</li>
          <li>Install the giscus GitHub app on it.</li>
          <li>Copy repo, repoId and categoryId from giscus.app.</li>
        </ol>
      </div>
    );
  }
  return <div className="giscus-host" ref={host} />;
}

export function Guestbook() {
  const open = useUI((s) => s.guestbookOpen);
  const [tab, setTab] = useState<"notes" | "discussion">("notes");
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [tint, setTint] = useState(0);

  useEffect(() => saveNotes(notes), [notes]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const n: Note = { id: crypto.randomUUID(), name: name.trim() || "A passing reader", text: t.slice(0, 280), tint, at: Date.now() };
    setNotes((prev) => [n, ...prev].slice(0, 60));
    setText("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setState({ guestbookOpen: false })}
          />
          <m.aside
            className="drawer"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 210, damping: 30 }}
            role="dialog"
            aria-label="Tsukiyomi Books Counter"
            data-lenis-prevent
          >
            <header className="drawer-head">
              <div>
                <p className="kicker">月読書店</p>
                <h2>Tsukiyomi Books Counter</h2>
                <p className="drawer-sub">Leave a note by the register, the way regulars do.</p>
              </div>
              <button className="icon-btn" onClick={() => setState({ guestbookOpen: false })} aria-label="Close">
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "notes"} className={tab === "notes" ? "is-on" : ""} onClick={() => setTab("notes")}>
                Note cards
              </button>
              <button
                role="tab"
                aria-selected={tab === "discussion"}
                className={tab === "discussion" ? "is-on" : ""}
                onClick={() => setTab("discussion")}
              >
                Reviews &amp; discussion
              </button>
            </div>

            {tab === "notes" ? (
              <div className="notes">
                <form
                  className="note-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    add();
                  }}
                >
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" maxLength={40} />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="A line you loved, a guess about Hana, a hello…"
                    maxLength={280}
                    rows={3}
                  />
                  <div className="note-form-row">
                    <div className="tints" role="radiogroup" aria-label="Card colour">
                      {TINTS.map((c, i) => (
                        <button
                          type="button"
                          key={c}
                          role="radio"
                          aria-checked={tint === i}
                          className={`tint ${tint === i ? "is-on" : ""}`}
                          style={{ background: c }}
                          onClick={() => setTint(i)}
                        />
                      ))}
                    </div>
                    <span className="count">{text.length}/280</span>
                    <button className="pill pill-amber" type="submit" disabled={!text.trim()}>
                      <Send size={14} strokeWidth={1.5} />
                      <span>Pin note</span>
                    </button>
                  </div>
                </form>
                <p className="notes-local">Note cards stay in this browser only.</p>
                <div className="note-grid">
                  <AnimatePresence initial={false}>
                    {notes.length === 0 && (
                      <m.p key="empty" className="notes-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        The counter is quiet. Be the first to leave a note.
                      </m.p>
                    )}
                    {notes.map((n, i) => (
                      <m.article
                        key={n.id}
                        layout
                        className="note-card"
                        style={{ ["--tint" as string]: TINTS[n.tint] ?? TINTS[0], rotate: `${((i * 37) % 7) - 3}deg` }}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        whileHover={{ rotate: 0, y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      >
                        <p>{n.text}</p>
                        <footer>
                          <span>— {n.name}</span>
                          <button
                            className="icon-btn icon-btn-sm"
                            onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                            aria-label="Remove note"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </footer>
                      </m.article>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <GiscusFrame />
            )}
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
}
