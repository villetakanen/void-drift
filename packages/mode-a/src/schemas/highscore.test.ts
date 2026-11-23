import { describe, expect, it } from "vitest";
import { ShipProfileIdSchema } from "../lib/schemas/ship-profile";
import {
  CHALLENGE,
  HighScoreSchema,
  HighScoreSubmissionSchema,
  isNewPersonalBest,
  parseHighScores,
  readPersonalBest,
  settleScore,
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
  it("excludes scores of other rulesets", () => {
    expect(
      parseHighScores([score, { ...score, challenge: "ion-storm" }]),
    ).toEqual([score]);
  });
  it("skips rows that fail the schema instead of failing the board", () => {
    const { fitting: _fitting, ...unfitted } = score;
    const { score: _score, ...unscored } = score;
    expect(
      parseHighScores([
        score,
        { ...score, shipId: "tank" },
        { ...score, extra: 1 },
        unfitted,
        unscored,
        { broken: true },
      ]),
    ).toEqual([score]);
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
  it("rejects a missing, fractional or negative score", () => {
    const { score: _score, ...missing } = submission;
    expect(HighScoreSubmissionSchema.safeParse(missing).success).toBe(false);
    expect(accepts({ seconds: 0.5, score: 0 })).toBe(true);
    for (const value of [-1, 1.5])
      expect(accepts({ score: value })).toBe(false);
  });
  it("keeps time to the millisecond", () => {
    expect(accepts({ seconds: 3.017 })).toBe(true);
    for (const value of [0, 3.0171])
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
  });
});

describe("personal best", () => {
  it("lets a first score or a strictly higher one replace the best", () => {
    expect(isNewPersonalBest({ status: "absent" }, 0)).toBe(true);
    expect(isNewPersonalBest({ status: "found", score: 420 }, 421)).toBe(true);
    for (const value of [420, 419])
      expect(isNewPersonalBest({ status: "found", score: 420 }, value)).toBe(
        false,
      );
  });
  it("reads a missing row as absent and an unreadable one as no answer", () => {
    expect(readPersonalBest(undefined)).toEqual({ status: "absent" });
    expect(readPersonalBest(score)?.status).toBe("found");
    for (const row of [{}, { score: "57" }, { score: -1 }, null])
      expect(readPersonalBest(row)).toBeUndefined();
  });
});

describe("settling a score in its transaction", () => {
  const record = HighScoreSchema.parse({
    ...score,
    initials: "ACE",
    score: 421,
  });
  it("writes a first score and a higher one", () => {
    expect(settleScore(undefined, record).write).toBe(true);
    expect(settleScore({ ...score, score: 420 }, record).write).toBe(true);
  });
  it("keeps an equal or higher stored best and reports it", () => {
    // Another run, flown for a different time, stored the best.
    for (const best of [421, 500])
      expect(
        settleScore({ ...score, score: best, seconds: 99.5 }, record),
      ).toMatchObject({
        write: false,
        outcome: "kept",
        best,
      });
  });
  it("recognises this run already stored by an earlier attempt", () => {
    expect(settleScore({ ...record }, record)).toMatchObject({
      write: false,
      outcome: "saved",
    });
    // Retried under other initials after a lost reply: still this run.
    expect(settleScore({ ...record, initials: "BOB" }, record)).toMatchObject({
      write: false,
      outcome: "saved",
    });
    // Another run with the same score is not this one.
    expect(
      settleScore({ ...record, seconds: record.seconds + 1 }, record),
    ).toMatchObject({ write: false, outcome: "kept" });
  });
  it("leaves an unreadable stored row to the rules", () => {
    expect(settleScore({ broken: true }, record).write).toBe(true);
  });
});
