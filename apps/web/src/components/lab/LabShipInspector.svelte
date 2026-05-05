<script lang="ts">
    import Controls from "../Controls.svelte";
    import LabStats from "./LabStats.svelte";
    import { CONFIG } from "@void-drift/core";
    import {
        DEFAULT_SHIP_PROFILE_ID,
        SHIP_PROFILE_BY_ID,
        SHIP_PROFILES,
        type ShipProfileId,
    } from "@void-drift/mode-a";
    import { shipParams } from "./ship-state.svelte";

    let { ...props }: { [key: string]: any } = $props();

    if (!shipParams.profileId) {
        shipParams.profileId = DEFAULT_SHIP_PROFILE_ID;
    }

    const selectedProfile = $derived(
        SHIP_PROFILE_BY_ID[shipParams.profileId as ShipProfileId],
    );

    const shipStatsGroups = $derived([
        {
            label: "Physical",
            stats: [
                { key: "Radius", value: CONFIG.SHIP_RADIUS, unit: "px" },
                { key: "Max Speed", value: CONFIG.MAX_SPEED, unit: "px/s" },
                {
                    key: "Hull Multiplier",
                    value: selectedProfile.hullMultiplier.toFixed(2),
                },
            ],
        },
        {
            label: "Movement",
            stats: [
                {
                    key: "Thrust",
                    value: selectedProfile.thrustMultiplier.toFixed(2),
                    unit: "x",
                },
                {
                    key: "Turn",
                    value: selectedProfile.turnMultiplier.toFixed(2),
                    unit: "x",
                },
                {
                    key: "Power Drain",
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
                <option value={profile.id}>{profile.name}</option>
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
        />
    </div>
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
        color: var(--color-text-dim);
        font-size: 0.9rem;
    }

    select {
        width: 100%;
        min-height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        background: rgba(5, 5, 16, 0.7);
        color: var(--color-text);
        padding: 0.5rem;
        font: inherit;
    }

    input[type="range"] {
        width: 100%;
        accent-color: var(--color-acid-lime);
        min-height: 44px;
    }
</style>
