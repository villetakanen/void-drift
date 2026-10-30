import { z } from "astro/zod";

export const studySchema = z.object({
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	title: z.string().min(1),
	status: z.enum(["exploratory", "accepted", "integrated", "closed"]),
	phase: z.enum(["purpose", "exploration", "readiness", "integration"]),
	question: z.string().min(1),
});
export type Study = z.infer<typeof studySchema>;
export const studies = z.array(studySchema).parse([
	{
		slug: "engine-effects",
		title: "Engine Effects",
		status: "accepted",
		phase: "integration",
		question:
			"How can engine effects turn flying into a flashy graphic performance through shaped surfaces, glow, and fluid transformation?",
	},
	{
		slug: "gravity-wells",
		title: "Gravity wells: temptation and danger",
		status: "integrated",
		phase: "integration",
		question:
			"How can sun and planet gravity reward a deliberate close pass while making the risk of going deeper readable?",
	},
	{
		slug: "buttons",
		title: "Buttons & action composition",
		status: "integrated",
		phase: "integration",
		question:
			"How should game-state navigation and data actions share a clear button hierarchy across the application and Lab?",
	},
]);
