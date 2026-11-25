import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate, usePath } from "../lib/router";
import { ROOMS } from "../config/site";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

/** In-app link: plain <a href> for crawlers and new tabs, client-side navigation for normal clicks. */
export function Link({ to, onClick, ...rest }: Props) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...rest} />;
}

export function RoomNav({ className = "" }: { className?: string }) {
  const path = usePath();
  return (
    <nav className={`room-nav ${className}`} aria-label="Rooms">
      {ROOMS.map((r) => (
        <Link key={r.path} to={r.path} className={path === r.path ? "is-here" : ""} aria-current={path === r.path ? "page" : undefined}>
          {r.label}
        </Link>
      ))}
    </nav>
  );
}

export function BrandLink() {
  return (
    <Link to="/" className="brand" aria-label="Books by Satyam, home">
      <span className="brand-mark" aria-hidden>
        S
      </span>
      <span className="brand-name">Books by Satyam</span>
    </Link>
  );
}

/** Header used by the Desk and Field Notes rooms. */
export function SiteHeader() {
  return (
    <header className="topbar site-header">
      <BrandLink />
      <RoomNav />
    </header>
  );
}
