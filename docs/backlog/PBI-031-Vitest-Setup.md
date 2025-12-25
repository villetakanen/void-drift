# PBI-031: Vitest Setup & Unit Testing

**Status:** TODO  
**Priority:** BLOCKER  
**Estimate:** 3 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.1

---

## User Story

**As a** developer  
**I want** a robust unit testing framework (Vitest)  
**So that** I can verify logic changes atomically and prevent regressions throughout Phase 6 and beyond.

---

## Context

Phase 6 involves major architectural changes (Package Restructure, Supabase integration). To ensure these changes are safe and maintainable, we need a testing foundation. This PBI establishes Vitest as the standard testing tool for the monorepo.

**Mandatory Requirement:** No PBI in Phase 6 (starting from PBI-021) should be considered DONE without corresponding unit tests.

---

## Acceptance Criteria

### Tooling Setup
- [ ] `vitest` installed as a devDependency in the root.
- [ ] `pnpm test` script added to root `package.json` to run all tests across the workspace.
- [ ] Vitest configured for TypeScript support.

### Package Integration
- [ ] Each new package (`@void-drift/core`, `@void-drift/mode-a`) has a `test` script in its `package.json`.
- [ ] `vitest.config.ts` created if specific package configuration is needed.

### Verification
- [ ] At least one meaningful unit test implemented for core physics or logic.
- [ ] CI/Build process fails if tests fail (to be integrated into Phase 6 workflow).

---

## Technical Implementation

### 1. Installation
```bash
pnpm add -wD vitest @vitest/ui
```

### 2. Configuration (`vitest.config.ts`)
Standard configuration for workspace projects.

### 3. Root Script
```json
"scripts": {
  "test": "pnpm -r test"
}
```

---

## Definition of Done
- [ ] Vitest is installed and functional.
- [ ] `pnpm test` successfully executes across the workspace.
- [ ] A sample test exists and passes.
- [ ] Documentation updated to reflect testing requirements for Phase 6.

---

## Sign-Off
**Specification Author:** @Lead  
**Assigned To:** @Dev  
**Approved:** ⏳ Pending
