import { expect, test } from "@playwright/test";

test("shared ion painter matches the accepted firing, turn and release replay", async ({
	page,
}) => {
	await page.goto("/lab/ion-engines");
	await page
		.getByText("Preserved approved reference · 02.4", { exact: true })
		.click();
	await expect(
		page
			.getByRole("region", { name: "Production ion effects" })
			.getByRole("button", { name: "Play", exact: true }),
	).toBeVisible();
	const frames: string[] = [];
	for (const [tick, name] of [
		[45, "Firing · 0.75 s"],
		[270, "Turning · 4.5 s"],
		[330, "Released · 5.5 s"],
		[360, "Faded · 6 s"],
	] as const) {
		for (const label of ["Production ion effects", "Frozen ion reference"]) {
			const region = page.getByRole("region", { name: label });
			await region.getByRole("button", { name, exact: true }).click();
			await expect(region).toHaveAttribute("data-tick", String(tick));
		}
		await expect
			.poll(async () =>
				page.evaluate(() => {
					const live = Array.from(
						document.querySelectorAll<HTMLCanvasElement>(
							'[aria-label="Production ion effects"] canvas',
						),
					);
					const frozen = Array.from(
						document.querySelectorAll<HTMLCanvasElement>(
							'[aria-label="Frozen ion reference"] canvas',
						),
					);
					return (
						live.length === 2 &&
						frozen.length === 2 &&
						live.every((c, i) => {
							const data = c
								.getContext("2d")
								?.getImageData(0, 0, c.width, c.height).data;
							return (
								data?.some((v) => v !== 0) &&
								c.toDataURL() === frozen[i].toDataURL()
							);
						})
					);
				}),
			)
			.toBe(true);
		frames.push(
			await page
				.locator('[aria-label="Production ion effects"] canvas')
				.first()
				.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
		);
	}
	// Catch an inert checkpoint control: each selected moment must change the image.
	expect(new Set(frames).size).toBe(4);
});
