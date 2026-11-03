import {
	ShipIdentitiesSchema,
	type ShipIdentity,
	type ShipProfile,
	type ShipProfileId,
	ShipProfilesSchema,
} from "./schemas/ship-profile";

// Owner-approved names (D4, 2026-11-02). Every UI surface reads names and traits from here.
export const SHIP_IDENTITY: Record<ShipProfileId, ShipIdentity> =
	ShipIdentitiesSchema.parse({
		wasp: {
			shortName: "Wasp",
			longName: "LHI Wasp",
			trait:
				"One rear Light ion + 4 turning stabilizers. Standard energy capacity.",
		},
		scout: {
			shortName: "Scout",
			longName: "Daehan Scout No.7",
			trait: "Three Light ions. Standard energy capacity.",
		},
		fighter: {
			shortName: "Fighter",
			longName: "Aegis XF-1 Interceptor",
			trait: "Four Light ions. One extra energy pack.",
		},
		corvette: {
			shortName: "Corvette",
			longName: "Mark II Escort Frigate",
			trait: "Five Light ions. Two extra energy packs.",
		},
		fiddler: {
			shortName: "Fiddler",
			longName: "LHI Fiddler Heavy Assault Corvette",
			trait:
				"Four Light ions + 4 turning stabilizers. Two extra energy packs and one gravity collector. Flight trial.",
		},
	});

const RAW_SHIP_PROFILES = [
	{
		id: "wasp",
		thrustMultiplier: 1.0,
		turnMultiplier: 1.15,
		hullMultiplier: 0.78,
		powerDrainMultiplier: 0.9,
		zoomDefault: 1.15,
		tint: "#83C7D0",
	},
	{
		id: "scout",
		thrustMultiplier: 1.15,
		turnMultiplier: 1.2,
		hullMultiplier: 0.82,
		powerDrainMultiplier: 1.08,
		zoomDefault: 1.12,
		tint: "#9AF7FF",
	},
	{
		id: "fighter",
		thrustMultiplier: 1.0,
		turnMultiplier: 1.0,
		hullMultiplier: 1.0,
		powerDrainMultiplier: 1.0,
		zoomDefault: 1.0,
		tint: "#D4FF00",
	},
	{
		id: "corvette",
		thrustMultiplier: 0.9,
		turnMultiplier: 0.86,
		hullMultiplier: 1.28,
		powerDrainMultiplier: 0.94,
		zoomDefault: 0.92,
		tint: "#FFC56E",
	},
	{
		id: "fiddler",
		thrustMultiplier: 1,
		turnMultiplier: 1,
		hullMultiplier: 1.4,
		powerDrainMultiplier: 1,
		zoomDefault: 0.92,
		tint: "#83C7D0",
	},
] as const;

export const SHIP_PROFILES = ShipProfilesSchema.parse(RAW_SHIP_PROFILES);

export const SHIP_PROFILE_BY_ID: Record<ShipProfileId, ShipProfile> = {
	wasp: SHIP_PROFILES[0],
	scout: SHIP_PROFILES[1],
	fighter: SHIP_PROFILES[2],
	corvette: SHIP_PROFILES[3],
	fiddler: SHIP_PROFILES[4],
};

export const DEFAULT_SHIP_PROFILE_ID: ShipProfileId = "fighter";
