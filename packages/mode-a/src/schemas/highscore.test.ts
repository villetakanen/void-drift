import { describe, expect, it } from "vitest";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
import {
  CHALLENGE,
  HighScoreSchema,
  HighScoreSubmissionSchema,
  parseHighScores,
} from "./highscore";

const score = {
  initials: "ONE",
  seconds: 42.5,
  score: 57,
  deathCause: "STAR",
  shipId: "corvette",
  fitting: ["ion", "ion", "battery"],
  stabilizers: true,
  linkedEngines: false,
  challenge: CHALLENGE,
  userId: "pilot",
};
const { userId: _userId, ...submission } = score;
const accepts = (patch: Record<string, unknown>) =>
  HighScoreSubmissionSchema.safeParse({ ...submission, ...patch }).success;

describe("leaderboard rows", () => {
  it("excludes scores of earlier challenges", () => {
    expect(
      parseHighScores([score, { ...score, challenge: "arrival-1" }]),
    ).toEqual([score]);
  });
  it("skips rows that fail the schema instead of failing the board", () => {
    const { fitting: _fitting, ...unfitted } = score;
    expect(
      parseHighScores([
        score,
        { ...score, shipId: "tank" },
        { ...score, extra: 1 },
        unfitted,
        { broken: true },
      ]),
    ).toEqual([score]);
  });
  it("skips rows without a score", () => {
    const { score: _score, ...legacy } = score;
    expect(parseHighScores([legacy, score])).toEqual([score]);
  });
  it("stays strict", () => {
    expect(HighScoreSchema.safeParse({ ...score, extra: 1 }).success).toBe(
      false,
    );
  });
});

describe("score submission", () => {
  it("accepts a complete run", () => {
    expect(HighScoreSubmissionSchema.safeParse(submission).success).toBe(true);
  });
  it("has no ceiling on score or time", () => {
    expect(accepts({ score: 10_000_000 })).toBe(true);
    expect(accepts({ seconds: 86_400.25 })).toBe(true);
  });
  it("rejects a missing, fractional or non-positive score", () => {
    const { score: _score, ...missing } = submission;
    expect(HighScoreSubmissionSchema.safeParse(missing).success).toBe(false);
    for (const value of [0, -3, 1.5, "57"])
      expect(accepts({ score: value })).toBe(false);
  });
  it("keeps time to the millisecond", () => {
    expect(accepts({ seconds: 3.017 })).toBe(true);
    for (const value of [0, -1, 3.0171, "3"])
      expect(accepts({ seconds: value })).toBe(false);
  });
  it("accepts any ship in the game", () => {
    for (const shipId of ShipProfileIdSchema.options)
      expect(accepts({ shipId })).toBe(true);
    expect(accepts({ shipId: "tank" })).toBe(false);
  });
  it("requires the fitting and both ship choices", () => {
    for (const field of ["fitting", "stabilizers", "linkedEngines"]) {
      const { [field]: _omitted, ...missing } = submission as Record<
        string,
        unknown
      >;
      expect(HighScoreSubmissionSchema.safeParse(missing).success).toBe(false);
    }
    expect(accepts({ fitting: ["not-a-part"] })).toBe(false);
    expect(accepts({ fitting: "ion" })).toBe(false);
    expect(accepts({ stabilizers: "yes" })).toBe(false);
    expect(accepts({ linkedEngines: undefined })).toBe(false);
  });
});
