<script lang="ts">
    import Controls from "../Controls.svelte";
    import LabStats from "./LabStats.svelte";
    import { CONFIG } from "@void-drift/core";
    import { shipParams } from "./ship-state.svelte";

    let { ...props }: { [key: string]: any } = $props();

    const shipStatsGroups = [
        {
            label: "Physical",
            stats: [
                { key: "Radius", value: CONFIG.SHIP_RADIUS, unit: "px" },
                { key: "Max Speed", value: CONFIG.MAX_SPEED, unit: "px/s" },
                { key: "Mass", value: 1.0 },
            ],
        },
        {
            label: "Movement",
            stats: [
                { key: "Thrust", value: CONFIG.THRUST_FORCE, unit: "px/s²" },
                {
                    key: "Rotation",
                    value: CONFIG.ROTATION_SPEED.toFixed(2),
                    unit: "rad/s",
                },
                { key: "Drag", value: CONFIG.SHIP_DRAG, unit: "/s" },
            ],
        },
    ];
</script>

<Controls title="Parameters">
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

    input[type="range"] {
        width: 100%;
        accent-color: var(--color-acid-lime);
    }
</style>
