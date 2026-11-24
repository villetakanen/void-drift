import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
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
  type PersonalBestLookup,
  parseHighScores,
  readPersonalBest,
  type SaveOutcome,
  settleScore,
} from "../schemas/highscore";
import type { ShipProfileId } from "./schemas/ship-profile";

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
          orderBy("score", "desc"),
          limit(30),
        ),
      );
      return parseHighScores(rows.docs.map((row) => row.data()));
    })(),
  );
}
/** The one row a player keeps for a ship on the client's board. */
function scoreReference(userId: string, shipId: string) {
  const { db } = getServices();
  return doc(
    db,
    "artifacts",
    "void-drift",
    "scores",
    `${CHALLENGE}_${userId}_${shipId}`,
  );
}
const message = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;
/**
 * Reads the player's own stored best for a ship on the client's board, from
 * the server, wherever it ranks. A failed, timed-out or unreadable read is
 * unavailable, never absent.
 */
export async function loadPersonalBest(
  shipId: ShipProfileId,
): Promise<PersonalBestLookup> {
  try {
    const best = await withTimeout(
      (async () => {
        const user = await ensureAnonymousSession();
        const row = await getDocFromServer(scoreReference(user.uid, shipId));
        return readPersonalBest(row.exists() ? row.data() : undefined);
      })(),
    );
    return (
      best ?? { status: "unavailable", error: "Your saved best is unreadable." }
    );
  } catch (error) {
    return {
      status: "unavailable",
      error: message(error, "Unable to check your best."),
    };
  }
}
/**
 * Saves a run as the player's best for its ship. The transaction rechecks
 * the stored row, so an equal or higher best stays and is reported as kept.
 * A matching best stays too, without assuming which attempt wrote it.
 */
export async function submitHighScore(
  submission: HighScoreSubmission,
): Promise<SaveOutcome> {
  try {
    const valid = HighScoreSubmissionSchema.parse(submission);
    return await withTimeout(
      (async (): Promise<SaveOutcome> => {
        const user = await ensureAnonymousSession();
        const { db } = getServices();
        const score = HighScoreSchema.parse({ ...valid, userId: user.uid });
        const reference = scoreReference(user.uid, score.shipId);
        const settled = await runTransaction(db, async (transaction) => {
          const previous = await transaction.get(reference);
          const decision = settleScore(
            previous.exists() ? previous.data() : undefined,
            score,
          );
          if (decision.write) transaction.set(reference, score);
          return decision;
        });
        if (settled.write) return { outcome: "saved", scoreId: reference.id };
        if (settled.outcome === "matching") return { outcome: "matching" };
        return { outcome: "kept", best: settled.best };
      })(),
    );
  } catch (error) {
    return {
      outcome: "failed",
      error: message(error, "Unable to submit score."),
    };
  }
}
