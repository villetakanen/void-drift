<script lang="ts">
import { type Snippet, untrack } from "svelte";
import {
  calculate,
  ENERGY_MEASURES,
  energyTraces,
  FLIGHT_MEASURES,
  InstrumentConfig,
  TRACK_COLORS,
  type Track,
  traces,
} from "../../../lib/instrument";
import {
  calculatePaidIgnition,
  PAID_IGNITION_MEASURES,
  REFERENCE_SUPPLY,
} from "../../../lib/instrument/paid-ignition";
import Switch from "../../inputs/Switch.svelte";
import DocumentPanel from "./DocumentPanel.svelte";
import MotionInstrumentScreen from "./MotionInstrumentScreen.svelte";

// Ship tuning, the Motion instrument without gravity (study lab-instrument-2026-11-01): compares
// two to six vehicles from one configuration document on the shared
// instrument screen. The pane holds the values under investigation.
let {
  config,
  label = "Ship tuning",
  paidComparison,
  pane,
}: {
  /** The configuration document; parsed here, so it may come from anywhere. */
  config: unknown;
  label?: string;
  /** Optional second document, entered deliberately and edited independently. */
  paidComparison?: InstrumentConfig & { paidIgnition: true };
  /** Pane content; by default the values editor and the document. */
  pane?: Snippet<[InstrumentConfig]>;
} = $props();

// The document is read once, as the starting point; edits happen in the pane.
const parsed = untrack(() => InstrumentConfig.safeParse(config));
const issues = parsed.success ? [] : parsed.error.issues;
const comparison = untrack(() =>
  paidComparison ? InstrumentConfig.parse(paidComparison) : null,
);
let ordinaryDoc = $state(parsed.success ? parsed.data : null);
let comparisonDoc = $state(comparison);
let showComparison = $state(false);
const comparisonId = $props.id();
const doc = $derived(showComparison ? comparisonDoc : ordinaryDoc);
const notes = `Paid ignition · Rest, no gravity · Full battery, steady ${REFERENCE_SUPPLY} E/s (not solar) · Dots mark paid Fission kicks`;
function setDocument(value: InstrumentConfig) {
  if (showComparison) comparisonDoc = value;
  else ordinaryDoc = value;
}
const tracks = $derived.by((): Track[] => {
  if (!doc) return [];
  const plain = $state.snapshot(doc);
  return plain.vehicles.map((v, i) => {
    if (plain.paidIgnition)
      return calculatePaidIgnition(
        v,
        plain.burn,
        TRACK_COLORS[i],
        plain.properties,
      );
    const samples = calculate(v, plain.burn, {}, plain.properties);
    return {
      label: v.label,
      color: TRACK_COLORS[i],
      samples,
      traces: {
        ...traces(samples),
        ...(plain.energy
          ? energyTraces(samples, v, plain.burn, plain.energy, plain.properties)
          : {}),
      },
    };
  });
});
</script>

{#if doc}
  <MotionInstrumentScreen
    {tracks}
    bodies={doc.energy?.fields.map((f, i) => ({
      kind: "energy",
      label: `Collection ${i + 1}`,
      color: "",
      radius: 0,
      reach: f.reach,
      path: [{ x: f.x, y: f.y }],
    })) ?? []}
    bind:burn={
      () => doc?.burn ?? "course",
      (burn) => {
  if (doc) doc.burn = burn;
}
    }
    measures={doc.paidIgnition
      ? PAID_IGNITION_MEASURES
      : doc.energy
        ? ENERGY_MEASURES
        : FLIGHT_MEASURES}
    note={doc.paidIgnition ? notes : undefined}
    {label}
  >
    {#if comparisonDoc}
      <div class="comparison">
        <label for={comparisonId}>Paid Fission comparison</label>
        <Switch id={comparisonId} bind:checked={showComparison} />
      </div>
    {/if}
    {#if pane}
      {@render pane(doc)}
    {:else}
      {@const current = doc}
      <DocumentPanel bind:config={() => current, setDocument} />
    {/if}
  </MotionInstrumentScreen>
{:else}
  <MotionInstrumentScreen
    tracks={[]}
    burn="course"
    measures={FLIGHT_MEASURES}
    {label}
    {issues}
  >
    {""}
  </MotionInstrumentScreen>
{/if}

<style>
.comparison {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
</style>
