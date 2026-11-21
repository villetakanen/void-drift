# Distant flight sky · failed in exploration

The designer ended the study at 02.10: “we are looping. close study as failed”. The release question concerned the distant sky seen in flight. No production sky was accepted. Readiness and scope were never entered. The Lab registry records the procedural state as stopped.

[Closed study, findings and versioned media](../../apps/web/src/pages/lab/studies/distant-flight-sky-2026-11-18.mdx)

The designer found that prominent dots competed with the Wasp. The grey edge exposed insufficient camera-relative travel but read as “grey goo.” The ESO photograph helped the designer identify dark pockets and bright patches as things the eye could follow. A pan of 65 worked better on that photograph than on the wash. The accepted study reference had 2–5 recognizable lights and two nearer stars with gleam. The round cores bothered the designer; tapered cores were proposed without a decision.

Two exchanges document what the designer called looping. In 02.6 the first scroll comparison removed the broad grey edge. The designer pointed out that the edge had made slow travel visible. The revised comparison restored it. In 02.9 the assistant turned a reservation about round cores into a separate shape exercise. The designer questioned whether whole-sky design was progressing. The designer described this as drift; the record contains no independent evidence of a technical context loss.

After the designer observed drift, Part 01 was amended around the relationship between an individual star and a field of starlight. The final flight compared grains and overlapping patches derived from the same photograph. The designer closed the study without choosing a final treatment. The two clips are closure captures of that instrument, not recordings of the designer’s viewing session.

The shared Practice-system inspector and its spec were separately requested and implemented during the study. The study-only wrapper and painters were retired. Earlier verification reported passing flight-run tests, Astro and Svelte checks for the Practice work, and browser checks on the final comparison. Those checks concerned implementation and playback. They did not establish design acceptance.

Closure used the local working tree based on 77b61ef9. No closure commit, push or deployment was made. Retained media cover selected settings; the written observations do not imply that every comparison has a recording.

Closure verification opened the static Lab page on localhost:4339 in Chrome at 1280 px with JavaScript disabled. The header showed exploration / stopped, the outcome showed failed, there were no client islands, and all 14 retained media links returned successfully.
