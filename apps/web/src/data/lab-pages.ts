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
  // Design-system pages: the shared files the page demonstrates, and the
  // section of the contract that defines them. /lab/ds lists both.
  defines: z.array(z.string().min(1)).optional(),
  spec: z
    .string()
    .regex(/^docs\/specs\/.+\.md#[a-z0-9-]+$/)
    .optional(),
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
    href: "/lab/ds",
    title: "Overview",
    purpose: "Every shared part with its page, source files and contract.",
    group: "design-system",
    source: "record",
  },
  {
    href: "/lab/tokens",
    title: "Colour roles",
    purpose: "Colour tokens and the roles each one may play.",
    group: "design-system",
    source: "production",
    defines: [
      "packages/core/src/lib/styles/tokens.css",
      "packages/core/src/lib/ui/colors.ts",
    ],
    spec: "docs/specs/factory/design-system/spec.md#colour",
  },
  {
    href: "/lab/typography",
    title: "Typography",
    purpose: "Type families, scale and tracking.",
    group: "design-system",
    source: "production",
    defines: [
      "packages/core/src/lib/styles/typography.css",
      "packages/core/src/lib/styles/fonts.css",
      "packages/core/src/lib/ui/typography.ts",
    ],
    spec: "docs/specs/factory/design-system/spec.md#typography",
  },
  {
    href: "/lab/surfaces",
    title: "Surfaces",
    purpose: "Cut surfaces, panels and their elevation.",
    group: "design-system",
    source: "production",
    defines: ["packages/core/src/lib/styles/surfaces.css"],
    spec: "docs/specs/factory/design-system/spec.md#surfaces-and-layers",
  },
  {
    href: "/lab/inputs",
    title: "Inputs",
    purpose: "Buttons, toggle and ring slider in every state.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/inputs/Toggle.svelte",
      "apps/web/src/components/inputs/RingSlider.svelte",
      "apps/web/src/components/inputs/Switch.svelte",
      "apps/web/src/components/inputs/ThrustPads.svelte",
    ],
    spec: "docs/specs/factory/design-system/spec.md#elevation-and-inputs",
  },
  {
    href: "/lab/ds/actions",
    title: "Actions",
    purpose: "Normal button, call to action and link in every state.",
    group: "design-system",
    source: "production",
    defines: ["packages/core/src/lib/styles/buttons.css"],
    spec: "docs/specs/factory/design-system/spec.md#button-system",
  },
  {
    href: "/lab/ds/tabs",
    title: "Tabs",
    purpose: "Tabs and their panels; when to use Tabs, Toggle or Switch.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/inputs/Tabs.svelte"],
    spec: "docs/specs/factory/design-system/spec.md#tabs",
  },
  {
    href: "/lab/logomark",
    title: "Logomark",
    purpose: "The mark and its sizes.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/Logo.svelte"],
    spec: "docs/specs/factory/design-system/spec.md#identity",
  },
  {
    href: "/lab/graphs",
    title: "Graphs",
    purpose: "The Motion instrument's path and trace graphs.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/lab/instrument/PathPane.svelte",
      "apps/web/src/components/lab/instrument/TimeGraph.svelte",
    ],
    spec: "docs/specs/lab/motion-instrument/spec.md#components",
  },
  {
    href: "/lab/instrument-parts",
    title: "Motion instrument parts",
    purpose: "The Motion instrument's panes and controls on their own.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/lab/instrument/BurnRow.svelte",
      "apps/web/src/components/lab/instrument/Legend.svelte",
      "apps/web/src/components/lab/instrument/OverlayPane.svelte",
    ],
    spec: "docs/specs/lab/motion-instrument/spec.md#components",
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
    href: "/lab/instrument",
    title: "Ship tuning",
    purpose:
      "Compare ships on fixed burns, no gravity; copy the document back.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/flight-scene",
    title: "Flight scene",
    purpose:
      "One ship flying a fixed burn through the game's own layers and frame passes.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/plasma-thrust-comparison",
    title: "Plasma thrust comparison",
    purpose:
      "Compare the production plasma plume with its accepted study reference.",
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
    href: "/lab/render-model",
    title: "Render model",
    purpose:
      "Compare World, persistent FX and fresh LFX across browser blend modes.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/render-performance",
    title: "Render performance",
    purpose: "Measure overlapping production rendering with real FX budgets.",
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
