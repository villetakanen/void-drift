export type LandingHintKind = "news" | "lore" | "hint";

export interface LandingHint {
  readonly kind: LandingHintKind;
  readonly text: string;
}

/** Ordered title-screen copy: the current alpha news lead always comes first. */
export const LANDING_HINTS = [
  {
    kind: "news",
    text: "0.6.0 — ION STORM brings ion engines and weapons to the fleet.",
  },
  {
    kind: "hint",
    text: "Turn on Playground to fly more ships and parts.",
  },
  {
    kind: "news",
    text: "The global leaderboard resets with 0.6.0.",
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
] as const satisfies readonly LandingHint[];
