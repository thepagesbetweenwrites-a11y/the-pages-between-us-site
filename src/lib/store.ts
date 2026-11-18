import { useSyncExternalStore } from "react";

export type ArtifactId = "ticket" | "note" | "letter";
export type Mode = "journey" | "reader";

export interface UIState {
  mode: Mode;
  inspect: ArtifactId | null;
  inkTransition: { active: boolean; x: number; y: number; target: Mode };
  audioOn: boolean;
  guestbookOpen: boolean;
  fontsReady: boolean;
}

let state: UIState = {
  mode: "journey",
  inspect: null,
  inkTransition: { active: false, x: 0.5, y: 0.5, target: "reader" },
  audioOn: false,
  guestbookOpen: false,
  fontsReady: false,
};

const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<UIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
