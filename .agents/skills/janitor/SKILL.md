---
name: janitor
description: Daily pruning run. Pick three random tracked files, judge whether each is stale or still brings value, propose an action for each, then carry out only the actions the user decides. Use when the user asks for the janitor or a pruning run.
---
# Janitor

1. Pick three random tracked text files with `git ls-files` (skip images and lockfiles).
2. For each file, check its references, its last commit and the spec or study it belongs to. Then give a verdict (keep, stale, or goes with its study), with the how and why in 220 characters or fewer, and propose refactoring or deletion where warranted.
3. Stop and wait. The user decides on each file; act only on those decisions.
4. Study code (a component, helper or data file used by a closed study): capture what it renders as images in `apps/web/public/studies/<slug>/`, with one image per meaningful state. Wait until canvases have drawn before capturing. Swap the page over to the images, then delete the code and any helpers it leaves without users.
5. Plans, past evidence (`docs/loop-evidence`, factory reports) and specs are never deleted on your own initiative. Propose, and leave the decision to the user.
6. Verify: the changed pages render without errors, `astro check` passes, and Biome passes on the changed files. Report what changed and anything you found along the way. Do not commit.
