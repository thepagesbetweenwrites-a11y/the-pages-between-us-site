# Books by Satyam — Author Hub

The website of Satyam K. ([booksbysatyam.com](https://booksbysatyam.com)), in three rooms:

| Route | Room | What's there |
|---|---|---|
| `/` | The Quiet Desk | Lantern-and-dust WebGL shader, kinetic name, manifesto, 3D-tilting book for *The Bookshop at Fujinomachi*, Coming Next, magnetic links to @satyamk.writes and @satyam.uncut |
| `/fujinomachi` | Living Book | Scroll journey through Fujinomachi (fluid lantern shader, dust, maple leaves, ink-bleed calligraphy, inspectable artifacts), the Chapter 01 reader, PNG quote cards and the Tsukiyomi Books Counter guestbook |
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
