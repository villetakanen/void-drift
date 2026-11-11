import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

// Scope and size limits on context documents warn; they never fail the gate.
const warnings = [];
const warn = (message) => {
  warnings.push(message);
  console.warn(`WARNING: ${message}`);
};

const instructions = readFileSync("AGENTS.md", "utf8");
const lineCount = instructions.trimEnd().split("\n").length;
if (lineCount >= 80) {
  warn(`AGENTS.md has ${lineCount} lines; keep it below 80.`);
}
for (const match of instructions.matchAll(/`((?:docs|\.agents)\/[^`]+)`/g)) {
  assert(existsSync(match[1]), `Missing agent context: ${match[1]}`);
}
console.log(
  `Agent entry point: ${lineCount} lines; all context links resolve.`,
);

// Relative Markdown links across tracked docs fail the gate when their target is missing.
// Links into ignored local evidence (artifacts/) are expected to be absent elsewhere.
const markdownFiles = execFileSync(
  "git",
  ["ls-files", "-z", "--", "*.md", ":!**/node_modules/**"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file && existsSync(file));
const brokenLinks = [];
for (const file of markdownFiles) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
    const target = match[1];
    if (/^(?:[a-z]+:|\/)/i.test(target)) continue;
    const path = relative(process.cwd(), resolve(dirname(file), target));
    if (path.startsWith("artifacts/") || existsSync(path)) continue;
    brokenLinks.push(`${file}: link target missing: ${target}`);
  }
}
console.log(
  `Markdown links: ${markdownFiles.length} files; ${brokenLinks.length} missing target(s).`,
);
for (const miss of brokenLinks) console.error(`FAIL: ${miss}`);
assert.equal(
  brokenLinks.length,
  0,
  `${brokenLinks.length} Markdown link target(s) missing`,
);

// docs/design.md holds experience principles, art direction and brand only.
const design = readFileSync("docs/design.md", "utf8");
const designLines = design.trimEnd().split("\n");
if (designLines.length > 200) {
  warn(
    `docs/design.md has ${designLines.length} lines; above 200, consider splitting brand out.`,
  );
}
const designChecks = [
  [
    /^#{1,6} .*(\b\d+\.\d+(\.\d+)?\b|\b\d{4}-\d{2}-\d{2}\b)/,
    "version or date in a heading (records belong in feature specs)",
  ],
  [/\/lab\/studies\//, "link to a study (studies are history)"],
  [
    /\b(?:packages|apps|scripts|tests)\/|\.(?:ts|js|mjs|svelte|astro|css)\b/,
    "source path (values and rules belong in specs or code)",
  ],
];
designLines.forEach((line, index) => {
  for (const [pattern, reason] of designChecks) {
    if (pattern.test(line)) {
      warn(`docs/design.md:${index + 1}: ${reason}.`);
    }
  }
});
console.log(
  `docs/design.md: ${designLines.length} lines; ${warnings.length} context warning(s).`,
);

// Canvas cannot read CSS custom properties; its type families mirror the tokens.
const tokens = readFileSync("packages/core/src/lib/styles/tokens.css", "utf8");
const canvasTypes = readFileSync(
  "packages/core/src/lib/ui/typography.ts",
  "utf8",
);
for (const [role, constant] of [
  ["ui", "FONT_FAMILY_UI"],
  ["prose", "FONT_FAMILY_PROSE"],
]) {
  const css = tokens
    .match(new RegExp(`--font-family-${role}:([^;]+);`))?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  const ts = canvasTypes.match(
    new RegExp(`${constant}\\s*=\\s*'([^']+)'`),
  )?.[1];
  assert(css, `Missing CSS token --font-family-${role}`);
  assert.equal(ts, css, `${constant} must equal --font-family-${role}`);
}
console.log("Canvas type families match the CSS role tokens.");

// Canvas colours mirror the CSS colour roles; aliases resolve through var().
const canvasColors = readFileSync("packages/core/src/lib/ui/colors.ts", "utf8");
const resolveToken = (name, seen = []) => {
  assert(!seen.includes(name), `Circular colour token ${name}`);
  const value = tokens
    .match(new RegExp(`${name}:([^;]+);`))?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  assert(value, `Missing CSS token ${name}`);
  const alias = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
  return alias ? resolveToken(alias, [...seen, name]) : value;
};
const pairs = [
  ...canvasColors.matchAll(/^[ \t]+(\w+): "(--color-[a-z0-9-]+)",$/gm),
];
assert(pairs.length > 0, "colors.ts must name the token behind each colour");
for (const [, key, token] of pairs) {
  const ts = canvasColors.match(
    new RegExp(`^[ \\t]+${key}: "([^"]+)",$`, "m"),
  )?.[1];
  assert.equal(ts, resolveToken(token), `COLOR.${key} must equal ${token}`);
}
console.log(`Canvas colours match ${pairs.length} CSS colour roles.`);

// The browser chrome colour is a literal; it must stay the void page colour.
const layout = readFileSync("apps/web/src/layouts/Layout.astro", "utf8");
assert.equal(
  layout.match(/name="theme-color" content="([^"]+)"/)?.[1],
  "#050510",
  "theme-color must be #050510, the sRGB form of --color-void",
);
assert.equal(
  resolveToken("--color-void"),
  "lch(1.57% 4.76 285.25)",
  "--color-void changed: update theme-color in Layout.astro to match",
);
console.log("theme-color matches --color-void.");

// The Lab has no game modes: nothing in it imports the flight shell, the
// Hangar, the title screen or score submission.
const labFiles = execFileSync(
  "git",
  [
    "ls-files",
    "-z",
    "--",
    "apps/web/src/pages/lab",
    "apps/web/src/components/lab",
    "apps/web/src/components/studies",
  ],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file && existsSync(file));
const gameModeImport =
  /^import\b[^;]*\b(?:FlightDeck|ShipBuilder|TitleScreen|GameWrapper|submitHighScore)\b[^;]*;/m;
const labGameModes = labFiles.filter((file) =>
  gameModeImport.test(readFileSync(file, "utf8")),
);
for (const file of labGameModes)
  console.error(`FAIL: ${file} imports a game mode`);
assert.equal(labGameModes.length, 0, "Lab files must not import a game mode");
console.log(`Lab: ${labFiles.length} files; none imports a game mode.`);

// The design system has one home in the Lab. Its pages live at /lab/ds/<name>;
// each names the shared files it demonstrates and the section of its contract;
// and every shared input and stylesheet is demonstrated by one of them.
// Pages still at an earlier address are listed here. The list only shrinks:
// a page moves when it is next changed, and its line goes with it.
const earlierDesignSystemAddresses = [
  "/lab/tokens",
  "/lab/typography",
  "/lab/surfaces",
  "/lab/inputs",
  "/lab/logomark",
  "/lab/graphs",
  "/lab/instrument-parts",
];
// Shared stylesheets that are page plumbing, not parts to demonstrate.
const stylesWithoutPage = ["reset.css", "flight.css"];

const labPageList = readFileSync("apps/web/src/data/lab-pages.ts", "utf8");
const designSystemPages = [
  ...labPageList.matchAll(/\n {2}\{\n([\s\S]*?)\n {2}\},/g),
]
  .map(([, body]) => ({
    href: body.match(/href: "([^"]+)"/)?.[1],
    group: body.match(/group: "([^"]+)"/)?.[1],
    defines: [
      ...(body.match(/defines: \[([\s\S]*?)\]/)?.[1] ?? "").matchAll(
        /"([^"]+)"/g,
      ),
    ].map((match) => match[1]),
    spec: body.match(/spec: "([^"]+)"/)?.[1],
  }))
  .filter((page) => page.group === "design-system");
assert(
  designSystemPages.length > 0,
  "No design-system pages found in lab-pages.ts",
);

const headingSlug = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/ +/g, "-");
const designSystemFailures = [];
for (const page of designSystemPages) {
  const atHome = page.href === "/lab/ds" || page.href.startsWith("/lab/ds/");
  if (!atHome && !earlierDesignSystemAddresses.includes(page.href))
    designSystemFailures.push(
      `${page.href}: a design-system page lives at /lab/ds/<name>`,
    );
  if (page.href === "/lab/ds") continue;
  if (page.defines.length === 0)
    designSystemFailures.push(
      `${page.href}: name the shared files it demonstrates in "defines"`,
    );
  for (const file of page.defines)
    if (!existsSync(file))
      designSystemFailures.push(
        `${page.href}: defines ${file}, which is missing`,
      );
  const [specFile, section] = (page.spec ?? "").split("#");
  if (!specFile || !existsSync(specFile)) {
    designSystemFailures.push(`${page.href}: "spec" must name its contract`);
  } else if (
    !readFileSync(specFile, "utf8")
      .split("\n")
      .some(
        (line) =>
          /^#+ /.test(line) &&
          headingSlug(line.replace(/^#+ /, "")) === section,
      )
  ) {
    designSystemFailures.push(
      `${page.href}: ${specFile} has no section "${section}"`,
    );
  }
}
for (const href of earlierDesignSystemAddresses)
  if (!designSystemPages.some((page) => page.href === href))
    designSystemFailures.push(
      `${href} has moved: remove it from earlierDesignSystemAddresses`,
    );
const demonstrated = new Set(designSystemPages.flatMap((page) => page.defines));
const sharedParts = execFileSync(
  "git",
  [
    "ls-files",
    "-z",
    "--others",
    "--cached",
    "--exclude-standard",
    "--",
    "apps/web/src/components/inputs/*.svelte",
    "packages/core/src/lib/styles/*.css",
  ],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(
    (file) =>
      file &&
      existsSync(file) &&
      !stylesWithoutPage.some((name) => file.endsWith(`/${name}`)),
  );
for (const file of sharedParts)
  if (!demonstrated.has(file))
    designSystemFailures.push(
      `${file} is a shared part with no design-system page: add one at /lab/ds/<name> or name the file in an existing page's "defines"`,
    );
for (const failure of designSystemFailures) console.error(`FAIL: ${failure}`);
assert.equal(
  designSystemFailures.length,
  0,
  "The design system's Lab pages do not match its shared parts",
);
console.log(
  `Design system: ${designSystemPages.length} Lab pages cover ${sharedParts.length} shared parts; ${earlierDesignSystemAddresses.length} still at an earlier address.`,
);
