// Chooses verification stages from the paths that differ from HEAD.
// A commit saves the whole shared tree, so selection reads every changed
// path, not one session's edits.

const baseline = ["check:repo", "lint"];
const code = ["check:types", "test"];
const browser = ["build", "test:browser"];
const backend = ["test:rules", "test:competition"];

const isDocument = (path) =>
  /^(docs|\.agents|\.claude|\.pi\/agents)\//.test(path) ||
  /^[^/]+\.md$/.test(path) ||
  path === "LICENSE";

const touchesBrowser = (path) =>
  /^tests\/(browser|helpers)\//.test(path) || path === "playwright.config.ts";

const touchesBackend = (path) =>
  /^firestore\.|^firebase\.json$|^\.firebaserc$/.test(path) ||
  /^tests\/(firebase|helpers)\//.test(path) ||
  /^playwright(\.firebase)?\.config\.ts$/.test(path) ||
  path === "packages/mode-a/src/lib/firebase.ts" ||
  path === "packages/mode-a/src/schemas/highscore.ts" ||
  path === "packages/mode-a/tests/firestore.test.mjs";

/** Stage names for the changed paths, in the order `allSteps` lists them. */
export function selectSteps(paths, allSteps) {
  if (paths.length === 0) return [];
  const selected = new Set(baseline);
  if (!paths.every(isDocument)) for (const name of code) selected.add(name);
  if (paths.some(touchesBrowser))
    for (const name of browser) selected.add(name);
  if (paths.some(touchesBackend))
    for (const name of backend) selected.add(name);
  return allSteps.filter((name) => selected.has(name));
}
