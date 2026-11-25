import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";
import { checkRelease, prepareRelease, publishRelease } from "./release.mjs";

const sentryEnv = {
  PUBLIC_SENTRY_DSN:
    "https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/42",
  SENTRY_ORG: "fixture-org",
  SENTRY_PROJECT: "fixture-project",
  SENTRY_AUTH_TOKEN: "fixture-private-token",
};

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "void-release-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  for (const [name, content] of Object.entries({
    ".gitignore": "artifacts/\nbin/\n",
    "package.json": '{"version":"0.5.0"}',
    "firebase.json": JSON.stringify({
      firestore: {
        rules: "firestore.rules",
        indexes: "firestore.indexes.json",
      },
      hosting: {
        public: "apps/web/dist",
        cleanUrls: true,
        redirects: [
          {
            source: "/credits",
            destination: "/field-guide/credits",
            type: 301,
          },
        ],
      },
    }),
    "firestore.rules": "original rules",
    "firestore.indexes.json": "{}",
  }))
    writeFileSync(join(cwd, name), content);
  for (const args of [
    ["init", "--quiet"],
    ["add", "."],
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "--quiet",
      "-m",
      "test: fixture",
    ],
  ])
    assert.equal(spawnSync("git", args, { cwd }).status, 0);
  mkdirSync(join(cwd, "bin"));
  const pnpm = join(cwd, "bin/pnpm");
  writeFileSync(
    pnpm,
    `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
fs.mkdirSync("artifacts", {recursive: true});
fs.appendFileSync("artifacts/commands.jsonl", JSON.stringify(process.argv.slice(2)) + "\\n");
if (process.argv[3] === "sentry-cli") {
  const assert = require("node:assert/strict");
  const out = process.argv.at(-1);
  const release = process.argv[process.argv.indexOf("--release") + 1];
  assert.ok(fs.readFileSync(path.join(out, "app.js"), "utf8").includes(release));
  assert.ok(fs.existsSync(path.join(out, "app.js.map")));
  assert.equal(process.env.SENTRY_ORG, "fixture-org");
  assert.equal(process.env.SENTRY_PROJECT, "fixture-project");
  assert.equal(process.env.SENTRY_AUTH_TOKEN, "fixture-private-token");
  if (process.env.FAIL_UPLOAD) {
    console.error("Fixture upload error with credential:", process.env.SENTRY_AUTH_TOKEN);
    process.exit(9);
  }
  process.exit(0);
}
if (process.env.FAIL_BUILD) process.exit(7);
if (process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_ORG || process.env.SENTRY_PROJECT) process.exit(8);
const out = process.argv[process.argv.indexOf("--outDir") + 1];
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, "index.html"), "<h1>Built</h1>");
let code = process.env.OMIT_CONFIG ? "unconfigured" : JSON.stringify([process.env.PUBLIC_FIREBASE_PROJECT_ID, process.env.PUBLIC_FIREBASE_API_KEY, process.env.PUBLIC_FIREBASE_APP_ID]);
if (process.env.PUBLIC_SENTRY_ENABLED === "true") {
  const id = "00000000-0000-0000-0000-000000000042";
  code += JSON.stringify([process.env.PUBLIC_SENTRY_DSN, process.env.PUBLIC_SENTRY_RELEASE]);
  code += "\\n//# debugId=" + id + "\\n";
  if (!process.env.OMIT_MAP) {
    fs.writeFileSync(path.join(out, "app.js.map"), JSON.stringify({
      debug_id: process.env.MISMATCH_DEBUG_ID ? "different" : id
    }));
  }
}
fs.writeFileSync(path.join(out, "app.js"), code);
if (process.env.MUTATE_SOURCE) fs.writeFileSync("firestore.rules", "changed");
`,
  );
  chmodSync(pnpm, 0o755);
  return {
    cwd,
    env: {
      ...process.env,
      PATH: `${join(cwd, "bin")}${delimiter}${process.env.PATH}`,
      PUBLIC_FIREBASE_API_KEY: "fixture-public-key",
      PUBLIC_FIREBASE_PROJECT_ID: "void-drift-alpha",
      PUBLIC_FIREBASE_APP_ID: "fixture-app",
      PUBLIC_FIREBASE_EMULATORS: "false",
      PUBLIC_SENTRY_DSN: "",
      SENTRY_ORG: "",
      SENTRY_PROJECT: "",
      SENTRY_AUTH_TOKEN: "",
    },
    smoke: async () => ({
      passed: true,
      browser: "fixture",
      externalNetwork: "blocked",
      liveBackendVerified: false,
    }),
  };
}
function failedReport(cwd) {
  const root = join(cwd, "artifacts/prepared-releases");
  return JSON.parse(
    readFileSync(join(root, readdirSync(root)[0], "report.json"), "utf8"),
  );
}
test("invalid production configuration fails before a build and does not echo values", async (t) => {
  const options = fixture(t);
  for (const [key, value] of [
    ["PUBLIC_FIREBASE_API_KEY", " "],
    ["PUBLIC_FIREBASE_APP_ID", ""],
    ["PUBLIC_FIREBASE_PROJECT_ID", "demo-void-drift"],
    ["PUBLIC_FIREBASE_EMULATORS", "true"],
    ["PUBLIC_FIREBASE_EMULATORS", undefined],
  ]) {
    await assert.rejects(
      prepareRelease({ ...options, env: { ...options.env, [key]: value } }),
      (error) => error.message === `Invalid release environment: ${key}`,
    );
  }
  assert.throws(() =>
    readFileSync(join(options.cwd, "artifacts/commands.jsonl")),
  );
});
test("preparation saves the tested build, source identity and original deployment inputs", async (t) => {
  const options = fixture(t);
  const directory = await prepareRelease(options);
  const report = checkRelease(directory);
  assert.equal(report.workingTree, "");
  assert.equal(report.sourceUnchanged, true);
  assert.equal(report.smoke.liveBackendVerified, false);
  assert.equal(report.sentry, undefined);
  assert.equal(
    readFileSync(join(directory, "bundle/firestore.rules"), "utf8"),
    "original rules",
  );
  assert(!JSON.stringify(report).includes(options.env.PUBLIC_FIREBASE_API_KEY));
  assert.equal(
    readFileSync(join(options.cwd, "artifacts/commands.jsonl"), "utf8")
      .trim()
      .split("\n").length,
    1,
  );
});
test("configured preparation uploads the exact build's source maps and keeps them out of the prepared bundle", async (t) => {
  const options = fixture(t);
  options.env = { ...options.env, ...sentryEnv };
  writeFileSync(join(options.cwd, "firestore.rules"), "dirty rules");
  const directory = await prepareRelease(options);
  const report = checkRelease(directory);
  const nextReport = checkRelease(await prepareRelease(options));
  const entries = readFileSync(
    join(options.cwd, "artifacts/commands.jsonl"),
    "utf8",
  )
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(entries.length, 4);
  assert.deepEqual(entries[1], [
    "exec",
    "sentry-cli",
    "sourcemaps",
    "upload",
    "--release",
    report.sentry.release,
    "--ext",
    "js",
    "--ext",
    "map",
    "--strict",
    "--wait",
    join(directory, "bundle/public"),
  ]);
  assert.equal(report.sentry.environment, "production");
  assert.match(report.workingTree, /firestore.rules/);
  assert.equal(report.sourceFingerprint, nextReport.sourceFingerprint);
  assert.notEqual(report.sentry.release, nextReport.sentry.release);
  assert.equal(report.files["public/app.js.map"], undefined);
  assert(!existsSync(join(directory, "bundle/public/app.js.map")));
  assert(!JSON.stringify(report).includes(sentryEnv.SENTRY_AUTH_TOKEN));
});
test("incomplete Sentry configuration fails before building", async (t) => {
  const options = fixture(t);
  await assert.rejects(
    prepareRelease({
      ...options,
      env: { ...options.env, PUBLIC_SENTRY_DSN: sentryEnv.PUBLIC_SENTRY_DSN },
    }),
    /Invalid release environment: SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN/,
  );
  assert(!existsSync(join(options.cwd, "artifacts/commands.jsonl")));
});
test("missing or mismatched Debug IDs and failed source-map uploads cannot prepare a release", async (t) => {
  for (const flag of ["OMIT_MAP", "MISMATCH_DEBUG_ID", "FAIL_UPLOAD"]) {
    const options = fixture(t);
    await assert.rejects(
      prepareRelease({
        ...options,
        env: { ...options.env, ...sentryEnv, [flag]: "1" },
      }),
    );
    const root = join(options.cwd, "artifacts/prepared-releases");
    const directory = join(root, readdirSync(root)[0]);
    const report = failedReport(options.cwd);
    assert.equal(report.status, "failed");
    assert(!JSON.stringify(report).includes(sentryEnv.SENTRY_AUTH_TOKEN));
    assert(!existsSync(join(directory, "bundle/public/app.js.map")));
    const log = join(directory, "sentry-upload.log");
    if (flag === "FAIL_UPLOAD") {
      assert.match(readFileSync(log, "utf8"), /credential: \[redacted\]/);
    } else {
      assert(!existsSync(log));
    }
  }
});
test("build failure, missing embedded configuration and source changes cannot prepare a release", async (t) => {
  for (const flag of ["FAIL_BUILD", "OMIT_CONFIG", "MUTATE_SOURCE"]) {
    const options = fixture(t);
    await assert.rejects(
      prepareRelease({ ...options, env: { ...options.env, [flag]: "1" } }),
    );
    assert.equal(failedReport(options.cwd).status, "failed");
  }
});
test("failed browser smoke remains failed evidence", async (t) => {
  const options = fixture(t);
  await assert.rejects(
    prepareRelease({
      ...options,
      smoke: async () => {
        throw new Error("hydration failed");
      },
    }),
    /hydration failed/,
  );
  assert.equal(failedReport(options.cwd).status, "failed");
});
test("changed, added and deleted artifact files prevent publication", async (t) => {
  for (const change of ["changed", "added", "deleted"]) {
    const options = fixture(t);
    const directory = await prepareRelease(options);
    const file = join(
      directory,
      "bundle/public",
      change === "added" ? "extra.js" : "app.js",
    );
    if (change === "deleted") rmSync(file);
    else writeFileSync(file, "different");
    assert.throws(
      () =>
        publishRelease(directory, {
          deploy: () => assert.fail("must not deploy"),
        }),
      /artifact files changed/,
    );
  }
});
test("publication consumes the saved bundle without rebuilding or taking changed source rules", async (t) => {
  const options = fixture(t);
  const directory = await prepareRelease(options);
  writeFileSync(join(options.cwd, "firestore.rules"), "later unrelated rules");
  let calls = 0;
  publishRelease(directory, {
    cwd: options.cwd,
    deploy: (_cwd, args) => {
      calls++;
      assert.deepEqual(args.slice(0, -1), [
        "exec",
        "firebase",
        "deploy",
        "--only",
        "firestore,hosting",
        "--project",
        "void-drift-alpha",
        "--config",
      ]);
      const staged = dirname(args.at(-1));
      assert(staged.startsWith(join(directory, "publication-")));
      assert.deepEqual(
        JSON.parse(readFileSync(join(staged, "firebase.json"), "utf8")).hosting
          .redirects,
        [
          {
            source: "/credits",
            destination: "/field-guide/credits",
            type: 301,
          },
        ],
      );
      assert.equal(
        readFileSync(join(staged, "firestore.rules"), "utf8"),
        "original rules",
      );
      mkdirSync(join(staged, ".firebase"));
      writeFileSync(
        join(staged, ".firebase/hosting.public.cache"),
        "CLI cache",
      );
    },
  });
  assert.equal(calls, 1);
  const attempt = readdirSync(directory).find((name) =>
    name.startsWith("publication-"),
  );
  const publication = JSON.parse(
    readFileSync(join(directory, attempt, "report.json"), "utf8"),
  );
  assert.equal(publication.status, "deployed");
  assert.equal(publication.liveVerified, false);
  assert.equal(checkRelease(directory).status, "prepared");
});
test("publication failure is recorded separately from successful preparation", async (t) => {
  const directory = await prepareRelease(fixture(t));
  assert.throws(
    () =>
      publishRelease(directory, {
        deploy: () => {
          throw new Error("deploy failed");
        },
      }),
    /deploy failed/,
  );
  assert.equal(checkRelease(directory).status, "prepared");
  const attempt = readdirSync(directory).find((name) =>
    name.startsWith("publication-"),
  );
  assert.equal(
    JSON.parse(readFileSync(join(directory, attempt, "report.json"))).status,
    "failed",
  );
});
