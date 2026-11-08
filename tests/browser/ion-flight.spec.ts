import { expect, test } from "../helpers/local-browser";

test("optional stabilizers and linked engines persist independently and reach flight", async ({
	page,
}) => {
	await page.clock.install();
	await page.goto("/hangar?chassis=fighter");
	const stabilizers = page.getByRole("checkbox", {
		name: "Ion stabilizers",
		exact: true,
	});
	const linked = page.getByRole("checkbox", {
		name: "Linked engines",
		exact: true,
	});
	await expect(stabilizers).toBeChecked();
	await expect(linked).not.toBeChecked();
	await stabilizers.uncheck();
	await linked.check();
	await page.reload();
	await expect(stabilizers).not.toBeChecked();
	await expect(linked).toBeChecked();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	await expect(page.locator(".flight-page")).toHaveAttribute(
		"data-stabilizers",
		"false",
	);
	await page
		.getByRole("button", { name: "Return to builder", exact: true })
		.click();
	await stabilizers.check();
	await linked.uncheck();
	await page.reload();
	await expect(stabilizers).toBeChecked();
	await expect(linked).not.toBeChecked();
	await page.getByRole("button", { name: /^Heavy ion\b/ }).click();
	await page.getByRole("button", { name: "Test flight", exact: true }).click();
	const deck = page.locator(".flight-page");
	await expect(deck).toHaveAttribute("data-stabilizers", "true");
	await page.keyboard.down("d");
	await page.clock.runFor(500);
	const initial = Number(await deck.getAttribute("data-spin"));
	expect(initial).toBeGreaterThan(0);
	await page.keyboard.up("d");
	await page.clock.runFor(500);
	const braking = Number(await deck.getAttribute("data-spin"));
	expect(braking).toBeLessThan(initial);
	expect(braking).toBeGreaterThanOrEqual(0);
	await page
		.getByRole("button", { name: "Return to builder", exact: true })
		.click();
	await page
		.getByRole("radiogroup", { name: "Choose chassis" })
		.getByText("Scout", { exact: true })
		.click();
	await expect(stabilizers).toBeChecked();
	await expect(linked).not.toBeChecked();
});
