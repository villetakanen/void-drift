// Adapted from futurice/fab v0.1.0, prefabs/skills/write-spec/evals.
import fs from "node:fs";
import path from "node:path";

import { provenance } from "./provenance.mjs";

const HEADINGS = [
  "# ",
  "## Blueprint",
  "### Context",
  "### Architecture",
  "### Constraints",
  "## Contract",
  "### Definition of Done",
  "### Regression guardrails",
  "### Scenarios",
];
const BAD_START = /^(never|do not|don['’]t|no|must not|cannot|avoid)\b/i;
const HISTORY = new RegExp(
  "\\b(?:change ?log|(?:change|revision|version) history|previously|used to|no longer|todo|tbd|open questions?)\\b" +
    "|\\bas of (?:\\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)",
  "i",
);
const SKIP = new Set([".git", "node_modules", ".agents"]);

// ---------- helpers ----------
const posix = (p) => p.split(path.sep).join("/");

function listFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full, base));
    else out.push(posix(path.relative(base, full)));
  }
  return out.sort();
}

// Each line gets { n, text, fence, fm }: fence = inside or on a code fence, fm = frontmatter.
function scan(text) {
  const ls = text.replaceAll("\r\n", "\n").split("\n");
  let fence = false;
  let fmEnd = -1;
  if (ls[0] === "---") fmEnd = ls.indexOf("---", 1);
  return ls.map((t, i) => {
    const fm = i <= fmEnd;
    if (!fm && /^\s*(```|~~~)/.test(t)) {
      const was = fence;
      fence = !fence;
      return { n: i + 1, text: t, fence: true, fm, marker: true, open: !was };
    }
    return { n: i + 1, text: t, fence, fm };
  });
}

function linkTargets(ls, fromFile) {
  const out = new Set();
  for (const l of ls) {
    if (l.fence) continue;
    for (const m of l.text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const t = m[1].split("#")[0];
      if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t)) continue;
      out.add(path.resolve(path.dirname(fromFile), t));
    }
  }
  return out;
}

function checkProvenance(file, relative, spec = false) {
  try {
    provenance(fs.readFileSync(file, "utf8"), spec);
    return [];
  } catch (error) {
    return [`${relative}: provenance: ${error.message}`];
  }
}

function lintFile(file, rel) {
  const v = [];
  const bad = (rule, msg) => v.push(`${rel}: ${rule}: ${msg}`);
  const text = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  const ls = scan(text);

  v.push(...checkProvenance(file, rel, true));

  // 2 headings
  const heads = [];
  for (const l of ls) {
    if (l.fm || l.fence) continue;
    const m = l.text.match(/^(#{1,3})\s+(.*?)\s*$/);
    if (m && !/^#{4,}/.test(l.text))
      heads.push({ key: m[1] === "#" ? "# " : `${m[1]} ${m[2]}`, n: l.n });
  }
  const h1 = heads.filter((h) => h.key === "# ").length;
  if (h1 !== 1) bad("headings", `expected exactly one # title, found ${h1}`);
  const got = heads.filter((h) => h.key !== "# ");
  const want = HEADINGS.slice(1);
  const seen = new Set();
  let extras = 0;
  for (const h of got) {
    if (!want.includes(h.key) || seen.has(h.key)) {
      bad("headings", `unexpected heading "${h.key}" (line ${h.n})`);
      extras++;
    }
    seen.add(h.key);
  }
  for (const w of want)
    if (!seen.has(w)) {
      bad("headings", `missing heading "${w}"`);
      extras++;
    }
  if (!extras && got.map((h) => h.key).join("|") !== want.join("|"))
    bad("headings", "headings are out of order");

  // section helper: lines after a heading up to the next #/##/### heading
  const section = (key) => {
    const h = heads.find((x) => x.key === key);
    if (!h) return null;
    const next = heads.find((x) => x.n > h.n);
    return ls.slice(h.n, next ? next.n - 1 : ls.length);
  };

  const criteria = section("### Definition of Done") ?? [];
  for (const line of criteria) {
    if (!line.fence && /^\s*(?:[-*+]|\d+[.)])\s+\[[ xX]\]/.test(line.text)) {
      bad(
        "criteria",
        `line ${line.n} uses a task checkbox; write a plain acceptance criterion`,
      );
    }
  }

  // Scenarios
  const sc = section("### Scenarios");
  let okScenario = false;
  if (sc) {
    let cap = null;
    for (const l of sc) {
      if (l.marker && l.open && /^\s*(```|~~~)\s*gherkin\b/.test(l.text))
        cap = "";
      else if (l.marker && !l.open) {
        if (cap !== null && /Scenario:/.test(cap)) okScenario = true;
        cap = null;
      } else if (cap !== null) cap += `${l.text}\n`;
    }
  }
  if (!okScenario)
    bad(
      "scenarios",
      'Scenarios needs a ```gherkin block containing "Scenario:"',
    );

  // 5 constraints
  const co = section("### Constraints");
  if (co) {
    const bullets = co.filter((l) => !l.fence && /^\s*[-*+]\s+\S/.test(l.text));
    if (!bullets.length)
      bad("constraints", "Constraints needs at least one bullet");
    for (const b of bullets) {
      const body = b.text.replace(/^\s*[-*+]\s+/, "").replace(/^[*_`]+/, "");
      if (BAD_START.test(body))
        bad(
          "constraints",
          `line ${b.n} is phrased as a prohibition; state it as a positive fact`,
        );
    }
  }

  // 6 history wording
  for (const l of ls) {
    if (l.fm || l.fence) continue;
    const m = l.text.match(HISTORY);
    if (m) bad("living", `line ${l.n} has history wording "${m[0]}"`);
  }

  // 7 template leftovers
  ls.forEach((l) => {
    if (/<!--/.test(l.text)) bad("template", `line ${l.n} has an HTML comment`);
    if (l.text.includes("[Feature name]"))
      bad("template", `line ${l.n} has [Feature name]`);
    if (/^\s*[-*]\s+(\[ \]\s*)?(…|\.\.\.)\s*$/.test(l.text))
      bad("template", `line ${l.n} is a placeholder bullet`);
    if (/^generated:\s*YYYY-MM-DD/.test(l.text))
      bad("template", `line ${l.n} has the placeholder date`);
  });
  return v;
}

function lintTree(root) {
  const label = path.relative(process.cwd(), root) || ".";
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory())
    return [`${label}: specs: directory not found`];
  const files = listFiles(root);
  const specs = files.filter(
    (f) =>
      /(^|\/)spec\.md$/.test(f) &&
      !f.split("/").slice(0, -1).includes("attachments"),
  );
  const v = [];
  if (!specs.length) v.push(`${label}: specs: no spec.md files found`);
  const abs = (f) => path.resolve(root, f);
  const show = (f) => `${label}/${f}`;

  for (const f of specs) v.push(...lintFile(abs(f), show(f)));

  for (const f of files.filter(
    (f) =>
      f.split("/").slice(0, -1).includes("attachments") && /\.mdx?$/i.test(f),
  )) {
    v.push(...checkProvenance(abs(f), show(f)));
  }

  // 9 attachments
  const byNode = new Map();
  for (const f of files.filter((x) =>
    x.split("/").slice(0, -1).includes("attachments"),
  )) {
    const parts = f.split("/");
    const node = parts.slice(0, parts.indexOf("attachments")).join("/") || ".";
    if (!byNode.has(node)) byNode.set(node, []);
    byNode.get(node).push(f);
  }
  for (const [node, atts] of byNode) {
    const spec = path.posix.join(node, "spec.md");
    if (!specs.includes(spec)) {
      v.push(`${show(atts[0])}: attachments: no ${spec} owns this attachment`);
      continue;
    }
    const links = linkTargets(
      scan(fs.readFileSync(abs(spec), "utf8")),
      abs(spec),
    );
    for (const a of atts)
      if (!links.has(abs(a)))
        v.push(`${show(spec)}: attachments: ${a} is not linked`);
  }
  for (const f of specs) {
    for (const t of linkTargets(
      scan(fs.readFileSync(abs(f), "utf8")),
      abs(f),
    )) {
      if (
        t.includes(`${path.sep}attachments${path.sep}`) &&
        !fs.existsSync(t)
      ) {
        v.push(
          `${show(f)}: attachments: link to ${posix(path.relative(path.dirname(abs(f)), t))} does not resolve`,
        );
      }
    }
  }
  return v;
}

if (process.argv.length > 3) {
  console.error("Usage: pnpm check:specs [spec-directory]");
  process.exitCode = 2;
} else {
  const findings = lintTree(path.resolve(process.argv[2] ?? "docs/specs"));
  for (const finding of findings) console.log(finding);
  console.log(`Spec lint: ${findings.length} finding(s).`);
  process.exitCode = findings.length ? 1 : 0;
}
