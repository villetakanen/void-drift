import { verificationUrls } from "../../packages/core/src/lib/schemas/verification-ports.mjs";
import { CHALLENGE } from "../../packages/mode-a/src/schemas/highscore";
import {
  type CompetitionChassis,
  competitionFlightResult,
  waitForFlightPhase,
} from "../helpers/competition-flight";
import { expect, test } from "../helpers/local-browser";

const firestore = "http://127.0.0.1:8080";
test.use({
  localOrigins: [
    verificationUrls().competition,
    firestore,
    "http://127.0.0.1:9099",
  ],
});

// Rules cases leave fixtures behind. Clear them even when that preceding suite
// failed, and also isolate a standalone competition invocation.
test.beforeAll(async ({ request }) => {
  const response = await request.delete(
    `${firestore}/emulator/v1/projects/demo-void-drift/databases/(default)/documents`,
  );
  expect(response.ok(), "reset demo Firestore before competition").toBe(true);
});

test("two anonymous pilots complete runs, retry a rejected write and see a shared leaderboard", async ({
  newLocalContext,
  request,
}) => {
  const pilots: {
    chassis: CompetitionChassis;
    initials: string;
    seed: number;
  }[] = [
    { chassis: "wasp", initials: "ONE", seed: 158 },
    { chassis: "wasp", initials: "TWO", seed: 2 },
  ];
  const expected = new Map<string, { seconds: number; score: number }>();
  for (const pilot of pilots) {
    const chassis = pilot.chassis;
    const context = await newLocalContext();
    const page = await context.newPage();
    // Fix only the single-word arrival seed; Firebase keeps its normal entropy.
    const arrivalSeed = pilot.seed;
    await page.addInitScript((seed) => {
      const random = crypto.getRandomValues.bind(crypto);
      Object.defineProperty(crypto, "getRandomValues", {
        value(array: ArrayBufferView) {
          const result = random(array);
          if (result instanceof Uint32Array && result.length === 1)
            result[0] = seed - 1;
          return result;
        },
      });
    }, arrivalSeed);
    await page.clock.install({ time: new Date("2026-11-03T00:00:00Z") });
    await page.goto("/");
    await expect(page.locator(".flight-page")).toHaveAttribute(
      "data-stabilizers",
      "true",
    );
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.getByRole("button", { name: "PRESS START" }).click();
    await waitForFlightPhase(page, "playing");
    await expect(page.locator(".flight-page")).toHaveAttribute(
      "data-status",
      "PLAYING",
    );
    await expect(page.locator(".flight-page")).toHaveAttribute(
      "data-ticks",
      "0",
    );
    const seed = Number(
      await page.locator(".flight-page").getAttribute("data-seed"),
    );
    expect(seed).toBe(arrivalSeed);
    const predicted = competitionFlightResult(chassis, seed);
    expect(predicted.status).toBe("GAME_OVER");
    expect(predicted.cause).toBe("STAR");
    expect(predicted.ticks).toBeLessThan(1000);
    expected.set(pilot.initials, predicted);
    await page.clock.runFor((predicted.ticks * 1000) / 60 + 40);
    await expect(
      page.getByRole("dialog", { name: "Run complete" }),
    ).toBeVisible();
    await expect(page.locator(".flight-page")).toHaveAttribute(
      "data-ticks",
      String(predicted.ticks),
    );
    await page.clock.resume();
    await page.getByLabel("Your initials").fill(pilot.initials);
    const submit = page.getByRole("button", {
      name: "Save Score",
      exact: true,
    });
    if (pilot.initials === "ONE") {
      let rejected = false;
      await page.route(
        (url) =>
          url.origin === firestore &&
          url.pathname.endsWith("/documents:commit"),
        async (route) => {
          if (rejected) return route.continue();
          rejected = true;
          await route.fulfill({
            status: 403,
            json: {
              error: {
                code: 403,
                status: "PERMISSION_DENIED",
                message: "Verification fixture denied this write.",
              },
            },
          });
        },
      );
      await submit.click();
      await expect(
        page.getByRole("dialog", { name: "Run complete" }).getByRole("status"),
      ).toContainText("Verification fixture denied this write.");
      await expect(submit).toBeEnabled();
      expect(rejected).toBe(true);
    }
    await submit.click();
    await expect(page).toHaveURL(/\/leaderboard$/, { timeout: 15000 });
    await context.close();
  }
  // A third row with a high score from a short run, so the two orders differ.
  const seeded = await request.patch(
    `${firestore}/v1/projects/demo-void-drift/databases/(default)/documents/artifacts/void-drift/scores/${CHALLENGE}_seeded_scout`,
    {
      headers: { Authorization: "Bearer owner" },
      data: {
        fields: {
          initials: { stringValue: "SEE" },
          seconds: { integerValue: "3" },
          score: { integerValue: "500" },
          deathCause: { stringValue: "STAR" },
          shipId: { stringValue: "scout" },
          challenge: { stringValue: CHALLENGE },
          userId: { stringValue: "seeded" },
        },
      },
    },
  );
  expect(seeded.ok(), "seed a high-score, short-run row").toBe(true);
  expected.set("SEE", { seconds: 3, score: 500 });
  const context = await newLocalContext();
  const page = await context.newPage();
  await page.goto("/leaderboard");
  for (const initials of ["ONE", "TWO"])
    await expect(
      page.getByRole("cell", { name: new RegExp(`^${initials}\\b`) }),
    ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Wasp", exact: true }),
  ).toHaveCount(2);
  // Each row carries the run's score and time, from the simulation's own result.
  for (const [initials, result] of expected) {
    const row = page.getByRole("row", {
      name: new RegExp(`^\\d+ ${initials}`),
    });
    await expect(row.getByRole("cell").nth(3)).toHaveText(String(result.score));
    await expect(row.getByRole("cell").nth(4)).toHaveText(`${result.seconds}s`);
  }
  const rankedPilots = () =>
    page.locator("tbody tr td:nth-child(2) strong").allTextContents();
  const byKey = (key: "score" | "seconds") =>
    [...expected]
      .sort((a, b) => b[1][key] - a[1][key])
      .map(([initials]) => initials);
  const byScore = page.getByRole("button", { name: "By score" });
  const byTime = page.getByRole("button", { name: "By time" });
  await expect(byScore).toHaveAttribute("aria-pressed", "true");
  // The seeded row leads by score and trails by time, so the orders differ.
  expect(await rankedPilots()).toEqual(byKey("score"));
  await byTime.click();
  await expect(byTime).toHaveAttribute("aria-pressed", "true");
  expect(await rankedPilots()).toEqual(byKey("seconds"));
  await byScore.click();
  expect(await rankedPilots()).toEqual(byKey("score"));
  await context.close();
});
