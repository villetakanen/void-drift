# Phase 5 Quick Start Guide

**Version:** v0.1.0  
**For:** Developers implementing Survival Core  
**Estimated Time:** 3-4 weeks

---

## 🎯 What You're Building

Transform the v0.0.4 physics sandbox into a complete single-player survival game with:

1. **Resource Management** — Hull & fuel that deplete/regenerate
2. **Death Conditions** — Three ways to die (star/hull/fuel)
3. **Timer System** — Track survival time for leaderboard
4. **Player Settings** — Control inversion toggle

---

## 📋 Prerequisites

**Before Starting:**
- [ ] Read [Project Vision](./project-vision.md) — Understand Mode A vs Mode B
- [ ] Read [Survival Core Spec](./specs/survival-core.md) — Full technical spec
- [ ] Review [AGENTS.md](../AGENTS.md) — Coding standards
- [ ] Verify v0.0.4 is working: `pnpm dev` → http://localhost:4321

**Environment:**
- Node.js 18+
- pnpm 8+
- Modern browser (Chrome/Firefox recommended for DevTools)

---

## 🗺️ Implementation Order

### Week 1: PBI-015 (Resource Systems)
**Goal:** Hull & fuel working, no UI yet

```bash
# Start here
git checkout -b feature/pbi-015-resources
```

**Files to Create:**
1. `packages/engine/src/lib/schemas/game-state.ts`
2. Add constants to `packages/engine/src/lib/config.ts`

**Files to Edit:**
1. `packages/engine/src/lib/engine/physics.ts` — Add `updateFuel()`, `updateHull()`
2. Existing collision handler — Add `applyPlanetCollisionDamage()`

**Testing:**
- Console.log fuel/hull values every second
- Manually verify: thrust → fuel drops, sun proximity → refuel + burn
- Performance: Chrome DevTools → < 0.5ms for updates

---

### Week 2: PBI-016 (Timer & Death)
**Goal:** Complete game loop (start → die → restart)

```bash
git checkout -b feature/pbi-016-timer-death
```

**Files to Create:**
1. `apps/web/src/components/GameOver.svelte`

**Files to Edit:**
1. `packages/engine/src/lib/schemas/game-state.ts` — Add timer, deathCause
2. `packages/engine/src/lib/engine/game-loop.ts` — Add `checkDeath()`, `updateTimer()`
3. `apps/web/src/components/HUD.svelte` — Add timer display

**Testing:**
- Die via star → verify cause is "STAR"
- Die via hull → verify cause is "HULL"
- Die via fuel → verify cause is "FUEL"
- Restart → verify all state resets

---

### Week 3: PBI-017 (Settings)
**Goal:** Control inversion toggle with persistence

```bash
git checkout -b feature/pbi-017-settings
```

**Files to Create:**
1. `apps/web/src/pages/settings.astro`
2. `apps/web/src/components/Settings.svelte`
3. `apps/web/src/lib/settings.ts`

**Files to Edit:**
1. `packages/engine/src/lib/engine/input.ts` — Add `invertControls` param

**Testing:**
- Toggle on → press left → ship turns right
- Reload page → toggle still on
- Corrupt localStorage → no crash (defaults to off)

---

### Week 4: Polish & Testing
**Goal:** Tuning, QA, performance audit

```bash
git checkout -b feature/phase-5-polish
```

**Tasks:**
- [ ] Playtest 10+ runs, adjust constants in `config.ts`
- [ ] Chrome DevTools Performance tab → verify 60 FPS
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Cross-browser (Firefox, Safari)
- [ ] Update `package.json` → version: "0.1.0"
- [ ] Git tag: `v0.1.0`

---

## 🔧 Key Constants to Tune

**Location:** `packages/engine/src/lib/config.ts`

```typescript
export const SURVIVAL_CONFIG = {
  // Adjust these based on playtesting
  FUEL_CONSUMPTION_RATE: 1.5,     // %/s (try 1.0-2.0)
  
  SUN_ZONE_1_RADIUS: 150,          // px (try 120-180)
  SUN_ZONE_2_RADIUS: 250,          // px (try 200-300)
  
  FUEL_REGEN_ZONE_1: 4.0,          // %/s (try 3.0-5.0)
  FUEL_REGEN_ZONE_2: 2.0,          // %/s (try 1.5-2.5)
  
  HULL_BURN_ZONE_1: 1.5,           // %/s (try 1.0-2.0)
  HULL_BURN_ZONE_2: 0.5,           // %/s (try 0.3-0.7)
  
  PLANET_COLLISION_DAMAGE: 7,      // % (try 5-10)
} as const;
```

**Target Metrics:**
- Average survival time: 30-60s (new players)
- Possible survival time: 120-180s (skilled players)
- All three death causes occur naturally (33% each ideally)

---

## 🧪 Testing Commands

```bash
# Lint & Type Check
pnpm -r check

# Build (verify no errors)
pnpm -r build

# Dev Server
pnpm dev

# Build Production
pnpm --filter web build
pnpm --filter web preview
```

---

## 🐛 Common Issues & Solutions

### Issue: Fuel/Hull not updating
**Cause:** `updateFuel()` not called in game loop  
**Fix:** Ensure it's called AFTER input processing, BEFORE collision detection

---

### Issue: Timer jumps backwards
**Cause:** Using frame count instead of `Date.now()` delta  
**Fix:** Use `Date.now() - startTime` for elapsed time

---

### Issue: Death priority wrong
**Cause:** Checking conditions in wrong order  
**Fix:** Priority must be STAR > HULL > FUEL (use if/else, not separate ifs)

---

### Issue: Settings don't apply without reload
**Cause:** Settings loaded once at init  
**Fix:** Load settings in game loop OR use Svelte reactive store

---

### Issue: Performance drops below 60 FPS
**Cause:** Object allocation in render loop  
**Fix:** Reuse objects, avoid `new Vector2()` every frame

---

## 📊 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| FPS | 60 | Chrome DevTools → Performance tab |
| `updateFuel()` | < 0.3ms | `console.time()` / `console.timeEnd()` |
| `updateHull()` | < 0.2ms | Same as above |
| `checkDeath()` | < 0.1ms | Same as above |
| Memory | No leaks | DevTools → Memory → Heap snapshots |

---

## 🎨 UI Design Tokens

**Use these CSS variables (defined in `apps/web/src/styles.css`):**

```css
/* Colors */
--color-void          /* Background: #0a0a0f */
--color-neon-blue     /* Primary: #00c8ff */
--color-neon-pink     /* Accent: #ff0064 */
--color-danger        /* Red: #ff0064 */
--color-warning       /* Yellow: #ffaa00 */
--color-acid-lime     /* Green: #ccff00 */

/* Spacing */
--spacing-xs   /* 4px */
--spacing-sm   /* 8px */
--spacing-md   /* 16px */
--spacing-lg   /* 24px */
--spacing-xl   /* 32px */
```

**Never hardcode colors/spacing!**

---

## 📝 Commit Message Format

```
feat(resources): implement fuel consumption system

- Add updateFuel() to physics loop
- Fuel depletes at 1.5%/s when thrusting
- Add SURVIVAL_CONFIG constants

Closes: PBI-015
```

**Prefixes:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `refactor:` — Code restructuring
- `test:` — Adding tests
- `perf:` — Performance improvement

---

## 🚀 Definition of Done Checklist

**Before marking PBI complete:**

- [ ] All acceptance criteria met
- [ ] Zero TypeScript errors (`pnpm -r check`)
- [ ] Manual testing complete (see PBI checklist)
- [ ] Performance targets met (60 FPS maintained)
- [ ] Code follows AGENTS.md standards
- [ ] No console errors or warnings
- [ ] Mobile tested (if UI changes)
- [ ] Git committed with clear message
- [ ] PBI markdown updated (status → DONE)

---

## 📚 Quick Reference Links

**Specs:**
- [Survival Core](./specs/survival-core.md) — Full technical spec
- [Phase 5 Roadmap](./PHASE-5-ROADMAP.md) — Implementation plan

**PBIs:**
- [PBI-015: Resource Systems](./backlog/PBI-015-Resource-Systems.md)
- [PBI-016: Timer & Death Logic](./backlog/PBI-016-Timer-Death-Logic.md)
- [PBI-017: Settings Route](./backlog/PBI-017-Settings-Route.md)

**Standards:**
- [AGENTS.md](../AGENTS.md) — Coding guidelines
- [Project Vision](./project-vision.md) — Big picture

---

## 🆘 Need Help?

**Stuck on a PBI?**
1. Re-read the PBI's "Technical Implementation" section
2. Check the spec's "Anti-Patterns" section (what NOT to do)
3. Review related specs (star-mechanics.md, planet-mechanics.md, etc.)
4. Ask @Lead for clarification

**Performance issues?**
1. Profile with Chrome DevTools → Performance tab
2. Look for long tasks (> 16ms)
3. Check for object allocations in render loop
4. Consult "Performance Considerations" in spec

**TypeScript errors?**
1. Ensure all schemas are exported from `@void-drift/engine`
2. Check that types are imported correctly
3. Use `unknown` and narrow (never `any`)

---

## ✅ Ready to Start?

1. **Read the specs** (30 min)
2. **Set up environment** (`pnpm install`, `pnpm dev`)
3. **Start with PBI-015** (Resource Systems)
4. **Test frequently** (after each function)
5. **Commit often** (small, logical changes)

**Good luck! 🚀**

---

**Last Updated:** 2025-01-XX  
**Phase Lead:** @Lead  
**Implementer:** @Dev