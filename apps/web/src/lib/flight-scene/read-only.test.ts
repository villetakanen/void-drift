import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { readOnlyCopy } from "./read-only";
import { STARTER_FLIGHT_SCENE } from "./starter";

const doc = FlightSceneDocumentSchema.parse(STARTER_FLIGHT_SCENE);

describe("readOnlyCopy", () => {
  it("is equal in value and not the same object", () => {
    const copy = readOnlyCopy(doc);
    expect(copy).toEqual(doc);
    expect(copy).not.toBe(doc);
    expect(copy.loadout).not.toBe(doc.loadout);
    expect(Object.isFrozen(doc)).toBe(false);
  });

  it("is frozen at depth", () => {
    const copy = readOnlyCopy(doc);
    expect(Object.isFrozen(copy)).toBe(true);
    expect(Object.isFrozen(copy.loadout)).toBe(true);
    expect(Object.isFrozen(copy.follow)).toBe(true);
    expect(Object.isFrozen(copy.targets)).toBe(true);
    for (const target of copy.targets)
      expect(Object.isFrozen(target)).toBe(true);
    expect(Object.isFrozen(copy.loadout.hull)).toBe(true);
    expect(() => {
      (copy.follow as { near: number }).near = 99;
    }).toThrow(TypeError);
    expect(() => {
      (copy.targets as { x: number; y: number }[]).push({ x: 0, y: 0 });
    }).toThrow(TypeError);
  });
});
