export {
	FIDDLER_DRAFT_FACES as CONNECTED_FACES,
	FIDDLER_DRAFT_PIXELS_PER_UNIT as DRAFT_PIXELS_PER_UNIT,
	fiddlerDraftPoint as draftPoint,
} from "@void-drift/mode-a";
export const CAPACITY_VIEW = { width: 340, height: 500, zoom: 3.25 } as const;

export const TRIAL_ITEMS = [
	{ at: [80, 176], part: "gravity-coil", area: "blade" },
	{ at: [76, 292], part: "battery", area: "blade" },
	{ at: [310, 176], part: "gravity-coil", area: "blade" },
	{ at: [314, 292], part: "battery", area: "blade" },
	{ at: [116, 414], part: "gravity-coil", area: "shoulder" },
	{ at: [274, 414], part: "gravity-coil", area: "shoulder" },
	{ at: [195, 552], part: "battery", area: "rear" },
	{ at: [195, 672], part: "gravity-coil", area: "rear" },
	{ at: [142, 600], part: "heavy-ion", area: "engine" },
	{ at: [248, 600], part: "heavy-ion", area: "engine" },
] as const;
