<script lang="ts">
// Actions study, 02.11: the surface behind a horizontal set of buttons.
// Every state of the button and the gaps are settled and the same in every
// version. Three slices of the Leaderboard stand side by side: its page
// surface, its panel, sample rows and the set at the foot of the panel. The
// logomark is production. The quiet button and the call to action are scoped
// copies built without clipping. Fixture: the scores are sample values and no
// action does anything.
import "@void-drift/core/styles/surfaces.css";
import Logo from "../Logo.svelte";

let { label = "Three surfaces behind a horizontal set" }: { label?: string } =
  $props();

const variants = [
  {
    id: "band",
    name: "0 / Today's band",
    note: "The set stands on a band of the void painted across the panel, so its panes are the void's.",
  },
  {
    id: "bare",
    name: "1 / On the panel",
    note: "No band. The buttons stand on the panel itself, as the title screen's do, and their panes step up from it.",
  },
  {
    id: "rule",
    name: "2 / A rule above",
    note: "No band. A hairline separates the set from the content above it, as in the Hangar's footer.",
  },
] as const;

const scores = [
  ["1", "AKI", "Wasp", "18 420", "214s"],
  ["2", "RHO", "Scout", "15 905", "187s"],
  ["3", "VEX", "Fighter", "12 310", "162s"],
];
</script>

<section class="strips" aria-label={label}>
  <dl class="key">
    {#each variants as variant}
      <div>
        <dt>{variant.name}</dt>
        <dd>{variant.note}</dd>
      </div>
    {/each}
  </dl>

  <div class="pages">
    {#each variants as variant}
      <div class={`page v-${variant.id}`}>
        <div class="panel score-panel on-panel">
          <div class="identity"><Logo size="sm" /></div>
          <p class="eyebrow">G CLASS / TOP 30</p>
          <p class="title">Top scores</p>
          <table>
            <tbody>
              {#each scores as row}
                <tr>
                  {#each row as cell}
                    <td>{cell}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="note">Casual, client-reported scores.</p>
          <div class="strip">
            <button type="button" class="act q">Refresh</button>
            <button type="button" class="act cta">Return to title</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
/* Registered so the arm length and the edge colour can ease between states. */
@property --act-arm {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 30%;
}
@property --act-edge {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

.strips {
  display: grid;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.key {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin: 0;
  max-width: none;
}
.key dt {
  margin: 0;
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.key dd {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) / var(--line-height-ui) var(--font-family-ui);
}
.pages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
}
/* The Leaderboard's page surface is elevation 1. */
.page {
  padding: var(--spacing-sm);
  background: var(--color-elev-1);
}
.score-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.identity {
  color: var(--color-brand);
}
.eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
}
.title {
  margin: 0;
  font: var(--font-weight-bold) var(--font-size-heading) var(--font-family-ui);
}
table {
  width: 100%;
  border-collapse: collapse;
  font: var(--font-size-label) var(--font-family-ui);
}
td {
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}
td:nth-child(n + 4) {
  text-align: right;
}
.note {
  margin: 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}

/* The horizontal set. Start to end the gap is 16px, as settled in 02.10. */
.strip {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}
.v-band .strip {
  --step: var(--color-elev-2);
  padding: var(--spacing-sm);
  background: var(--color-void);
}
.v-rule .strip {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-subtle);
}

/* Both buttons: an unclipped element, a fill on ::before and an edge on
   ::after, each following the cut. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}
.act {
  --_cut: var(--cut-size-md);
  --_w: 1px;
  --_inset: 0px;
  --_i: calc(var(--_cut) + 0.4142 * var(--_w));
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: var(--control-min-height);
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 0;
  background: none;
  font:
    var(--font-weight-regular) var(--font-control-size) / 1
    var(--font-family-ui);
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition:
    --act-arm var(--duration-fast) var(--ease-standard),
    --act-edge var(--duration-fast) var(--ease-standard);
}
.act::before,
.act::after {
  content: "";
  position: absolute;
  z-index: var(--layer-under);
  pointer-events: none;
}
.act::before {
  inset: 0;
  background: var(--_fill);
  transition: background var(--duration-fast) var(--ease-standard);
  clip-path: polygon(
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut)
  );
}
.act::after {
  inset: var(--_inset);
  background: linear-gradient(
    to right,
    var(--act-edge) 0 var(--act-arm),
    transparent var(--act-arm) calc(100% - var(--act-arm)),
    var(--act-edge) calc(100% - var(--act-arm))
  );
  clip-path: polygon(
    evenodd,
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut),
    var(--_cut) 0,
    var(--_i) var(--_w),
    calc(100% - var(--_w)) var(--_w),
    calc(100% - var(--_w)) calc(100% - var(--_i)),
    calc(100% - var(--_i)) calc(100% - var(--_w)),
    var(--_w) calc(100% - var(--_w)),
    var(--_w) var(--_i),
    var(--_i) var(--_w),
    var(--_cut) 0
  );
}

.strip .act {
  padding-inline: var(--spacing-sm);
  font-size: var(--font-size-label);
}

/* The quiet button as settled: rest, pointer and held. */
.q {
  --_fill: var(--step);
  --act-arm: 30%;
  --act-edge: lch(25% 32 290);
  color: var(--color-text);
}
.q:is(:hover, :active):not(:disabled) {
  --act-edge: var(--color-action);
}
.q:active:not(:disabled) {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}
/* The call to action: the production look, rebuilt unclipped. */
.cta {
  --_fill: var(--color-action);
  --act-arm: 30%;
  --act-edge: transparent;
  color: var(--color-on-brand);
  font-weight: var(--font-weight-medium);
}
.cta:hover:not(:disabled) {
  filter: brightness(var(--state-hover-brightness));
}

/* Focus as settled in 02.8: as a pointer. */
.q:focus-visible:not(:disabled) {
  --act-edge: var(--color-action);
}
.cta:focus-visible:not(:disabled) {
  --act-edge: var(--color-on-brand);
  --_inset: 3px;
  --_w: 2px;
}

/* Unavailable, as settled in 02.9: an empty frame. The call to action's
   frame is lime. */
.act:disabled {
  --_fill: transparent;
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.q:disabled {
  --act-edge: lch(25% 32 290);
}
.cta:disabled {
  --act-edge: var(--color-action);
}

@media (prefers-reduced-motion: reduce) {
  .act,
  .act::before {
    transition: none;
  }
}
</style>
