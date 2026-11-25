import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  preparedReleaseSchema,
  releaseEnvironmentSchema,
  releaseFirebaseSchema,
  releaseSentryEnvironmentSchema,
} from "../packages/core/src/lib/schemas/release.mjs";
import { smokeArtifact } from "./release-smoke.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const json = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, "Git source evidence unavailable");
  return result.stdout.trimEnd();
}
function sourceFingerprint(cwd) {
  const hash = createHash("sha256");
  const files = git(
    cwd,
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
  )
    .split("\0")
    .filter(Boolean);
  // Same identity algorithm as verify.mjs, so reports can be compared directly.
  for (const file of [...new Set(files)].sort()) {
    hash.update(file).update("\0");
    const path = resolve(cwd, file);
    try {
      if (lstatSync(path).isSymbolicLink())
        hash.update("<symlink>").update(readlinkSync(path));
      else hash.update(readFileSync(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("<deleted>");
    }
  }
  return hash.digest("hex");
}
export function artifactManifest(directory) {
  const files = {};
  function visit(relative) {
    for (const entry of readdirSync(resolve(directory, relative), {
      withFileTypes: true,
    }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      assert(
        !entry.isSymbolicLink(),
        "Release artifacts cannot contain symlinks",
      );
      if (entry.isDirectory()) visit(name);
      else {
        assert(entry.isFile(), "Release artifact must be a regular file");
        files[name] = sha(readFileSync(resolve(directory, name)));
      }
    }
  }
  visit("");
  return { files, artifactFingerprint: sha(JSON.stringify(files)) };
}
function run(cwd, args, env, log, token = env.SENTRY_AUTH_TOKEN) {
  const result = spawnSync("pnpm", args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`;
  writeFileSync(log, token ? output.replaceAll(token, "[redacted]") : output);
  assert.equal(result.status, 0, `Command failed; inspect ${log}`);
}
function parseEnvironment(schema, env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Invalid release environment: ${[...new Set(parsed.error.issues.map((issue) => issue.path[0]))].join(", ")}`,
    );
  return parsed.data;
}
function withoutSentryCredentials(env) {
  const childEnv = { ...env };
  delete childEnv.SENTRY_AUTH_TOKEN;
  delete childEnv.SENTRY_ORG;
  delete childEnv.SENTRY_PROJECT;
  return childEnv;
}
function validateSourceMaps(scripts, maps) {
  const mapFiles = new Set(maps);
  for (const [file, code] of scripts) {
    const map = `${file}.map`;
    assert(
      mapFiles.has(map),
      `Sentry release build is missing ${basename(map)}`,
    );
    const sourceMap = JSON.parse(readFileSync(map, "utf8"));
    const debugId = code.match(/^\/\/# debugId=([a-f0-9-]{36})$/m)?.[1];
    assert(
      debugId && debugId === (sourceMap.debug_id ?? sourceMap.debugId),
      `Sentry release build has no matching Debug ID for ${basename(file)}`,
    );
  }
}
function uploadReleaseSourceMaps({
  cwd,
  directory,
  publicDirectory,
  env,
  sentry,
  release,
}) {
  run(
    cwd,
    [
      "exec",
      "sentry-cli",
      "sourcemaps",
      "upload",
      "--release",
      release,
      "--ext",
      "js",
      "--ext",
      "map",
      "--strict",
      "--wait",
      publicDirectory,
    ],
    {
      ...env,
      SENTRY_ORG: sentry.SENTRY_ORG,
      SENTRY_PROJECT: sentry.SENTRY_PROJECT,
      SENTRY_AUTH_TOKEN: sentry.SENTRY_AUTH_TOKEN,
      SENTRY_URL: "https://sentry.io/",
      SENTRY_ALLOW_FAILURE: "0",
      SENTRY_LOAD_DOTENV: "0",
      SENTRY_LOG_LEVEL: "warn",
    },
    resolve(directory, "sentry-upload.log"),
  );
}
function validatePublicBuild({
  cwd,
  directory,
  publicDirectory,
  env,
  firebase,
  sentry,
  sentryRelease,
}) {
  const entries = readdirSync(publicDirectory, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => resolve(entry.parentPath, entry.name));
  const maps = files.filter((file) => file.endsWith(".map"));
  try {
    assert(
      entries.every((entry) => entry.isFile() || entry.isDirectory()),
      "Public release artifacts must contain only files and directories",
    );
    const scripts = files
      .filter((file) => file.endsWith(".js"))
      .map((file) => [file, readFileSync(file, "utf8")]);
    const javascript = scripts.map(([, code]) => code).join("\n");
    for (const key of [
      "PUBLIC_FIREBASE_PROJECT_ID",
      "PUBLIC_FIREBASE_API_KEY",
      "PUBLIC_FIREBASE_APP_ID",
    ])
      assert(
        javascript.includes(firebase[key]),
        `Production bundle is missing ${key}`,
      );
    if (sentryRelease) {
      assert(
        javascript.includes(sentryRelease.release) &&
          javascript.includes(sentry.PUBLIC_SENTRY_DSN),
        "Production bundle is missing Sentry release configuration",
      );
      validateSourceMaps(scripts, maps);
      uploadReleaseSourceMaps({
        cwd,
        directory,
        publicDirectory,
        env,
        sentry,
        release: sentryRelease.release,
      });
    }
  } finally {
    for (const file of maps) rmSync(file);
  }
}
export async function prepareRelease({
  cwd = process.cwd(),
  env = process.env,
  smoke = smokeArtifact,
} = {}) {
  const firebase = parseEnvironment(releaseEnvironmentSchema, env);
  const sentry = Object.keys(releaseSentryEnvironmentSchema.shape).some((key) =>
    env[key]?.trim(),
  )
    ? parseEnvironment(releaseSentryEnvironmentSchema, env)
    : undefined;
  const root = resolve(cwd, "artifacts/prepared-releases");
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(
    `${root}/${new Date().toISOString().replaceAll(":", "-")}-`,
  );
  const bundle = resolve(directory, "bundle");
  const publicDirectory = resolve(bundle, "public");
  mkdirSync(bundle);
  const report = {
    status: "failed",
    createdAt: new Date().toISOString(),
    revision: git(cwd, "rev-parse", "HEAD"),
    workingTree: git(cwd, "status", "--short"),
    sourceFingerprint: sourceFingerprint(cwd),
    version: JSON.parse(readFileSync(resolve(cwd, "package.json"), "utf8"))
      .version,
    project: firebase.PUBLIC_FIREBASE_PROJECT_ID,
    emulators: false,
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
  };
  const sentryRelease = sentry
    ? {
        release: `void-drift@${report.version}+${randomUUID()}`,
        environment: "production",
      }
    : undefined;
  try {
    const config = releaseFirebaseSchema.parse(
      JSON.parse(readFileSync(resolve(cwd, "firebase.json"), "utf8")),
    );
    // Copy deployment inputs; publishing never rebuilds or reads current rules.
    copyFileSync(
      resolve(cwd, config.firestore.rules),
      resolve(bundle, "firestore.rules"),
    );
    copyFileSync(
      resolve(cwd, config.firestore.indexes),
      resolve(bundle, "firestore.indexes.json"),
    );
    json(resolve(bundle, "firebase.json"), {
      firestore: {
        rules: "firestore.rules",
        indexes: "firestore.indexes.json",
      },
      hosting: { ...config.hosting, public: "public" },
    });
    run(
      cwd,
      [
        "--filter",
        "web",
        "exec",
        "astro",
        "build",
        "--outDir",
        publicDirectory,
      ],
      {
        ...withoutSentryCredentials(env),
        ...firebase,
        PUBLIC_SENTRY_ENABLED: sentry ? "true" : "false",
        PUBLIC_SENTRY_DSN: sentry?.PUBLIC_SENTRY_DSN ?? "",
        PUBLIC_SENTRY_ENVIRONMENT: sentryRelease?.environment ?? "",
        PUBLIC_SENTRY_RELEASE: sentryRelease?.release ?? "",
      },
      resolve(directory, "build.log"),
      sentry?.SENTRY_AUTH_TOKEN,
    );
    validatePublicBuild({
      cwd,
      directory,
      publicDirectory,
      env,
      firebase,
      sentry,
      sentryRelease,
    });
    const manifest = artifactManifest(bundle);
    if (sentryRelease) report.sentry = sentryRelease;
    report.smoke = await smoke(publicDirectory, directory);
    report.sourceUnchanged =
      sourceFingerprint(cwd) === report.sourceFingerprint;
    assert(
      report.sourceUnchanged,
      "Source changed during release preparation; prepare a stable candidate again",
    );
    assert.deepEqual(
      artifactManifest(bundle),
      manifest,
      "Artifact changed during smoke checks",
    );
    Object.assign(report, manifest, { status: "prepared" });
    preparedReleaseSchema.parse(report);
  } catch (error) {
    report.status = "failed";
    report.failure = error.message;
    throw error;
  } finally {
    json(resolve(directory, "report.json"), report);
    console.log(`Release preparation ${report.status}: ${directory}`);
  }
  return directory;
}
export function checkRelease(directory) {
  const report = preparedReleaseSchema.parse(
    JSON.parse(readFileSync(resolve(directory, "report.json"), "utf8")),
  );
  const actual = artifactManifest(resolve(directory, "bundle"));
  assert.deepEqual(
    actual.files,
    report.files,
    "Prepared artifact files changed; prepare again",
  );
  assert.equal(
    actual.artifactFingerprint,
    report.artifactFingerprint,
    "Prepared artifact fingerprint changed",
  );
  return report;
}
export function publishRelease(
  directory,
  { cwd = process.cwd(), deploy = run } = {},
) {
  const report = checkRelease(directory);
  // This command is invoked only after explicit publication authorization.
  const attempt = mkdtempSync(`${resolve(directory)}/publication-`);
  let status = "failed";
  try {
    // Firebase writes its own cache beside its config. Keep that out of the
    // preserved bundle by deploying an exact, hash-checked copy per attempt.
    const staged = resolve(attempt, "bundle");
    cpSync(resolve(directory, "bundle"), staged, { recursive: true });
    assert.deepEqual(artifactManifest(staged).files, report.files);
    deploy(
      cwd,
      [
        "exec",
        "firebase",
        "deploy",
        "--only",
        "firestore,hosting",
        "--project",
        report.project,
        "--config",
        resolve(staged, "firebase.json"),
      ],
      withoutSentryCredentials(process.env),
      resolve(attempt, "deploy.log"),
    );
    checkRelease(directory);
    status = "deployed";
  } finally {
    json(resolve(attempt, "report.json"), {
      status,
      revision: report.revision,
      artifactFingerprint: report.artifactFingerprint,
      finishedAt: new Date().toISOString(),
      liveVerified: false,
    });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [command, directory, ...extra] = process.argv.slice(2);
    assert(
      extra.length === 0 &&
        ((command === "prepare" && !directory) ||
          (["check", "publish"].includes(command) && directory)),
      "Usage: release.mjs prepare | check <directory> | publish <directory>",
    );
    if (command === "prepare") {
      if (existsSync(".env.local")) process.loadEnvFile(".env.local");
      await prepareRelease();
    } else if (command === "check") {
      checkRelease(directory);
      console.log("Prepared artifact matches its report.");
    } else publishRelease(directory);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
