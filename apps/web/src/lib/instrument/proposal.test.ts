import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GRAVITY_TUNING, TUNING } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { InstrumentConfig } from "./config";
import {
	applyGravitySection,
	gravityProposal,
	readGravityProposal,
} from "./proposal";
import { FIELD_DOCUMENT } from "./starter";

// Contract: docs/specs/gravity-field.md, "Changing gravity values".
const stronger = GRAVITY_TUNING.planetStrength * 2;
const withChanges = (changes: object) =>
	InstrumentConfig.parse({
		...FIELD_DOCUMENT,
		field: { ...FIELD_DOCUMENT.field, changes },
	});
const proposal = (changes: object = { planetStrength: stronger }) => {
	const text = gravityProposal(withChanges(changes));
	if (!text) throw new Error("expected a proposal");
	return text;
};
const reason = (text: string, current = GRAVITY_TUNING) => {
	const result = readGravityProposal(text, current);
	return result.ok ? "" : result.reason;
};

describe("gravity proposal", () => {
	it("exists only for a field with gravity changes", () => {
		expect(gravityProposal(InstrumentConfig.parse(FIELD_DOCUMENT))).toBeNull();
		expect(
			gravityProposal(
				withChanges({ planetStrength: GRAVITY_TUNING.planetStrength }),
			),
		).toBeNull();
	});
	it("names the change and the Lab wells it leaves behind", () => {
		const text = proposal();
		expect(text).toContain(
			`planetStrength ${GRAVITY_TUNING.planetStrength} → ${stronger}`,
		);
		for (const well of FIELD_DOCUMENT.field.wells)
			expect(text).toMatch(new RegExp(`^Not applied.*${well.label}`, "m"));
	});
	it("reads back as exactly its changes", () => {
		const result = readGravityProposal(proposal(), GRAVITY_TUNING);
		expect(result.ok && result.next).toEqual({
			...GRAVITY_TUNING,
			planetStrength: stronger,
		});
	});
	it("refuses each invalid case with a reason", () => {
		const text = proposal();
		const json = text.slice(text.search(/^\{/m));
		const header = text.slice(0, text.search(/^\{/m));
		expect(reason(header)).toMatch(/No instrument document/);
		expect(reason(`${header}{ not json`)).toMatch(/not valid JSON/);
		expect(reason(`${header}{"version": 9}`)).toMatch(/invalid/);
		const doc = JSON.parse(json);
		expect(
			reason(
				`${header}${JSON.stringify({
					...doc,
					field: undefined,
					vehicles: doc.vehicles.map(
						({ start: _, ...vehicle }: { start: unknown }) => vehicle,
					),
				})}`,
			),
		).toMatch(/no gravity field/);
		const outOfRange = {
			...doc,
			field: { ...doc.field, changes: { sunMultiplier: 1 } },
		};
		expect(reason(`${header}${JSON.stringify(outOfRange)}`)).toMatch(
			/invalid|range/,
		);
		expect(reason(text.replace(/^Apply: .*$/m, ""))).toMatch(
			/Apply line is missing/,
		);
		expect(reason(text.replace(`→ ${stronger}`, `→ ${stronger + 1}`))).toMatch(
			/does not match/,
		);
		expect(
			reason(text, { ...GRAVITY_TUNING, planetStrength: stronger }),
		).toMatch(/Stale proposal: planetStrength/);
		expect(
			reason(
				text.replace(
					"Apply: planetStrength",
					"Apply: drag 1 → 2; planetStrength",
				),
			),
		).toMatch(/Unknown gravity value drag/);
	});
	it("replaces only the gravity section of the tuning file", () => {
		const result = applyGravitySection(proposal(), TUNING);
		expect(result.ok && result.file).toEqual({
			...TUNING,
			gravity: { ...TUNING.gravity, planetStrength: stronger },
		});
		expect(applyGravitySection(proposal(), { version: 1 }).ok).toBe(false);
	});
});

describe("pnpm tuning:apply", () => {
	const run = (args: string[], file: string) =>
		spawnSync("node", ["scripts/tuning-apply.mjs", ...args], {
			encoding: "utf8",
			env: { ...process.env, VOID_DRIFT_TUNING_FILE: file },
		});
	it("applies a proposal once, then refuses it as stale without writing", () => {
		const dir = mkdtempSync(join(tmpdir(), "tuning-"));
		const file = join(dir, "tuning.json");
		const block = join(dir, "proposal.txt");
		writeFileSync(file, JSON.stringify(TUNING));
		writeFileSync(block, proposal());
		const applied = run(["gravity", block], file);
		expect(applied.status).toBe(0);
		expect(applied.stdout).toContain(
			`planetStrength ${GRAVITY_TUNING.planetStrength} → ${stronger}`,
		);
		const written = readFileSync(file, "utf8");
		expect(JSON.parse(written).gravity.planetStrength).toBe(stronger);
		const again = run(["gravity", block], file);
		expect(again.status).toBe(1);
		expect(again.stderr).toMatch(/Refused, nothing written: Stale/);
		expect(readFileSync(file, "utf8")).toBe(written);
		expect(run(["ship", block], file).status).toBe(2);
	});
});
