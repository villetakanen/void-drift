import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { readOnlyCopy } from "./read-only";
import { STARTER_FLIGHT_SCENE } from "./starter";

const doc = FlightSceneDocumentSchema.parse(STARTER_FLIGHT_SCENE);

describe("readOnlyCopy", () => {
  it("refuses nested edits and leaves the source editable", () => {
    const copy = readOnlyCopy(doc);
    expect(() => {
      (copy.follow as { near: number }).near = 99;
    }).toThrow(TypeError);
    expect(() => {
      (copy.targets as { x: number; y: number }[]).push({ x: 0, y: 0 });
    }).toThrow(TypeError);
    expect(Object.isFrozen(doc)).toBe(false);
  });
});
