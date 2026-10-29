import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
	collection,
	connectFirestoreEmulator,
	doc,
	getDocs,
	getFirestore,
	limit,
	orderBy,
	query,
	runTransaction,
	where,
} from "firebase/firestore";
import { z } from "zod";
import {
	CHALLENGE,
	type HighScore,
	HighScoreSchema,
	type HighScoreSubmission,
	HighScoreSubmissionSchema,
} from "../schemas/highscore";

export const LEADERBOARD_UNAVAILABLE =
	"Shared scores are unavailable in this local session.";
const env = import.meta.env;
const ConfigSchema = z.object({
	apiKey: z.string().min(1),
	projectId: z.string().min(1),
	appId: z.string().min(1),
});
const config = ConfigSchema.safeParse({
	apiKey: env?.PUBLIC_FIREBASE_API_KEY,
	projectId: env?.PUBLIC_FIREBASE_PROJECT_ID,
	appId: env?.PUBLIC_FIREBASE_APP_ID,
});
let services: ReturnType<typeof createServices> | undefined;
function createServices() {
	if (!config.success) throw new Error(LEADERBOARD_UNAVAILABLE);
	const app = initializeApp(config.data);
	const auth = getAuth(app);
	const db = getFirestore(app);
	if (env.PUBLIC_FIREBASE_EMULATORS === "true") {
		connectAuthEmulator(auth, "http://127.0.0.1:9099", {
			disableWarnings: true,
		});
		connectFirestoreEmulator(db, "127.0.0.1", 8080);
	}
	return { auth, db };
}
function getServices() {
	services ??= createServices();
	return services;
}
export function scoresAvailable() {
	return config.success;
}
export async function ensureAnonymousSession() {
	const { auth } = getServices();
	await auth.authStateReady();
	return auth.currentUser ?? (await signInAnonymously(auth)).user;
}
function withTimeout<T>(promise: Promise<T>): Promise<T> {
	let timer: ReturnType<typeof setTimeout>;
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => {
			timer = setTimeout(
				() => reject(new Error("Shared scores timed out. Please retry.")),
				10000,
			);
		}),
	]).finally(() => clearTimeout(timer));
}
export async function loadHighScores(): Promise<HighScore[]> {
	return withTimeout(
		(async () => {
			await ensureAnonymousSession();
			const { db } = getServices();
			const rows = await getDocs(
				query(
					collection(db, "artifacts", "void-drift", "scores"),
					where("challenge", "==", CHALLENGE),
					orderBy("seconds", "desc"),
					limit(20),
				),
			);
			return rows.docs.map((row) => HighScoreSchema.parse(row.data()));
		})(),
	);
}
export async function submitHighScore(
	submission: HighScoreSubmission,
): Promise<
	{ success: true; scoreId: string } | { success: false; error: string }
> {
	try {
		const valid = HighScoreSubmissionSchema.parse(submission);
		const scoreId = await withTimeout(
			(async () => {
				const user = await ensureAnonymousSession();
				const { db } = getServices();
				const score = HighScoreSchema.parse({ ...valid, userId: user.uid });
				const reference = doc(
					db,
					"artifacts",
					"void-drift",
					"scores",
					`${score.challenge}_${user.uid}_${score.shipId}`,
				);
				await runTransaction(db, async (transaction) => {
					const previous = await transaction.get(reference);
					if (
						previous.exists() &&
						HighScoreSchema.parse(previous.data()).seconds >= score.seconds
					)
						return;
					transaction.set(reference, score);
				});
				return reference.id;
			})(),
		);
		return { success: true, scoreId };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to submit score.",
		};
	}
}
