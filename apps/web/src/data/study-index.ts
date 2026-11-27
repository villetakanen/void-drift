import { frontmatter as migrated7 } from "../pages/lab/studies/buttons-2026-11-11.mdx";
import { frontmatter as migrated11 } from "../pages/lab/studies/derelict-draft-two-2026-11-06.mdx";
import { frontmatter as migrated10 } from "../pages/lab/studies/derelict-three-2026-11-06.mdx";
import { frontmatter as migrated12 } from "../pages/lab/studies/derelicts-2026-11-06.mdx";
import { frontmatter as migrated1 } from "../pages/lab/studies/earth-2026-11-14.mdx";
import { frontmatter as energySupport } from "../pages/lab/studies/energy-support-2026-11-02.mdx";
import { frontmatter as fissionEngine } from "../pages/lab/studies/fission-engine-2026-11-26.mdx";
import { frontmatter as fissionLight } from "../pages/lab/studies/fission-light-2026-11-11.mdx";
import { frontmatter as flightDeckWeapons } from "../pages/lab/studies/flight-deck-weapons-2026-11-24.mdx";
import { frontmatter as migrated14 } from "../pages/lab/studies/gilded-surfaces-2026-11-03.mdx";
import { frontmatter as gravityCoilForm } from "../pages/lab/studies/gravity-coil-form-2026-11-03.mdx";
import { frontmatter as migrated15 } from "../pages/lab/studies/gravity-coil-fx-2026-11-03.mdx";
import { frontmatter as inGameControllers } from "../pages/lab/studies/in-game-controllers.mdx";
import { frontmatter as migrated0 } from "../pages/lab/studies/inhabited-worlds-2026-11-15.mdx";
import { frontmatter as migrated8 } from "../pages/lab/studies/ion-point-defence-2026-11-08.mdx";
import { frontmatter as waspFrontmatter } from "../pages/lab/studies/lhi-wasp.mdx";
import { frontmatter as lightIonCannon } from "../pages/lab/studies/light-ion-cannon-2026-11-08.mdx";
import { frontmatter as mercury } from "../pages/lab/studies/mercury-2026-11-12.mdx";
import { frontmatter as openFrameMachinery } from "../pages/lab/studies/open-frame-machinery-2026-11-02.mdx";
import { frontmatter as migrated6 } from "../pages/lab/studies/part-rows-2026-11-11.mdx";
import { frontmatter as migrated2 } from "../pages/lab/studies/plasma-projector-2026-11-11.mdx";
import { frontmatter as resourceCapacity } from "../pages/lab/studies/resource-capacity-2026-11-02.mdx";
import { frontmatter as migrated13 } from "../pages/lab/studies/run-countdown-2026-11-05.mdx";
import { frontmatter as runStatus } from "../pages/lab/studies/run-status-2026-11-10.mdx";
import { frontmatter as shipMotionLaws } from "../pages/lab/studies/ship-motion-laws-2026-11-04.mdx";
import { frontmatter as migrated5 } from "../pages/lab/studies/ship-slots-2026-11-11.mdx";
import { frontmatter as shipUtilityLanguage } from "../pages/lab/studies/ship-utility-language-2026-11-02.mdx";
import { frontmatter as migrated3 } from "../pages/lab/studies/stellar-characters-2026-11-11.mdx";
import { frontmatter as migrated4 } from "../pages/lab/studies/stellar-encounters-2026-11-11.mdx";
import { frontmatter as migrated9 } from "../pages/lab/studies/suns-2026-11-07.mdx";
import { frontmatter as utilitiesRecord } from "../pages/lab/studies/utilities-2026-11-02.mdx";
import { frontmatter as utilityMachinery } from "../pages/lab/studies/utility-machinery-2026-11-02.mdx";
import { frontmatter as venus } from "../pages/lab/studies/venus-2026-11-13.mdx";
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
const utilityLanguage = studySchema.parse({
  ...shipUtilityLanguage,
  slug: "ship-utility-language-2026-11-02",
});
const stoppedUtilities = studySchema.parse({
  ...utilitiesRecord,
  slug: "utilities-2026-11-02",
});
const controllers = studySchema.parse({
  ...inGameControllers,
  slug: "in-game-controllers",
});
const wasp = studySchema.parse({ ...waspFrontmatter, slug: "lhi-wasp" });

const migratedBefore: Record<string, ReturnType<typeof studySchema.parse>[]> = {
  "plasma-light-2026-11-11": [
    studySchema.parse({ ...migrated0, slug: "inhabited-worlds-2026-11-15" }),
    studySchema.parse({ ...migrated1, slug: "earth-2026-11-14" }),
    studySchema.parse({ ...venus, slug: "venus-2026-11-13" }),
    studySchema.parse({ ...mercury, slug: "mercury-2026-11-12" }),
    studySchema.parse({ ...migrated2, slug: "plasma-projector-2026-11-11" }),
    studySchema.parse({ ...migrated3, slug: "stellar-characters-2026-11-11" }),
    studySchema.parse({ ...migrated4, slug: "stellar-encounters-2026-11-11" }),
    studySchema.parse({ ...fissionLight, slug: "fission-light-2026-11-11" }),
    studySchema.parse({ ...migrated5, slug: "ship-slots-2026-11-11" }),
    studySchema.parse({ ...migrated6, slug: "part-rows-2026-11-11" }),
    studySchema.parse({ ...migrated7, slug: "buttons-2026-11-11" }),
  ],
  "flight-scene-instrument-2026-11-10": [
    studySchema.parse({ ...runStatus, slug: "run-status-2026-11-10" }),
  ],
  "lhi-fiddler-2026-11-03": [
    studySchema.parse({ ...migrated8, slug: "ion-point-defence-2026-11-08" }),
    studySchema.parse({
      ...lightIonCannon,
      slug: "light-ion-cannon-2026-11-08",
    }),
    studySchema.parse({ ...migrated9, slug: "suns-2026-11-07" }),
    studySchema.parse({ ...migrated10, slug: "derelict-three-2026-11-06" }),
    studySchema.parse({ ...migrated11, slug: "derelict-draft-two-2026-11-06" }),
    studySchema.parse({ ...migrated12, slug: "derelicts-2026-11-06" }),
    studySchema.parse({ ...migrated13, slug: "run-countdown-2026-11-05" }),
    studySchema.parse({
      ...shipMotionLaws,
      slug: "ship-motion-laws-2026-11-04",
    }),
    studySchema.parse({ ...migrated14, slug: "gilded-surfaces-2026-11-03" }),
  ],
  "gravity-coil-2026-11-03": [
    studySchema.parse({ ...migrated15, slug: "gravity-coil-fx-2026-11-03" }),
  ],
};

// These studies own their metadata in MDX while older studies retain their registry.
export const studies = [
  studySchema.parse({ ...fissionEngine, slug: "fission-engine-2026-11-26" }),
  studySchema.parse({
    ...flightDeckWeapons,
    slug: "flight-deck-weapons-2026-11-24",
  }),
  // Keep migrated studies beside their original peers.
  ...legacyStudies.flatMap((study) => {
    if (study.slug === "gravity-coil-2026-11-03") {
      return [
        ...(migratedBefore[study.slug] ?? []),
        studySchema.parse({
          ...gravityCoilForm,
          slug: "gravity-coil-form-2026-11-03",
        }),
        study,
      ];
    }
    if (study.slug === "lab-instrument-2026-11-01") {
      return [
        reserves,
        extraEnergy,
        utilities,
        openFrame,
        utilityLanguage,
        stoppedUtilities,
        controllers,
        wasp,
        study,
      ];
    }
    return [...(migratedBefore[study.slug] ?? []), study];
  }),
];
