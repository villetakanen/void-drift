import { describe, expect, it } from "vitest";
import { readInitials, rememberInitials } from "./initials";

function memory() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}
const denied = {
  getItem(): string | null {
    throw new DOMException("Denied", "SecurityError");
  },
  setItem() {
    throw new DOMException("Full", "QuotaExceededError");
  },
};

describe("remembered initials", () => {
  it("reads back initials remembered on this browser", () => {
    const storage = memory();
    expect(readInitials(storage)).toBe("");
    expect(rememberInitials("ACE", storage)).toBe(true);
    expect(readInitials(storage)).toBe("ACE");
  });
  it("never remembers or prefills anything but three letters A–Z", () => {
    const storage = memory();
    expect(rememberInitials("ac", storage)).toBe(false);
    expect(readInitials(storage)).toBe("");
    storage.setItem("void-drift:initials", "a1b");
    expect(readInitials(storage)).toBe("");
  });
  it("treats missing or failing storage as nothing remembered", () => {
    expect(readInitials(undefined)).toBe("");
    expect(readInitials(denied)).toBe("");
    expect(rememberInitials("ACE", undefined)).toBe(false);
    expect(rememberInitials("ACE", denied)).toBe(false);
  });
});
