import { describe, expect, it } from "vitest";
import { CHALLENGE, parseHighScores } from "./highscore";

const score = {
	initials: "ONE",
	seconds: 42,
	deathCause: "STAR",
	shipId: "corvette",
	challenge: CHALLENGE,
	userId: "pilot",
};

describe("leaderboard rows", () => {
	it("keeps previous rules scores off the current board", () => {
		expect(
			parseHighScores([
				score,
				{ ...score, challenge: "ion-1" },
				{ ...score, challenge: "gravity-1" },
			]),
		).toEqual([score]);
	});
	it("skips scores with retired ship ids instead of failing the board", () => {
		expect(
			parseHighScores([score, { ...score, shipId: "tank" }, { broken: true }]),
		).toEqual([score]);
	});
});
