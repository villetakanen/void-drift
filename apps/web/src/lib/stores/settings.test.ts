import { expect, it } from "vitest";
import { decodeSettings } from "./settings";

it("preserves legacy control choices while adding speed camera Off", () => {
  expect(decodeSettings('{"invertControls":false}')).toEqual({
    invertControls: false,
    speedCamera: false,
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
    });
  }
});
