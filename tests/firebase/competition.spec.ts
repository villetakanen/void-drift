import { verificationUrls } from "../../packages/core/src/lib/schemas/verification-ports.mjs";
import { CHALLENGE } from "../../packages/mode-a/src/schemas/highscore";
import {
  type CompetitionChassis,
  competitionFlightResult,
  waitForFlightPhase,
} from "../helpers/competition-flight";
import { chooseShip, enablePreviewContent } from "../helpers/hangar";
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

test("title and Hangar pilots complete ranked runs, retry a rejected write and share a leaderboard", async ({
  newLocalContext,
  request,
}) => {
  // Three actual seeded flights plus authentication, retry and board inspection.
  test.setTimeout(120_000);
  const pilots: {
    chassis: CompetitionChassis;
    initials: string;
    seed: number;
    source?: "hangar";
  }[] = [
    { chassis: "wasp", initials: "ONE", seed: 158 },
    { chassis: "wasp", initials: "TWO", seed: 2 },
    { chassis: "scout", initials: "HGR", seed: 158, source: "hangar" },
  ];
  const expected = new Map<string, { seconds: number; score: number }>();
  const flown = new Map<
    string,
    {
      shipId: string;
      fitting: string[];
      stabilizers: boolean;
      linkedEngines: boolean;
    }
  >();
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
    await page.goto(pilot.source === "hangar" ? "/hangar" : "/");
    if (pilot.source === "hangar") await chooseShip(page, "Scout");
    else
      await expect(page.locator(".flight-page")).toHaveAttribute(
        "data-stabilizers",
        "true",
      );
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page
      .getByRole("button", {
        name: pilot.source === "hangar" ? "Survival" : "PRESS START",
        exact: true,
      })
      .click();
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
    flown.set(pilot.initials, {
      shipId: chassis,
      fitting: predicted.fitting,
      stabilizers: predicted.stabilizers,
      linkedEngines: predicted.linkedEngines,
    });
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
  // An additional row with a high score from a short run, so the two orders differ.
  const seeded = await request.patch(
    `${firestore}/v1/projects/demo-void-drift/databases/(default)/documents/artifacts/void-drift/scores/${CHALLENGE}_seeded_scout`,
    {
      headers: { Authorization: "Bearer owner" },
      data: {
        fields: {
          initials: { stringValue: "SEE" },
          seconds: { doubleValue: 3.5 },
          score: { integerValue: "500" },
          deathCause: { stringValue: "STAR" },
          shipId: { stringValue: "scout" },
          fitting: { arrayValue: { values: [{ stringValue: "ion" }] } },
          stabilizers: { booleanValue: true },
          linkedEngines: { booleanValue: false },
          challenge: { stringValue: CHALLENGE },
          userId: { stringValue: "seeded" },
        },
      },
    },
  );
  expect(seeded.ok(), "seed a high-score, short-run row").toBe(true);
  expected.set("SEE", { seconds: 3.5, score: 500 });
  // Each saved row carries the ship, the fitting and both flags as flown.
  const stored = await request.get(
    `${firestore}/v1/projects/demo-void-drift/databases/(default)/documents/artifacts/void-drift/scores`,
    { headers: { Authorization: "Bearer owner" } },
  );
  expect(stored.ok(), "read the saved rows").toBe(true);
  type StoredValue = {
    stringValue?: string;
    booleanValue?: boolean;
    integerValue?: string;
    doubleValue?: number;
    arrayValue: { values?: { stringValue: string }[] };
  };
  const rows: { fields: Record<string, StoredValue> }[] = (await stored.json())
    .documents;
  for (const [initials, run] of flown) {
    const row = rows.find((r) => r.fields.initials?.stringValue === initials);
    expect(row, `saved row for ${initials}`).toBeDefined();
    const fields = row?.fields ?? {};
    expect(fields.shipId.stringValue).toBe(run.shipId);
    expect(
      fields.fitting.arrayValue.values?.map(
        (value: { stringValue: string }) => value.stringValue,
      ),
    ).toEqual(run.fitting);
    expect(fields.stabilizers.booleanValue).toBe(run.stabilizers);
    expect(fields.linkedEngines.booleanValue).toBe(run.linkedEngines);
    const seconds = Number(
      fields.seconds.doubleValue ?? fields.seconds.integerValue,
    );
    expect(seconds).toBe(expected.get(initials)?.seconds);
  }
  const context = await newLocalContext();
  const page = await context.newPage();
  await page.goto("/leaderboard");
  for (const initials of ["ONE", "TWO", "HGR"])
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
  // The board shows score and time only, never the fitting or the ship choices.
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveText([
    "Rank",
    "Pilot",
    "Ship",
    "Score",
    "Time",
  ]);
  await expect(table).not.toContainText(/stabiliz|linked|ion-point-defence/i);
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

test("Experimental On completes a stable ship run without submitting a score", async ({
  newLocalContext,
}) => {
  const context = await newLocalContext();
  const page = await context.newPage();
  const commits: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === firestore && url.pathname.endsWith("/documents:commit"))
      commits.push(request.url());
  });
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, "getRandomValues", {
      value(array: ArrayBufferView) {
        const result = random(array);
        if (result instanceof Uint32Array && result.length === 1)
          result[0] = 157;
        return result;
      },
    });
  });
  await page.clock.install({ time: new Date("2026-11-03T00:00:00Z") });
  await page.goto("/hangar");
  await enablePreviewContent(page);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.getByRole("button", { name: "Survival", exact: true }).click();
  await waitForFlightPhase(page, "playing");
  const predicted = competitionFlightResult("wasp", 158);
  await page.clock.runFor((predicted.ticks * 1000) / 60 + 40);
  const result = page.getByRole("dialog", { name: "Run complete" });
  await expect(result).toBeVisible();
  await expect(
    result.getByText("No score for this run.", { exact: true }),
  ).toBeVisible();
  await expect(result.getByRole("button", { name: "Save Score" })).toHaveCount(
    0,
  );
  await expect(result.getByText(/^Score /)).toHaveCount(0);
  await expect(result.getByRole("link", { name: "Top Scores" })).toBeVisible();
  await page.clock.runFor(1000);
  expect(commits).toEqual([]);
  await context.close();
});
