<script lang="ts">
    import Controls from "../Controls.svelte";
    import LabStats from "./LabStats.svelte";
    import { SURVIVAL_CONFIG } from "@void-drift/core";
    import { planetParamsState, getPlanetConfig } from "./planet-state.svelte";

    let { ...props }: { [key: string]: any } = $props();
    const selectedPlanet = $derived(
        getPlanetConfig(planetParamsState.selectedPlanetIndex),
    );

    const planetStatsGroups = $derived.by(() => {
        const cfg = selectedPlanet;
        const orbitDirection =
            cfg.orbitSpeed < 0 ? "Retrograde ↻" : "Prograde ↺";
        const orbitPeriod = Math.abs((2 * Math.PI) / cfg.orbitSpeed);

        return [
            {
                label: "Identity",
                stats: [
                    { key: "ID", value: cfg.id },
                    { key: "Name", value: cfg.name },
                ],
            },
            {
                label: "Physical",
                stats: [
                    { key: "Radius", value: cfg.radius, unit: "px" },
                    { key: "Mass", value: cfg.mass },
                    { key: "Color", value: cfg.color },
                ],
            },
            {
                label: "Orbital",
                stats: [
                    { key: "Orbit Radius", value: cfg.orbitRadius, unit: "px" },
                    {
                        key: "Speed",
                        value: cfg.orbitSpeed.toFixed(3),
                        unit: "rad/s",
                    },
                    { key: "Direction", value: orbitDirection },
                    { key: "Period", value: orbitPeriod.toFixed(1), unit: "s" },
                    {
                        key: "Initial Phase",
                        value: ((cfg.orbitPhase * 180) / Math.PI).toFixed(0),
                        unit: "°",
                    },
                ],
            },
        ];
    });
</script>

<Controls title="Planet Selection">
    <div class="control-group">
        <label for="planet-select">Select Planet</label>
        <select
            id="planet-select"
            bind:value={planetParamsState.selectedPlanetIndex}
        >
            {#each SURVIVAL_CONFIG.PLANETS as planet, i}
                <option value={i}>{planet.name}</option>
            {/each}
        </select>
    </div>

    <div class="planet-color-preview">
        <span
            class="color-swatch"
            style="background-color: {selectedPlanet.color}"
        ></span>
        <span class="color-label">{selectedPlanet.color}</span>
    </div>
</Controls>

<Controls title="Animation">
    <div class="control-group">
        <label>
            <input type="checkbox" bind:checked={planetParamsState.animating} />
            Animate Orbits
        </label>
    </div>
    <div class="control-group">
        <label>
            <input
                type="checkbox"
                bind:checked={planetParamsState.showOrbits}
            />
            Show Orbit Paths
        </label>
    </div>
    <div class="control-group">
        <label for="time-scale"
            >Time Scale: {planetParamsState.timeScale.toFixed(1)}x</label
        >
        <input
            type="range"
            id="time-scale"
            min="0.1"
            max="5"
            step="0.1"
            bind:value={planetParamsState.timeScale}
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
</style>
