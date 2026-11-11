import {
  defaultBuildStore,
  defaultLoadout,
  type ExperimentalSetting,
  ExperimentalSettingSchema,
  type Loadout,
  LoadoutSchema,
  type ShipProfileId,
  ShipProfileIdSchema,
} from "@void-drift/mode-a";
import { atom } from "nanostores";

const STORAGE_KEY = "void-drift-builds-v3";
const EXPERIMENTAL_STORAGE_KEY = "void-drift:experimental";
const CHASSIS_IDS = [
  "wasp",
  "scout",
  "fighter",
  "corvette",
  "fiddler",
] as const;
type BuildStore = ReturnType<typeof defaultBuildStore>;

export type ShipSetup = {
  builds: BuildStore;
  experimental: ExperimentalSetting;
};
export type ShipSetupStatus = {
  ready: boolean;
  persistent: boolean;
  message: string;
};

function defaultSetup(): ShipSetup {
  return { builds: defaultBuildStore(), experimental: "Off" };
}

/** Shared web owner for ship fittings, the active chassis, and the player setting. */
export const shipSetup = atom<ShipSetup>(defaultSetup());
export const shipSetupStatus = atom<ShipSetupStatus>({
  ready: false,
  persistent: true,
  message: "Loading saved ships",
});

type StorageLike = Pick<Storage, "getItem" | "setItem">;
let activeStorage: StorageLike | undefined;
let initialized = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse each saved value independently so one damaged fitting cannot erase another. */
export function recoverShipSetup(value: unknown): {
  setup: ShipSetup;
  recovered: boolean;
} {
  const defaults = defaultBuildStore();
  const source = isRecord(value) ? value : {};
  let recovered = !isRecord(value);
  const fittings = { ...defaults };
  let validFittings = 0;

  for (const id of CHASSIS_IDS) {
    const candidate = source[id];
    const parsed = LoadoutSchema.safeParse(candidate);
    if (parsed.success && parsed.data.chassis === id) {
      fittings[id] = parsed.data;
      validFittings++;
    } else {
      fittings[id] = defaults[id] ?? defaultLoadout(id);
      if (candidate !== undefined) recovered = true;
    }
  }

  const active = ShipProfileIdSchema.safeParse(source.activeChassis);
  if (active.success) fittings.activeChassis = active.data;
  else {
    fittings.activeChassis = "wasp";
    if (source.activeChassis !== undefined) recovered = true;
  }

  if (Object.keys(source).length > 0 && validFittings === 0) recovered = true;

  return {
    setup: {
      builds: fittings,
      experimental: "Off",
    },
    recovered,
  };
}

function persist(setup = shipSetup.get()) {
  if (!initialized || !activeStorage) return;
  try {
    activeStorage.setItem(STORAGE_KEY, JSON.stringify(setup.builds));
    activeStorage.setItem(EXPERIMENTAL_STORAGE_KEY, setup.experimental);
  } catch {
    activeStorage = undefined;
    shipSetupStatus.set({
      ready: true,
      persistent: false,
      message:
        "Storage is unavailable. Choices are kept until this page closes.",
    });
  }
}

/** Load once from browser storage; pass storage explicitly in focused tests. */
export function initializeShipSetup(storage?: StorageLike) {
  if (initialized) return;
  initialized = true;
  let target = storage;
  if (!target && typeof window !== "undefined") {
    try {
      target = window.localStorage;
    } catch {
      target = undefined;
    }
  }
  activeStorage = target;
  if (!target) {
    shipSetup.set(defaultSetup());
    shipSetupStatus.set({
      ready: true,
      persistent: false,
      message:
        "Storage is unavailable. Choices are kept until this page closes.",
    });
    return;
  }

  try {
    let raw: string | null = null;
    let storedExperimental: string | null = null;
    let storageReadFailed = false;
    try {
      raw = target.getItem(STORAGE_KEY);
    } catch {
      storageReadFailed = true;
    }
    try {
      storedExperimental = target.getItem(EXPERIMENTAL_STORAGE_KEY);
    } catch {
      storageReadFailed = true;
    }
    let buildsValue: unknown;
    let buildJsonCorrupt = false;
    if (raw) {
      try {
        buildsValue = JSON.parse(raw);
      } catch {
        buildJsonCorrupt = true;
      }
    }
    const recovered = raw
      ? recoverShipSetup(buildJsonCorrupt ? undefined : buildsValue)
      : {
          setup: defaultSetup(),
          recovered: false,
        };
    const experimental =
      ExperimentalSettingSchema.safeParse(storedExperimental);
    const finalSetup = {
      ...recovered.setup,
      experimental: experimental.success ? experimental.data : ("Off" as const),
    };
    const hadBadExperimental =
      storedExperimental !== null && !experimental.success;
    shipSetup.set(finalSetup);
    if (storageReadFailed) {
      activeStorage = undefined;
      shipSetupStatus.set({
        ready: true,
        persistent: false,
        message:
          "Some saved choices could not be read. Available choices are kept in memory until this page closes.",
      });
    } else if (recovered.recovered || buildJsonCorrupt || hadBadExperimental) {
      shipSetupStatus.set({
        ready: true,
        persistent: true,
        message: "Some saved choices could not be read and were restored.",
      });
    } else {
      shipSetupStatus.set({ ready: true, persistent: true, message: "" });
    }
    // Write the active-chassis field and normalized setting as the v3 migration.
    if (!storageReadFailed) persist(finalSetup);
  } catch {
    activeStorage = undefined;
    shipSetup.set(defaultSetup());
    shipSetupStatus.set({
      ready: true,
      persistent: false,
      message:
        "Saved choices could not be read. Using starting ships in memory until this page closes.",
    });
  }
}

export function setActiveChassis(chassis: ShipProfileId) {
  shipSetup.set({
    ...shipSetup.get(),
    builds: { ...shipSetup.get().builds, activeChassis: chassis },
  });
  persist();
}

export function saveFitting(fitting: Loadout) {
  const current = shipSetup.get();
  shipSetup.set({
    ...current,
    builds: { ...current.builds, [fitting.chassis]: fitting },
  });
  persist();
}

export function setExperimentalSetting(setting: ExperimentalSetting) {
  const parsed = ExperimentalSettingSchema.parse(setting);
  shipSetup.set({ ...shipSetup.get(), experimental: parsed });
  persist();
}

export function resetShipSetupForTests() {
  initialized = false;
  activeStorage = undefined;
  shipSetup.set(defaultSetup());
  shipSetupStatus.set({
    ready: false,
    persistent: true,
    message: "Loading saved ships",
  });
}
