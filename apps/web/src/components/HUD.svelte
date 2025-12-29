<script lang="ts">
    import type { GameState } from "@void-drift/mode-a";

    let { gameState }: { gameState: GameState } = $props();

    const hullPercent = $derived(gameState.resources.hull);
    const powerPercent = $derived(gameState.resources.power);

    const hullColor = $derived(
        hullPercent < 25
            ? "var(--color-resource-danger)"
            : hullPercent < 50
              ? "var(--color-resource-warning)"
              : "var(--color-resource-hull)",
    );

    const powerColor = $derived(
        powerPercent < 25
            ? "var(--color-resource-danger)"
            : powerPercent < 50
              ? "var(--color-resource-warning)"
              : "var(--color-resource-power)",
    );
    const timeDisplay = $derived(
        gameState.status === "PLAYING"
            ? `${gameState.elapsedTime.toFixed(1)}s`
            : gameState.elapsedTime > 0
              ? `${gameState.elapsedTime.toFixed(1)}s`
              : "0.0s",
    );
    const isPlaying = $derived(gameState.status === "PLAYING");

    const sunLabel = $derived(
        gameState.sunType === "O"
            ? "CLASS O (BLUE)"
            : gameState.sunType === "B"
              ? "CLASS B (BLUE-WHITE)"
              : gameState.sunType === "A"
                ? "CLASS A (WHITE)"
                : gameState.sunType === "F"
                  ? "CLASS F (YELLOW-WHITE)"
                  : gameState.sunType === "G"
                    ? "CLASS G (YELLOW)"
                    : gameState.sunType === "K"
                      ? "CLASS K (ORANGE)"
                      : gameState.sunType === "M"
                        ? "CLASS M (RED)"
                        : "",
    );
</script>

<div class="hud">
    {#if isPlaying || gameState.elapsedTime > 0}
        <div class="timer">
            <span class="sun-indicator">{sunLabel}</span>
            <span class="time">{timeDisplay}</span>
        </div>
    {/if}

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
            style:width="{powerPercent}%"
            style:background-color={powerColor}
        ></div>
        <span class="bar-label">POWER {powerPercent.toFixed(0)}%</span>
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

    .timer {
        position: fixed;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--spacing-xs);
        z-index: 100;
        pointer-events: none;
    }

    .sun-indicator {
        font-size: 0.75rem;
        color: var(--color-text-dim);
        letter-spacing: 2px;
        text-transform: uppercase;
    }

    .time {
        font-size: 1.25rem;
        color: var(--color-text);
        font-variant-numeric: tabular-nums;
        font-family: monospace;
        text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
    }
</style>
