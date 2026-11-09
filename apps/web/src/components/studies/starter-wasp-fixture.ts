import { defaultLoadout, LoadoutSchema } from "@void-drift/mode-a";

/** Frozen starter Wasp (Gravity coil in hull[0], light ion engine, stabilizers on) that dated studies were accepted against. */
export function studyStarterWasp() {
  const build = defaultLoadout("wasp");
  build.stabilizers = true;
  build.hull[0] = "gravity-coil";
  return LoadoutSchema.parse(build);
}
