<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import Controls from "../Controls.svelte";
    import { drawShip } from "@void-drift/core";

    let shipRotation = $state(0);

    function drawShipPreview(ctx: CanvasRenderingContext2D) {
        // Center the ship
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        drawShip(ctx, {
            x: centerX,
            y: centerY,
            rotation: shipRotation * (Math.PI / 180), // Convert deg to rad
            size: 2, // Scale up for visibility
            color: "#D4FF00", // Acid Lime
        });
    }
</script>

<div class="workbench">
    <div class="stage">
        <div class="stage-header">
            <h2>Preview: SHIP</h2>
        </div>
        <div class="stage-content">
            <Canvas width={600} height={400} draw={drawShipPreview} />
        </div>
    </div>

    <aside class="inspector">
        <Controls title="Parameters">
            <div class="control-group">
                <label for="rotation">Rotation ({shipRotation}°)</label>
                <input
                    type="range"
                    id="rotation"
                    min="0"
                    max="360"
                    bind:value={shipRotation}
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
</style>
