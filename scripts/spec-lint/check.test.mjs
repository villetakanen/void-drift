import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("./check.mjs", import.meta.url));
const spec = `---
generated: { by: codex/gpt-6, at: 2026-11-19T09:00:00Z }
verified: []
---
# Reset
## Blueprint
### Context
A pilot can restart a run.
### Architecture
The flight loop owns the active run.
### Constraints
- Each run starts at tick zero.
## Contract
### Definition of Done
- The counter reads zero at restart.
### Regression guardrails
- A restart works while paused.
### Scenarios
\`\`\`gherkin
Scenario: Reset after pausing
  Given a paused run
  When the pilot restarts
  Then the counter reads zero
\`\`\`
`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "void-drift-spec-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return (text) => {
    writeFileSync(join(root, "spec.md"), text);
    return spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
  };
}

test("spec names live in H1 and verification records humans only", (t) => {
  const lint = fixture(t);
  for (const verified of [
    "[]",
    "[{ by: human:ville, at: 2026-11-19 }]",
    "\n  - by: human:ville\n    at: 2026-11-19T09:00:00Z",
  ]) {
    const result = lint(spec.replace("verified: []", `verified: ${verified}`));
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }
});

test("spec status and duplicate title metadata are forbidden even when empty", (t) => {
  const lint = fixture(t);
  for (const field of ["status", "title"]) {
    for (const value of ["", "draft", "approved", "Reset"]) {
      const result = lint(spec.replace("---\n", `---\n${field}: ${value}\n`));
      assert.equal(result.status, 1, result.stderr + result.stdout);
      assert.match(
        result.stdout,
        new RegExp(`spec ${field} metadata is forbidden`),
      );
    }
  }
});

test("provenance and valid dates remain required", (t) => {
  const lint = fixture(t);
  for (const [text, message] of [
    [spec.replace(/generated:.*\n/, ""), /expected actor and timestamp/],
    [spec.replace("verified: []\n", ""), /expected verified events or \[\]/],
    [spec.replace("2026-11-19T09:00:00Z", "2026-02-30"), /invalid timestamp/],
    [
      spec.replace(
        "verified: []",
        "verified: [{ by: human:ville, at: 2026-02-30 }]",
      ),
      /invalid timestamp/,
    ],
    [
      spec.replace("verified: []", "verified: [{ by: human:ville }]"),
      /invalid timestamp/,
    ],
  ]) {
    const result = lint(text);
    assert.equal(result.status, 1, result.stderr + result.stdout);
    assert.match(result.stdout, message);
  }
});

test("model checks and blank human identifiers cannot become verification", (t) => {
  const lint = fixture(t);
  for (const actor of [
    "codex/gpt-6",
    "model:gpt-6",
    '"human: "',
    '"human: ville"',
  ]) {
    const result = lint(
      spec.replace(
        "verified: []",
        `verified: [{ by: ${actor}, at: 2026-11-19 }]`,
      ),
    );
    assert.equal(result.status, 1, result.stderr + result.stdout);
    assert.match(result.stdout, /human:<id>/);
  }
});

test("nested contracts use folders, while criteria and attachments remain checked", (t) => {
  const root = mkdtempSync(join(tmpdir(), "void-drift-spec-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const child = join(root, "flight", "reset");
  mkdirSync(child, { recursive: true });
  writeFileSync(join(root, "flight", "spec.md"), spec);
  const childFile = join(child, "spec.md");
  writeFileSync(childFile, spec);
  const lint = () =>
    spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
  const valid = lint();
  assert.equal(valid.status, 0, valid.stderr + valid.stdout);

  mkdirSync(join(child, "attachments"));
  writeFileSync(join(child, "attachments", "ticks.json"), "[]");
  writeFileSync(childFile, spec.replace("- The counter", "- [ ] The counter"));
  const invalid = lint();
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.match(invalid.stdout, /task checkbox/);
  assert.match(invalid.stdout, /ticks\.json is not linked/);
});

test("attachments share human verification rules while retaining their own metadata", (t) => {
  const root = mkdtempSync(join(tmpdir(), "void-drift-spec-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "attachments"));
  writeFileSync(
    join(root, "spec.md"),
    `${spec}\n[Reference](attachments/reference.md)\n`,
  );
  const file = join(root, "attachments", "reference.md");
  const attachment = `---
title: Reference
status: reference
generated: { by: codex/gpt-6, at: 2026-11-19T09:00:00Z }
verified: [{ by: human:ville, at: 2026-11-19 }]
---
# Reference
`;
  writeFileSync(file, attachment);
  const lint = () =>
    spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
  const valid = lint();
  assert.equal(valid.status, 0, valid.stderr + valid.stdout);
  writeFileSync(file, attachment.replace("human:ville", "codex/gpt-6"));
  const invalid = lint();
  assert.equal(invalid.status, 1, invalid.stderr + invalid.stdout);
  assert.match(
    invalid.stdout,
    /attachments\/reference.md: provenance:.*human:<id>/,
  );
});
