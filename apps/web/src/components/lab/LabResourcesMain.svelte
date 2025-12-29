<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import { drawResourceBar, drawDeathIcon } from "@void-drift/core";
    import { resourcesParams } from "./resources-state.svelte";

    let { ...props }: { [key: string]: any } = $props();

    const COLORS = {
        hull: "#00c8ff",
        fuel: "#D4FF00",
        warning: "#FFAA00",
        danger: "#FF3333",
    };

    function drawHullBar(ctx: CanvasRenderingContext2D) {
        drawResourceBar(ctx, 0, 0, 200, 24, {
            value: resourcesParams.hullValue,
            maxValue: 100,
            label: "HULL",
            colorNormal: COLORS.hull,
            colorWarning: COLORS.warning,
            colorDanger: COLORS.danger,
        });
    }

    function drawFuelBar(ctx: CanvasRenderingContext2D) {
        drawResourceBar(ctx, 0, 0, 200, 24, {
            value: resourcesParams.fuelValue,
            maxValue: 100,
            label: "FUEL",
            colorNormal: COLORS.fuel,
            colorWarning: COLORS.warning,
            colorDanger: COLORS.danger,
        });
    }

    function drawIcons(ctx: CanvasRenderingContext2D) {
        const spacing = 50;
        const startX = 30;
        drawDeathIcon(ctx, startX, 40, 32, "STAR");
        drawDeathIcon(ctx, startX + spacing, 40, 32, "HULL");
        drawDeathIcon(ctx, startX + spacing * 2, 40, 32, "POWER");

        ctx.fillStyle = "#888";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("STAR", startX, 70);
        ctx.fillText("HULL", startX + spacing, 70);
        ctx.fillText("POWER", startX + spacing * 2, 70);
    }
</script>

<div class="stage-content">
    <div class="hud-preview">
        <section>
            <h3>Resource Bars</h3>
            <div class="row">
                <Canvas width={200} height={24} draw={drawHullBar} />
                <div class="meta">{resourcesParams.hullValue}%</div>
            </div>
            <div class="row">
                <Canvas width={200} height={24} draw={drawFuelBar} />
                <div class="meta">{resourcesParams.fuelValue}%</div>
            </div>
        </section>

        <section>
            <h3>Death Icons</h3>
            <Canvas width={200} height={80} draw={drawIcons} />
        </section>

        <section>
            <h3>Timer Display</h3>
            <div class="timer-examples">
                <span class="timer">0.0s</span>
                <span class="timer">42.3s</span>
                <span class="timer">142.3s</span>
            </div>
        </section>
    </div>
</div>

<style>
    .stage-content {
        padding: 2rem;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        flex: 1;
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }

    .hud-preview {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        backdrop-filter: blur(4px);
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 0.8rem;
        color: var(--color-text-dim);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .row {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
    }

    .meta {
        font-family: monospace;
        color: var(--color-text-dim);
        font-size: 0.9rem;
    }

    .timer-examples {
        display: flex;
        gap: 1rem;
    }

    .timer {
        font-size: 1rem;
        color: var(--color-text);
        font-family: monospace;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--color-neon-blue);
        border-radius: 2px;
    }
</style>
