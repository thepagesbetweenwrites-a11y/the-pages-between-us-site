# Books by Satyam — Author Hub

The website of Satyam K. ([booksbysatyam.com](https://booksbysatyam.com)), in three rooms:

| Route | Room | What's there |
|---|---|---|
| `/` | The Midnight Desk | Volumetric desk-lamp beam shader with ink-dust and film grain, kinetic name + manifesto, a 3D cloth-bound hardcover (linen boards, gold-foil title, cream page block) that tilts with the pointer and swings open into `/fujinomachi`, and a glass Bento Dock (Chapter 01, Chapter 02 status, walk map, verse archive, Instagram) |
| `/fujinomachi` | Living Book | Scroll journey through Fujinomachi, the 12-Minute Walk map (brush-stroke route, 5 stops quoting Chapter 01), the Chapter 01 reader, PNG quote cards, the Tsukiyomi Books Counter, and the Atmosphere Mixer (sea, furin, rain) in the top bar. Deep links: `#walk`, `#read` |
| `/notes` | Field Notes | Dispatches plus a collapsible Early Verse & Essays (2018–2020) archive |

Routing is a small History-API router (`src/lib/router.ts`); `vercel.json` rewrites every path to `index.html` and sets the security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS). Author identity lives in `src/config/site.ts`; dispatches and archive pieces in `src/data/notes.ts`.

Built with Vite, React 19, TypeScript, three.js, React Three Fiber, @react-three/postprocessing, GSAP, Lenis and framer-motion.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/
```

## Chapter text

`src/data/chapters.ts` is generated from the novel's locked chapters by `npm run sync-novel`, which reads `../publishing/book/chapters/*.md`. It runs automatically before `dev` and `build`. In a standalone clone (CI, hosting) that folder doesn't exist, so the committed `chapters.ts` is used as-is.

## Reader discussion (Giscus)

The Counter drawer's reviews tab uses [Giscus](https://giscus.app) (GitHub Discussions). It stays off until you fill in `src/config/giscus.ts`:

1. Make this repository public and enable Discussions.
2. Install the giscus GitHub app on it.
3. Copy `repo`, `repoId` and `categoryId` from giscus.app into the config.

Note cards in the same drawer are stored only in each visitor's browser.

## Preview screenshots

With the dev server running on port 5180 (`npx vite --port 5180`), `npm run preview:shots` captures desktop (1440×900) and mobile (390×844) screenshots into `preview/` using Playwright and the installed Google Chrome. `preview/` is git-ignored.

## Notes

- No WebGL (old GPU, locked-down drivers): the 3D stage falls back to a still backdrop and the reader still works.
- Sound is synthesized with the Web Audio API (no audio files) and starts only after the visitor turns it on.

© 2026 Satyam K. All rights reserved. The novel text in `src/data/chapters.ts` is not licensed for reuse.
