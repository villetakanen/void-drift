// Copyright © 2026 Futurice Oy / Ville Takanen
// Lean document format from FAB’s write-spec prefab.
function gherkinBlocks(lines) {
  const blocks = [];
  let block;
  for (const line of lines) {
    if (line.open && line.language === "gherkin")
      block = { start: line.n, lines: [] };
    else if (block && line.close) {
      blocks.push(block);
      block = undefined;
    } else if (block) block.lines.push(line.text);
  }
  return blocks;
}

function scenarioBodies(lines) {
  return lines
    .join("\n")
    .split(/^\s*Scenario(?: Outline)?:[ \t]*/m)
    .slice(1);
}

export function lintLeanSpec(ls, bad) {
  const prose = ls.filter((l) => !l.fm && !l.fence);
  const heads = prose.filter((l) => /^ {0,3}#{1,2}\s/.test(l.text));
  const title = heads[0]?.text.trim();
  const h1 = heads.filter((l) => /^#\s/.test(l.text.trim())).length;
  if (h1 !== 1) bad("headings", `expected exactly one # title, found ${h1}`);
  if (
    !/^# \S/.test(title || "") ||
    title !== prose.find((l) => l.text.trim())?.text.trim()
  ) {
    bad("headings", "start with the feature name as the H1");
  }
  if (/^# Spec:/i.test(title))
    bad("headings", "title must omit the Spec: prefix");
  const sectionNames = heads.slice(1).map((l) => l.text.trim());
  const want = ["## Architecture", "## Constraints"]
    .filter((key) => sectionNames.includes(key))
    .concat("## Scenarios");
  if (sectionNames.join("\n") !== want.join("\n")) {
    bad(
      "headings",
      "use optional Architecture and Constraints, then Scenarios",
    );
  }
  const section = (heading) => {
    const i = heads.findIndex((l) => l.text.trim() === heading);
    return i < 0
      ? []
      : ls.slice(heads[i].n, heads[i + 1] ? heads[i + 1].n - 1 : ls.length);
  };
  if (!section(title).some((l) => !l.fence && /\S/.test(l.text)))
    bad("purpose", "open with a sentence explaining the feature");
  for (const line of prose) {
    if (
      /^\s*(?:#{1,6}\s+|\*\*|__)?(?:acceptance criteria|acceptance criterion|definition of done|regression guardrails|required behavio[u]?r)(?:\s*[:#*_]|\s*$)/i.test(
        line.text,
      )
    ) {
      bad("checklist", `line ${line.n} introduces completion criteria`);
    }
  }
  for (const line of ls.filter((l) => !l.fm)) {
    if (
      /^\s*(?:>\s*)*(?:(?:[-*+]|\d+[.)])\s+)?\[[ xX]\](?:\s|$)/.test(
        line.text,
      ) ||
      /<input\b[^>]*\btype\s*=\s*["']?checkbox\b/i.test(line.text)
    ) {
      bad("checklist", `line ${line.n} contains a checkbox`);
    }
  }
  const blocks = gherkinBlocks(ls);
  const sc = section("## Scenarios");
  const openings = ls.filter((l) => l.open && l.language === "gherkin");
  if (
    openings.length !== 1 ||
    blocks.length !== 1 ||
    !sc.some((l) => l.n === blocks[0]?.start) ||
    sc.some(
      (l) =>
        (l.open && l.language !== "gherkin") || (!l.fence && l.text.trim()),
    )
  ) {
    bad(
      "scenarios",
      "put all scenarios in one closed gherkin block under Scenarios",
    );
  }
  for (const { lines } of blocks) {
    const content = lines.map((l) => l.trim());
    if (
      content.find(Boolean) !== `Feature: ${title?.slice(2)}` ||
      content.filter((l) => /^Feature:/.test(l)).length !== 1
    ) {
      bad("scenarios", "Feature: must repeat the spec title exactly once");
    }
    const scenes = scenarioBodies(lines);
    if (!scenes.length) bad("scenarios", "include a named Scenario");
    for (const scene of scenes) {
      const [name, ...steps] = scene.split("\n");
      const keywords = steps.map(
        (step) => step.trim().match(/^(Given|When|Then)\s+\S/)?.[1],
      );
      const given = keywords.indexOf("Given");
      const when = keywords.indexOf("When", given + 1);
      const then = keywords.indexOf("Then", when + 1);
      if (!name.trim() || given < 0 || when < 0 || then < 0) {
        bad("scenarios", "each scenario needs a name, Given, When and Then");
      }
    }
  }

  for (const key of ["## Architecture", "## Constraints"]) {
    if (
      sectionNames.includes(key) &&
      !section(key).some((l) => /\S/.test(l.text) && !l.text.startsWith("#"))
    ) {
      bad("headings", `omit empty section ${key}`);
    }
  }
}
