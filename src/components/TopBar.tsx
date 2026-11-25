import { useState } from "react";
import { Volume2, VolumeX, MessageSquareText } from "lucide-react";
import { soundscape } from "../lib/audio";
import { setState, useUI } from "../lib/store";
import { BrandLink, RoomNav } from "./Link";

export function TopBar() {
  const audioOn = useUI((s) => s.audioOn);
  const [busy, setBusy] = useState(false);

  const toggleAudio = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (audioOn) soundscape.stop();
      else await soundscape.start();
      setState({ audioOn: !audioOn });
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="topbar">
      <BrandLink />
      <RoomNav className="room-nav-center" />
      <nav className="topbar-actions" aria-label="Fujinomachi controls">
        <button className={`pill ${audioOn ? "is-on" : ""}`} onClick={toggleAudio} aria-pressed={audioOn}>
          {audioOn ? <Volume2 size={15} strokeWidth={1.5} /> : <VolumeX size={15} strokeWidth={1.5} />}
          <span>{audioOn ? "Waves & furin" : "Sound off"}</span>
          {audioOn && (
            <span className="eq" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          )}
        </button>
        <button className="pill" onClick={() => setState({ guestbookOpen: true })}>
          <MessageSquareText size={15} strokeWidth={1.5} />
          <span>The Counter</span>
        </button>
      </nav>
    </header>
  );
}
