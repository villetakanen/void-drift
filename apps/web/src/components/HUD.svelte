<script lang="ts">
    import type { GameState } from "@void-drift/engine";

    let { state }: { state: GameState } = $props();

    const hullPercent = $derived(state.resources.hull);
    const fuelPercent = $derived(state.resources.fuel);

    const hullColor = $derived(
        hullPercent < 25
            ? "var(--color-resource-danger)"
            : hullPercent < 50
              ? "var(--color-resource-warning)"
              : "var(--color-resource-hull)",
    );

    const fuelColor = $derived(
        fuelPercent < 25
            ? "var(--color-resource-danger)"
            : fuelPercent < 50
              ? "var(--color-resource-warning)"
              : "var(--color-resource-fuel)",
    );
</script>

<div class="hud">
    <div class="resource-bar">
        <div
            class="bar-fill"
            style:width="{hullPercent}%"
            style:background-color={hullColor}
        ></div>
        <span class="bar-label">HULL {hullPercent.toFixed(0)}%</span>
    </div>

    <div class="resource-bar">
        <div
            class="bar-fill"
            style:width="{fuelPercent}%"
            style:background-color={fuelColor}
        ></div>
        <span class="bar-label">FUEL {fuelPercent.toFixed(0)}%</span>
    </div>
</div>

<style>
    .hud {
        position: absolute;
        top: auto;
        bottom: var(--spacing-sm);
        left: var(--spacing-sm);
        pointer-events: none;
        z-index: 100;
        display: flex;
        flex-direction: column-reverse;
        gap: var(--spacing-xs);
    }

    .resource-bar {
        position: relative;
        width: 200px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--color-resource-hull);
        overflow: hidden;
    }

    .bar-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        transition:
            width 0.1s linear,
            background-color 0.3s ease;
    }

    .bar-label {
        position: relative;
        display: block;
        text-align: center;
        line-height: 24px;
        font-size: 0.875rem;
        color: var(--color-text);
        text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
        font-weight: bold;
    }
</style>
