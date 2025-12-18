# PBI-024: Lab Stats View

**Status:** TODO  
**Priority:** LOW  
**Estimate:** 3 Story Points  
**Phase:** 6 (Foundation)  
**Target Version:** v0.1.3

---

## User Story

**As a** developer/designer  
**I want** to see game stats for each entity in the lab  
**So that** I can understand and tune the gameplay parameters visually

---

## Context

The lab (`/lab`) currently shows visual previews of assets but doesn't display the underlying game stats that affect gameplay. When tuning parameters, developers need to:

1. Look at the visual representation
2. Cross-reference config files for actual values
3. Mentally map how values affect gameplay

This PBI adds a **stats panel** to each lab entity that shows:
- Physical properties (radius, mass, speed)
- Gameplay properties (damage, gravity influence, zone radii)
- Derived values (influence radius, zone boundaries)

---

## Acceptance Criteria

### Stats Panel Component
- [ ] Create reusable `LabStats.svelte` component
- [ ] Displays key-value pairs in clean format
- [ ] Supports grouping (Physical, Gameplay, Zones)
- [ ] Uses monospace font for values (tabular alignment)
- [ ] Matches design system (void bg, neon-blue accents)

### Ship Stats
- [ ] Radius: collision size in pixels
- [ ] Max Speed: pixels per second
- [ ] Thrust Force: acceleration
- [ ] Rotation Speed: radians per second
- [ ] Drag: damping factor

### Sun Stats
- [ ] Type: RED_GIANT / YELLOW_DWARF / BLUE_DWARF
- [ ] Radius: visual/collision size
- [ ] Mass: gravity strength factor
- [ ] Power Multiplier: regen rate modifier
- [ ] Burn Multiplier: hull damage modifier
- [ ] Zone 1/2/3 Radii: calculated from base + sun scale

### Planet Stats
- [ ] Radius: collision size
- [ ] Mass: gravity strength
- [ ] Orbit Radius: distance from sun
- [ ] Orbit Speed: radians per second
- [ ] Collision Damage: hull damage on impact

### Lab Page Updates
- [ ] Ship section shows stats panel
- [ ] Sun section shows stats panel (updates with type selector)
- [ ] Planet section shows stats panel
- [ ] Stats panels toggleable (show/hide) to reduce clutter

---

## Technical Implementation

### Stats Component

```svelte
<!-- apps/web/src/components/lab/LabStats.svelte -->
<script lang="ts">
  interface StatGroup {
    label: string;
    stats: { key: string; value: string | number; unit?: string }[];
  }
  
  let { groups }: { groups: StatGroup[] } = $props();
</script>

<div class="stats-panel">
  {#each groups as group}
    <div class="stat-group">
      <h4>{group.label}</h4>
      <dl>
        {#each group.stats as stat}
          <div class="stat-row">
            <dt>{stat.key}</dt>
            <dd>{stat.value}{stat.unit ? ` ${stat.unit}` : ''}</dd>
          </div>
        {/each}
      </dl>
    </div>
  {/each}
</div>

<style>
  .stats-panel {
    background: var(--color-void-light);
    border: 1px solid var(--color-neon-blue);
    border-radius: var(--radius-sm);
    padding: var(--spacing-md);
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .stat-group {
    margin-bottom: var(--spacing-md);
  }
  
  .stat-group:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    color: var(--color-neon-blue);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--spacing-sm);
  }
  
  dl {
    margin: 0;
  }
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }
  
  dt {
    color: var(--color-text-dim);
  }
  
  dd {
    color: var(--color-text);
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
</style>
```

### Ship Stats Usage

```svelte
<!-- In lab ship section -->
<script>
  import LabStats from './LabStats.svelte';
  import { CONFIG } from '@void-drift/core';
  
  const shipStats = [
    {
      label: 'Physical',
      stats: [
        { key: 'Radius', value: CONFIG.SHIP_RADIUS, unit: 'px' },
        { key: 'Max Speed', value: CONFIG.MAX_SPEED, unit: 'px/s' },
      ]
    },
    {
      label: 'Movement',
      stats: [
        { key: 'Thrust', value: CONFIG.THRUST_FORCE, unit: 'px/s²' },
        { key: 'Rotation', value: CONFIG.ROTATION_SPEED.toFixed(2), unit: 'rad/s' },
        { key: 'Drag', value: CONFIG.SHIP_DRAG, unit: '/s' },
      ]
    }
  ];
</script>

<LabStats groups={shipStats} />
```

### Sun Stats with Dynamic Type

```svelte
<script>
  import LabStats from './LabStats.svelte';
  import { SUN_PRESETS, SURVIVAL_CONFIG } from '@void-drift/core';
  
  let sunType = $state('YELLOW_DWARF');
  
  const sunStats = $derived(() => {
    const config = SUN_PRESETS[sunType];
    const radiusScale = config.radius / 40;
    
    return [
      {
        label: 'Type',
        stats: [
          { key: 'Class', value: sunType.replace('_', ' ') },
        ]
      },
      {
        label: 'Physical',
        stats: [
          { key: 'Radius', value: config.radius, unit: 'px' },
          { key: 'Mass', value: config.mass },
          { key: 'Pulse Speed', value: config.pulseSpeed.toFixed(1), unit: 'x' },
        ]
      },
      {
        label: 'Gameplay',
        stats: [
          { key: 'Power Mult', value: config.powerMultiplier.toFixed(1), unit: 'x' },
          { key: 'Burn Mult', value: config.burnMultiplier.toFixed(1), unit: 'x' },
        ]
      },
      {
        label: 'Zones (scaled)',
        stats: [
          { key: 'Zone 1', value: Math.round(SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * radiusScale), unit: 'px' },
          { key: 'Zone 2', value: Math.round(SURVIVAL_CONFIG.POWER_ZONE_2_RADIUS * radiusScale), unit: 'px' },
          { key: 'Zone 3', value: Math.round(SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * radiusScale), unit: 'px' },
        ]
      }
    ];
  });
</script>

<select bind:value={sunType}>
  <option value="RED_GIANT">Red Giant</option>
  <option value="YELLOW_DWARF">Yellow Dwarf</option>
  <option value="BLUE_DWARF">Blue Dwarf</option>
</select>

<LabStats groups={sunStats} />
```

---

## Definition of Done

- [ ] `LabStats.svelte` component created
- [ ] Ship stats displayed in lab
- [ ] Sun stats displayed in lab (dynamic with type selector)
- [ ] Planet stats displayed in lab
- [ ] Stats match actual config values
- [ ] Stats update when selectors change
- [ ] Consistent styling with design system
- [ ] Zero TypeScript errors

---

## Testing Checklist

### Accuracy
- [ ] Ship stats match `CONFIG` values
- [ ] Sun stats match `SUN_PRESETS` values
- [ ] Planet stats match game config
- [ ] Zone radii calculate correctly with sun scale

### Visual
- [ ] Stats panel readable
- [ ] Values align nicely (tabular-nums)
- [ ] Groups clearly separated
- [ ] Matches void industrial aesthetic

### Interactivity
- [ ] Sun type selector updates stats in real-time
- [ ] No flicker or layout shift on update

---

## Dependencies

- PBI-023 (Sun Scale System) must be complete for sun type stats

---

## Out of Scope

- Editable stats (would require live config updates)
- Export stats to file
- Comparison mode (side-by-side types)
- Historical stats tracking

---

## Related Documents

- [Gallery and Assets Spec](../specs/gallery_and_assets.md)
- [PBI-023: Sun Scale System](./PBI-023-Sun-Scale-System.md)
- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
