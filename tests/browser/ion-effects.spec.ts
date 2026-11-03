import { expect, test } from "@playwright/test";

test("shared ion instrument exposes firing, turning, release and expiry", async ({
	page,
}, testInfo) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto("/lab/ion-engines");
	const region = page.getByRole("region", { name: "Production ion effects" });
	for (const [tick, name] of [
		[45, "Firing · 0.75 s"],
		[270, "Turning · 4.5 s"],
		[330, "Released · 5.5 s"],
		[360, "Faded · 6 s"],
	] as const) {
		await region.getByRole("button", { name, exact: true }).click();
		await expect(region).toHaveAttribute("data-tick", String(tick));
		if (tick === 360) await expect(region).toHaveAttribute("data-marks", "0");
		else
			await expect
				.poll(async () => Number(await region.getAttribute("data-marks")))
				.toBeGreaterThan(0);
	}
	await region
		.getByRole("button", { name: "Firing · 0.75 s", exact: true })
		.click();
	await testInfo.attach("arcade-ion-review", {
		body: await region.screenshot(),
		contentType: "image/png",
	});
	expect(errors).toEqual([]);
});
