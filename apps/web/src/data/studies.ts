import { z } from "astro/zod";

export const studySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  status: z.enum(["open", "blocked", "accepted", "ruled-out", "stopped"]),
  phase: z.enum(["problem", "exploration", "readiness", "scope"]),
  question: z.string().min(1),
});
export type Study = z.infer<typeof studySchema>;
export const studies = z.array(studySchema).parse([
  {
    slug: "drone-launcher-2026-11-25",
    title: "Drone launcher",
    phase: "scope",
    status: "accepted",
    question:
      "How should the drone launcher’s manufacture, launch, pursuit and energy recovery work and read in flight?",
  },
  {
    slug: "ranked-initials-2026-11-20",
    title: "Signing a ranked score",
    phase: "exploration",
    status: "open",
    question:
      "How should entering three initials after a ranked run feel like signing an arcade or pinball high-score table, while remaining an accessible web form control that works with keyboard, mouse or touch and looks at home in Void Drift?",
  },
  {
    slug: "offscreen-information-2026-11-19",
    title: "Offscreen contacts · beyond pirate bearings",
    status: "accepted",
    phase: "scope",
    question:
      "How should the existing pirate-location HUD extend into one offscreen layer that communicates target type, direction and distance?",
  },
  {
    slug: "combat-hud-2026-11-19",
    title: "Combat HUD",
    status: "stopped",
    phase: "exploration",
    question:
      "What information helps a pilot find and navigate toward relevant things outside the current view?",
  },
  {
    slug: "milky-way-sky-2026-11-19",
    title: "Inside the Milky Way",
    status: "accepted",
    phase: "scope",
    question:
      "What composition, texture and camera response make the flight sky feel like a view from inside the Milky Way?",
  },
  {
    slug: "close-g-stars-2026-11-18",
    title: "Eleven close stars",
    status: "stopped",
    phase: "exploration",
    question:
      "Which drawing techniques from 1990s game skies give a bright G-class background star a distinctive appearance in Void Drift?",
  },
  {
    slug: "distant-flight-sky-2026-11-18",
    title: "The distant flight sky",
    status: "stopped",
    phase: "exploration",
    question:
      "How do we create the first design-wise sound sky for Void Drift 0.7.0, Fires in the Sky?",
  },
  {
    slug: "background-stars-2026-11-18",
    title: "Flight starfield",
    status: "stopped",
    phase: "exploration",
    question:
      "How should Void Drift render its distant stars so the sky feels like part of the world, with a Sun-like minority you discover as you fly?",
  },
  {
    slug: "plasma-rifle-operation-2026-11-18",
    title: "Plasma rifle operation",
    status: "accepted",
    phase: "scope",
    question:
      "How should a fitted plasma rifle commit to a charge and resolve it when a target slips away or stays within reach?",
  },
  {
    slug: "plasma-projector-fitting-2026-11-17",
    title: "Plasma Projector · the fitting",
    status: "accepted",
    phase: "scope",
    question:
      "What physical construction gives the Plasma Projector a convincing identity within the game’s weapon language?",
  },
  {
    slug: "maintenance-drive-2026-11-17",
    title: "Maintenance drive",
    status: "accepted",
    phase: "scope",
    question:
      "What can change within the ion engines’ shared form and plume, and what name, mass, energy draw and cruise contribution, make a drive at a third of a light ion’s thrust read as the smallest ion engine rather than a stabilizer?",
  },
  {
    slug: "plasma-projector-2026-11-16",
    title: "Plasma Projector",
    status: "open",
    phase: "exploration",
    question:
      "What visual identity makes the Plasma Projector’s loading, close eruption and continuously thrusting residual vents read as one distinctive heavy weapon in the plasma family?",
  },
  {
    slug: "rock-atmospheres-2026-11-15",
    title: "Air around rock worlds",
    status: "accepted",
    phase: "scope",
    question:
      "What atmospheric envelope makes the existing rotating rock worlds feel surrounded by air and gives a pilot a readable choice when skimming their edge?",
  },
  {
    slug: "plasma-light-2026-11-11",
    title: "Plasma light: power gathered, then released",
    status: "accepted",
    phase: "scope",
    question:
      "How does a plasma engine’s light show power gathering through its charge and then released, and stay distinct from ion light on the same ship?",
  },
  {
    slug: "flight-scene-instrument-2026-11-10",
    title: "Flight scene: one screen for seeing a burn in the game",
    status: "accepted",
    phase: "scope",
    question:
      "What does one shared instrument look like that plays a fixed burn through the game’s own layers, so a study can judge how a ship, its effects and its weapons look in flight?",
  },
  {
    slug: "lhi-fiddler-2026-11-03",
    title: "Ship 05 / LHI Fiddler Heavy Assault Corvette",
    status: "accepted",
    phase: "scope",
    question:
      "How can a heavy twin-blade corvette carry an abundant loadout and still look unmistakably related to Wasp?",
  },
  {
    slug: "gravity-coil-2026-11-03",
    title: "Gravity coil",
    status: "stopped",
    phase: "exploration",
    question:
      "What makes a gravity coil read as substantial technical machinery beside a ship’s engines?",
  },
  {
    slug: "lab-instrument-2026-11-01",
    title: "Lab instrument: one screen for comparing vehicles",
    status: "accepted",
    phase: "scope",
    question:
      "What does a single shared instrument look like that every study and the Lab use to compare paths, engines and hulls on the same measurements?",
  },
  {
    slug: "path-instrument-2026-11-01",
    title: "Path instrument: reading motion in any container",
    status: "stopped",
    phase: "exploration",
    question:
      "What should a single, standard path instrument fix and what may a study vary, so motion results from different studies can be compared?",
  },
  {
    slug: "plasma-behaviour-2026-11-01",
    title: "Plasma engines: commitment and recovery",
    status: "stopped",
    phase: "exploration",
    question:
      "What acceleration or speed advantage would make plasma’s delayed response worth choosing over ion?",
  },
  {
    slug: "base-movement-ion",
    title: "Base movement: flying with ion engines",
    status: "accepted",
    phase: "scope",
    question:
      "How can momentum make flying engaging while two engine controls keep the ship understandable and recoverable?",
  },
  {
    slug: "ion-engines-2026-10-31",
    title: "Ion engines: precise, decisive, reliable",
    status: "accepted",
    phase: "scope",
    question:
      "How should Light and Heavy ion engines share a precise visual language?",
  },
  {
    slug: "engine-identities",
    title: "Engines: types and low-poly identities",
    status: "accepted",
    phase: "scope",
    question:
      "How can low-poly engine bodies express families, subtypes and architectural tradeoffs, both in the catalog and fitted to a ship?",
  },
  {
    slug: "ship-slot-language",
    title: "Ship slots: mounts, contents and intent",
    status: "accepted",
    phase: "scope",
    question:
      "How should a slot show what fits, what is installed and what the player can do while keeping the ship readable?",
  },
  {
    slug: "scout-firefly",
    title: "Scout: an angry little firefly",
    status: "accepted",
    phase: "scope",
    question:
      "How can a compact, tightly fitted Scout read as an angry little spacecraft rather than a miniature paper-plane Fighter?",
  },
  {
    slug: "heavy-cruiser-slots",
    title: "Heavy cruiser: slots into silhouette",
    status: "accepted",
    phase: "scope",
    question:
      "How can eight mounts and a multi-window bridge make a slim, armored cruiser express overwhelming power?",
  },
  {
    slug: "ship-silhouettes",
    title: "Three ship silhouettes",
    status: "stopped",
    phase: "scope",
    question:
      "How can part placement and engine angles give three ships recognizable silhouettes in the builder and in flight?",
  },
  {
    slug: "engine-effects",
    title: "Engine Effects",
    status: "accepted",
    phase: "scope",
    question:
      "How can engine effects turn flying into a flashy graphic performance through shaped surfaces, glow, and fluid transformation?",
  },
  {
    slug: "gravity-wells",
    title: "Gravity wells: temptation and danger",
    status: "accepted",
    phase: "scope",
    question:
      "How can sun and planet gravity reward a deliberate close pass while making the risk of going deeper readable?",
  },
  {
    slug: "buttons",
    title: "Buttons & action composition",
    status: "accepted",
    phase: "scope",
    question:
      "How should game-state navigation and data actions share a clear button hierarchy across the application and Lab?",
  },
]);
