import { MessageSquareText } from "lucide-react";
import { setState } from "../lib/store";
import { BrandLink, RoomNav } from "./Link";
import { AtmosphereMixer } from "./AtmosphereMixer";

export function TopBar() {
  return (
    <header className="topbar">
      <BrandLink />
      <RoomNav className="room-nav-center" />
      <nav className="topbar-actions" aria-label="Fujinomachi controls">
        <AtmosphereMixer />
        <button className="pill" onClick={() => setState({ guestbookOpen: true })} aria-label="The Counter">
          <MessageSquareText size={15} strokeWidth={1.5} />
          <span>The Counter</span>
        </button>
      </nav>
    </header>
  );
}
