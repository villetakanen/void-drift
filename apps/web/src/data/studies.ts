import { z } from "astro/zod";

export const studySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  status: z.enum(["open", "accepted", "ruled-out", "stopped"]),
  phase: z.enum(["problem", "exploration", "readiness", "scope"]),
  question: z.string().min(1),
});
export type Study = z.infer<typeof studySchema>;
export const studies = z.array(studySchema).parse([
  {
    slug: "flight-scene-instrument-2026-11-10",
    title: "Flight scene: one screen for seeing a burn in the game",
    status: "open",
    phase: "problem",
    question:
      "What does one shared instrument look like that plays a fixed burn through the game’s own layers, so a study can judge how a ship, its effects and its weapons look in flight?",
  },
  {
    slug: "ion-point-defence-2026-11-08",
    title: "Ion Point Defence: a turret that meets the threat",
    status: "accepted",
    phase: "scope",
    question:
      "How should a small rotating ion turret look, turn and fire so that it becomes the game’s dependable baseline defence?",
  },
  {
    slug: "light-ion-cannon-2026-11-08",
    title: "Light Ion Cannon: an instant line of force",
    status: "accepted",
    phase: "scope",
    question:
      "How should an instant ion ray look and feel, and what reach and firing rhythm make it a satisfying baseline weapon?",
  },
  {
    slug: "suns-2026-11-07",
    title: "Suns: stellar character in play",
    status: "accepted",
    phase: "scope",
    question:
      "How should real stars and the game’s fiction shape suns whose character, behaviour and consequences are readable in play?",
  },
  {
    slug: "derelict-three-2026-11-06",
    title: "Derelict three: a broken monument, still alive",
    status: "accepted",
    phase: "scope",
    question:
      "How does the supplied draft become a monumental, broken structure with energy still active inside, while preserving its silhouette and colour language?",
  },
  {
    slug: "derelict-draft-two-2026-11-06",
    title: "Derelict draft two: the monumental shard",
    status: "stopped",
    phase: "exploration",
    question:
      "How faithfully can the supplied silhouette, material colours and rotating energy square carry into the game?",
  },
  {
    slug: "derelicts-2026-11-06",
    title: "Derelicts: a broken structure, a passing opportunity",
    status: "stopped",
    phase: "exploration",
    question:
      "How does a remnant of a broken megastructure read as one coherent object, then break into dangerous splinters and an energy fragment worth chasing?",
  },
  {
    slug: "run-countdown-2026-11-05",
    title: "Run countdown: three seconds of light",
    status: "accepted",
    phase: "scope",
    question:
      "How does a 3, 2, 1 countdown painted on the effects surface give a run a readable, characterful threshold without hiding the ship it releases?",
  },
  {
    slug: "ship-motion-laws-2026-11-04",
    title: "Ship motion: a law for assembled ships",
    status: "open",
    phase: "exploration",
    question:
      "What shared flight rule makes mass and propulsion layout produce distinct, predictable handling, while preserving control through a gravity well?",
  },
  {
    slug: "gilded-surfaces-2026-11-03",
    title: "Gilded glass: a surface language",
    status: "accepted",
    phase: "scope",
    question:
      "How does green–space–gold become a consistent material language across round, curved, cornered and faceted surfaces?",
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
    slug: "gravity-coil-fx-2026-11-03",
    title: "Gravity coil: potential in motion",
    status: "accepted",
    phase: "scope",
    question:
      "When and how does gravity becoming potential create an exotic light show that remains readable alongside engine FX?",
  },
  {
    slug: "gravity-coil-form-2026-11-03",
    title: "Gravity coil: static visual form",
    status: "accepted",
    phase: "scope",
    question:
      "What visual construction makes the chosen coil shape feel like complete equipment on its own and part of this game when fitted to a ship?",
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
    slug: "resource-capacity-2026-11-02",
    title: "Ship reserves: capacity made physical",
    status: "accepted",
    phase: "scope",
    question:
      "What basic piece of equipment lets a ship carry more of what keeps it running?",
  },
  {
    slug: "energy-support-2026-11-02",
    title: "Extra energy: potential made physical",
    status: "stopped",
    phase: "exploration",
    question:
      "What kind of object makes extra energy feel like an opportunity, and belongs above or below a ship?",
  },
  {
    slug: "utility-machinery-2026-11-02",
    title: "Utility machinery: objects with weight",
    status: "accepted",
    phase: "scope",
    question:
      "What gives a family of utility machinery volume, character and a convincing place alongside the ships and engines?",
  },
  {
    slug: "open-frame-machinery-2026-11-02",
    title: "Open-frame machinery",
    status: "stopped",
    phase: "exploration",
    question:
      "Can exposed working parts give four utilities a shared character alongside Void Drift’s ships and engines?",
  },
  {
    slug: "ship-utility-language-2026-11-02",
    title: "The visual language of ship utilities",
    status: "stopped",
    phase: "exploration",
    question:
      "How do we build utilities that look good alongside Void Drift’s ships and engines, and feel like machinery from the same world?",
  },
  {
    slug: "utilities-2026-11-02",
    title: "Utilities: energy, charging and repair",
    status: "stopped",
    phase: "exploration",
    question:
      "How should four utility devices express their roles and remain recognizable above or below a ship?",
  },
  {
    slug: "in-game-controllers",
    title: "In-game controllers: side-margin angled thrust flaps",
    status: "accepted",
    phase: "scope",
    question:
      "How should the 60°-angled L/F and R/F side-margin touch flaps be sized and layered across phone, tablet, and desktop screens?",
  },
  {
    slug: "lhi-wasp",
    title: "LHI Wasp: single-engine practice vessel",
    status: "accepted",
    phase: "scope",
    question:
      "How should low-poly facets structure the LHI Wasp silhouette around one rear engine, two wing equipment mounts, and four turning stabilizers?",
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
