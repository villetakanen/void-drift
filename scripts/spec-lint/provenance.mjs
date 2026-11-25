// Adapted from futurice/fab v0.1.0, prefabs/skills/write-spec/evals.
// Reads the two OKF provenance fields in fab's block and compact YAML forms.
// Other frontmatter belongs to the host (for example skill discovery keys).
function scalar(s) {
  const value = s.trim();
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'"))
    return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

// Ignore YAML comments while retaining a hash inside a quoted actor name.
function withoutComment(line) {
  return line
    .replace(
      /("(?:\\.|[^"\\])*"|'(?:''|[^'])*')|(?:^|\s)#.*$/g,
      (_match, quoted) => quoted ?? "",
    )
    .trimEnd();
}

function fields(text) {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end < 1) throw Error("missing YAML frontmatter");
  const values = new Map();
  let key;
  for (const input of lines.slice(1, end)) {
    const line = withoutComment(input);
    if (!line.trim()) continue;
    const match = /^([\w-]+):(?:\s+(.*))?$/.exec(line);
    if (match) {
      key = match[1];
      if (values.has(key)) throw Error(`duplicate field ${key}`);
      values.set(key, match[2] || "");
    } else if (key && /^(\s|-\s)/.test(line)) {
      values.set(key, `${values.get(key)}\n${line}`);
    } else throw Error(`invalid frontmatter line ${line}`);
  }
  return values;
}

function event(raw) {
  let entries = raw.trim().split(/\n/);
  if (raw.trim().startsWith("{") && raw.trim().endsWith("}")) {
    entries = raw
      .trim()
      .slice(1, -1)
      .split(/,\s*(?=(?:by|at):)/);
  }
  const data = {};
  for (const entry of entries) {
    const match = /^(by|at):\s+(.+)$/.exec(entry.trim());
    if (!match || Object.hasOwn(data, match[1]))
      throw Error("expected actor and timestamp in { by, at }");
    data[match[1]] = scalar(match[2]);
  }
  if (!/^(?:[\w.-]+\/[\w.+:-]+|[\w.-]+:[^{}[\]"'\n]+)$/.test(data.by ?? ""))
    throw Error("missing or invalid actor");
  const at = data.at || "";
  if (
    !/^\d{4}-\d\d-\d\d(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(
      at,
    ) ||
    !Number.isFinite(Date.parse(at)) ||
    new Date(at.slice(0, 10)).toISOString().slice(0, 10) !== at.slice(0, 10)
  ) {
    throw Error(`missing or invalid timestamp ${at}`);
  }
  return data;
}

export function provenance(text, spec = false, lean = false) {
  const fm = fields(text);
  const generated = event(fm.get("generated") ?? "");
  const value = fm.get("verified")?.trim();
  if (!value) throw Error("expected verified events or []");
  let verified = [];
  if (value !== "[]") {
    let entries;
    if (value.startsWith("[") && value.endsWith("]"))
      entries = value.slice(1, -1).split(/(?<=})\s*,\s*(?={)/);
    else if (/^-\s/.test(value))
      entries = value.replace(/^-\s+/, "").split(/\n\s*-\s+/);
    else entries = [value];
    verified = entries.map(event);
  }
  if (lean && verified.length > 1)
    throw Error("verified must contain at most one human source check");
  for (const verification of verified) {
    if (!/^human:\S(?:[^\r\n]*\S)?$/.test(verification.by))
      throw Error(
        "verified events require a human:<id> actor with a nonempty identifier",
      );
  }
  if (spec) {
    if (fm.has("status")) throw Error("spec status metadata is forbidden");
    if (fm.has("title"))
      throw Error("spec title metadata is forbidden; use the H1 feature name");
    if (lean) {
      for (const key of fm.keys()) {
        if (key !== "generated" && key !== "verified")
          throw Error(`spec frontmatter must omit ${key}`);
      }
    }
  }
  return { generated, verified };
}
