// Giscus (GitHub Discussions) settings for "The Counter" guestbook.
// 1. Make the repo public and enable Discussions (Settings → Features).
// 2. Install the giscus app: https://github.com/apps/giscus
// 3. Generate the IDs at https://giscus.app and paste them below.
// Until `repo`, `repoId` and `categoryId` are filled in, the drawer shows setup steps instead.
export const giscusConfig = {
  repo: "", // e.g. "your-name/the-pages-between-us"
  repoId: "", // e.g. "R_kgDO..."
  category: "Guestbook",
  categoryId: "", // e.g. "DIC_kwDO..."
  mapping: "specific" as const,
  term: "tsukiyomi-books-counter",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top" as const,
  theme: "transparent_dark",
  lang: "en",
};

export const giscusReady = Boolean(giscusConfig.repo && giscusConfig.repoId && giscusConfig.categoryId);
