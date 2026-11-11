import {
  defaultBuildStore,
  defaultLoadout,
  starterLoadout,
} from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  initializeShipSetup,
  recoverShipSetup,
  resetShipSetupForTests,
  setActiveChassis,
  setExperimentalSetting,
  shipSetup,
  shipSetupStatus,
} from "./ship-setup";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("shared ship setup persistence", () => {
  it("migrates v3 fittings, defaults the active ship, and stores Experimental separately", () => {
    resetShipSetupForTests();
    const storage = new MemoryStorage();
    const wasp = starterLoadout("wasp");
    wasp.hull[0] = "laser";
    storage.setItem(
      "void-drift-builds-v3",
      JSON.stringify({
        wasp,
        scout: defaultLoadout("scout"),
        fighter: defaultLoadout("fighter"),
        corvette: defaultLoadout("corvette"),
      }),
    );

    initializeShipSetup(storage);
    expect(shipSetup.get().builds.activeChassis).toBe("wasp");
    expect(shipSetup.get().builds.wasp).toEqual(wasp);
    expect(shipSetup.get().experimental).toBe("Off");
    expect(
      JSON.parse(storage.getItem("void-drift-builds-v3") ?? "null")
        .activeChassis,
    ).toBe("wasp");

    setActiveChassis("scout");
    setExperimentalSetting("On");
    expect(storage.getItem("void-drift:experimental")).toBe("On");
    expect(
      JSON.parse(storage.getItem("void-drift-builds-v3") ?? "null")
        .activeChassis,
    ).toBe("scout");
  });

  it("recovers each corrupt value independently and retains valid fittings", () => {
    const validFighter = defaultLoadout("fighter");
    validFighter.hull[0] = "laser";
    const recovered = recoverShipSetup({
      activeChassis: "not-a-ship",
      wasp: { broken: true },
      fighter: validFighter,
    });
    expect(recovered.recovered).toBe(true);
    expect(recovered.setup.builds.activeChassis).toBe("wasp");
    expect(recovered.setup.builds.wasp).toEqual(starterLoadout("wasp"));
    expect(recovered.setup.builds.fighter).toEqual(validFighter);
    expect(recovered.setup.builds.scout).toEqual(defaultBuildStore().scout);
  });

  it("recovers an invalid Experimental setting without losing saved builds", () => {
    resetShipSetupForTests();
    const storage = new MemoryStorage();
    const wasp = starterLoadout("wasp");
    storage.setItem(
      "void-drift-builds-v3",
      JSON.stringify({
        ...defaultBuildStore(),
        wasp,
        activeChassis: "fighter",
      }),
    );
    storage.setItem("void-drift:experimental", "broken");
    initializeShipSetup(storage);
    expect(shipSetup.get().builds.activeChassis).toBe("fighter");
    expect(shipSetup.get().builds.wasp).toEqual(wasp);
    expect(shipSetup.get().experimental).toBe("Off");
  });

  it("keeps the game usable in memory when browser storage is unavailable", () => {
    resetShipSetupForTests();
    initializeShipSetup({
      getItem() {
        throw new Error("blocked");
      },
      setItem() {},
    });
    expect(shipSetupStatus.get().persistent).toBe(false);
    setActiveChassis("scout");
    expect(shipSetup.get().builds.activeChassis).toBe("scout");
  });

  it("keeps readable fittings when only the Experimental setting cannot be read", () => {
    resetShipSetupForTests();
    const savedBuilds = {
      ...defaultBuildStore(),
      activeChassis: "fighter" as const,
    };
    const storage = {
      getItem(key: string) {
        if (key === "void-drift:experimental") throw new Error("blocked key");
        return JSON.stringify(savedBuilds);
      },
      setItem() {},
    };
    initializeShipSetup(storage);
    expect(shipSetup.get().builds.activeChassis).toBe("fighter");
    expect(shipSetup.get().experimental).toBe("Off");
    expect(shipSetupStatus.get().persistent).toBe(false);
  });
});
