import { expect, test } from "@playwright/test";

test("shared ion painter matches both frozen approved variants pixel for pixel", async ({
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
});
