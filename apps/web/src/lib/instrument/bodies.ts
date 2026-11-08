// A body the path pane draws under the paths: a well's centre and reach ring,
// and its surface when it has one. Used by the Gravity tuning bench
// (docs/specs/gravity-tuning.md).
export type FieldBody = {
  kind: "sun" | "planet" | "well" | "energy";
  label: string;
  color: string;
  radius: number;
  reach: number;
  /** Centre at every sample index; one entry when the body never moves. */
  path: { x: number; y: number }[];
};

/** A body's centre at a sample index; the last known one past its path. */
export function bodyAt(body: FieldBody, index: number) {
  return body.path[Math.min(index, body.path.length - 1)];
}
