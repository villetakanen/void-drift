# PBI-012: Refactor Specifications to ASDLC Standard

**Status:** TODO
**Priority:** Medium
**Parent:** Phase 3 (Wrap-Up)

## 1. Context
The current project specifications follow an ad-hoc format that mixes Requirements, Implementation Plans, and Acceptance Criteria. This violates the ASDLC "Spec" pattern, which advocates for a strict separation of **Blueprint** (Design Constraints) and **Contract** (Quality Constraints), while decoupling "Delta" (Plan) to the PBIs.

To improve Agentic performance and prevent context amnesia, we must refactor our "Source of Truth" documents.

## 2. Requirements

### 2.1. Refactor `docs/specs/*.md`
Convert the following active specs to the Blueprint/Contract format:
1.  `docs/specs/scaffold-project.md`
2.  `docs/specs/design-system-core.md`
3.  `docs/specs/star_mechanics.md`
4.  `docs/specs/controls-system.md`
5.  `docs/specs/gallery_and_assets.md`

### 2.2. The Format
Apply this structure to every file:

```markdown
# Feature: [Feature Name]

## Blueprint
### Context
[Why does this exist?]

### Architecture
- **Data Models:** [Zod Schemas / Interfaces]
- **API/Functions:** [Signatures]
- **Dependencies:** [Imports]

### Anti-Patterns
- [Negative Constraints: What NOT to do]

## Contract
### Definition of Done
- [ ] [Observable Outcome 1]

### Regression Guardrails
- [Invariant 1 (e.g. Performance limits)]

### Scenarios
**Scenario 1: [Name]**
- Given [State]
- When [Action]
- Then [Result]
```

### 2.3. Cleanup
- Remove "Implementation Steps" or "Phases" from these specs. The Spec describes the *desired state*, not the roadmap to get there.

## 3. Acceptance Criteria
- [ ] All specified Spec files follow the Blueprint/Contract structure.
- [ ] All Specs contain "Anti-Patterns" sections.
- [ ] All Specs contain at least 2 Gherkin-style Scenarios.
- [ ] No Specs contain "Phase 1/2/3" implementation checklists (these belong in PBIs).
