import { describe, expect, it } from "vitest";
import {
  CHALLENGE,
  HighScoreSubmissionSchema,
  MAX_SCORE,
  parseHighScores,
} from "./highscore";

const score = {
  initials: "ONE",
  seconds: 42,
  score: 57,
  deathCause: "STAR",
  shipId: "corvette",
  challenge: CHALLENGE,
  userId: "pilot",
};

describe("leaderboard rows", () => {
  it("excludes scores from the previous gameplay rules", () => {
    expect(
      parseHighScores([score, { ...score, challenge: "arrival-1" }]),
    ).toEqual([score]);
  });
  it("skips scores with retired ship ids instead of failing the board", () => {
    expect(
      parseHighScores([score, { ...score, shipId: "tank" }, { broken: true }]),
    ).toEqual([score]);
  });
});

describe("score submission", () => {
  const { userId: _userId, ...submission } = score;
  it("accepts a whole-number score", () => {
    expect(HighScoreSubmissionSchema.safeParse(submission).success).toBe(true);
    expect(
      HighScoreSubmissionSchema.safeParse({ ...submission, score: MAX_SCORE })
        .success,
    ).toBe(true);
  });
  it("rejects a missing, fractional, non-positive or oversized score", () => {
    const { score: _score, ...missing } = submission;
    expect(HighScoreSubmissionSchema.safeParse(missing).success).toBe(false);
    for (const value of [0, -3, 1.5, MAX_SCORE + 1, "57"])
      expect(
        HighScoreSubmissionSchema.safeParse({ ...submission, score: value })
          .success,
      ).toBe(false);
  });
  it("skips rows without a score", () => {
    const { score: _score, ...legacy } = score;
    expect(parseHighScores([legacy, score])).toEqual([score]);
  });
});
