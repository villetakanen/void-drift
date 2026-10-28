import { expect, it } from "vitest";
import { stockSettings } from "../simulation";
import { FlightSettingsSchema } from "./flight";

it("defaults legacy trials to five levels and validates the 4–11 integer range", () => {
	const settings = stockSettings();
	const legacy = { ...settings, camera: { padding: 160, smoothing: 4 } };
	expect(FlightSettingsSchema.parse(legacy).camera.zoomSteps).toBe(5);
	for (const zoomSteps of [4, 11])
		expect(
			FlightSettingsSchema.safeParse({
				...settings,
				camera: { ...settings.camera, zoomSteps },
			}).success,
		).toBe(true);
	for (const zoomSteps of [3, 12, 5.5, null])
		expect(
			FlightSettingsSchema.safeParse({
				...settings,
				camera: { ...settings.camera, zoomSteps },
			}).success,
		).toBe(false);
});
