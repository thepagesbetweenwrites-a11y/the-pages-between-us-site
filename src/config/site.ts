import { BOOK_AUTHOR, BOOK_TITLE } from "../data/chapters";

// Author identity, used across every room, the quote cards and page metadata.
export const SITE = {
  name: "Books by Satyam",
  author: BOOK_AUTHOR,
  domain: "booksbysatyam.com",
  url: "https://booksbysatyam.com",
  year: 2026,
  book: {
    title: BOOK_TITLE,
    path: "/fujinomachi",
    blurb:
      "An Indian literature researcher on a six-month fellowship and the young woman keeping her late grandmother's bookshop alive find each other in Fujinomachi, a small coastal town in rural Japan.",
  },
  socials: [
    { handle: "@satyamk.writes", href: "https://www.instagram.com/satyamk.writes/", note: "Writing, drafts, the book" },
    { handle: "@satyam.uncut", href: "https://www.instagram.com/satyam.uncut/", note: "Everything else" },
  ],
} as const;

export const ROOMS = [
  { path: "/", label: "The Desk" },
  { path: "/fujinomachi", label: "Fujinomachi" },
  { path: "/notes", label: "Field Notes" },
] as const;

export const ROOM_TITLES: Record<string, string> = {
  "/": `${SITE.name} · ${SITE.author}`,
  "/fujinomachi": `${BOOK_TITLE} · ${SITE.author}`,
  "/notes": `Field Notes · ${SITE.name}`,
};
