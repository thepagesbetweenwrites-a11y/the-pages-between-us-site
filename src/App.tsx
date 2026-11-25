import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { installPointerTracking } from "./lib/motion";
import { usePath } from "./lib/router";
import { Link, SiteHeader } from "./components/Link";
import { ROOM_TITLES } from "./config/site";
import Landing from "./rooms/Landing";

// The Desk ships in the main bundle; the other two rooms load on first visit.
const FujinomachiRoom = lazy(() => import("./rooms/FujinomachiRoom"));
const Notes = lazy(() => import("./rooms/Notes"));

function NotFound() {
  return (
    <div className="notes">
      <SiteHeader />
      <main className="notes-main lost">
        <p className="kicker">404</p>
        <h1>This page isn't on the shelf.</h1>
        <Link to="/" className="pill">
          Back to the desk
        </Link>
      </main>
    </div>
  );
}

function Room({ path }: { path: string }) {
  if (path === "/") return <Landing />;
  if (path === "/fujinomachi") return <FujinomachiRoom />;
  if (path === "/notes") return <Notes />;
  return <NotFound />;
}

export default function App() {
  const path = usePath();

  useEffect(() => installPointerTracking(), []);

  useEffect(() => {
    document.title = ROOM_TITLES[path] ?? "Not found · Books by Satyam";
  }, [path]);

  // Opacity only: a transform or filter here would turn every `position: fixed` stage inside into a scrolling one.
  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      <m.div
        key={path}
        className="room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<div className="room-loading" aria-busy="true" />}>
          <Room path={path} />
        </Suspense>
      </m.div>
    </AnimatePresence>
  );
}
