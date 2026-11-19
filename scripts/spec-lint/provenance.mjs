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

// Date.parse retains milliseconds. Compare any remaining fractional digits
// when two RFC 3339 instants fall within the same millisecond.
function atOrAfter(observed, generated) {
  const delta = Date.parse(observed) - Date.parse(generated);
  if (delta !== 0) return delta > 0;
  const fraction = (value) => /\.(\d+)/.exec(value)?.[1] || "";
  const left = fraction(observed);
  const right = fraction(generated);
  const width = Math.max(left.length, right.length);
  return left.padEnd(width, "0") >= right.padEnd(width, "0");
}

export function provenance(text, spec = false) {
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
  const status = scalar(fm.get("status") || "");
  if (spec) {
    if (!fm.get("title")?.trim()) throw Error("expected title");
    if (!["draft", "approved"].includes(status))
      throw Error("expected draft or approved status");
    if (
      status === "approved" &&
      !verified.some(
        (v) => v.by.startsWith("human:") && atOrAfter(v.at, generated.at),
      )
    ) {
      throw Error("approved spec requires a current human verification");
    }
  }
  return { generated, verified, status };
}
