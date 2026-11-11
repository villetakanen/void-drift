<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
  $props();

import {
  type HighScore,
  loadHighScores,
  SHIP_IDENTITY,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";
import Logo from "./Logo.svelte";

let rows = $state<HighScore[]>([]);
let order = $state<"score" | "time">("score");
// The query returns the top 30 by score; time re-sorts those rows in the client.
const sorted = $derived(
  order === "score"
    ? rows
    : [...rows].sort((a, b) => b.seconds - a.seconds || b.score - a.score),
);
let loading = $state(true);
let error = $state("");
async function load() {
  loading = true;
  error = "";
  try {
    rows = await loadHighScores();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to load scores.";
  } finally {
    loading = false;
  }
}
onMount(() => {
  void load();
});
</script>
<main class="score-page">
  <section class="panel score-panel" aria-labelledby="scores-title">
    <header class="score-heading">
      <a href="/" class="brand" aria-label="Void Drift home"
        ><Logo size="sm" /></a
      >
      <p class="eyebrow">G CLASS / TOP 30</p>
      <h1 id="scores-title">Top scores</h1>
      <p>One best score per pilot, per craft.</p>
    </header>
    <div class="score-results" aria-busy={loading}>
      {#if loading}
        <p role="status">Loading shared scores…</p>
      {:else if error}
        <p role="status">{error}</p>
      {:else if rows.length === 0}
        <p>No scores yet. Set the first mark.</p>
      {:else}
        <div class="button-group-frame">
          <div class="button-group button-group--strip">
            <button
              type="button"
              class={order === "score" ? "btn btn-filled" : "btn btn-normal"}
              aria-pressed={order === "score"}
              onclick={() => (order = "score")}
            >
              By score
            </button><button
              type="button"
              class={order === "time" ? "btn btn-filled" : "btn btn-normal"}
              aria-pressed={order === "time"}
              onclick={() => (order = "time")}
            >
              By time
            </button>
          </div>
        </div>
        <table aria-label="Top 30 survival scores, sorted by {order}">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Pilot</th>
              <th scope="col">Ship</th>
              <th scope="col">Score</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {#each sorted as row, index}
              <tr>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.initials}</strong
                  ><small>{row.userId.slice(-4)}</small>
                </td>
                <td>{SHIP_IDENTITY[row.shipId].shortName}</td>
                <td class:sorted={order === "score"}>{row.score}</td>
                <td class:sorted={order === "time"}>{row.seconds}s</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <p class="score-note">
      Casual, client-reported scores. Lab trials are unranked.
    </p>
    <div class="button-group-frame">
      <div class="button-group button-group--strip">
        <button
          type="button"
          class="btn btn-normal"
          onclick={load}
          disabled={loading}
        >
          {error ? "Retry" : "Refresh"}
        </button><a class="btn btn-filled" href="/">Return to title screen</a>
      </div>
    </div>
    <p class="score-version">{version}</p>
  </section>
</main>

<style>
.score-page {
  box-sizing: border-box;
  height: 100dvh;
  overflow: auto;
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--color-elev-1);
  font: var(--font-size-body) / var(--line-height-ui) var(--font-family-ui);
}
.score-panel {
  width: min(100%, 48rem);
  box-sizing: border-box;
  margin-inline: auto;
  display: grid;
  gap: var(--spacing-lg);
}
.score-heading {
  display: grid;
  justify-items: center;
  gap: var(--spacing-md);
  text-align: center;
}
h1 {
  margin: 0;
  font:
    var(--font-weight-display) var(--font-size-display) /
    var(--line-height-display) var(--font-family-display);
  letter-spacing: var(--tracking-display);
}
p {
  margin: 0;
  color: var(--color-text-muted);
}
.score-results {
  min-width: 0;
  overflow-x: auto;
}
.score-results > p {
  padding-block: var(--spacing-lg);
  text-align: center;
}
.score-results .button-group-frame {
  margin-bottom: var(--spacing-md);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
th,
td {
  padding: var(--spacing-md) var(--spacing-sm);
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle);
}
th {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
}
th:nth-last-child(-n + 2),
td:nth-last-child(-n + 2) {
  text-align: right;
}
td:first-child {
  color: var(--color-text-muted);
}
td:nth-last-child(-n + 2) {
  white-space: nowrap;
}
td.sorted {
  font-weight: var(--font-weight-bold);
}
small {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.score-note,
.score-version {
  text-align: center;
  font-size: var(--font-size-caption);
}
@media (max-width: 580px) {
  .score-panel {
    padding: var(--spacing-md);
  }
  th,
  td {
    padding-inline: var(--spacing-xs);
  }
}
</style>
