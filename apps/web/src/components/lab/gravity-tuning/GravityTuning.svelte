<script lang="ts">
import { massWellReach } from "@void-drift/core";
import { untrack } from "svelte";
import {
  editGravityTuning,
  flyBench,
  GravityTuningConfig,
} from "../../../lib/gravity-tuning";
import { GRAVITY_TUNING_SHIPS } from "../../../lib/gravity-tuning/fleet";
import {
  ENERGY_MEASURES,
  energyTraces,
  type FieldBody,
  TRACK_COLORS,
  type Track,
} from "../../../lib/instrument";
import MotionInstrumentScreen from "../instrument/MotionInstrumentScreen.svelte";
import GravityPanel from "./GravityPanel.svelte";

// Gravity tuning (docs/specs/gravity-tuning.md): one well in empty space and
// the four given ships on the instrument's burns, on the shared instrument
// screen, each ship's unaffected path dotted and its thrust dashed on the
// gravity graph. The pane holds the settings and the document.
let {
  config,
  label = "Gravity tuning",
}: {
  /** The bench document; parsed here, so it may come from anywhere. */
  config: unknown;
  label?: string;
} = $props();

const MEASURES = ["speed", "gravity", "distance"] as const;
const parsed = untrack(() => GravityTuningConfig.safeParse(config));
const issues = parsed.success ? [] : parsed.error.issues;
let doc = $state(parsed.success ? parsed.data : null);

const tracks = $derived.by((): Track[] =>
  doc
    ? flyBench($state.snapshot(doc)).map((run, i) => ({
        label: run.label,
        color: TRACK_COLORS[i],
        samples: run.samples,
        unaffected: run.unaffected,
        contacts: run.contacts,
        references: { gravity: run.thrust },
        traces: {
          ...(doc?.energy
            ? energyTraces(
                run.samples,
                GRAVITY_TUNING_SHIPS[i],
                doc.burn,
                doc.energy,
              )
            : {}),
          speed: run.samples.map((s) => Math.hypot(s.vx, s.vy)),
          gravity: run.gravity,
          distance: run.distance,
        },
      }))
    : [],
);
const bodies = $derived.by((): FieldBody[] =>
  doc
    ? [
        {
          kind: "well",
          label: "Well",
          color: "",
          radius: doc.well.radius,
          reach: massWellReach(
            doc.well.strength,
            doc.well.cutoff,
            doc.well.falloff,
          ),
          path: [{ x: doc.well.x, y: doc.well.y }],
        },
      ]
    : [],
);
function moveWell(_index: number, x: number, y: number) {
  if (!doc) return;
  const result = editGravityTuning($state.snapshot(doc), (draft) => {
    draft.well.x = x;
    draft.well.y = y;
  });
  if (result.ok) doc = result.doc;
}
</script>

{#if doc}
  <MotionInstrumentScreen
    {tracks}
    bodies={[
      ...bodies,
      ...(doc.energy?.fields.map((f, i) => ({
        kind: "energy" as const,
        label: `Collection ${i + 1}`,
        color: "",
        radius: 0,
        reach: f.reach,
        path: [{ x: f.x, y: f.y }],
      })) ?? []),
    ]}
    bind:burn={doc.burn}
    measures={doc.energy ? ENERGY_MEASURES : MEASURES}
    onmovewell={moveWell}
    {label}
  >
    <GravityPanel
      bind:config={doc}
      ships={tracks.map((t) => ({
        label: t.label,
        color: t.color,
        thrust: t.references?.gravity ?? Number.NaN,
      }))}
    />
  </MotionInstrumentScreen>
{:else}
  <MotionInstrumentScreen
    tracks={[]}
    burn="course"
    measures={MEASURES}
    {label}
    {issues}
  >
    {""}
  </MotionInstrumentScreen>
{/if}
