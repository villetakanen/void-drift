<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import Controls from "../Controls.svelte";
    import { drawResourceBar, drawDeathIcon } from "@void-drift/engine";

    // State
    let hullValue = $state(100);
    let fuelValue = $state(100);

    // Constants (reading from CSS would be better but for canvas we need hex/rgb)
    // We can get them from computed styles if we really want, but for now hardcode to match tokens
    const COLORS = {
        hull: "#00c8ff",
        fuel: "#D4FF00",
        warning: "#FFAA00",
        danger: "#FF3333",
    };

    function drawHullBar(ctx: CanvasRenderingContext2D) {
        drawResourceBar(ctx, 0, 0, 200, 24, {
            value: hullValue,
            maxValue: 100,
            label: "HULL",
            colorNormal: COLORS.hull,
            colorWarning: COLORS.warning,
            colorDanger: COLORS.danger,
        });
    }

    function drawFuelBar(ctx: CanvasRenderingContext2D) {
        drawResourceBar(ctx, 0, 0, 200, 24, {
            value: fuelValue,
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
        drawDeathIcon(ctx, startX + spacing * 2, 40, 32, "FUEL");

        // Labels
        ctx.fillStyle = "#888";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("STAR", startX, 70);
        ctx.fillText("HULL", startX + spacing, 70);
        ctx.fillText("FUEL", startX + spacing * 2, 70);
    }
</script>

<div class="workbench">
    <div class="stage">
        <div class="stage-header">
            <h2>Preview: RESOURCES</h2>
        </div>
        <div class="stage-content">
            <div class="hud-preview">
                <!-- Resource Bars -->
                <section>
                    <h3>Resource Bars</h3>
                    <div class="row">
                        <Canvas width={200} height={24} draw={drawHullBar} />
                        <div class="meta">{hullValue}%</div>
                    </div>
                    <div class="row">
                        <Canvas width={200} height={24} draw={drawFuelBar} />
                        <div class="meta">{fuelValue}%</div>
                    </div>
                </section>

                <!-- Death Icons -->
                <section>
                    <h3>Death Icons</h3>
                    <Canvas width={200} height={80} draw={drawIcons} />
                </section>

                <!-- Timer -->
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
    </div>

    <aside class="inspector">
        <Controls title="Simulation">
            <div class="control-group">
                <label for="hull">Hull Integrity ({hullValue}%)</label>
                <input
                    type="range"
                    id="hull"
                    min="0"
                    max="100"
                    bind:value={hullValue}
                />
            </div>
            <div class="control-group">
                <label for="fuel">Fuel Level ({fuelValue}%)</label>
                <input
                    type="range"
                    id="fuel"
                    min="0"
                    max="100"
                    bind:value={fuelValue}
                />
            </div>
        </Controls>
    </aside>
</div>

<style>
    .workbench {
        display: grid;
        grid-template-columns: 1fr 300px;
        height: 100%;
        overflow: hidden;
    }

    .stage {
        display: flex;
        flex-direction: column;
        background: var(--color-void);
    }

    .stage-header {
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--color-text-dim);
    }

    .stage-header h2 {
        margin: 0;
        font-size: 1rem;
        color: var(--color-text-dim);
    }

    .stage-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        /* Grid background effect */
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
        border: 1px solid var(--color-text-dim);
        border-radius: 4px;
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: var(--color-text-dim);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0.5rem;
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
        width: 40px;
    }

    .inspector {
        border-left: 1px solid var(--color-text-dim);
        background: var(--color-void-light);
    }

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

    /* Timer Styles from PBI */
    .timer-examples {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        margin-top: var(--spacing-sm);
    }

    .timer {
        font-size: 1.25rem;
        color: var(--color-text);
        font-variant-numeric: tabular-nums;
        font-family: monospace;
        text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--color-neon-blue);
        border-radius: 4px;
    }
</style>
