<script lang="ts">
    import Controls from "../Controls.svelte";
    import { resourcesParams } from "./resources-state.svelte";

    let { ...props }: { [key: string]: any } = $props();
</script>

<Controls title="Simulation">
    <div class="control-group">
        <label for="hull">Hull Integrity ({resourcesParams.hullValue}%)</label>
        <input
            type="range"
            id="hull"
            min="0"
            max="100"
            bind:value={resourcesParams.hullValue}
        />
    </div>
    <div class="control-group">
        <label for="fuel">Fuel Level ({resourcesParams.fuelValue}%)</label>
        <input
            type="range"
            id="fuel"
            min="0"
            max="100"
            bind:value={resourcesParams.fuelValue}
        />
    </div>
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
