---
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-23T07:50:16+02:00"
verified: []
---

# Page header

## Blueprint

### Context

The shared page header combines the brand mark, sub-site name, optional page name, controls
and navigation. Its current consumers are the Design system at `/lab/ds`, including
its component pages at earlier URLs, Hangar at `/hangar`, Lab at `/lab` and
Design Studies at `/lab/studies`. Other game screens retain their existing headers. Design system, Lab and Studies are peer sites; URL
nesting does not define ownership. Broader adoption requires a separate decision.

### Architecture

`apps/web/src/components/PageHeader.svelte` owns the semantic header, home-linked
Logo, identity text, action region, labelled navigation and single-row layout.
Pages supply the sub-site name (`title`), optional `pageName`, sub-site destination
(`href`, defaulting to `/`), navigation label and links, and optional
Svelte actions snippet. The header has no game state or persistence of its own.

`DesignSystemLayout.astro` is the Design system's own Astro layout. It composes
the shared header and a dedicated navigation list. Lab and Studies retain their
independent layouts. Its header spans the full page above the navigation and main
content, with `spacing-sm` (8px) vertical and `spacing-md` (16px) horizontal
padding and no divider below it.
LabLayout composes the header in its existing content-column header cell, to the
right of its navigation tray, preserving the tray logo and inspector columns.
It supplies Lab identity and the current page name; the overview has no suffix.
StudyLayout composes Design studies identity and the available study title,
with peer-site navigation on the right. The sub-site name returns to the
study index. Its host supplies the UI font while article prose keeps its family,
H1, status and question. Both hosts provide 8px vertical and 16px horizontal
padding with no divider below the header.
Each development site supplies links to the other two through the shared header's
links input: `DS` leads to `/lab/ds`, `lab` to `/lab`, and `studies` to
`/lab/studies`. The current site is omitted from this navigation, labelled
Development sites. Existing URLs and package boundaries remain unchanged.

Hangar supplies the plain Hangar identity, its persisted Playground Switch as
an actions snippet, and Settings linking to `/settings?from=hangar`. Its page
wrapper owns the spacing shared by its header and workbench, as defined by the
[Hangar contract](../../../game/hangar/spec.md).

The MDX overview at `/lab/ds` lists the components. The canonical MDX page
`/lab/ds/page-header` owns the concise explanation and input reference. Labelled
live examples show site identity, site and page identity, and optional controls.
The controls example keeps its state local without changing game settings.

### Constraints

- Shared tokens and Logo, Switch and button definitions govern presentation.
- The existing Hangar is the visual reference: a 44px minimum header height,
  no internal vertical padding and no external margin. Host pages own outer
  spacing. The Design system layout uses `spacing-sm` (8px) vertical and
  `spacing-md` (16px) horizontal padding. In a live example the header sits
  directly on the dashed line of its
  [Component frame](../component-frame/spec.md), with no padding between them.
- Sub-site names use `font-size-lead`; the optional page name and its `// `
  prefix use `font-size-body`. Both retain bold weight and inherited UI family
  and line height. Optional control labels use body size; navigation uses buttons.
- With a page name, the sub-site name links to its supplied destination with
  inherited text colour and no underline, retaining visible keyboard focus.
  Without a page name, the sub-site name is plain text.
- Design-system child pages link the sub-site name to `/lab/ds`; the overview
  shows only the plain Design system name.
- The header fills its containing block and stays on one line at supported screen widths.
- Identity, controls and navigation retain the same single-row layout; the header
  has no responsive breakpoint or wrapping behaviour.
- Controls retain their minimum touch targets.
- Site and page labels are ordinary text or links, including inside live examples.
- The Page header documentation owns its main content H1, with article sections as H2.
- Navigation links live in a labelled nav; state controls live outside that nav.

## Contract

### Definition of Done

- Design system, Hangar, Lab and Studies layouts compose the shared header.
- Its MDX overview lists the MDX header page, shared source and this contract.
- The MDX component page introduces Page header and presents labelled live examples before its input reference.
- Live examples show the single-row header at supported desktop widths.

### Regression guardrails

- Credits retains its preceding header.
- Title and flight retain their existing composition.
- Example controls preserve saved game settings.
- Design-system pages retain their existing addresses and dedicated navigation.

### Scenarios

```gherkin
Scenario: Browse the design system
  Given the design-system overview at /lab/ds
  When I follow Page header in its catalogue or navigation
  Then the MDX Page header page opens in the Design system layout
  And both pages use the shared header with Design system identity

Scenario: Place the Design system header
  Given the Design system at a viewport of at least 1280px
  When I inspect its page header
  Then the page header spans above both navigation and content
  And the layout provides 8px vertical and 16px horizontal padding around the header
  And no divider appears below the page header
  And the sub-site name uses font-size-lead
  And optional control labels use font-size-body

Scenario: Read and navigate page identity
  Given a Design system component page
  When I inspect its header
  Then Design system uses font-size-lead and links to /lab/ds
  And its page name and // prefix use font-size-body
  And the sub-site link has inherited text colour and no underline
  When I focus that link with the keyboard
  Then a visible focus ring appears
  When I follow the link
  Then the overview shows the plain Design system name without a page suffix

Scenario: Place Lab identity beside its tray
  Given a Lab page at a viewport of at least 1280px
  When I inspect the shared header
  Then it occupies the content-column header cell to the right of the tray
  And Lab links to /lab when a page name is present
  And the overview shows Lab without a page suffix
  And the tray logo, navigation and inspector arrangement remain in place
  And the host supplies 8px vertical and 16px horizontal padding with no bottom divider

Scenario: Navigate a study with shared identity
  Given a registered study page at a viewport of at least 1280px
  When I inspect the shared header
  Then Design studies links to /lab/studies beside the study title
  And peer-site navigation sits on the right
  And the host supplies the UI font and 8px vertical and 16px horizontal padding
  And no divider appears below the header
  And the article retains its H1, status, question and prose font
  When I follow Design studies
  Then the index shows Design studies without a page suffix

Scenario Outline: Navigate between peer development sites
  Given a page using the <site> layout at a viewport of at least 1280px
  When I inspect its header navigation labelled Development sites
  Then it has exactly the links <first> to <firstRoute> and <second> to <secondRoute>
  And it omits a navigation link to the current site
  When I follow either link
  Then the corresponding peer-site overview opens

  Examples:
    | site          | first | firstRoute | second  | secondRoute  |
    | Design system | lab   | /lab       | studies | /lab/studies |
    | Lab           | DS    | /lab/ds    | studies | /lab/studies |
    | Studies       | DS    | /lab/ds    | lab     | /lab         |

Scenario: Preserve other game headers
  Given Credits, the title screen or flight
  When I open that screen
  Then its existing composition remains in place

Scenario: Open Hangar with the shared header
  Given Hangar at /hangar
  When I inspect its opening row
  Then the shared header shows the plain Hangar identity without a page suffix
  And the Hangar page owns the shared header and workbench gutter
  And Playground retains its persisted game setting
  And Settings follows it and links to /settings?from=hangar

Scenario: Visit a component at an earlier address
  Given a design-system component at /lab/tokens or another listed earlier address
  When I open that address
  Then its content uses the Design system layout and navigation
  And its address is unchanged

Scenario: Preserve the single-row layout
  Given the Page header component page at a viewport of at least 1280px
  When I inspect its identity and controls examples
  Then each header occupies one line
  And each header sits directly on the dashed line of its Component frame with no padding between them
  And identity, controls and navigation keep the same row layout

Scenario: Keep example state local
  Given the live header controls example
  When I change Example mode
  Then the example switch shows the selected value
  And the saved game setting is unchanged

Scenario: Learn the header from examples
  Given the Page header component page
  When I read its content
  Then Page header introduces a one-sentence purpose
  And labelled examples show site only, site and page, and controls
  And a compact input reference follows the examples

Scenario: Preserve document hierarchy
  Given the Page header documentation and its embedded examples
  When I inspect the document headings
  Then Page header is the main content H1 and its sections are H2
  And site and page identity labels contribute no document headings
  And navigation has an accessible label
```
