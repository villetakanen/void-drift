import {
  ShipProfilesSchema,
  type ShipProfile,
  type ShipProfileId,
} from "./schemas/ship-profile";

const RAW_SHIP_PROFILES = [
  {
    id: "scout",
    name: "Scout",
    thrustMultiplier: 1.15,
    turnMultiplier: 1.2,
    hullMultiplier: 0.82,
    powerDrainMultiplier: 1.08,
    zoomDefault: 1.12,
    tint: "#9AF7FF",
  },
  {
    id: "balanced",
    name: "Balanced",
    thrustMultiplier: 1.0,
    turnMultiplier: 1.0,
    hullMultiplier: 1.0,
    powerDrainMultiplier: 1.0,
    zoomDefault: 1.0,
    tint: "#D4FF00",
  },
  {
    id: "tank",
    name: "Tank",
    thrustMultiplier: 0.9,
    turnMultiplier: 0.86,
    hullMultiplier: 1.28,
    powerDrainMultiplier: 0.94,
    zoomDefault: 0.92,
    tint: "#FFC56E",
  },
] as const;

export const SHIP_PROFILES = ShipProfilesSchema.parse(RAW_SHIP_PROFILES);

export const SHIP_PROFILE_BY_ID: Record<ShipProfileId, ShipProfile> = {
  scout: SHIP_PROFILES[0],
  balanced: SHIP_PROFILES[1],
  tank: SHIP_PROFILES[2],
};

export const DEFAULT_SHIP_PROFILE_ID: ShipProfileId = "balanced";
