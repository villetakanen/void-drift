interface ImportMetaEnv {
	readonly PUBLIC_FIREBASE_API_KEY?: string;
	readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
	readonly PUBLIC_FIREBASE_APP_ID?: string;
	readonly PUBLIC_FIREBASE_EMULATORS?: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
