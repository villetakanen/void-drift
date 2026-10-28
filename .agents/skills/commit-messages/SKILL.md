---
name: commit-messages
description: Prepare meaningful Conventional Commit messages when committing or squash-merging.
---
# Commit messages
- Inspect the staged diff and preserve unrelated work.
- Keep each commit focused on one coherent change.
- Follow the repository's commitlint configuration for message syntax.
- Use feat for capabilities and fix for corrected behavior.
- Choose other types according to the actual change, not its size.
- Describe the resulting change in a concise imperative summary.
- Explain non-obvious reasons and consequences in the body.
- Mark incompatible contracts with ! and a BREAKING CHANGE footer.
- Explain the break and migration, including saved-data or replay impacts.
- Preserve release-significant details when squashing commits.
- Check meaning against the diff; a passing linter only establishes structure.
