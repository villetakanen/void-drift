---

title: "Spec: Identity"
status: draft
generated:
  by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:32:56+02:00"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Spec: Identity

## Blueprint

### Context

The linked SVG logomark identifies Void Drift consistently without a served logo font.

### Architecture

**Source of truth:** `apps/web/src/components/Logo.svelte`, `apps/web/src/components/logomark.ts`
and the `--logomark-height-*` tokens. **Lab:** `/lab/logomark`.

#### Logomark

- The mark is ∅·Δ: U+2205 empty set, U+22C5 dot operator, U+0394 Greek capital delta (void · drift).
  It is the only brand mark. The title screen also displays “VOID DRIFT” as an
  ordinary heading beneath it; this is not a separate mark. “Void Drift” is the
  accessible name and the page-title text.
- The glyphs come from Noto Sans Math 3.000 (SIL OFL 1.1), converted once by
  `scripts/convert-logomark.py` into `logomark.ts` (paths cropped to the ink box, 180 font units
  between advance boxes). `logomark-OFL.txt` sits beside it. The font is never committed or served;
  the script's docstring says how to download it and rerun the conversion, which also regenerates
  the favicon. Do not edit the paths by hand.
- `Logo.svelte` renders inline SVG with `role="img"` and `aria-label` (default "Void Drift"). It
  fills with `currentColor`; the operator is at 70% opacity. Props: `size` (`sm` | `md` | `lg`) and
  `label`.

#### Sizes

| Token                  | Height | Used for                                                                            |
| ---------------------- | ------ | ----------------------------------------------------------------------------------- |
| `--logomark-height-sm` | 1rem   | Page headers (game, builder, scores, settings, study shell) and the game menu title |
| `--logomark-height-md` | 1.5rem | Lab nav rail                                                                        |
| `--logomark-height-lg` | 3rem   | Title cards                                                                         |

Width follows the 2.62:1 aspect ratio.

#### Placement and colour

- The mark is `--color-brand`. On a lime surface it is `--color-on-brand`.
  Consumers set the colour; shared headers use `.brand` in `flight.css`.
- Every shared page header links home with the mark: `FlightDeck`, `ShipBuilder`, `Leaderboard` and
  `Settings`. The Lab rail links it to `/lab` with the name "Void Drift Lab". `StudyLayout` shows it
  in the nav beside "/ RESEARCH". Preserved study pages keep their local values.
- `public/favicon.svg` is the mark in lime on `--color-void` with a rounded square. Every layout
  (`Layout`, `LabLayout`, `StudyLayout`) links it.
- Page titles read "{Page} | Void Drift" (Lab: "{Page} | Void Drift Lab"); the game is "Void Drift".

### Constraints

- Shared headers and layouts use the committed SVG mark.
- Mark colors follow the brand and on-brand roles.
- Page titles and accessible names identify the application.

## Contract

### Definition of Done

- Shared headers, Lab rail and favicon display the mark at their specified sizes.
- Logo rendering loads no Noto Sans Math font.
- Header links lead to their documented home and have meaningful accessible names.

### Regression guardrails

- Consumers set mark color without changing shared paths.
- Generated SVG paths remain derived from the conversion source.

### Scenarios

```gherkin
Scenario: Identify a game header
  Given a shared game header
  When it renders
  Then its linked SVG mark is named Void Drift and leads home
  And its color uses the brand role

Scenario: Render the mark without a logo font
  Given a fresh application load
  When the mark appears
  Then its glyphs come from the committed SVG paths
```
