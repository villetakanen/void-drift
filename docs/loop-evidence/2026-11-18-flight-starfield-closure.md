# Flight starfield study closure

The 18 November 2026 study explored how the distant flight sky could feel like part of Void Drift and make a 6% Sun-like minority discoverable in flight. It used the _Fires in the Sky_ release and the game's hi-fi low-fi art direction as context. The designer ended the study in exploration and assessed it as failed. No direction was accepted for readiness, scope or implementation.

[Closed study and retained media](../../apps/web/src/pages/lab/studies/background-stars-2026-11-18.mdx)

| Round     | Conditions and observations                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 02.1      | Three Canvas stills exposed different whole-field treatments. The designer found this comparison helped distinguish alternatives and later cited the cloud as an example of structure.                                      |
| 02.2–02.3 | A single background scrolled independently of a captured arena. The designer reported greater depth and singled out the widening as especially effective. The tested scroll ratio and zoom curve remained provisional.      |
| 02.4      | Two skies shared the same captured arena and fixed-zoom pan. The observed-sky and period-game reference board helped establish that the field needs structure. The designer left the form of that structure open.           |
| 02.5–02.6 | A luminous band competed with the foreground in 02.5. The point-built 02.6 field read as grit to the designer. The designer credited 02.4 with the finding about structure and saw little additional value in these rounds. |
| 02.7      | The same 02.1 cloud and fixed-zoom arena pan were used with and without a handful of added lights. The designer said the whole field resembled the early in-game placeholder and then stopped the study.                    |

The designer clarified that spoken reactions during exploration are design feedback unless given as explicit instructions. The reference-board request was an explicit instruction. The final closure was explicit as well.

## Closure discussion

The designer restated the question as “how to do the sky, for 0.7.0?” and described it as one design question. They also pointed out that several rounds had already been removed before 02.4. At the time, the designer said the first presented alternatives looked worse than the placeholder and that two versions of 02.1 had contributed little. In the closure discussion, they described the early work as “larping photoshop” and said those rounds had never tried to answer the question. That feedback concerns earlier iterations. The retained 02.1 sketches were later singled out as useful.

The assistant initially located the loop after 02.4 and questioned the breadth of 01. After the designer's corrections, the assistant withdrew the breadth claim and described repeating visual variations in response to feedback about the relevance of the comparison. The early rejected versions are absent from the retained page. The account of those rounds comes from the study conversation.

## Retained evidence and verification

The static page keeps the sketches, motion recordings, the 02.4 stills and reference board, and a written record of the final comparison. The rejected 02.5–02.7 examples and the final study-specific instrument were retired. 02.7 comparison screenshots existed in temporary storage during review and are outside this retained record. The photo and game reference board uses external media, so its image availability depends on those hosts. There was no retained comparison that settled the 6% treatment, the full five-stop camera behavior, or the performance of a replacement in play.

The tracked study baseline was `66391118`. Exploration and closure changes were in the local working tree at verification. Local Astro served the closed study. Headless Chrome at 1280 px with JavaScript disabled verified the stopped header, absence of client islands, keyboard access to the retained motion comparison and successful responses for all nine local media sources. The closure screenshot was visually inspected. External media availability was outside that check. No production deployment was made as part of closure.
