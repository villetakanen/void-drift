// Selected display-colour anchors from Harre & Heller (2021), Table 5:
// https://doi.org/10.1002/asna.202113868 . Interpolation is a study approximation,
// not a spectrum, luminosity model, or atmospheric chemistry calculation.
const anchors = [
  [2300, "ff7d24"],
  [3500, "ffa251"],
  [4500, "ffb67f"],
  [5800, "ffede6"],
  [7000, "c2cbff"],
  [9000, "849fff"],
  [12000, "718fff"],
] as const;
export function starColour(kelvin: number) {
  const k = Math.max(2300, Math.min(12000, kelvin));
  let i = 0;
  while (i < anchors.length - 2 && k > anchors[i + 1][0]) i++;
  const [lo, a] = anchors[i],
    [hi, b] = anchors[i + 1];
  const t = (k - lo) / (hi - lo);
  return `#${[0, 2, 4]
    .map((at) =>
      Math.round(
        Number.parseInt(a.slice(at, at + 2), 16) * (1 - t) +
          Number.parseInt(b.slice(at, at + 2), 16) * t,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
