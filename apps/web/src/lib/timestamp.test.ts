import { describe, expect, it } from "vitest";
import { atOrAfter, parseTimestamp } from "./timestamp";

describe("Field Guide timestamps", () => {
  it("rejects invalid calendar dates, times and offsets", () => {
    for (const value of [
      "2025-02-29T00:00:00Z",
      "2024-04-31T00:00:00Z",
      "2024-01-01T24:00:00Z",
      "2024-01-01T23:59:60Z",
      "2024-01-01T00:00:00+24:00",
      "2024-01-01T00:00:00+01:60",
    ])
      expect(parseTimestamp(value)).toBeNull();
    expect(parseTimestamp("2024-02-29T23:59:59Z")).not.toBeNull();
  });
  it("compares offset instants and arbitrary fractional precision", () => {
    expect(atOrAfter("2024-01-01T01:00:00+01:00", "2024-01-01T00:00:00Z")).toBe(
      true,
    );
    expect(atOrAfter("2023-12-31T19:00:00-05:00", "2024-01-01T00:00:00Z")).toBe(
      true,
    );
    expect(
      atOrAfter("2024-01-01T00:00:00.1230001Z", "2024-01-01T00:00:00.1230002Z"),
    ).toBe(false);
    expect(
      atOrAfter("2024-01-01T00:00:00.1Z", "2024-01-01T00:00:00.1000Z"),
    ).toBe(true);
  });
});
