import type { FlightLayerContexts } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { PlanetInspectorDocumentSchema } from "./config";
import { PlanetInspectorScene } from "./scene";

// The state and replay contract needs no drawing or browser material preparation.
function scene(planet: unknown) {
  const canvas = { width: 1, height: 1, getContext: () => ctx };
  const ctx = { canvas };
  const layers = {
    world: ctx,
    fx: ctx,
    lfx: ctx,
  } as unknown as FlightLayerContexts;
  return new PlanetInspectorScene(
    layers,
    PlanetInspectorDocumentSchema.parse({ planet }),
    () => {},
  );
}

describe("mercurial family inspection", () => {
  it("validates the family radius without accepting it as a named planet", () => {
    for (const radius of [16, 27, 36]) {
      expect(
        PlanetInspectorDocumentSchema.parse({
          planet: { kind: "family", name: "mercurial", radius },
        }).planet,
      ).toMatchObject({ radius });
    }
    for (const radius of [15.9, 36.1, NaN, Infinity]) {
      expect(
        PlanetInspectorDocumentSchema.safeParse({
          planet: { kind: "family", name: "mercurial", radius },
        }).success,
      ).toBe(false);
    }
    expect(
      PlanetInspectorDocumentSchema.safeParse({
        planet: { kind: "named", name: "mercurial" },
      }).success,
    ).toBe(false);
  });

  it("retains staged radius, tick and angle through edits and backward replay at generated mass", () => {
    const subject = scene({ kind: "family", name: "mercurial", radius: 16 });
    try {
      subject.setOrbit(120);
      subject.seekRotation(180);
      const ticks = subject.sim.ticks;
      subject.setRadius(36);
      expect(subject.sim.ticks).toBe(ticks);
      expect(subject.orbit).toBeCloseTo(120);
      expect(subject.planet.radius).toBe(36);
      expect(subject.planet.massWell?.mass).toBeCloseTo(1039.1666666667);
      expect(subject.planet.mass).toBe(subject.planet.massWell?.mass);
      expect(
        subject.planet.orbitRadius * subject.planet.orbitSpeed,
      ).toBeCloseTo(4);
      expect(subject.planet.orbitRadius - 36).toBeGreaterThan(
        subject.sim.star.damageField?.reach ?? Infinity,
      );
      expect(subject.planet.orbitRadius + 36).toBeLessThan(
        subject.sim.star.collectionField?.reach ?? 0,
      );
      subject.seekRotation(90);
      expect(subject.sim.ticks).toBeLessThan(ticks);
      expect(subject.planet.radius).toBe(36);
      expect(subject.planet.massWell?.mass).toBeCloseTo(1039.1666666667);
      expect(subject.orbit).toBeCloseTo(120);
      expect(subject.planet.displayName).toBeUndefined();
      expect(subject.sim.star.name).toBeUndefined();
      expect(() => subject.setRadius(40)).toThrow();
      expect(subject.planet.radius).toBe(36);
      subject.seekRotation(360);
      expect(subject.rotation).toBe(360);
    } finally {
      subject.dispose();
    }
    const reopened = scene({ kind: "family", name: "mercurial", radius: 16 });
    expect(reopened.planet.radius).toBe(16);
    reopened.dispose();
  });

  it("keeps named Mercury fixed and rejects family edits to it", () => {
    const mercury = scene({ kind: "named", name: "mercury" });
    try {
      expect(mercury.planet.radius).toBe(27);
      expect(mercury.planet.orbitRadius).toBe(258);
      expect(mercury.planet.massWell?.mass).toBe(870);
      expect(mercury.planet.displayName).toBe("Mercury");
      expect(() => mercury.setRadius(36)).toThrow();
      expect(mercury.planet.radius).toBe(27);
    } finally {
      mercury.dispose();
    }
  });
});

it("matches named Mercury gravity at the family reference radius", () => {
  const family = scene({ kind: "family", name: "mercurial", radius: 16 });
  const mercury = scene({ kind: "named", name: "mercury" });
  try {
    family.setRadius(27);
    expect(family.planet.mass).toBe(870);
    expect(family.planet.massWell).toEqual(mercury.planet.massWell);
    family.seekRotation(180);
    family.seekRotation(0);
    expect(family.planet.massWell).toEqual(mercury.planet.massWell);
  } finally {
    family.dispose();
    mercury.dispose();
  }
});
