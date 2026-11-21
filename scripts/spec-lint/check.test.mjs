import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("./check.mjs", import.meta.url));
const spec = `---
status: draft
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

test("spec titles live in H1; legacy metadata titles remain accepted", (t) => {
  const root = mkdtempSync(join(tmpdir(), "void-drift-spec-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, "spec.md");
  for (const text of [spec, spec.replace("---\n", "---\ntitle: Reset\n")]) {
    writeFileSync(file, text);
    const result = spawnSync(process.execPath, [checker, root], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }
});

test("title-optional specs still require status and provenance", (t) => {
  const root = mkdtempSync(join(tmpdir(), "void-drift-spec-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, "spec.md");
  for (const [field, message] of [
    ["status: draft\n", /expected draft or approved status/],
    [
      "generated: { by: codex/gpt-6, at: 2026-11-19T09:00:00Z }\n",
      /expected actor and timestamp/,
    ],
    ["verified: []\n", /expected verified events or \[\]/],
  ]) {
    writeFileSync(file, spec.replace(field, ""));
    const result = spawnSync(process.execPath, [checker, root], {
      encoding: "utf8",
    });
    assert.equal(result.status, 1, result.stderr + result.stdout);
    assert.match(result.stdout, message);
  }
});

test("nested contracts use folders, while approval, criteria and attachments remain checked", (t) => {
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
  writeFileSync(
    childFile,
    spec
      .replace("status: draft", "status: approved")
      .replace("- The counter", "- [ ] The counter"),
  );
  const invalid = lint();
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.match(invalid.stdout, /current human verification/);
  assert.match(invalid.stdout, /task checkbox/);
  assert.match(invalid.stdout, /ticks\.json is not linked/);
});
