---
name: plan-writer
description: Write or update a planning document in docs/plans/ that maps a topic's territory to inform later work. Use when the user asks for a plan, a planning document or a map of what to touch and discuss. Not for task lists, briefs or specs.
---
# Plan writer

A plan is a map, not the territory. It records what we know about a topic, what it touches and what is still open, so that later specs, steering, prompts and tasks are well informed. It holds no tasks and settles nothing. Implementation happens elsewhere.

Example of a good plan: [ship parts territory](../../../docs/plans/2026-11-24-ship-parts-territory.md).

1. Read `docs/plans/AGENTS.md`, then the code, specs and pages the topic touches. Every claim about the present is checked against them and cites a path.
2. Name it `docs/plans/YYYY-MM-DD-topic.md`. Open by saying it is an open planning document, its start date, and that it settles nothing unless a point is marked agreed with a date.
3. Shape it to fit the topic. Plans usually cover:
   - **Where this started:** the problem as found, with the evidence.
   - **Working direction:** where the conversation leans, marked as not yet in specs.
   - **First deliverable:** what it should let someone do, what exists today, and what to discuss before speccing.
   - **Later:** the rest of the territory, each area with its facts and its open questions.
4. Keep what exists today separate from what we want and from what is open. Phrase open points as questions with their real alternatives, and name the specs each area would touch.
5. Write the user's intent in plain words. Put the user's examples in as examples, not as requirements.
6. Do not write checkboxes, steps, estimates, assignees or status. Do not write acceptance criteria, which belong in specs. Leave open questions open for the user.
7. When the user agrees on a point, mark it agreed with the date, and move it into a spec once it holds.
8. Update an existing plan on its topic rather than starting a new one. Never delete a plan.
