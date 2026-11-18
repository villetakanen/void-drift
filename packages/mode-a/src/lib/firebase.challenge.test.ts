import { describe, expect, it } from "vitest";
import { CHALLENGE_UNAVAILABLE } from "../schemas/highscore";
import { loadHighScores, scoresAvailable, submitHighScore } from "./firebase";

describe("pending challenge score access", () => {
  it("reports the board unavailable without loading it", async () => {
    expect(scoresAvailable()).toBe(false);
    await expect(loadHighScores()).rejects.toThrow(CHALLENGE_UNAVAILABLE);
  });

  it("does not attempt a score submission", async () => {
    const result = await submitHighScore({
      initials: "ACE",
      seconds: 42,
      score: 60,
      deathCause: "POWER",
      shipId: "fighter",
      fitting: ["ion", "ion"],
      stabilizers: true,
      linkedEngines: false,
      challenge: "fires-in-the-sky",
    });
    expect(result).toEqual({ success: false, error: CHALLENGE_UNAVAILABLE });
  });
});
