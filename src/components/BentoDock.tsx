import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, Feather, Map as MapIcon, PenLine } from "lucide-react";
import { Link } from "./Link";
import { Magnetic } from "./Magnetic";
import { SITE } from "../config/site";
import { chapters } from "../data/chapters";
import { ARCHIVE } from "../data/notes";
import { WALK_STOPS } from "../data/walk";

/** Pointer spotlight: tiles light up where the cursor is. */
function track(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function Tile({
  to,
  href,
  className = "",
  kicker,
  title,
  meta,
  icon,
}: {
  to?: string;
  href?: string;
  className?: string;
  kicker: string;
  title: string;
  meta: ReactNode;
  icon: ReactNode;
}) {
  const body = (
    <>
      <span className="bento-kicker">{kicker}</span>
      <span className="bento-title">{title}</span>
      <span className="bento-meta">{meta}</span>
      <span className="bento-icon" aria-hidden>
        {icon}
      </span>
    </>
  );
  const cls = `bento-tile ${className}`;
  return (
    <Magnetic strength={0.08} className={`bento-cell ${className}`}>
      {to ? (
        <Link to={to} className={cls} onPointerMove={track}>
          {body}
        </Link>
      ) : href ? (
        <a href={href} className={cls} onPointerMove={track} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      ) : (
        <div className={cls} onPointerMove={track}>
          {body}
        </div>
      )}
    </Magnetic>
  );
}

export function BentoDock() {
  const ch = chapters[0];
  const minutes = ch ? Math.round(ch.words / 230) : 13;
  return (
    <nav className="bento" aria-label="From the desk">
      <Tile
        to="/fujinomachi#read"
        className="bento-wide bento-lead"
        kicker="Chapter 01"
        title="Fujinomachi Station"
        meta={<>Read now · {minutes} min</>}
        icon={<BookOpen size={20} strokeWidth={1.4} />}
      />
      <Tile
        className="bento-status"
        kicker="Chapter 02"
        title="Tsukiyomi Books"
        meta={
          <>
            <i className="live-dot" aria-hidden /> Writing next
          </>
        }
        icon={<PenLine size={18} strokeWidth={1.4} />}
      />
      <Tile
        to="/fujinomachi#walk"
        kicker="Fujinomachi"
        title="12-Minute Walk Map & Artifacts"
        meta={<>{WALK_STOPS.length} stops · 3 artifacts</>}
        icon={<MapIcon size={18} strokeWidth={1.4} />}
      />
      <Tile
        to="/notes#archive"
        className="bento-wide"
        kicker="Field Notes"
        title="Early Verse Archive"
        meta={<>2018–2020 · {ARCHIVE.length} pieces</>}
        icon={<Feather size={18} strokeWidth={1.4} />}
      />
      {SITE.socials.map((s) => (
        <Tile key={s.handle} href={s.href} kicker="Elsewhere" title={s.handle} meta="Instagram" icon={<ArrowUpRight size={18} strokeWidth={1.4} />} />
      ))}
    </nav>
  );
}
