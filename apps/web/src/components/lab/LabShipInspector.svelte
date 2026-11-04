<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
	$props();

import { CONFIG } from "@void-drift/core";
import {
	CHASSIS,
	DEFAULT_SHIP_PROFILE_ID,
	SHIP_IDENTITY,
	SHIP_PROFILE_BY_ID,
	SHIP_PROFILES,
	type ShipProfileId,
} from "@void-drift/mode-a";
import Controls from "../Controls.svelte";
import LabStats from "./LabStats.svelte";
import { shipParams } from "./ship-state.svelte";

if (!shipParams.profileId) {
	shipParams.profileId = DEFAULT_SHIP_PROFILE_ID;
}

const selectedProfile = $derived(
	SHIP_PROFILE_BY_ID[shipParams.profileId as ShipProfileId],
);

const identity = $derived(SHIP_IDENTITY[selectedProfile.id]);
const chassis = $derived(CHASSIS[selectedProfile.id]);

const shipStatsGroups = $derived([
	{
		label: "Identity",
		stats: [
			{ key: "Id", value: selectedProfile.id },
			{ key: "Short name", value: identity.shortName },
			{ key: "Long name", value: identity.longName },
			{ key: "Trait", value: identity.trait },
		],
	},
	// Fitted flight reads the chassis and its parts; of the profile
	// multipliers only power drain still applies.
	{
		label: "Chassis",
		stats: [
			{ key: "Mass", value: chassis.mass },
			{ key: "Hull slots", value: chassis.hull },
			{ key: "Aft slots", value: chassis.aft },
			{
				key: "Turn response",
				value: chassis.turnResponse.toFixed(2),
				unit: "x",
			},
			{ key: "Radius", value: CONFIG.SHIP_RADIUS, unit: "px" },
		],
	},
	{
		label: "Power",
		stats: [
			{
				key: "Power drain",
				value: selectedProfile.powerDrainMultiplier.toFixed(2),
				unit: "x",
			},
		],
	},
	{
		label: "Camera",
		stats: [
			{
				key: "Default Zoom",
				value: selectedProfile.zoomDefault.toFixed(2),
				unit: "x",
			},
		],
	},
]);
</script>

<Controls title="Parameters">
	<div class="control-group">
		<label for="ship-profile">Chassis</label>
		<select id="ship-profile" bind:value={shipParams.profileId}>
			{#each SHIP_PROFILES as profile}
				<option value={profile.id}>
					{SHIP_IDENTITY[profile.id].shortName}
				</option>
			{/each}
		</select>
	</div>

	<div class="control-group">
		<label for="rotation">Rotation ({shipParams.rotation}°)</label>
		<input
			type="range"
			id="rotation"
			min="0"
			max="360"
			bind:value={shipParams.rotation}
		>
	</div>
</Controls>

<Controls title="Weapon fittings">
	<label
		><input type="checkbox" bind:checked={shipParams.weapons}>
		Show railgun and laser</label
	>
	<div class="control-group">
		<label for="turret-angle">Laser rotation ({shipParams.turretAngle}°)</label>
		<input
			id="turret-angle"
			type="range"
			min="-180"
			max="180"
			bind:value={shipParams.turretAngle}
			disabled={!shipParams.weapons}
		>
	</div>
	<p>
		Shared fitting geometry. Fly and fire these weapons in the
		<a href="/lab/builder">Hangar Lab</a>.
	</p>
</Controls>

<Controls title="Stats">
	<LabStats groups={shipStatsGroups} />
</Controls>

<style>
.control-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

label {
	color: var(--color-text-muted);
	font-size: 0.9rem;
}

select {
	width: 100%;
	min-height: 44px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	background: var(--color-glass);
	color: var(--color-text);
	padding: 0.5rem;
	font: inherit;
}

input[type="range"] {
	width: 100%;
	accent-color: var(--color-action);
	min-height: 44px;
}
</style>
