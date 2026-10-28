<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
	$props();

import { type HighScore, loadHighScores } from "@void-drift/mode-a";
import { onMount } from "svelte";
import { version } from "../../package.json";

let rows = $state<HighScore[]>([]);
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
	<a href="/" class="brand">VOID·DRIFT</a>
	<p class="eyebrow">{version} / G CLASS</p>
	<h1>The longest orbit.</h1>
	<p>One personal best per ship. A shared challenge for every pilot.</p>
	<p class="control-copy">
		Casual, client-reported scores. Lab trials are unranked.
	</p>
	{#if loading}
		<p role="status">Loading shared scores…</p>
	{:else if error}
		<p role="status">{error}</p>
		<button type="button" class="btn btn-ghost" onclick={load}>Retry</button>
	{:else if rows.length === 0}
		<p>No scores yet. Set the first mark.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Rank</th>
					<th>Pilot</th>
					<th>Ship</th>
					<th>Survival</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row, index}
					<tr>
						<td>{index + 1}</td>
						<td>{row.initials}<small> · {row.userId.slice(-4)}</small></td>
						<td>{row.shipId}</td>
						<td>{row.seconds}s</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<div class="inspector-actions">
		<a class="btn btn-filled" href="/">Fly again</a
		><button
			type="button"
			class="btn btn-ghost"
			onclick={load}
			disabled={loading}
		>
			Refresh
		</button>
	</div>
</main>
