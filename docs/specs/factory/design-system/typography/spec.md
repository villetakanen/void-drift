---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-22T08:00:02Z"
verified: []
---

# Typography

## Blueprint

### Context

Typography keeps game interfaces, Lab instruments and prose readable in distinct shared roles.

### Architecture

**Source of truth:** `packages/core/src/lib/styles/{fonts,tokens,typography}.css` and
`packages/core/src/lib/ui/typography.ts`. **Lab:** `/lab/typography`.

#### Typefaces

| Role      | Face                                | Used for                                                                                          | Shipped as                                         |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ui`      | B612 Mono 400/700, roman and italic | All game and interface text: HUD, menus, builder, settings, leaderboard, Lab shell, canvas labels | Self-hosted woff2 (latin)                          |
| `prose`   | Noto Sans, variable 100–900         | Studies, help and docs                                                                            | Self-hosted woff2 (latin subset: English, Finnish) |
| `display` | Noto Sans at weight 800             | Headlines                                                                                         | Same file as `prose`                               |
| Logotype  | Noto Sans Math                      | ∅·Δ only; see [Identity](../identity/spec.md)                                                     | SVG outlines; the font is never served             |

"Monospace" in this project means B612 Mono. Fonts live in
`packages/core/src/lib/styles/fonts/` with their SIL OFL 1.1 licences; there is no CDN and no npm
font package. Each family falls back to the OS face (`ui-monospace`, `system-ui`) while loading
(`font-display: swap`) or for characters outside the subset.

#### Tokens

| Group        | Tokens                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Families     | `--font-family-ui`, `--font-family-prose`, `--font-family-display`                                                                           |
| Weights      | `--font-weight-regular` 400, `--font-weight-medium` 500, `--font-weight-bold` 700, `--font-weight-display` 800                               |
| Sizes        | `--font-size-caption` 0.75rem, `-label` 0.875rem, `-body` 0.95rem, `-lead` 1.2rem, `-heading` 1.5rem, `-display` clamp(1.75rem, 4vw, 3.5rem) |
| Line heights | `--line-height-display` 1.05, `-heading` 1.1, `-ui` 1.5, `-prose` 1.65                                                                       |
| Tracking     | `--tracking-eyebrow` 0.16em, `-display` 0.03em                                                                                               |
| Measure      | `--measure-prose` 70ch                                                                                                                       |

B612 Mono has no 500 or 800; `--font-weight-medium` resolves to 400 in the ui role. Use 400 or 700
there. Deprecated aliases remain until their last consumer migrates: `--font-flight` → ui,
`--font-display` → display, `--font-small` → caption, `--font-body` → body, `--font-large` → heading,
`--font-title` → display size. Preserved studies keep using these aliases.

#### Rules

- Page roots set the role: game pages (`body`, `.flight-page`) and the Lab shell use `ui`;
  `StudyLayout` puts `.prose` on its `main`.
- `DesignSystemLayout` opts authored MDX documentation prose in its main content into the shared
  prose styles. Headings, paragraphs, lists, blockquotes and other authored prose, including inline
  links, use the shared reading treatment. Live examples and nested component UI keep their own
  typography. The shell and Astro-authored Design system pages retain their existing typography.
- `.prose` is global: family, line height, measure on section paragraphs, heading rhythm and link
  colour. Its descendant rules have zero specificity, so local component styles win.
- Components name role tokens. Literal families are not allowed in shared CSS, layouts or canvas.
- Canvas uses `canvasFont(size, weight)` from `@void-drift/core`, which mirrors `--font-family-ui`
  (`pnpm check:contracts` keeps them equal). One-shot canvas drawings redraw after `loadCanvasFonts()`.
- Preserved study components keep their local values.

### Constraints

- UI, prose and display roles resolve through shared tokens.
- Fonts are self-hosted with their licences.
- Canvas text uses the shared typography owner.

## Contract

### Definition of Done

- Shared role fonts, sizes, weights and tracking resolve from tokens.
- Canvas font construction matches the CSS UI family.
- Study prose retains its intended role and measure.
- MDX documentation inherits shared prose styling from `DesignSystemLayout`.

### Regression guardrails

- Loading a page requests local fonts rather than a third-party font service.
- Preserved studies retain their supported aliases.
- The [Documents grid](../documents-grid/spec.md) retains its dimensions, width query and placement
  when prose typography is applied.

### Scenarios

```gherkin
Scenario: Read a shared interface
  Given a game or Lab interface
  When its text renders
  Then interface text uses the UI role and prose uses its prose role

Scenario: Read authored MDX documentation
  Given a Design system MDX page with authored headings, paragraphs, lists, blockquotes and links in its main content
  When the page renders through DesignSystemLayout
  Then the authored prose uses the shared reading typography and its links use the shared prose link treatment
  And the Documents grid retains its dimensions, width query and placement rules

Scenario: Keep examples and shell separate from document prose
  Given a Design system MDX page with a live example and nested component UI in its main content
  When the page renders through DesignSystemLayout
  Then example content and nested component UI keep their own typography, including their text and links
  And the page header, navigation and inspector keep their shell typography

Scenario: Keep Astro page typography
  Given an Astro-authored Design system page
  When it renders through DesignSystemLayout
  Then its main content retains its existing typography

Scenario: Match Canvas and CSS text
  Given an instrument with Canvas labels
  When its labels are drawn
  Then the shared Canvas font helper resolves the same UI family as CSS
```
