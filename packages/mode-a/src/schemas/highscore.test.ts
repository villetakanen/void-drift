import { describe, expect, it } from "vitest";
import { parseHighScores } from "./highscore";

const score = {
	initials: "ONE",
	seconds: 42,
	deathCause: "STAR",
	shipId: "corvette",
	challenge: "arrival-3",
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
