#!/bin/sh
# PreToolUse hook for Bash: stop direct Biome calls and point to the package scripts.
command=$(jq -r '.tool_input.command // empty')

# A reminder, not a guard: only the start of the first line is checked, after an
# optional `cd dir &&`, so quoted text in messages and heredocs never matches.
first_line=$(printf '%s\n' "$command" | head -n 1)
if printf '%s\n' "$first_line" | grep -Eq '^[[:space:]]*(cd[[:space:]]+[^;&|]+&&[[:space:]]*)?(pnpm[[:space:]]+(--filter[[:space:]]+[^[:space:]]+[[:space:]]+)?(exec|dlx)[[:space:]]+|npx[[:space:]]+|pnpx[[:space:]]+|bunx[[:space:]]+|[^[:space:]]*node_modules/\.bin/)?biome([[:space:]]|$)'; then
  reason='Do not call Biome directly. Use the scripts in the root package.json: `pnpm lint:fix` formats and applies safe fixes in place; `pnpm lint` checks with warnings failing. See docs/development.md.'
  jq -n --arg reason "$reason" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
fi
exit 0
