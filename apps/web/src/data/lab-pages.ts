import { z } from "astro/zod";

// The Lab's page map: the nav rail and the /lab index render from it.
// `source` says what a page shows: the game's own code, a study-local
// drawing, or a design record.
const labGroupSchema = z.enum([
  "design-system",
  "ships-and-world",
  "tools",
  "studies",
]);
export const labGroups: {
  id: z.infer<typeof labGroupSchema>;
  label: string;
}[] = [
  { id: "design-system", label: "Design system" },
  { id: "ships-and-world", label: "Ships and world" },
  { id: "tools", label: "Tools" },
  { id: "studies", label: "Studies" },
];

export const labPageSchema = z.object({
  href: z.string().regex(/^\/lab(?:\/[a-z0-9-]+)+$/),
  title: z.string().min(1),
  purpose: z.string().min(1),
  group: labGroupSchema,
  source: z.enum(["production", "sketch", "record"]),
  /** Another page's href when this route only keeps an old link working. */
  aliasOf: z.string().optional(),
});
export type LabPage = z.infer<typeof labPageSchema>;

export const labPages = z.array(labPageSchema).parse([
  {
    href: "/lab/entities/derelict",
    title: "Derelict",
    purpose:
      "Damage-driven shedding, fitted collisions and shared derelict artwork.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/tokens",
    title: "Colour roles",
    purpose: "Colour tokens and the roles each one may play.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/typography",
    title: "Typography",
    purpose: "Type families, scale and tracking.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/surfaces",
    title: "Surfaces",
    purpose: "Cut surfaces, panels and their elevation.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/inputs",
    title: "Inputs",
    purpose: "Buttons, toggle and ring slider in every state.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/buttons",
    title: "Buttons",
    purpose: "The button reference, on the inputs page.",
    group: "design-system",
    source: "production",
    aliasOf: "/lab/inputs",
  },
  {
    href: "/lab/logomark",
    title: "Logomark",
    purpose: "The mark and its sizes.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/graphs",
    title: "Graphs",
    purpose: "The Motion instrument's path and trace graphs.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/instrument-parts",
    title: "Motion instrument parts",
    purpose: "The Motion instrument's panes and controls on their own.",
    group: "design-system",
    source: "production",
  },
  {
    href: "/lab/entities/ship",
    title: "Ships",
    purpose: "The fleet: drawings, identity and fitted chassis.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/entities/star",
    title: "Suns",
    purpose: "The standard Sun: collection, exposure and live field feedback.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/entities/planet",
    title: "Planets",
    purpose: "Planet types and drawing; sliders preview only.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/resources",
    title: "Resources",
    purpose: "Hull and fuel readouts.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/utility-artwork",
    title: "Utility artwork",
    purpose: "Utility machinery and the gravity coil across the fleet.",
    group: "ships-and-world",
    source: "production",
  },
  {
    href: "/lab/ion-engines",
    title: "Ion effects",
    purpose: "Ion engine sizes, from the accepted study comparison.",
    group: "ships-and-world",
    source: "sketch",
  },

  {
    href: "/lab/instrument",
    title: "Ship tuning",
    purpose:
      "Compare ships on fixed burns, no gravity; copy the document back.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/gravity-tuning",
    title: "Gravity tuning",
    purpose:
      "One well and the given ships on fixed burns; tune its mass and size.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/mount-planner",
    title: "Mount planner",
    purpose: "Place engine and weapon mounts; copy the plan.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/builder",
    title: "Ship builder",
    purpose: "The hangar with Lab builds.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/ship-propulsion",
    title: "Ship propulsion",
    purpose:
      "The shared installed-engine cruise ceiling and its flight behavior.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/fx",
    title: "Arcade FX",
    purpose: "FX workload bench with frame timings.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/landing",
    title: "Opening screen",
    purpose: "The game's opening screen on its own route.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/studies",
    title: "Design studies",
    purpose: "Every study with its phase and outcome.",
    group: "studies",
    source: "record",
  },
]);

/** Pages shown in navigation: aliases stay routable but unlisted. */
export const listedLabPages = labPages.filter((page) => !page.aliasOf);
