import { persistentAtom } from '@nanostores/persistent';
import { type Settings, SettingsSchema, DEFAULT_SETTINGS } from '@void-drift/mode-a';

export const settings = persistentAtom<Settings>(
    'void-drift:settings',
    DEFAULT_SETTINGS,
    {
        encode: JSON.stringify,
        decode: (str) => {
            try {
                const parsed = JSON.parse(str);
                return SettingsSchema.parse(parsed);
            } catch {
                return DEFAULT_SETTINGS;
            }
        },
    }
);
