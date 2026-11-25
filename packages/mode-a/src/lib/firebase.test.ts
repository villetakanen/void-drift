import { FirebaseError } from "firebase/app";
import { getDocFromServer, getDocs, runTransaction } from "firebase/firestore";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CHALLENGE, type HighScoreSubmission } from "../schemas/highscore";

vi.mock("firebase/app", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/app")>()),
  initializeApp: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: () => ({
    authStateReady: async () => {},
    currentUser: { uid: "pilot" },
  }),
  signInAnonymously: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  where: vi.fn(),
}));

const submission: HighScoreSubmission = {
  initials: "ONE",
  seconds: 42.5,
  score: 57,
  deathCause: "STAR",
  shipId: "corvette",
  fitting: ["ion", "ion", "battery"],
  stabilizers: true,
  linkedEngines: false,
  challenge: CHALLENGE,
};

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("PUBLIC_FIREBASE_API_KEY", "test-api-key");
  vi.stubEnv("PUBLIC_FIREBASE_PROJECT_ID", "test-project");
  vi.stubEnv("PUBLIC_FIREBASE_APP_ID", "test-app-id");
  vi.stubEnv("PUBLIC_FIREBASE_EMULATORS", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("reports unexpected score failures without allowing the reporter to change outcomes", async () => {
  const scores = await import("./firebase");
  const reporter = vi.fn(() => {
    throw new Error("reporting failed");
  });
  scores.installScoreFailureReporter(reporter);
  const denied = new FirebaseError("permission-denied", "Rejected by rules");
  const internal = new FirebaseError("internal", "Commit state unknown");
  vi.mocked(getDocs).mockRejectedValue(denied);
  vi.mocked(getDocFromServer).mockRejectedValue(denied);
  vi.mocked(runTransaction)
    .mockRejectedValueOnce(denied)
    .mockRejectedValueOnce(internal);

  await expect(scores.loadHighScores()).rejects.toBe(denied);
  await expect(scores.loadPersonalBest(submission.shipId)).resolves.toEqual({
    status: "unavailable",
  });
  await expect(scores.submitHighScore(submission)).resolves.toEqual({
    outcome: "failed",
  });
  await expect(scores.submitHighScore(submission)).resolves.toEqual({
    outcome: "unconfirmed",
  });
  expect(reporter.mock.calls).toEqual([
    ["load-high-scores", denied],
    ["load-personal-best", denied],
    ["submit-high-score", denied],
    ["submit-high-score", internal],
  ]);
});

it("keeps ordinary connectivity failures and local timeouts out of reporting", async () => {
  vi.useFakeTimers();
  const scores = await import("./firebase");
  const reporter = vi.fn();
  scores.installScoreFailureReporter(reporter);
  const unavailable = new FirebaseError("unavailable", "Offline service");
  vi.mocked(getDocFromServer).mockRejectedValueOnce(unavailable);
  await expect(scores.loadPersonalBest(submission.shipId)).resolves.toEqual({
    status: "unavailable",
  });
  vi.stubGlobal("navigator", { onLine: false });
  vi.mocked(getDocFromServer).mockRejectedValueOnce(new Error("Offline read"));
  await expect(scores.loadPersonalBest(submission.shipId)).resolves.toEqual({
    status: "unavailable",
  });
  vi.stubGlobal("navigator", { onLine: true });
  vi.mocked(runTransaction).mockReturnValueOnce(new Promise(() => {}));
  const result = scores.submitHighScore(submission);
  await vi.advanceTimersByTimeAsync(10000);
  await expect(result).resolves.toEqual({ outcome: "unconfirmed" });
  expect(reporter).not.toHaveBeenCalled();
});
