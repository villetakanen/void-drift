import { z } from "zod";
import { DEFAULT_SHIP_PROFILE_ID } from "../config";
import { ShipProfileIdSchema } from "./ship-profile";

export const SettingsSchema = z.object({
	invertControls: z.boolean(),
	selectedShipId: ShipProfileIdSchema,
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
	invertControls: false,
	selectedShipId: DEFAULT_SHIP_PROFILE_ID,
};
