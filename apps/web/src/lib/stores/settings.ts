import { persistentAtom } from "@nanostores/persistent";
import {
	DEFAULT_SETTINGS,
	type Settings,
	SettingsSchema,
} from "@void-drift/mode-a";

export const settings = persistentAtom<Settings>(
	"void-drift:settings",
	DEFAULT_SETTINGS,
	{
		encode: JSON.stringify,
		decode: (str) => {
			try {
				const parsed = JSON.parse(str);
				return SettingsSchema.parse({
					...DEFAULT_SETTINGS,
					...parsed,
				});
			} catch {
				return DEFAULT_SETTINGS;
			}
		},
	},
);
