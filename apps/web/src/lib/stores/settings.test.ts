import { expect, it } from "vitest";
import { decodeSettings } from "./settings";

it("preserves legacy control choices while adding speed camera Off", () => {
  expect(decodeSettings('{"invertControls":false}')).toEqual({
    invertControls: false,
    speedCamera: false,
    combatHud: true,
  });
});

it("recovers from corrupt settings without preventing startup", () => {
  for (const value of [
    null,
    "{",
    '{"invertControls":false,"speedCamera":"yes"}',
  ]) {
    expect(decodeSettings(value)).toEqual({
      invertControls: true,
      speedCamera: false,
      combatHud: true,
    });
  }
});

it("restores a disabled combat HUD and keeps legacy camera and control choices", () => {
  const legacy = { invertControls: false, speedCamera: true };
  expect(decodeSettings(JSON.stringify(legacy))).toEqual({
    ...legacy,
    combatHud: true,
  });
  const saved = { ...legacy, combatHud: false };
  expect(decodeSettings(JSON.stringify(saved))).toEqual(saved);
});
