import * as THREE from "three";

// Procedural textures for the cloth-bound hardcover on the Desk.
// Every foil element is drawn by one function into four canvases (colour,
// roughness, metalness, bump) so the gold sits exactly where the shine is.

const SERIF = "'EB Garamond', Georgia, serif";
const JP = "'Shippori Mincho', serif";

type Paint = { linen: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; foil: string | CanvasGradient };

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Deterministic PRNG so every map gets the identical weave. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Linen weave: horizontal and vertical threads with slubs. `tone` maps a 0..1 thread value to a CSS colour. */
function weave(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, tone: (v: number) => string, seed = 11) {
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = tone(r());
    ctx.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += 2) {
    ctx.fillStyle = tone(r());
    ctx.fillRect(x, 0, 1, h);
  }
  // Slubs: short thick threads.
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = tone(r() * 0.6 + 0.4);
    const horiz = r() > 0.5;
    const len = 6 + r() * 22;
    ctx.fillRect(r() * w, r() * h, horiz ? len : 1.4, horiz ? 1.4 : len);
  }
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = Array.from(text);
  const total = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
}

function drawCoverFoil(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string | CanvasGradient, line: string | CanvasGradient) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // Double rule frame.
  ctx.lineWidth = 5;
  ctx.strokeRect(58, 58, w - 116, h - 116);
  ctx.lineWidth = 2;
  ctx.strokeRect(78, 78, w - 156, h - 156);
  // Corner diamonds.
  for (const [cx, cy] of [
    [78, 78],
    [w - 78, 78],
    [78, h - 78],
    [w - 78, h - 78],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 14, cy);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 14, cy);
    ctx.closePath();
    ctx.fill();
  }
  // Moon mark.
  ctx.font = `700 150px ${JP}`;
  ctx.textAlign = "center";
  ctx.fillText("月", w / 2, 430);
  // Title.
  ctx.textAlign = "left";
  ctx.font = `500 84px ${SERIF}`;
  spacedText(ctx, "THE BOOKSHOP", w / 2, 650, 6);
  ctx.font = `italic 400 70px ${SERIF}`;
  spacedText(ctx, "at", w / 2, 770, 4);
  ctx.font = `500 84px ${SERIF}`;
  spacedText(ctx, "FUJINOMACHI", w / 2, 890, 6);
  // Rule + author.
  ctx.fillRect(w / 2 - 70, 990, 140, 4);
  ctx.font = `500 54px ${SERIF}`;
  spacedText(ctx, "SATYAM K.", w / 2, h - 200, 16);
  ctx.restore();
}

function drawSpineFoil(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string | CanvasGradient) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(0, 70, w, 4);
  ctx.fillRect(0, h - 74, w, 4);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `500 48px ${SERIF}`;
  spacedText(ctx, "THE BOOKSHOP AT FUJINOMACHI", -170, 0, 6);
  ctx.font = `500 36px ${SERIF}`;
  spacedText(ctx, "SATYAM K.", 520, 0, 8);
  ctx.restore();
}

function gold(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#f1d38a");
  g.addColorStop(0.35, "#c9a052");
  g.addColorStop(0.6, "#f6dc98");
  g.addColorStop(1, "#a97f37");
  return g;
}

export interface BoardMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

function toTex(c: HTMLCanvasElement, color = false) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function board(w: number, h: number, foil: ((ctx: CanvasRenderingContext2D, fill: string | CanvasGradient) => void) | null): BoardMaps {
  const linen = (v: number) => `rgba(${36 + v * 26}, ${38 + v * 24}, ${52 + v * 26}, ${0.35 + v * 0.4})`;
  const P: Record<keyof BoardMaps, Paint> = {
    map: { linen: (c) => weave(c, w, h, "#1b1d27", linen), foil: "" },
    roughnessMap: { linen: (c) => weave(c, w, h, "#e6e6e6", (v) => `rgba(${200 + v * 55},${200 + v * 55},${200 + v * 55},0.5)`), foil: "#4a4a4a" },
    metalnessMap: { linen: (c) => ((c.fillStyle = "#000"), c.fillRect(0, 0, w, h)), foil: "#fff" },
    bumpMap: { linen: (c) => weave(c, w, h, "#808080", (v) => `rgba(${90 + v * 120},${90 + v * 120},${90 + v * 120},0.55)`), foil: "#3a3a3a" },
  };
  const out = {} as BoardMaps;
  (Object.keys(P) as (keyof BoardMaps)[]).forEach((k) => {
    const c = canvas(w, h);
    const ctx = c.getContext("2d")!;
    P[k].linen(ctx, w, h);
    if (foil) foil(ctx, k === "map" ? gold(ctx, w, h) : P[k].foil);
    out[k] = toTex(c, k === "map");
  });
  return out;
}

export function coverMaps() {
  return board(1024, 1536, (ctx, fill) => drawCoverFoil(ctx, 1024, 1536, fill, fill));
}
export function spineMaps() {
  return board(160, 1536, (ctx, fill) => drawSpineFoil(ctx, 160, 1536, fill));
}
export function backMaps() {
  return board(512, 768, null);
}

/** Cream page edges: fine stripes. `across` = stripes vary along u (vertical lines). */
export function pageEdge(across: boolean) {
  const c = canvas(512, 512);
  const ctx = c.getContext("2d")!;
  const r = rng(5);
  ctx.fillStyle = "#e9dcbf";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 512; i += 2) {
    const v = r();
    ctx.fillStyle = `rgba(${150 + v * 40}, ${128 + v * 30}, ${96 + v * 20}, ${0.12 + v * 0.22})`;
    if (across) ctx.fillRect(i, 0, 1, 512);
    else ctx.fillRect(0, i, 512, 1);
  }
  // Soft age toward the edges.
  const g = across ? ctx.createLinearGradient(0, 0, 0, 512) : ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, "rgba(160,120,60,0.18)");
  g.addColorStop(0.15, "rgba(160,120,60,0)");
  g.addColorStop(0.85, "rgba(160,120,60,0)");
  g.addColorStop(1, "rgba(160,120,60,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return toTex(c, true);
}

/** Endpaper inside the front board: amber with a faint wave pattern. */
export function endpaper() {
  const c = canvas(512, 768);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#b8873f";
  ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = "rgba(60, 36, 12, 0.22)";
  ctx.lineWidth = 2;
  for (let y = 10; y < 790; y += 26) {
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, y + Math.sin((x / 512) * Math.PI * 6 + y) * 5);
    ctx.stroke();
  }
  return toTex(c, true);
}

/** First page under the cover: chapter title and the chapter epigraph. */
export function titlePage(epigraph: string) {
  const c = canvas(768, 1152);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#efe4cb";
  ctx.fillRect(0, 0, 768, 1152);
  const g = ctx.createRadialGradient(384, 520, 80, 384, 576, 720);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(150,110,60,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 768, 1152);
  ctx.fillStyle = "#8a6a3a";
  ctx.textAlign = "left";
  ctx.font = `500 26px ${SERIF}`;
  spacedText(ctx, "CHAPTER 01", 384, 420, 8);
  ctx.textAlign = "center";
  ctx.fillStyle = "#2a2018";
  ctx.font = `400 64px ${SERIF}`;
  ctx.fillText("Fujinomachi Station", 384, 520);
  ctx.fillStyle = "#5a4630";
  ctx.font = `italic 400 30px ${SERIF}`;
  const words = epigraph.split(" ");
  let line = "";
  let y = 620;
  for (const wd of words) {
    const test = line ? `${line} ${wd}` : wd;
    if (ctx.measureText(test).width > 520 && line) {
      ctx.fillText(line, 384, y);
      line = wd;
      y += 44;
    } else line = test;
  }
  if (line) ctx.fillText(line, 384, y);
  return toTex(c, true);
}

/** Soft elliptical contact shadow. */
export function shadowTexture() {
  const c = canvas(256, 256);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.75)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTex(c);
}
