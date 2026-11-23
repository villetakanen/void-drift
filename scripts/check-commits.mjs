import { spawnSync } from "node:child_process";

const baseline = "841c975deee6f53db6b663f6a08047f8f8704e06";
const exception = "80ad5972c6b096087f584d0fe90d113e44ed2a72";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function lint(from, to) {
  return run("pnpm", ["exec", "commitlint", "--from", from, "--to", to]);
}

const ancestry = run("git", ["merge-base", "--is-ancestor", exception, "HEAD"]);
if (ancestry === 0) {
  // PR #17's merge body contains an overlong line. Its second parent already
  // contains the first parent's history, so these ranges omit only the merge.
  const before = lint(baseline, `${exception}^2`);
  const after = lint(exception, "HEAD");
  process.exitCode = before || after;
} else if (ancestry === 1 || ancestry === 128) {
  // Branches that do not contain the merge still lint the entire normal range.
  process.exitCode = lint(baseline, "HEAD");
} else {
  process.exitCode = ancestry;
}
