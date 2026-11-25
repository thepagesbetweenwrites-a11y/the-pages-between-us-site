// Aru's route in Chapter 01, in the order the chapter walks it. Every quote is
// verbatim from the locked chapter text (checked against src/data/chapters.ts).
// Coordinates are in the map's 1000 × 560 viewBox.

export interface WalkStop {
  id: string;
  n: number;
  name: string;
  note: string;
  x: number;
  y: number;
  quote: string;
  evening?: boolean;
}

export const WALK_INTRO = "Twelve minutes on foot, the sheet says. Whoever timed it was not carrying Ma’s suitcase.";

export const WALK_STOPS: WalkStop[] = [
  {
    id: "station",
    n: 1,
    name: "Fujinomachi Station",
    note: "Platform 02",
    x: 110,
    y: 438,
    quote:
      "The faint sound of the wind blowing through the trees past the station, a wind chime somewhere I can't find. And underneath everything, faint but steady - the sea.",
  },
  {
    id: "barbershop",
    n: 2,
    name: "The Sleeping Barbershop",
    note: "Pole turning, no barber",
    x: 318,
    y: 318,
    quote:
      "Red and blue stripes turn inside the glass, climbing and getting nowhere. In the chair an old man sleeps with a newspaper over his chest, and there is no barber anywhere.",
  },
  {
    id: "tsukiyomi",
    n: 3,
    name: "Tsukiyomi Books",
    note: "Curtain drawn. He doesn’t stop.",
    x: 586,
    y: 212,
    quote: "A curtain is drawn across the glass and the lights are off.",
  },
  {
    id: "cleaner",
    n: 4,
    name: "The Steaming Dry Cleaner’s",
    note: "His room is upstairs",
    x: 852,
    y: 132,
    quote:
      "The shop is closed, but a warm smell of starch and steam seeps under the door, and plastic-wrapped shirts hang on a rail inside. A metal staircase climbs the side of the building, painted green a long time ago.",
  },
  {
    id: "ramen",
    n: 5,
    name: "Corner Ramen Stall",
    note: "Ichiban · that evening",
    x: 520,
    y: 452,
    evening: true,
    quote:
      "One red paper lantern with black writing on it, swinging a little. Steam lifts off a pot at the back and the wind takes it sideways.",
  },
];

/** Afternoon route: station → barbershop → (konbini) → Tsukiyomi Books → dry cleaner's. */
export const WALK_PATH =
  "M110 438 C 170 410, 240 360, 318 318 S 430 262, 470 250 S 540 226, 586 212 S 720 168, 760 156 S 820 138, 852 132";

/** Evening detour: back down past the konbini to the ramen stall. */
export const EVENING_PATH = "M852 132 C 820 230, 700 260, 640 320 S 560 420, 520 452";
