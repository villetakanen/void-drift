import { frontmatter } from "../pages/lab/studies/flight-deck-weapons-2026-11-24.mdx";
import { studies as legacyStudies, studySchema } from "./studies";

// This study owns its metadata in MDX while older studies retain their registry.
export const studies = [
  studySchema.parse({
    ...frontmatter,
    slug: "flight-deck-weapons-2026-11-24",
  }),
  ...legacyStudies,
];
