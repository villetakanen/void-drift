import { persistentAtom } from '@nanostores/persistent';
import { SettingsSchema, DEFAULT_SETTINGS, type Settings } from '@void-drift/engine';

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
