import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from "firebase/firestore";

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-void-drift",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
beforeEach(async () => environment.clearFirestore());
after(async () => environment?.cleanup());
const score = {
  initials: "ACE",
  seconds: 42,
  score: 60,
  deathCause: "POWER",
  shipId: "fighter",
  fitting: ["ion", "ion", "battery", "light-ion-cannon"],
  stabilizers: true,
  linkedEngines: false,
  challenge: "ion-storm",
  userId: "pilot",
};
function ref(
  user = "pilot",
  id = "ion-storm_pilot_fighter",
  app = "void-drift",
) {
  const context = user
    ? environment.authenticatedContext(user)
    : environment.unauthenticatedContext();
  return doc(context.firestore(), "artifacts", app, "scores", id);
}
test("owner can create and improve a score", async () => {
  await assertSucceeds(setDoc(ref(), score));
  await assertSucceeds(setDoc(ref(), { ...score, seconds: 50, score: 80 }));
});
test("different players can contribute and read the shared board", async () => {
  await assertSucceeds(setDoc(ref(), score));
  await assertSucceeds(
    setDoc(ref("rival", "ion-storm_rival_scout"), {
      ...score,
      userId: "rival",
      shipId: "scout",
      seconds: 51,
      score: 70,
    }),
  );
  const db = environment.authenticatedContext("viewer").firestore();
  const rows = await assertSucceeds(
    getDocs(
      query(collection(db, "artifacts", "void-drift", "scores"), limit(30)),
    ),
  );
  if (rows.size !== 2) throw new Error("Both players must appear");
});
test("anonymous, cross-owner and wrong namespace writes fail", async () => {
  await assertFails(setDoc(ref(""), score));
  await assertFails(setDoc(ref("rival"), score));
  await assertFails(
    setDoc(ref("pilot", "ion-storm_pilot_fighter", "other"), score),
  );
});
test("identity and document shape cannot be forged", async () => {
  await assertFails(setDoc(ref("pilot", "wrong"), score));
  await assertFails(setDoc(ref("pilot", "pilot_fighter"), score));
  await assertFails(setDoc(ref("pilot", "ion-storm_pilot_scout"), score));
  await assertFails(setDoc(ref(), { ...score, userId: "rival" }));
});
test("every field is required and no extra field is accepted", async () => {
  await assertFails(setDoc(ref(), { ...score, admin: true }));
  for (const field of Object.keys(score)) {
    const { [field]: _omitted, ...missing } = score;
    await assertFails(setDoc(ref(), missing));
  }
});
test("fields of the wrong type fail", async () => {
  for (const patch of [
    { initials: "a" },
    { initials: "TOOLONG" },
    { initials: "<X>" },
    { deathCause: "WIN" },
    { fitting: "ion" },
    { fitting: Array(17).fill("ion") },
    { stabilizers: "true" },
    { stabilizers: 1 },
    { linkedEngines: null },
    { linkedEngines: "false" },
    { shipId: 7 },
  ])
    await assertFails(setDoc(ref(), { ...score, ...patch }));
});
test("seconds hold milliseconds and score has no ceiling", async () => {
  for (const seconds of [-1, 0, 4.0005, "42"])
    await assertFails(setDoc(ref(), { ...score, seconds }));
  for (const value of [-1, 0, 41, 1.5, "60", null])
    await assertFails(setDoc(ref(), { ...score, score: value }));
  await assertSucceeds(setDoc(ref(), { ...score, seconds: 42.123, score: 60 }));
  await assertSucceeds(
    setDoc(ref(), { ...score, seconds: 0.5, score: 100, fitting: [] }),
  );
  await assertSucceeds(
    setDoc(ref("rival", "ion-storm_rival_fighter"), {
      ...score,
      userId: "rival",
      seconds: 7200.001,
      score: 9999999,
    }),
  );
});
test("any ship id is accepted when the document id matches", async () => {
  for (const shipId of [
    "wasp",
    "scout",
    "fighter",
    "corvette",
    "fiddler",
    "future-ship",
  ])
    await assertSucceeds(
      setDoc(ref("pilot", `ion-storm_pilot_${shipId}`), { ...score, shipId }),
    );
});
test("only the current challenge is written", async () => {
  for (const challenge of [
    "alpha-1",
    "gravity-1",
    "ion-1",
    "arrival-1",
    "arrival-2",
    "arrival-3",
    "future",
  ]) {
    await assertFails(
      setDoc(ref("pilot", `${challenge}_pilot_fighter`), {
        ...score,
        challenge,
      }),
    );
    await assertFails(setDoc(ref(), { ...score, challenge }));
  }
});
test("earlier boards stay stored and readable but cannot be raised or deleted", async () => {
  const legacy = {
    initials: "OLD",
    seconds: 42,
    score: 60,
    deathCause: "POWER",
    shipId: "fighter",
    challenge: "arrival-3",
    userId: "pilot",
  };
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        "artifacts",
        "void-drift",
        "scores",
        "arrival-3_pilot_fighter",
      ),
      legacy,
    );
  });
  const target = ref("pilot", "arrival-3_pilot_fighter");
  await assertSucceeds(getDoc(target));
  await assertFails(setDoc(target, { ...legacy, score: 90 }));
  await assertFails(deleteDoc(target));
});
test("scores cannot decrease, be overwritten by another owner, or be deleted", async () => {
  await assertSucceeds(setDoc(ref(), score));
  await assertFails(setDoc(ref(), { ...score, score: 50 }));
  await assertFails(setDoc(ref(), score));
  // A longer run whose score fits its time but is lower is not an improvement.
  await assertFails(setDoc(ref(), { ...score, seconds: 50, score: 55 }));
  await assertSucceeds(setDoc(ref(), { ...score, seconds: 40, score: 61 }));
  await assertFails(setDoc(ref("rival"), { ...score, seconds: 99, score: 99 }));
  await assertFails(deleteDoc(ref()));
});
test("reads require authentication and a bounded list query", async () => {
  await assertFails(getDoc(ref("")));
  await assertFails(getDoc(ref("pilot", "ion-storm_pilot_fighter", "other")));
  await assertFails(
    getDocs(
      query(
        collection(
          environment.authenticatedContext("pilot").firestore(),
          "artifacts",
          "void-drift",
          "scores",
        ),
        limit(31),
      ),
    ),
  );
  await assertFails(
    getDocs(
      query(
        collection(
          environment.unauthenticatedContext().firestore(),
          "artifacts",
          "void-drift",
          "scores",
        ),
        limit(30),
      ),
    ),
  );
  await assertFails(
    getDocs(
      collection(
        environment.authenticatedContext("pilot").firestore(),
        "artifacts",
        "void-drift",
        "scores",
      ),
    ),
  );
});

test("each anonymous identity can keep a best on every ship", async () => {
  for (const userId of ["pilot", "rival"]) {
    for (const shipId of ["wasp", "scout", "fighter", "corvette", "fiddler"]) {
      const target = ref(userId, `ion-storm_${userId}_${shipId}`);
      const current = { ...score, userId, shipId };
      await assertSucceeds(setDoc(target, current));
      await assertSucceeds(
        setDoc(target, { ...current, seconds: 60, score: 90 }),
      );
      await assertFails(setDoc(target, { ...current, seconds: 30, score: 50 }));
    }
  }
});
