import { InitialsSchema } from "@void-drift/mode-a";

/* The initials of the last score this browser saved. A convenience only: the
   score store decides what may be saved, and storage that is missing, full or
   denied leaves entry and saving as they are. */
const STORAGE_KEY = "void-drift:initials";

type InitialsStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): InitialsStorage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/** The remembered initials, or an empty string when none can be read. */
export function readInitials(storage = browserStorage()): string {
  try {
    const parsed = InitialsSchema.safeParse(storage?.getItem(STORAGE_KEY));
    return parsed.success ? parsed.data : "";
  } catch {
    return "";
  }
}

/** Remembers saved initials; reports whether the browser kept them. */
export function rememberInitials(
  initials: string,
  storage = browserStorage(),
): boolean {
  const parsed = InitialsSchema.safeParse(initials);
  if (!parsed.success || !storage) return false;
  try {
    storage.setItem(STORAGE_KEY, parsed.data);
    return true;
  } catch {
    return false;
  }
}
