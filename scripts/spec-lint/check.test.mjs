import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("./check.mjs", import.meta.url));
const spec = `---
title: Reset
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
