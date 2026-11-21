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
    href: "/lab/ds/component-frame",
    title: "Component frame",
    purpose: "A shared boundary and width container for live examples.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/lab/ComponentFrame.svelte"],
    spec: "docs/specs/factory/design-system/component-frame/spec.md#architecture",
  },
  {
    href: "/lab/ds/page-header",
    title: "Page header",
    purpose: "Page identity, navigation and controls in a single row.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/PageHeader.svelte"],
    spec: "docs/specs/factory/design-system/page-header/spec.md#architecture",
  },
  {
    href: "/lab/sky-instrument",
    title: "Sky instrument",
    purpose:
      "Inspect the fixed Sol sky, seeded sightlines and the continuous galactic reach.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/system-instrument",
    title: "System instrument",
    purpose: "Generate and inspect the production solar system by seed.",
    group: "tools",
    source: "production",
  },
  {
    href: "/lab/planet-inspector",
    title: "Planet Inspector",
    purpose:
      "Planet surface, spin, Sun-facing light, orbit and world HUD in a live preview.",
    group: "tools",
    source: "production",
  },
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
    spec: "docs/specs/factory/design-system/colour/spec.md#architecture",
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
    spec: "docs/specs/factory/design-system/typography/spec.md#architecture",
  },
  {
    href: "/lab/surfaces",
    title: "Surfaces",
    purpose: "Cut surfaces, panels and their elevation.",
    group: "design-system",
    source: "production",
    defines: ["packages/core/src/lib/styles/surfaces.css"],
    spec: "docs/specs/factory/design-system/surfaces/spec.md#architecture",
  },
  {
    href: "/lab/ds/game-field-backdrop",
    title: "Game field backdrop",
    purpose:
      "Generated decorative system, outer orbit composition and shared scrim.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/GameFieldBackdrop.svelte",
      "apps/web/src/lib/game-field.ts",
      "packages/mode-a/src/lib/solar-system.ts",
      "packages/mode-a/src/lib/flight-frame.ts",
      "packages/core/src/lib/styles/surfaces.css",
    ],
    spec: "docs/specs/factory/design-system/game-field-backdrop/spec.md#architecture",
  },
  {
    href: "/lab/ds/choices",
    title: "Choices",
    purpose:
      "SegmentedControl for values; Switch for independent on/off settings.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/inputs/SegmentedControl.svelte",
      "apps/web/src/components/inputs/Switch.svelte",
    ],
    spec: "docs/specs/factory/design-system/choices/spec.md#architecture",
  },
  {
    href: "/lab/ds/slider",
    title: "Slider",
    purpose: "Ring slider for bounded numeric values.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/inputs/RingSlider.svelte"],
    spec: "docs/specs/factory/design-system/inputs/spec.md#ring-slider",
  },
  {
    href: "/lab/ds/actions",
    title: "Actions",
    purpose:
      "Action states and button groups with native or directional navigation.",
    group: "design-system",
    source: "production",
    defines: [
      "packages/core/src/lib/styles/buttons.css",
      "apps/web/src/components/inputs/ButtonGroup.svelte",
    ],
    spec: "docs/specs/factory/design-system/actions/spec.md#architecture",
  },
  {
    href: "/lab/ds/tabs",
    title: "Tabs",
    purpose:
      "Tabs and their panels; when to use Tabs, SegmentedControl or Switch.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/inputs/Tabs.svelte"],
    spec: "docs/specs/factory/design-system/inputs/spec.md#tabs",
  },
  {
    href: "/lab/ds/parts",
    title: "Parts",
    purpose: "Part-design principles and optional fictional artwork markings.",
    group: "design-system",
    source: "production",
    defines: ["packages/mode-a/src/lib/testing-marking.ts"],
    spec: "docs/specs/factory/design-system/artwork/spec.md#testing-only-marking",
  },
  {
    href: "/lab/ds/weapons",
    title: "Weapons",
    purpose:
      "Unlit SVG master, shared catalog and Canvas artwork, and production fittings.",
    group: "design-system",
    source: "production",
    defines: ["packages/mode-a/src/lib/plasma-rifle-art.ts"],
    spec: "docs/specs/factory/design-system/artwork/spec.md#architecture",
  },
  {
    href: "/lab/ds/engines",
    title: "Engines",
    purpose:
      "Engine artwork: SVG masters, poses, plume and decorative markings.",
    group: "design-system",
    source: "production",
    defines: [
      "packages/mode-a/src/lib/art/engines/service-ion.svg",
      "packages/mode-a/src/lib/testing-marking.ts",
    ],
    spec: "docs/specs/factory/design-system/artwork/spec.md#architecture",
  },
  {
    href: "/lab/logomark",
    title: "Logomark",
    purpose: "The mark and its sizes.",
    group: "design-system",
    source: "production",
    defines: ["apps/web/src/components/Logo.svelte"],
    spec: "docs/specs/factory/design-system/identity/spec.md#architecture",
  },
  {
    href: "/lab/ds/instrument-parts",
    title: "Instrument parts",
    purpose:
      "Shared parts for instrumentation views, led by the parameter side sheet.",
    group: "design-system",
    source: "production",
    defines: [
      "apps/web/src/components/lab/instrument/BurnRow.svelte",
      "apps/web/src/components/lab/instrument/Legend.svelte",
      "apps/web/src/components/lab/instrument/PathPane.svelte",
      "apps/web/src/components/lab/instrument/SideSheet.svelte",
      "apps/web/src/components/lab/instrument/TimeGraph.svelte",
    ],
    spec: "docs/specs/factory/design-system/side-sheet/spec.md#architecture",
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
    href: "/lab/controls",
    title: "Flight controls",
    purpose: "Production touch thrust pads and their resolved action feedback.",
    group: "tools",
    source: "production",
    defines: ["apps/web/src/components/controls/ThrustPads.svelte"],
    spec: "docs/specs/game/controls/spec.md#touch-pads",
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
    href: "/lab/targeting",
    title: "Targeting bench",
    purpose:
      "Measure mounted weapon acquisition and contact across three flight paths shared by eight Wasps and eight Fighters.",
    group: "tools",
    source: "production",
    spec: "docs/specs/lab/targeting-bench/spec.md#measurement",
  },
  {
    href: "/lab/gauntlet",
    title: "Gauntlet",
    purpose:
      "Play the seven-enemy Gauntlet through the production simulation and render stack.",
    group: "tools",
    source: "production",
    defines: [
      "packages/mode-a/src/lib/gauntlet.ts",
      "packages/mode-a/src/lib/flight-frame.ts",
      "packages/mode-a/src/lib/build-renderer.ts",
    ],
    spec: "docs/specs/lab/gauntlet-bench/spec.md#contract",
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
