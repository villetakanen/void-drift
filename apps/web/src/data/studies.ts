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
		slug: "ion-engines-2026-10-31",
		title: "Ion engines: precise, decisive, reliable",
		status: "integrated",
		phase: "integration",
		question:
			"How should Light and Heavy ion engines share a precise visual language?",
	},
	{
		slug: "engine-identities",
		title: "Engines: types and low-poly identities",
		status: "integrated",
		phase: "integration",
		question:
			"How can low-poly engine bodies express families, subtypes and architectural tradeoffs, both in the catalog and fitted to a ship?",
	},
	{
		slug: "ship-slot-language",
		title: "Ship slots: mounts, contents and intent",
		status: "integrated",
		phase: "integration",
		question:
			"How should a slot show what fits, what is installed and what the player can do while keeping the ship readable?",
	},
	{
		slug: "scout-firefly",
		title: "Scout: an angry little firefly",
		status: "integrated",
		phase: "integration",
		question:
			"How can a compact, tightly fitted Scout read as an angry little spacecraft rather than a miniature paper-plane Fighter?",
	},
	{
		slug: "heavy-cruiser-slots",
		title: "Heavy cruiser: slots into silhouette",
		status: "integrated",
		phase: "integration",
		question:
			"How can eight mounts and a multi-window bridge make a slim, armored cruiser express overwhelming power?",
	},
	{
		slug: "ship-silhouettes",
		title: "Three ship silhouettes",
		status: "closed",
		phase: "integration",
		question:
			"How can part placement and engine angles give three ships recognizable silhouettes in the builder and in flight?",
	},
	{
		slug: "engine-effects",
		title: "Engine Effects",
		status: "integrated",
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
