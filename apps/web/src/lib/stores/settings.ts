import {
  DEFAULT_SETTINGS,
  type Settings,
  SettingsSchema,
} from "@void-drift/mode-a";
import { atom, onMount } from "nanostores";

const STORAGE_KEY = "void-drift:settings";

export function decodeSettings(value: string | null): Settings {
  try {
    return SettingsSchema.parse({
      ...DEFAULT_SETTINGS,
      ...JSON.parse(value ?? "{}"),
    });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const settings = atom<Settings>({ ...DEFAULT_SETTINGS });
const set = settings.set;
settings.set = (value) => {
  const parsed = SettingsSchema.parse(value);
  // Memory remains usable when privacy settings or a full device deny storage.
  set(parsed);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Persistence is optional; flight is not.
  }
};

onMount(settings, () => {
  if (typeof window === "undefined") return;
  const restore = () => {
    try {
      set(decodeSettings(localStorage.getItem(STORAGE_KEY)));
    } catch {
      set({ ...DEFAULT_SETTINGS });
    }
  };
  const changed = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) restore();
  };
  restore();
  window.addEventListener("storage", changed);
  window.addEventListener("pageshow", restore);
  return () => {
    window.removeEventListener("storage", changed);
    window.removeEventListener("pageshow", restore);
  };
});
