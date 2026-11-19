<script lang="ts">
import { type Snippet, untrack } from "svelte";
import { type DeepReadonly, readOnlyCopy } from "../../../lib/flight-scene";
import {
  type PlanetInspectorDocument,
  PlanetInspectorDocumentSchema,
} from "../../../lib/planet-inspector";
import PlanetInspectorView from "./PlanetInspectorView.svelte";

let {
  config,
  label = "Planet Inspector: planet and its Sun",
  pane,
}: {
  config: unknown;
  label?: string;
  pane?: Snippet<[DeepReadonly<PlanetInspectorDocument>]>;
} = $props();
const parsed = $derived(PlanetInspectorDocumentSchema.safeParse(config));
const doc = $derived(parsed.success ? parsed.data : null);
let selected = $state<PlanetInspectorDocument["planet"]>();
$effect(() => {
  void config;
  untrack(() => {
    selected = undefined;
  });
});
const activeDoc = $derived(
  doc && selected ? { ...doc, planet: selected } : doc,
);
const key = $derived(JSON.stringify(activeDoc));
</script>

{#if activeDoc}
  {#key key}
    <PlanetInspectorView
      doc={activeDoc}
      paneDoc={readOnlyCopy(activeDoc)}
      {label}
      {pane}
      onSelect={(planet) => {
        selected =
          planet.kind === "family" && doc?.planet.kind === "family"
            ? doc.planet
            : planet;
      }}
    />
  {/key}
{:else if !parsed.success}
  <div class="issues" role="alert">
    <p>Planet Inspector configuration is invalid.</p>
    <ul>
      {#each parsed.error.issues as issue}
        <li>{issue.path.join(".") || "document"}: {issue.message}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
.issues {
  padding: var(--spacing-lg);
  color: var(--color-text);
}
</style>
