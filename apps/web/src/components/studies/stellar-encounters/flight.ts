import {
  massWellAcceleration,
  massWellReach,
  starPull,
  Vec2,
} from "@void-drift/core";
import { buildDrain, GRAVITY_TUNING } from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  BURN_IDS,
  calculate,
  DT,
  inputAt,
  type Sample,
  TRACK_COLORS,
  type Track,
} from "../../../lib/instrument";
import {
  type Encounter,
  loadout,
  readEncounter,
  shipRadius,
  stats,
} from "./fields";

export const FlightSettingsSchema = z
  .object({
    burn: z.enum(BURN_IDS),
    startSpeed: z.number().finite().min(0).max(300),
  })
  .strict();
export type FlightSettings = z.infer<typeof FlightSettingsSchema>;
export const startingFlight = FlightSettingsSchema.parse({
  burn: "course",
  startSpeed: 120,
});
export const gravityReach = massWellReach(
  GRAVITY_TUNING.sunMass,
  GRAVITY_TUNING.cutoff,
  GRAVITY_TUNING.falloff,
);
export const offsets = [80, 160, 260] as const;
export const centre = { x: 960, y: 540 };
export const startX = -400;

export type EncounterRun = {
  track: Track;
  offset: number;
  contact: boolean;
  duration: number;
  collectionSeconds: number;
  netGainWithoutExposureSeconds: number;
  minClearance: number;
  energyChange: number;
  exposureBudget: number;
  outcome: string;
};

/** The radial interval that pays for full forward thrust without exposure.
 * This describes local rates, not the ability to hold that position. */
export function poweredBand(encounter: Encounter) {
  const drain = buildDrain(loadout, {
    leftThruster: true,
    rightThruster: true,
    fire: false,
  });
  const field = encounter.collection;
  const peak = field.peak * stats.coils;
  const outer =
    drain <= peak * field.outerFraction
      ? field.reach
      : field.reach -
        ((drain / peak - field.outerFraction) / (1 - field.outerFraction)) *
          (field.reach - field.shoulder);
  const inner = Math.max(
    encounter.exposure.reach,
    encounter.radius + shipRadius,
  );
  return {
    inner,
    outer: peak > drain ? outer : inner,
    width: peak > drain ? Math.max(0, outer - inner) : 0,
  };
}

export function flyEncounter(
  encounter: Encounter,
  settings: FlightSettings,
): EncounterRun[] {
  const config = FlightSettingsSchema.parse(settings);
  return offsets.map((offset, index) => {
    // Instrument starts at (0,0). Move the star relative to it, then translate
    // recorded samples into play's centre so the shared default view stays useful.
    const star = {
      pos: new Vec2(-startX, -offset),
      radius: encounter.radius,
      influenceRadius: gravityReach,
      mass: GRAVITY_TUNING.sunMass,
      massWell: {
        mass: GRAVITY_TUNING.sunMass,
        cutoff: GRAVITY_TUNING.cutoff,
        falloff: GRAVITY_TUNING.falloff,
      },
      type: "G" as const,
      color: encounter.color,
      glowColor: encounter.color,
      powerMultiplier: 1,
      burnMultiplier: 1,
      pulseSpeed: 1,
    };
    let hit: { tick: number; x: number; y: number } | undefined;
    const raw = calculate({ label: "Wasp", loadout }, config.burn, {
      startSpeed: config.startSpeed,
      pull: (x, y) => starPull({ x, y }, star, "inverse-square"),
      contact: (ship, tick) => {
        if (
          !hit &&
          Math.hypot(ship.pos.x - star.pos.x, ship.pos.y - star.pos.y) <
            encounter.radius + shipRadius
        )
          hit = { tick, x: ship.pos.x, y: ship.pos.y };
      },
    });
    // The hook observes each substep. Discard everything after first contact;
    // preserve the observed contact position rather than a later point in the tick.
    const sampledContact = raw.findIndex(
      (s) =>
        Math.hypot(s.x - star.pos.x, s.y - star.pos.y) <
        encounter.radius + shipRadius,
    );
    const contactTick =
      sampledContact < 0
        ? (hit?.tick ?? null)
        : Math.min(sampledContact, hit?.tick ?? sampledContact);
    const samples: Sample[] = raw
      .slice(0, contactTick === null ? undefined : contactTick + 1)
      .map((s) => ({
        ...s,
        x: centre.x + startX + s.x,
        y: centre.y + offset + s.y,
      }));
    if (hit && hit.tick === contactTick) {
      const last = samples[samples.length - 1];
      last.x = centre.x + startX + hit.x;
      last.y = centre.y + offset + hit.y;
    }
    const distance = samples.map((s) =>
      Math.hypot(s.x - centre.x, s.y - centre.y),
    );
    const gravity = distance.map((d) =>
      massWellAcceleration(
        d,
        GRAVITY_TUNING.sunMass,
        GRAVITY_TUNING.cutoff,
        GRAVITY_TUNING.falloff,
      ),
    );
    const collection = distance.map(
      (d) => readEncounter(encounter, d, false).collection,
    );
    const exposure = distance.map(
      (d) => readEncounter(encounter, d, false).exposure,
    );
    const consumption = samples.map((s, tick) => {
      const input = inputAt(config.burn, Math.max(0, tick - 1));
      return buildDrain(
        loadout,
        { leftThruster: input.left, rightThruster: input.right, fire: false },
        (s.spin * Math.PI) / 180,
        DT / 4,
      );
    });
    const netPower = collection.map((value, tick) => value - consumption[tick]);
    let energyChange = 0;
    let exposureBudget = 0;
    let collectionSeconds = 0;
    let netGainWithoutExposureSeconds = 0;
    const batteryChange = netPower.map((net, tick) => {
      // Right-endpoint budget at 60 Hz, omitting the terminal contact interval.
      if (tick > 0 && !(contactTick !== null && tick === samples.length - 1)) {
        energyChange += net * DT;
        exposureBudget += exposure[tick] * DT;
        if (collection[tick] > 0) collectionSeconds += DT;
        if (net > 0 && exposure[tick] === 0)
          netGainWithoutExposureSeconds += DT;
      }
      return energyChange;
    });
    const entered = distance.some((d) => d < gravityReach);
    const outside = distance[distance.length - 1] >= gravityReach;
    return {
      offset,
      contact: contactTick !== null,
      duration: (samples.length - 1) * DT,
      collectionSeconds,
      netGainWithoutExposureSeconds,
      minClearance: Math.min(...distance) - encounter.radius - shipRadius,
      energyChange,
      exposureBudget,
      outcome:
        contactTick !== null
          ? "Star contact"
          : !entered
            ? "Never entered the well"
            : outside
              ? "Outside the well at 14 s"
              : "Still inside the well at 14 s",
      track: {
        label: `${encounter.id === "sun" ? "G Sun" : encounter.id === "dwarf" ? "Dwarf" : "Giant"} / ${offset} u`,
        color: TRACK_COLORS[index],
        samples,
        contacts: contactTick === null ? [] : [samples.length - 1],
        traces: {
          distance,
          gravity,
          collection,
          consumption,
          netPower,
          batteryChange,
        },
      },
    };
  });
}
