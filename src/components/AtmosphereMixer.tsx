import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { AudioLines, CloudRain, Waves, Wind, Power } from "lucide-react";
import { CHANNELS, soundscape } from "../lib/audio";
import type { Channel } from "../lib/audio";
import { getState, setState, useUI } from "../lib/store";

const ICONS: Record<Channel, typeof Waves> = { sea: Waves, furin: Wind, rain: CloudRain };

/** Compact pill that opens a three-channel atmosphere mixer. Lives in the top bar,
 *  so it works over the scroll journey and inside the Chapter 01 reader. */
export function AtmosphereMixer() {
  const audioOn = useUI((s) => s.audioOn);
  const mix = useUI((s) => s.mix);
  const open = useUI((s) => s.mixerOpen);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const power = async (on: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (on) await soundscape.start(getState().mix);
      else soundscape.stop();
      setState({ audioOn: on });
    } finally {
      setBusy(false);
    }
  };

  const setLevel = (ch: Channel, v: number) => {
    const next = { ...getState().mix, [ch]: v };
    setState({ mix: next });
    soundscape.setLevel(ch, v);
    // Raising any slider while silent turns the room on.
    if (v > 0 && !getState().audioOn) void power(true);
  };

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setState({ mixerOpen: false });
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState({ mixerOpen: false });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mixer" ref={wrap}>
      <button
        className={`pill ${audioOn ? "is-on" : ""}`}
        onClick={() => setState({ mixerOpen: !open })}
        aria-expanded={open}
        aria-controls="atmosphere-panel"
        aria-label="Atmosphere mixer"
      >
        <AudioLines size={15} strokeWidth={1.5} />
        <span>Atmosphere</span>
        {audioOn && (
          <span className="eq" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            id="atmosphere-panel"
            className="mixer-panel"
            role="group"
            aria-label="Atmosphere mixer"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mixer-head">
              <span className="kicker">Atmosphere</span>
              <button
                className={`mixer-power ${audioOn ? "is-on" : ""}`}
                onClick={() => void power(!audioOn)}
                aria-pressed={audioOn}
                disabled={busy}
              >
                <Power size={13} strokeWidth={1.8} />
                <span>{audioOn ? "On" : "Off"}</span>
              </button>
            </div>
            {CHANNELS.map(({ id, label }) => {
              const Icon = ICONS[id];
              const v = mix[id];
              return (
                <label key={id} className={`mixer-row ${audioOn && v > 0 ? "is-live" : ""}`}>
                  <Icon size={16} strokeWidth={1.5} aria-hidden />
                  <span className="mixer-label">{label}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(v * 100)}
                    onChange={(e) => setLevel(id, Number(e.target.value) / 100)}
                    style={{ ["--fill" as string]: `${Math.round(v * 100)}%` }}
                    aria-label={`${label} volume`}
                  />
                </label>
              );
            })}
            <p className="mixer-note">Synthesized live in your browser, no audio files.</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
