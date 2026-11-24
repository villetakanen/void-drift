#!/bin/sh
# PreToolUse hook for Bash: stop direct Biome calls and point to the package scripts.
command=$(jq -r '.tool_input.command // empty')

if printf '%s\n' "$command" | grep -Eq '(pnpm[[:space:]]+(--filter[[:space:]]+[^[:space:]]+[[:space:]]+)?(exec|dlx)[[:space:]]+|npx[[:space:]]+|pnpx[[:space:]]+|bunx[[:space:]]+|node_modules/\.bin/)biome([[:space:]]|$)|(^|[;&|(][[:space:]]*)biome([[:space:]]|$)'; then
  reason='Do not call Biome directly. Use the scripts in the root package.json: `pnpm lint:fix` formats and applies safe fixes in place; `pnpm lint` checks with warnings failing. See docs/development.md.'
  jq -n --arg reason "$reason" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
fi
exit 0
