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

const leanSpec = `---
generated: { by: codex/gpt-6, at: 2026-11-19T09:00:00Z }
verified: []
---
# Export

Readers can export selected rows.

## Scenarios

\`\`\`gherkin
Feature: Export

  Scenario: Export exactly twenty rows
    Given I selected twenty rows
    When I request an export
    Then the file contains all twenty rows
\`\`\`
`;

test("lean specs can have just a purpose and a feature, or optional sections", (t) => {
  const lint = fixture(t);
  for (const sections of [
    "",
    "## Architecture\n\nThe exporter owns the output.\n\n",
    "## Constraints\n\nExports contain up to twenty rows.\n\n",
  ]) {
    const result = lint(
      leanSpec.replace("## Scenarios", `${sections}## Scenarios`),
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }
});

test("lean format enforces the feature name, scenario boundaries and single verification", (t) => {
  const lint = fixture(t);
  for (const [from, to, message] of [
    ["Feature: Export", "Feature: Empty", /repeat the spec title/],
    ["When I request", "And I request", /Given, When and Then/],
    ["Then the file contains", "And the file contains", /Given, When and Then/],
    ["\n```\n", "\n~~~\n", /one closed gherkin block/],
    ["## Scenarios", "## Architecture\n\n## Scenarios", /empty section/],
    [
      "## Scenarios",
      "## Constraints\n\n- [ ] Ship it.\n\n## Scenarios",
      /checkbox/,
    ],
    [
      "## Scenarios",
      "## Constraints\n\n### Acceptance criteria\n\nShip it.\n\n## Scenarios",
      /completion criteria/,
    ],
    [
      "## Scenarios",
      "## Blueprint\n\n## Scenarios",
      /optional Architecture and Constraints/,
    ],
    [
      "verified: []",
      "verified: [{ by: human:a, at: 2026-11-19 }, { by: human:b, at: 2026-11-20 }]",
      /at most one human/,
    ],
    [
      "verified: []",
      "verified: []\nrevision: 2",
      /frontmatter must omit revision/,
    ],
  ]) {
    const result = lint(leanSpec.replace(from, to));
    assert.equal(result.status, 1, result.stderr + result.stdout);
    assert.match(result.stdout, message);
  }
});

test("format selection and attachment provenance follow each spec in a mixed tree", (t) => {
  const root = mkdtempSync(join(tmpdir(), "void-drift-mixed-specs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const child = join(root, "export");
  mkdirSync(join(child, "attachments"), { recursive: true });
  const reviews =
    "verified: [{ by: human:a, at: 2026-11-19 }, { by: human:b, at: 2026-11-20 }]";
  // A heading quoted inside a fence does not change the parent's format.
  writeFileSync(
    join(root, "spec.md"),
    spec.replace("verified: []", reviews) +
      "\n```markdown\n## Scenarios\n```\n",
  );
  writeFileSync(
    join(child, "spec.md"),
    leanSpec.replace(
      "selected rows.",
      "selected rows. [Columns](attachments/columns.md)",
    ),
  );
  const attachment = join(child, "attachments", "columns.md");
  const data = `${leanSpec.slice(0, leanSpec.indexOf("# Export"))}# Columns\n`;
  writeFileSync(attachment, data);
  const lint = () =>
    spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
  const valid = lint();
  assert.equal(valid.status, 0, valid.stderr + valid.stdout);
  writeFileSync(attachment, data.replace("verified: []", reviews));
  assert.match(lint().stdout, /columns\.md: provenance:.*at most one human/);
  rmSync(attachment);
  assert.match(lint().stdout, /columns\.md does not resolve/);
});
