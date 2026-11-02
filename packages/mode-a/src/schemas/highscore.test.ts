import { describe, expect, it } from "vitest";
import { parseHighScores } from "./highscore";

const score = {
	initials: "ONE",
	seconds: 42,
	deathCause: "STAR",
	shipId: "corvette",
	challenge: "ion-1",
	userId: "pilot",
};

describe("leaderboard rows", () => {
	it("skips scores with retired ship ids instead of failing the board", () => {
		expect(
			parseHighScores([score, { ...score, shipId: "tank" }, { broken: true }]),
		).toEqual([score]);
	});
});
