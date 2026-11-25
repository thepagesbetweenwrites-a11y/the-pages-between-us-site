import { BOOK_AUTHOR, BOOK_TITLE } from "../data/chapters";

// Author identity, used across every room, the quote cards and page metadata.
export const SITE = {
  name: "Books by Satyam",
  author: BOOK_AUTHOR,
  manifesto: "Stories about quiet places, the distance between home and where you land, and the things people leave behind.",
  domain: "booksbysatyam.com",
  url: "https://booksbysatyam.com",
  year: 2026,
  book: {
    title: BOOK_TITLE,
    path: "/fujinomachi",
    hook: "Six months looked smaller in the email. On a tatami floor with one suitcase and a jar of mango pickle, it looks like a year.",
    blurb:
      "An Indian literature researcher on a six-month fellowship and the young woman keeping her late grandmother's bookshop alive find each other in Fujinomachi, a small coastal town in rural Japan.",
  },
  socials: [
    { handle: "@satyamk.writes", href: "https://www.instagram.com/satyamk.writes/" },
    { handle: "@satyam.uncut", href: "https://www.instagram.com/satyam.uncut/" },
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
