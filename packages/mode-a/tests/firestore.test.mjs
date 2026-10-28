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
	deathCause: "POWER",
	shipId: "balanced",
	challenge: "alpha-1",
	userId: "pilot",
};
function ref(user = "pilot", id = "pilot_balanced", app = "void-drift") {
	const context = user
		? environment.authenticatedContext(user)
		: environment.unauthenticatedContext();
	return doc(context.firestore(), "artifacts", app, "scores", id);
}
test("owner can create and improve a score", async () => {
	await assertSucceeds(setDoc(ref(), score));
	await assertSucceeds(setDoc(ref(), { ...score, seconds: 50 }));
});
test("different players can contribute and read the shared board", async () => {
	await assertSucceeds(setDoc(ref(), score));
	await assertSucceeds(
		setDoc(ref("rival", "rival_scout"), {
			...score,
			userId: "rival",
			shipId: "scout",
			seconds: 51,
		}),
	);
	const db = environment.authenticatedContext("viewer").firestore();
	const rows = await assertSucceeds(
		getDocs(
			query(collection(db, "artifacts", "void-drift", "scores"), limit(20)),
		),
	);
	if (rows.size !== 2) throw new Error("Both players must appear");
});
test("anonymous, cross-owner and wrong namespace writes fail", async () => {
	await assertFails(setDoc(ref(""), score));
	await assertFails(setDoc(ref("rival"), score));
	await assertFails(setDoc(ref("pilot", "pilot_balanced", "other"), score));
});
test("identity and document shape cannot be forged", async () => {
	await assertFails(setDoc(ref("pilot", "wrong"), score));
	await assertFails(setDoc(ref(), { ...score, userId: "rival" }));
	await assertFails(setDoc(ref(), { ...score, admin: true }));
	const { initials, ...missing } = score;
	await assertFails(setDoc(ref(), missing));
});
test("invalid types and bounds fail", async () => {
	for (const seconds of [-1, 0, 3601, 1.5, "42"])
		await assertFails(setDoc(ref(), { ...score, seconds }));
	for (const initials of ["a", "TOOLONG", "<X>"])
		await assertFails(setDoc(ref(), { ...score, initials }));
});
test("unknown challenge, ship and death cause fail", async () => {
	await assertFails(setDoc(ref(), { ...score, challenge: "future" }));
	await assertFails(setDoc(ref(), { ...score, shipId: "cheat" }));
	await assertFails(setDoc(ref(), { ...score, deathCause: "WIN" }));
});
test("scores cannot decrease, be overwritten by another owner, or be deleted", async () => {
	await assertSucceeds(setDoc(ref(), score));
	await assertFails(setDoc(ref(), { ...score, seconds: 10 }));
	await assertFails(setDoc(ref("rival"), { ...score, seconds: 99 }));
	await assertFails(deleteDoc(ref()));
});
test("reads require authentication and a bounded list query", async () => {
	await assertFails(
		getDocs(
			query(
				collection(
					environment.unauthenticatedContext().firestore(),
					"artifacts",
					"void-drift",
					"scores",
				),
				limit(20),
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
