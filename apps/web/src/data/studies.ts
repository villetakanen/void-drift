import { z } from "astro/zod";

export const studySchema = z.object({
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	title: z.string().min(1),
	status: z.enum(["exploratory", "accepted", "integrated"]),
	question: z.string().min(1),
});
export type Study = z.infer<typeof studySchema>;
export const studies = z.array(studySchema).parse([
	{
		slug: "buttons",
		title: "Buttons & action composition",
		status: "accepted",
		question:
			"How should game-state navigation and data actions share a clear button hierarchy across the application and Lab?",
	},
]);
