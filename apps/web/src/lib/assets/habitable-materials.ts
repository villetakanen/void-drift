import {
  createCloudedWorld,
  HabitableAppearanceSchema,
  PLANET_MAPS,
  type Planet,
} from "@void-drift/core";
import {
  type CloudedMaterial,
  habitableMaterialKey,
} from "./planet-appearances";

/** Per-consumer lazy cache; decoded atlases are shared by the core map loader. */
export class HabitableMaterials {
  readonly materials = new Map<string, CloudedMaterial>();
  private pending = new Map<string, Promise<void>>();
  private disposed = false;

  async prepare(planets: readonly Planet[]) {
    const planet = planets.find((p) => p.id === "habitable");
    if (!planet || this.disposed) return;
    const appearance = HabitableAppearanceSchema.parse(planet.habitable);
    const key = habitableMaterialKey(appearance);
    if (this.materials.has(key)) return;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const task = (async () => {
      const ground =
        appearance.ground === "violet"
          ? PLANET_MAPS.habitableViolet
          : PLANET_MAPS.habitableArchipelago;
      const clouds = {
        fronts: PLANET_MAPS.habitableFronts,
        "cover-20": PLANET_MAPS.habitableCover20,
        "cover-40": PLANET_MAPS.habitableCover40,
      }[appearance.clouds];
      const material = await createCloudedWorld(ground, clouds);
      if (this.disposed) material.painter.dispose();
      else this.materials.set(key, material);
    })();
    this.pending.set(key, task);
    try {
      await task;
    } finally {
      this.pending.delete(key);
    }
  }
  dispose() {
    this.disposed = true;
    for (const material of this.materials.values()) material.painter.dispose();
    this.materials.clear();
  }
}
