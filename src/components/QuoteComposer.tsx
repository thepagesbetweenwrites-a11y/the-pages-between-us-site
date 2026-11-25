import { useMemo, useState } from "react";
import { motion as m } from "framer-motion";
import { Check, Copy, Download, X } from "lucide-react";
import type { Chapter } from "../data/chapters";
import { BOOK_TITLE } from "../data/chapters";
import { SITE } from "../config/site";

const SLUG = BOOK_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function sentences(text: string) {
  return (text.match(/[^.!?…]+[.!?…]+[”"’)]*|[^.!?…]+$/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function renderCard(text: string, theme: "night" | "parchment", chapter: Chapter) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const night = theme === "night";
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, night ? "#121116" : "#efe5cf");
  bg.addColorStop(1, night ? "#08080a" : "#e2d3b2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Lantern glow.
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.18, 10, W * 0.78, H * 0.18, W * 0.7);
  glow.addColorStop(0, night ? "rgba(212,163,89,0.28)" : "rgba(212,163,89,0.22)");
  glow.addColorStop(1, "rgba(212,163,89,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const ink = night ? "#efe3cc" : "#2a2018";
  const amber = "#D4A359";
  ctx.fillStyle = amber;
  ctx.font = "700 150px 'Shippori Mincho', serif";
  ctx.fillText("“", 96, 250);
  ctx.fillStyle = ink;
  let fs = 60;
  let lines: string[] = [];
  for (; fs >= 34; fs -= 2) {
    ctx.font = `italic 400 ${fs}px 'EB Garamond', serif`;
    lines = wrapLines(ctx, text, W - 220);
    if (lines.length * fs * 1.38 < H - 560) break;
  }
  const lh = fs * 1.38;
  lines.forEach((l, i) => ctx.fillText(l, 110, 330 + i * lh));
  ctx.strokeStyle = amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, H - 220);
  ctx.lineTo(260, H - 220);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = "500 40px 'EB Garamond', serif";
  ctx.fillText(BOOK_TITLE, 110, H - 160);
  ctx.globalAlpha = 0.6;
  ctx.font = "400 26px 'Inter', sans-serif";
  ctx.fillText(`${SITE.author.toUpperCase()} · CHAPTER ${String(chapter.number).padStart(2, "0")} · ${chapter.title.toUpperCase()}`, 110, H - 112);
  ctx.globalAlpha = 0.42;
  ctx.font = "400 22px 'Inter', sans-serif";
  ctx.fillText(`${SITE.name} · ${SITE.domain}`, 110, H - 72);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = amber;
  ctx.font = "700 64px 'Shippori Mincho', serif";
  ctx.textAlign = "right";
  ctx.fillText("月", W - 110, H - 96);
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png"));
}

export function QuoteComposer({
  text,
  theme,
  chapter,
  onClose,
}: {
  text: string;
  theme: "night" | "parchment";
  chapter: Chapter;
  onClose: () => void;
}) {
  const parts = useMemo(() => sentences(text), [text]);
  // Default: the whole thing if short, else the first sentence.
  const [picked, setPicked] = useState<boolean[]>(() => parts.map((_, i) => text.length < 240 || i === 0));
  const [copied, setCopied] = useState(false);
  const quote = parts.filter((_, i) => picked[i]).join(" ") || parts[0];

  const copy = async () => {
    const out = `“${quote}”\n— ${SITE.author}, ${BOOK_TITLE}, Chapter ${chapter.number}\n${SITE.domain}`;
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  const download = async () => {
    const blob = await renderCard(quote, theme, chapter);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${SLUG}-ch${String(chapter.number).padStart(2, "0")}-quote.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <m.div className="quote-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <m.div
        className={`quote-sheet theme-${theme}`}
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quote card"
      >
        <button className="icon-btn quote-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.5} />
        </button>
        <div className="quote-card">
          <span className="quote-mark">“</span>
          <p>{quote}</p>
          <div className="quote-foot">
            <span>{BOOK_TITLE}</span>
            <span>
              {SITE.author} · Chapter {String(chapter.number).padStart(2, "0")} · {chapter.title}
            </span>
          </div>
        </div>
        {parts.length > 1 && (
          <div className="quote-chips" aria-label="Choose sentences">
            {parts.map((s, i) => (
              <button
                key={i}
                className={`chip ${picked[i] ? "is-on" : ""}`}
                onClick={() => setPicked((p) => p.map((v, j) => (j === i ? !v : v)))}
              >
                {s.length > 48 ? `${s.slice(0, 46)}…` : s}
              </button>
            ))}
          </div>
        )}
        <div className="quote-actions">
          <button className="pill" onClick={copy}>
            {copied ? <Check size={15} strokeWidth={1.5} /> : <Copy size={15} strokeWidth={1.5} />}
            <span>{copied ? "Copied" : "Copy text"}</span>
          </button>
          <button className="pill pill-amber" onClick={download}>
            <Download size={15} strokeWidth={1.5} />
            <span>Download card</span>
          </button>
        </div>
      </m.div>
    </m.div>
  );
}
