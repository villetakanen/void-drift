import { expect, test } from "../helpers/local-browser";

test("physical shedding matches fitted material in the production damage specimen", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/lab/entities/derelict");
	const bench = page.getByRole("region", {
		name: "Physical shedding specimen",
	});
	const capture = async (name: string) => {
		const path = info.outputPath(`${name}.png`);
		await bench.screenshot({ path });
		await info.attach(name, { path, contentType: "image/png" });
	};
	await expect(bench.getByRole("status")).toContainText("Hull 85 / 85");
	await capture("intact-physical");
	for (let i = 0; i < 11; i++)
		await bench
			.getByRole("button", { name: "Laser pulse", exact: true })
			.click();
	await bench.getByRole("button", { name: "Coast 0.5 s" }).click();
	await expect(bench.getByRole("status")).toContainText(
		"Fragments 3 · Energy cells 0",
	);
	await capture("three-shed-pieces");
	await bench.getByRole("checkbox", { name: "Show fitted material" }).check();
	await capture("fitted-material");
	await bench.getByRole("checkbox", { name: "Show fitted material" }).uncheck();
	await bench.getByRole("button", { name: "Rail shot", exact: true }).click();
	await bench.getByRole("button", { name: "Coast 0.5 s" }).click();
	await expect(bench.getByRole("status")).toContainText(
		"Hull 0 / 85 · Fragments 8 · Energy cells 1",
	);
	await capture("eight-physical-pieces");
});
