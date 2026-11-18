import * as THREE from "three";

// All 3D text and paper artifacts are painted onto 2D canvases with the real
// web fonts (loaded via Google Fonts in index.html), then uploaded as textures.

export const FONT_LOADS = [
  "700 120px 'Shippori Mincho'",
  "500 120px 'Shippori Mincho'",
  "italic 400 64px 'EB Garamond'",
  "400 64px 'EB Garamond'",
  "500 64px 'EB Garamond'",
  "400 48px 'Kalam'",
  "400 32px 'Inter'",
];

export async function loadFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  try {
    await Promise.all(FONT_LOADS.map((f) => document.fonts.load(f, "月読書店 Aa")));
  } catch {
    /* fall back to system fonts */
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// Deterministic pseudo-random so textures look the same on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function paperGrain(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, seed: number, strength = 0.06) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 255 * strength;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);
  // Soft foxing stains.
  for (let k = 0; k < 9; k++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 20 + r() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(120,80,30,0.10)");
    g.addColorStop(1, "rgba(120,80,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

/** Vertical calligraphy column (white ink on transparent; colored in shader). */
export function calligraphyTexture(text: string) {
  const chars = [...text];
  const size = 220;
  const { c, ctx } = makeCanvas(320, size * chars.length + 160);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${size}px 'Shippori Mincho', serif`;
  chars.forEach((ch, i) => ctx.fillText(ch, c.width / 2, 80 + size * (i + 0.5)));
  return { texture: toTexture(c), aspect: c.width / c.height };
}

/** The Chapter 1 epigraph, set in EB Garamond italic, wrapped. */
export function epigraphTexture(text: string, narrow = false) {
  // Narrow (< 480px wide screens): a taller block with generous side padding.
  const { c, ctx } = narrow ? makeCanvas(1200, 1000) : makeCanvas(2048, 640);
  const fontPx = narrow ? 84 : 96;
  const wrapW = narrow ? 980 : 1800;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 400 ${fontPx}px 'EB Garamond', serif`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > wrapW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const lh = narrow ? 112 : 128;
  const top = c.height / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, top + i * lh));
  ctx.font = `500 ${narrow ? 34 : 40}px 'Inter', sans-serif`;
  ctx.globalAlpha = 0.55;
  const footer = narrow ? "C H A P T E R   0 1" : "C H A P T E R   0 1   ·   F U J I N O M A C H I   S T A T I O N";
  ctx.fillText(footer, c.width / 2, top + lines.length * lh + 40);
  return { texture: toTexture(c), aspect: c.width / c.height };
}

/** Platform 02 station ticket (edmondson-style card). */
export function ticketTexture() {
  const w = 1024;
  const h = 512;
  const { c, ctx } = makeCanvas(w, h);
  paperGrain(ctx, w, h, "#d9cdb0", 11, 0.08);
  // Printed guilloche band.
  ctx.strokeStyle = "rgba(160,70,50,0.22)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 46; i++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = 90 + Math.sin(x / 38 + i * 0.4) * 14 + i * 7.5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(217,205,176,0.86)";
  ctx.fillRect(40, 60, w - 80, h - 120);
  ctx.strokeStyle = "#7a2e22";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 60, w - 80, h - 120);
  ctx.fillStyle = "#2a2018";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 76px 'Shippori Mincho', serif";
  ctx.fillText("ふじのまち", 84, 172);
  ctx.font = "500 34px 'Inter', sans-serif";
  ctx.fillText("FUJINOMACHI", 88, 220);
  ctx.font = "700 150px 'Shippori Mincho', serif";
  ctx.fillStyle = "#7a2e22";
  ctx.textAlign = "right";
  ctx.fillText("02", w - 84, 230);
  ctx.font = "500 30px 'Inter', sans-serif";
  ctx.fillText("番線  PLATFORM", w - 86, 268);
  ctx.textAlign = "left";
  ctx.fillStyle = "#2a2018";
  ctx.font = "500 36px 'Inter', sans-serif";
  ctx.fillText("片道  SINGLE  ·  下車前途無効", 88, 330);
  ctx.font = "400 30px 'Inter', sans-serif";
  ctx.fillText("SUNDAY · NOVEMBER · LATE AFTERNOON", 88, 380);
  ctx.textAlign = "right";
  ctx.font = "700 44px 'Inter', sans-serif";
  ctx.fillText("¥ 240", w - 86, 384);
  // Punched hole.
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(w / 2 + 40, 108, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  return { texture: toTexture(c), aspect: w / h };
}

/** Ma's note, rolled into a sock (Chapter 1, Scene 2). */
export function noteTexture() {
  const w = 900;
  const h = 1100;
  const { c, ctx } = makeCanvas(w, h);
  paperGrain(ctx, w, h, "#ece4d0", 23, 0.05);
  // Fold creases from being rolled.
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    const g = ctx.createLinearGradient(0, y - 14, 0, y + 14);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, "rgba(60,40,20,0.16)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 14, w, 28);
  }
  // Ruled lines.
  ctx.strokeStyle = "rgba(70,110,170,0.22)";
  ctx.lineWidth = 2;
  for (let y = 210; y < h - 60; y += 92) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(w - 60, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1f3a78";
  ctx.font = "400 74px 'Kalam', cursive";
  ctx.save();
  ctx.translate(90, 0);
  ctx.transform(1, 0, -0.12, 1, 0, 0); // leans hard to the right
  const lines = ["Eat properly.", "Don’t just have", "maggi.", "", "Call on Sundays."];
  lines.forEach((l, i) => ctx.fillText(l, 40, 190 + i * 92));
  ctx.restore();
  return { texture: toTexture(c), aspect: w / h };
}

/** A 1913 letter from the university archive (the parallel love story). */
export function letterTexture() {
  const w = 900;
  const h = 1200;
  const { c, ctx } = makeCanvas(w, h);
  paperGrain(ctx, w, h, "#d8c49a", 37, 0.1);
  // Burnished edges.
  const edge = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.85);
  edge.addColorStop(0, "rgba(90,55,20,0)");
  edge.addColorStop(1, "rgba(90,55,20,0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#3a2614";
  ctx.font = "italic 400 46px 'EB Garamond', serif";
  ctx.textAlign = "right";
  ctx.fillText("— 1913", w - 90, 130);
  ctx.textAlign = "left";
  ctx.font = "italic 400 54px 'EB Garamond', serif";
  ctx.fillText("Dear friend,", 90, 240);
  // Faded, illegible lines of a longer letter (no invented canon text).
  const r = rng(91);
  ctx.strokeStyle = "rgba(58,38,20,0.28)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const y = 330 + i * 64;
    const len = i === 5 ? 380 : 620 + r() * 80;
    ctx.beginPath();
    for (let x = 0; x <= len; x += 6) {
      const yy = y + Math.sin(x * 0.21 + i) * 5 + Math.sin(x * 0.047) * 3 + (r() - 0.5) * 3;
      if (x === 0) ctx.moveTo(90 + x, yy);
      else ctx.lineTo(90 + x, yy);
    }
    ctx.stroke();
  }
  // The one line that survives clearly: the book's epigraph.
  ctx.fillStyle = "#3a2614";
  ctx.font = "italic 400 54px 'EB Garamond', serif";
  ctx.fillText("I do not know your seasons,", 90, 790);
  ctx.fillText("but I want to learn them.", 90, 866);
  // Faded ink blot + archive stamp.
  ctx.fillStyle = "rgba(40,25,12,0.35)";
  ctx.beginPath();
  ctx.ellipse(640, 980, 26, 14, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(130,40,40,0.55)";
  ctx.lineWidth = 4;
  ctx.strokeRect(90, 1010, 300, 110);
  ctx.fillStyle = "rgba(130,40,40,0.6)";
  ctx.font = "500 26px 'Inter', sans-serif";
  ctx.fillText("UNIVERSITY ARCHIVE", 112, 1056);
  ctx.fillText("CORRESP. 1913–1917", 112, 1094);
  return { texture: toTexture(c), aspect: w / h };
}

/** Maple leaf alpha sprite (white; tinted per instance). */
export function mapleTexture() {
  const s = 256;
  const { c, ctx } = makeCanvas(s, s);
  ctx.translate(s / 2, s / 2 + 18);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  // Seven-lobed palmate outline in polar form.
  const N = 720;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const lobes = Math.pow(Math.abs(Math.cos(3.5 * (a - Math.PI / 2))), 0.6);
    const serr = 0.06 * Math.abs(Math.sin(a * 28));
    const lower = Math.sin(a) > 0.55 ? 0.45 : 1; // pinch the base
    const r = (52 + 62 * lobes) * (1 - serr) * lower;
    const x = Math.cos(a - Math.PI / 2) * r;
    const y = Math.sin(a - Math.PI / 2) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Veins (cut slightly darker via alpha).
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * (Math.PI / 3.6);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(Math.cos(a) * 100, Math.sin(a) * 100);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.fillRect(-3, 10, 6, 70); // stem
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
