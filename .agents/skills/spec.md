# Spec Skill (@Spec)

## Trigger
- Use this skill when asked to create, reverse-engineer, or update a feature specification.

## Goal
- Produce and maintain living specs in `docs/specs/` that act as the source of truth for intent, behavior contracts, and acceptance criteria.

## Modes
1. `create <domain>`
   - Create a new spec from user requirements and existing project constraints.
2. `reverse <path-or-domain>`
   - Derive a spec from existing code and docs when no reliable spec exists.
3. `update <domain>`
   - Bring an existing spec in sync with current behavior and architecture.

## Workflow

### 1) Load Context
- Read `AGENTS.md` first for project boundaries and role rules.
- Read relevant existing specs in `docs/specs/`.
- Read backlog PBIs in `docs/backlog/` when they are referenced.
- For ASDLC guidance, use MCP articles:
  - `the-spec`
  - `living-specs`
  - `spec-driven-development`

### 2) Inspect Reality
- Read the relevant source files before writing the spec.
- Identify:
  - Data contracts and validation points (Zod schema paths)
  - Runtime flow and integration points
  - Firestore paths and persistence rules
  - Error and edge-case behavior

### 3) Author the Spec
- Write or update `docs/specs/<domain>.md`.
- State constraints positively and make them machine-verifiable.
- Use concrete file paths, not abstract references.
- Keep implementation details out unless they are contract-critical.

Suggested structure:

```markdown
# <Feature Name>

## Context
Why this exists and what user/system problem it solves.

## Architecture
- Inputs/Outputs
- Data contracts (with schema file paths)
- Dependencies and boundaries
- Constraints (security/performance/routing)

## Contract
### Definition of Done
- [ ] Verifiable criterion 1
- [ ] Verifiable criterion 2

### Regression Guardrails
- Invariant that must always hold

### Scenarios
```gherkin
Scenario: Happy path
  Given ...
  When ...
  Then ...

Scenario: Failure path
  Given ...
  When ...
  Then ...
```
```

### 4) Verify Quality
- Ensure each DoD item is independently testable.
- Ensure at least one happy path and one failure/edge scenario exist.
- Ensure schema-first requirements are explicit when logic changes are involved.
- Ensure Firestore paths follow `artifacts/{appId}/...` where persistence is involved.

### 5) Maintain as Living Spec
- If behavior changed, update the relevant spec in the same change.
- Mark obsolete sections with `[DEPRECATED yyyy-mm-dd]` plus rationale instead of deleting history.

## Boundaries
- This skill writes and updates specification docs only.
- This skill does not implement production code.
- This skill does not introduce new dependencies.

## Output Contract
- Return:
  - Mode used (`create`, `reverse`, `update`)
  - Files created/updated
  - Key contracts added/changed
  - Open questions that block implementation (if any)
