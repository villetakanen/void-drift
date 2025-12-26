<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import Controls from "../Controls.svelte";
    import { drawStar } from "@void-drift/core";

    // Star State
    let starParams = $state({
        radius: 40,
        color: "#FFA500", // Orange
        pulseSpeed: 1.0,
    });
    let starTime = $state(0);

    // Animation Loop for Star
    $effect(() => {
        let handle: number;
        const loop = (t: number) => {
            starTime = t;
            handle = requestAnimationFrame(loop);
        };
        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    });

    function drawStarPreview(ctx: CanvasRenderingContext2D) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        drawStar(ctx, {
            x: cx,
            y: cy,
            radius: starParams.radius,
            color: starParams.color,
            time: starTime,
            pulseSpeed: starParams.pulseSpeed,
        });
    }
</script>

<div class="workbench">
    <div class="stage">
        <div class="stage-header">
            <h2>Preview: STAR</h2>
        </div>
        <div class="stage-content">
            <Canvas width={600} height={400} draw={drawStarPreview} />
        </div>
    </div>

    <aside class="inspector">
        <Controls title="Parameters">
            <div class="control-group">
                <label for="star-radius">Radius ({starParams.radius}px)</label>
                <input
                    type="range"
                    id="star-radius"
                    min="10"
                    max="200"
                    bind:value={starParams.radius}
                />
            </div>
            <div class="control-group">
                <label for="star-speed"
                    >Pulse Speed ({starParams.pulseSpeed}x)</label
                >
                <input
                    type="range"
                    id="star-speed"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    bind:value={starParams.pulseSpeed}
                />
            </div>
            <div class="control-group">
                <label for="star-color">Color</label>
                <input
                    type="color"
                    id="star-color"
                    bind:value={starParams.color}
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
