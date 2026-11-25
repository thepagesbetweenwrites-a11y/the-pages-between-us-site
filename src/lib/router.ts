import { useSyncExternalStore } from "react";

// A tiny History-API router: three rooms don't need a routing library.
const EVENT = "booksbysatyam:navigate";

function normalize(path: string) {
  const p = path.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function usePath() {
  return useSyncExternalStore(
    subscribe,
    () => normalize(window.location.pathname),
    () => "/",
  );
}

export function navigate(to: string, { replace = false } = {}) {
  const url = new URL(to, window.location.origin);
  if (normalize(url.pathname) === normalize(window.location.pathname) && url.hash === window.location.hash) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(EVENT));
}
