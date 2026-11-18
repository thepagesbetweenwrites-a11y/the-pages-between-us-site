// Capture preview screenshots of the site at desktop and mobile sizes.
// Usage: node scripts/capture-preview.mjs [url] [outDir]
// Needs the dev server running (npm run dev). Uses the installed Google Chrome.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] ?? "http://127.0.0.1:5180/";
const outDir = path.resolve(process.argv[3] ?? path.join(here, "..", "preview"));
const SETTLE = Number(process.env.SETTLE ?? 4500); // software WebGL is slow; let shaders settle

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
];

const wait = (page, ms = SETTLE) => page.waitForTimeout(ms);
const scrollTo = (page, p) =>
  page.evaluate((p) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * p), p);

/** Screen position of a named 3D object (via the dev-only window.__r3f hook). */
async function screenPos(page, name) {
  return page.evaluate((name) => {
    const s = window.__r3f;
    const o = s?.scene.getObjectByName(name);
    if (!o) return null;
    const v = o.getWorldPosition(new o.position.constructor()).project(s.camera);
    return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight };
  }, name);
}

async function capture(browser, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  let n = 0;
  const shot = async (label) => {
    n += 1;
    const file = path.join(outDir, `${vp.name}-${String(n).padStart(2, "0")}-${label}.png`);
    await page.screenshot({ path: file });
    console.log(`  ${path.basename(file)}`);
  };
  const click = async (x, y) => (vp.isMobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));

  console.log(`${vp.name} ${vp.width}x${vp.height}`);
  await page.goto(url, { waitUntil: "networkidle" });
  await wait(page);
  await shot("hero");

  // Cursor trail -> amber ripples + leaf vortex.
  if (!vp.isMobile) {
    for (let i = 0; i <= 28; i++) await page.mouse.move(380 + i * 26, 360 + Math.sin(i / 3) * 120, { steps: 2 });
    await wait(page, 600);
    await shot("cursor-ripples");
  }

  const stops = [
    [0.12, "calligraphy"],
    [0.21, "kana"],
    [0.34, "epigraph"],
    [0.48, "ticket"],
  ];
  for (const [p, label] of stops) {
    await scrollTo(page, p);
    await wait(page);
    await shot(label);
  }

  // Hover state (desktop): checks the rim glow stays soft and the ink stays legible.
  if (!vp.isMobile) {
    const pos = await screenPos(page, "artifact-ticket");
    if (pos) {
      await page.mouse.move(pos.x, pos.y, { steps: 6 });
      await wait(page, SETTLE * 0.6);
      await shot("ticket-hover");
    }
  }

  // Inspect each artifact: scroll to it, click its projected position, capture, close.
  for (const [p, id] of [
    [0.48, "ticket"],
    [0.605, "note"],
    [0.73, "letter"],
  ]) {
    await scrollTo(page, p);
    await wait(page);
    const pos = await screenPos(page, `artifact-${id}`);
    if (!pos) {
      console.log(`  (skip inspect-${id}: object not found)`);
      continue;
    }
    await click(pos.x, pos.y);
    await wait(page, SETTLE * 0.7);
    if (await page.locator(".inspect-panel").count()) await shot(`inspect-${id}`);
    else console.log(`  (inspect-${id}: click missed)`);
    await page.keyboard.press("Escape");
    await wait(page, 900);
  }

  await scrollTo(page, 0.95);
  await wait(page);
  await shot("enter-chapter");

  // Ink transition into the reader.
  const btn = page.locator(".enter-btn");
  const box = await btn.boundingBox();
  if (box) await click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForSelector(".reader", { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector(".ink-veil.is-active"), null, { timeout: 30000 });
  await wait(page, 1200);
  await shot("reader-night");

  await page.locator(".reader-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight * 0.32));
  await wait(page, 1500);
  await shot("reader-scene-break");

  await page.getByRole("button", { name: "Toggle reading theme" }).click();
  await wait(page, 1200);
  await shot("reader-parchment");

  await page.locator(".para").nth(2).click();
  await page.waitForSelector(".quote-sheet");
  await wait(page, 900);
  await shot("quote-card");
  await page.getByRole("button", { name: "Close" }).first().click();
  await wait(page, 600);

  // Guestbook drawer with one note pinned.
  await page.locator(".topbar .pill").last().click();
  await page.waitForSelector(".drawer");
  await page.locator(".note-form textarea").fill("The pickle jar knocking inside the suitcase got me. Waiting for Hana.");
  await page.locator(".note-form input").fill("Preview");
  await page.locator(".note-form button[type=submit]").click();
  await wait(page, 1100);
  await shot("counter-drawer");

  await ctx.close();
  if (errors.length) console.log(`  console errors:\n   - ${errors.join("\n   - ")}`);
  return n;
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
let total = 0;
for (const vp of VIEWPORTS) total += await capture(browser, vp);
await browser.close();
console.log(`\n${total} screenshots -> ${outDir}`);
