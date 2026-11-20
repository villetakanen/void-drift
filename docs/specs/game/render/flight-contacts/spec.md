---
title: "Spec: Flight contacts"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-19T20:41:21+00:00"
verified: [{ by: "codex/gpt-6.1-terra", at: "2026-11-19T21:42:03+02:00" }]
---

# Flight contacts

## Blueprint

### Context

With Combat HUD enabled in [Options](../../options/spec.md), contacts in playable flight give the pilot bearing, type and separation while a target's centre lies on or beyond the invisible arrow circle.

### Architecture

FlightDeck uses the read-only [contact roster](../../../../../apps/web/src/lib/flight-contacts.ts) and [projection](../../../../../apps/web/src/lib/flight-contact-projection.ts). The shared [FlightContacts component](../../../../../apps/web/src/components/FlightContacts.svelte) presents one screen-fixed, pointer-transparent inline SVG above the composed game field and below controls and dialogs. The existing frame update supplies camera projection and live contacts. The browser draws keyed groups of shapes in stage-local CSS pixels.

Centre the circle in the game screen's active CSS rectangle. Its radius is half the shorter active dimension minus 22 CSS px. Project each target centre through the same camera as the field and convert to CSS pixels. Show its cue when squared distance from the circle centre is at least radius squared. Place it on that radius along the same bearing. An area too small to contain the cue draws none.

Use living pirate actors, the system Sun, intact wrecks and free energy cells from the current simulation. Each live contact has one identity within its kind. Fragments, contained energy and destroyed or removed contacts have no cue.

### Constraints

- Triangle length and base width are 16 × 12 CSS px. The concentric arc sits 16 px inward. Its length grows linearly from 2 to 96 CSS px over 600 to 3400 world units of direct player-to-target separation, clamped at each endpoint.
- Triangle and arc use full opacity. The pirate skull uses 33% opacity. The Sun, wreck and cell glyphs use 50% opacity. All marks have no glow.
- Pirates use the supplied skull silhouette in pirate red. Its crown faces the arrow at every bearing. Crown to teeth measures 24 CSS px. Along the bearing, leave 7 CSS px between the inner edge of the arc stroke and the crown.
- The Sun uses a HUD-green circle, wrecks a caution-yellow square and free cells a HUD-green square. These glyphs sit 13 px inward from the arc. Squares tilt +30° relative to the screen. Circle and squares use the [02.6 configuration](../../../../../apps/web/public/studies/offscreen-information-2026-11-19/026-selected-configuration.json) at 1.2× base.

## Contract

### Definition of Done

- With Combat HUD Off, playable flight skips contact projection and omits the overlay. Enabling it resumes projection from the current flight and camera state.
- All four live contact kinds follow the same circle rule at every supported camera zoom.
- Input passes through the overlay. Projection and painting leave simulation and camera state unchanged.

### Regression guardrails

- One frame update owns field and cues. The deck and modal surfaces remain accessible.
- Coincident bearings retain distinct contacts. Resizing recomputes placement in the current active box.

### Scenarios

```gherkin
Scenario: A visible target crosses the arrow circle
  Given a live pirate in a visible corner outside the circle
  When its projected centre moves to the circle and then just inside
  Then its complete cue shows in the corner and at equality
  And disappears strictly inside

Scenario: A pirate changes bearing
  Given a visible pirate cue
  When its bearing turns around the circle
  Then the skull turns with the arrow, crown outward
  And its height and clearance from the arc stay fixed in CSS pixels

Scenario: Contacts change during flight
  Given a Sun, pirate, intact wreck and free cell outside the circle
  When the pirate dies, the wreck breaks up and the cell leaves the simulation
  Then their three cues disappear and the Sun cue remains
  And a newly released free cell receives its own cue when eligible

Scenario: Camera scale changes at constant world separation
  Given a contact outside the circle before and after zooming
  When the field and SVG present the new projection
  Then the arrow follows the projected bearing
  And the arc keeps its CSS length

Scenario: The pilot uses deck controls
  Given a flight with visible cues
  When the pilot operates a thrust pad or opens the pause dialog
  Then the controls receive input above the contact layer
```
