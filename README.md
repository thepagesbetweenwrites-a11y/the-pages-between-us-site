# The Pages Between Us — Website

An interactive WebGL reading experience for the novel *The Pages Between Us*: a scroll-driven journey through Fujinomachi (fluid lantern shader, dust, falling maple leaves, ink-bleed calligraphy, inspectable artifacts) that opens into a distraction-free reader for Chapter 01.

Built with Vite, React 19, TypeScript, three.js, React Three Fiber, drei, @react-three/postprocessing, GSAP, Lenis and framer-motion.

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

© The author. All rights reserved. The novel text in `src/data/chapters.ts` is not licensed for reuse.
