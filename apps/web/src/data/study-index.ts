import { frontmatter as energySupport } from "../pages/lab/studies/energy-support-2026-11-02.mdx";
import { frontmatter as fissionEngine } from "../pages/lab/studies/fission-engine-2026-11-26.mdx";
import { frontmatter as flightDeckWeapons } from "../pages/lab/studies/flight-deck-weapons-2026-11-24.mdx";
import { frontmatter as inGameControllers } from "../pages/lab/studies/in-game-controllers.mdx";
import { frontmatter as waspFrontmatter } from "../pages/lab/studies/lhi-wasp.mdx";
import { frontmatter as openFrameMachinery } from "../pages/lab/studies/open-frame-machinery-2026-11-02.mdx";
import { frontmatter as resourceCapacity } from "../pages/lab/studies/resource-capacity-2026-11-02.mdx";
import { frontmatter as utilityMachinery } from "../pages/lab/studies/utility-machinery-2026-11-02.mdx";
import { studies as legacyStudies, studySchema } from "./studies";

const reserves = studySchema.parse({
  ...resourceCapacity,
  slug: "resource-capacity-2026-11-02",
});
const extraEnergy = studySchema.parse({
  ...energySupport,
  slug: "energy-support-2026-11-02",
});
const utilities = studySchema.parse({
  ...utilityMachinery,
  slug: "utility-machinery-2026-11-02",
});
const openFrame = studySchema.parse({
  ...openFrameMachinery,
  slug: "open-frame-machinery-2026-11-02",
});
const controllers = studySchema.parse({
  ...inGameControllers,
  slug: "in-game-controllers",
});
const wasp = studySchema.parse({ ...waspFrontmatter, slug: "lhi-wasp" });

// These studies own their metadata in MDX while older studies retain their registry.
export const studies = [
  studySchema.parse({ ...fissionEngine, slug: "fission-engine-2026-11-26" }),
  studySchema.parse({
    ...flightDeckWeapons,
    slug: "flight-deck-weapons-2026-11-24",
  }),
  // Keep the November 1–2 migrations beside their original peers.
  ...legacyStudies.flatMap((study) => {
    if (study.slug === "ship-utility-language-2026-11-02") {
      return [reserves, extraEnergy, utilities, openFrame, study];
    }
    if (study.slug === "lab-instrument-2026-11-01") {
      return [controllers, wasp, study];
    }
    return [study];
  }),
];
