<script lang="ts">
    import Controls from "../Controls.svelte";
    import LabStats from "./LabStats.svelte";
    import {
        planetLabState,
        sliderToOrbit,
        sliderToSize,
        getPlanetColor,
        getPlanetTypeOptions,
    } from "./planet-state.svelte";
    import { getPlanetInfluenceRadius, type PlanetTypeId } from "@void-drift/core";

    let { ...props }: { [key: string]: any } = $props();

    const typeOptions = getPlanetTypeOptions();

    // Derived values for stats display
    const orbitRadius = $derived(sliderToOrbit(planetLabState.orbitSlider));
    const planetRadius = $derived(sliderToSize(planetLabState.sizeSlider));
    const planetColor = $derived(getPlanetColor());

    // Calculate derived physics values
    const mass = $derived(Math.round(planetRadius * 10)); // Mass scales with size
    const gravityInfluence = $derived(
        Math.round(getPlanetInfluenceRadius({ radius: planetRadius, mass })),
    );

    const planetStatsGroups = $derived([
        {
            label: "Physical",
            stats: [
                { key: "Radius", value: planetRadius.toFixed(0), unit: "px" },
                { key: "Mass", value: mass },
                { key: "Color", value: planetColor },
                { key: "Ring", value: planetLabState.hasRing ? "Yes" : "No" },
            ],
        },
        {
            label: "Orbital",
            stats: [
                {
                    key: "Orbit Radius",
                    value: orbitRadius.toFixed(0),
                    unit: "px",
                },
                { key: "Gravity Range", value: gravityInfluence, unit: "px" },
            ],
        },
    ]);
</script>

<Controls title="Planet Type">
    <div class="control-group">
        <label for="planet-type">Type</label>
        <select id="planet-type" bind:value={planetLabState.planetType}>
            {#each typeOptions as type}
                <option value={type.id}>{type.name}</option>
            {/each}
        </select>
    </div>

    <div class="planet-color-preview">
        <span class="color-swatch" style="background-color: {planetColor}"
        ></span>
        <span class="color-label">{planetColor}</span>
    </div>

    <div class="control-group">
        <label>
            <input type="checkbox" bind:checked={planetLabState.hasRing} />
            Ring System
        </label>
    </div>
</Controls>

<Controls title="Orbit">
    <div class="control-group">
        <label for="orbit-slider"
            >Orbit Radius: {orbitRadius.toFixed(0)}px</label
        >
        <input
            type="range"
            id="orbit-slider"
            min="1"
            max="100"
            step="1"
            bind:value={planetLabState.orbitSlider}
        />
        <div class="range-labels">
            <span>200px</span>
            <span>1000px</span>
        </div>
    </div>
</Controls>

<Controls title="Size">
    <div class="control-group">
        <label for="size-slider"
            >Planet Radius: {planetRadius.toFixed(0)}px</label
        >
        <input
            type="range"
            id="size-slider"
            min="1"
            max="100"
            step="1"
            bind:value={planetLabState.sizeSlider}
        />
        <div class="range-labels">
            <span>10px</span>
            <span>100px</span>
        </div>
    </div>
</Controls>

<Controls title="Animation">
    <div class="control-group">
        <label>
            <input type="checkbox" bind:checked={planetLabState.animating} />
            Animate Orbit
        </label>
    </div>
    <div class="control-group">
        <label>
            <input type="checkbox" bind:checked={planetLabState.showOrbit} />
            Show Orbit Path
        </label>
    </div>
    <div class="control-group">
        <label>
            <input
                type="checkbox"
                bind:checked={planetLabState.showGravityWell}
            />
            Show Gravity Well
        </label>
    </div>
    <div class="control-group">
        <label for="time-scale"
            >Time Scale: {planetLabState.timeScale.toFixed(1)}x</label
        >
        <input
            type="range"
            id="time-scale"
            min="0.1"
            max="5"
            step="0.1"
            bind:value={planetLabState.timeScale}
        />
    </div>
</Controls>

<Controls title="Stats">
    <LabStats groups={planetStatsGroups} />
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    input[type="range"] {
        width: 100%;
        accent-color: var(--color-acid-lime);
    }

    input[type="checkbox"] {
        accent-color: var(--color-acid-lime);
    }

    select {
        width: 100%;
        padding: 0.5rem;
        background: var(--color-void);
        color: var(--color-text);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: inherit;
    }

    .planet-color-preview {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .color-label {
        font-family: monospace;
        color: var(--color-text-dim);
    }

    .range-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--color-text-dim);
        opacity: 0.6;
    }
</style>
