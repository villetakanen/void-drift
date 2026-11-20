export type LandingHintKind = "news" | "lore" | "hint";

export interface LandingHint {
  readonly kind: LandingHintKind;
  readonly text: string;
}

/** Ordered title-screen copy: the current alpha news lead always comes first. */
export const LANDING_HINTS = [
  {
    kind: "news",
    text: "0.7.0 — FIRES IN THE SKY introduces a new ranked challenge.",
  },
  {
    kind: "hint",
    text: "Turn on Playground to fly more ships and parts.",
  },
  {
    kind: "news",
    text: "Fires in the Sky has its own leaderboard.",
  },
  {
    kind: "lore",
    text: "Remnants of the Oberon Monolith still drift from the Battle of Terra.",
  },
  {
    kind: "lore",
    text: "Luna Heavy Industries’ WASP was the workhorse of the Sol Allied Fleet.",
  },
  {
    kind: "hint",
    text: "Turn with A / D or ← / →; thrust with W / ↑, A + D, or the touch pads.",
  },
  {
    kind: "lore",
    text: "The Samurai of Sirius are notorious for their Daeshan scout ships, oversized plasma rifles, and a reckless disregard for orbital mechanics.",
  },
  {
    kind: "news",
    text: "Fires in the Sky brings plasma engines and rifles to the Hangar.",
  },
  {
    kind: "news",
    text: "Sometimes small is big, try out the new Service drive!",
  },
  {
    kind: "hint",
    text: "You can change how the camera operates, and disable the combat hud in settings.",
  },
] as const satisfies readonly LandingHint[];
