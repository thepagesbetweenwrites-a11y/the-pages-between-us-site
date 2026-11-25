import { useSyncExternalStore } from "react";
import { DEFAULT_LEVELS } from "./audio";
import type { Levels } from "./audio";

export type ArtifactId = "ticket" | "note" | "letter";
export type Mode = "journey" | "reader";

export interface UIState {
  mode: Mode;
  inspect: ArtifactId | null;
  inkTransition: { active: boolean; x: number; y: number; target: Mode };
  audioOn: boolean;
  mix: Levels;
  mixerOpen: boolean;
  guestbookOpen: boolean;
  fontsReady: boolean;
}

function loadMix(): Levels {
  try {
    const raw = localStorage.getItem("tpbu.mix");
    if (raw) return { ...DEFAULT_LEVELS, ...(JSON.parse(raw) as Partial<Levels>) };
  } catch {
    /* storage unavailable */
  }
  return { ...DEFAULT_LEVELS };
}

let state: UIState = {
  mode: "journey",
  inspect: null,
  inkTransition: { active: false, x: 0.5, y: 0.5, target: "reader" },
  audioOn: false,
  mix: loadMix(),
  mixerOpen: false,
  guestbookOpen: false,
  fontsReady: false,
};

const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<UIState>) {
  state = { ...state, ...patch };
  if (patch.mix) {
    try {
      localStorage.setItem("tpbu.mix", JSON.stringify(patch.mix));
    } catch {
      /* storage unavailable */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
