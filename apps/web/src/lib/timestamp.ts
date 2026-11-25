// RFC 3339 timestamps, kept as seconds and decimal digits to avoid millisecond rounding.
export function parseTimestamp(
  value: string,
): { seconds: number; fraction: string } | null {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?([Zz]|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!m) return null;
  const [, y, mo, d, h, mi, s, fraction = "", zone] = m;
  const year = Number(y),
    month = Number(mo),
    day = Number(d);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > days[month - 1] ||
    +h > 23 ||
    +mi > 59 ||
    +s > 59
  )
    return null;
  let offset = 0;
  if (zone.toUpperCase() !== "Z") {
    const oh = +zone.slice(1, 3),
      om = +zone.slice(4, 6);
    if (oh > 23 || om > 59) return null;
    offset = (oh * 60 + om) * (zone[0] === "+" ? 1 : -1);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(+h, +mi, +s, 0);
  return { seconds: date.getTime() / 1000 - offset * 60, fraction };
}

export function atOrAfter(a: string, b: string): boolean {
  const x = parseTimestamp(a),
    y = parseTimestamp(b);
  if (!x || !y) return false;
  if (x.seconds !== y.seconds) return x.seconds > y.seconds;
  const length = Math.max(x.fraction.length, y.fraction.length);
  return x.fraction.padEnd(length, "0") >= y.fraction.padEnd(length, "0");
}
