<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import Controls from "../Controls.svelte";
    import { drawStar, SUN_CONFIG, type SunType } from "@void-drift/core";

    // Star State
    let selectedType: SunType = $state("G");
    let interpolator = $state(4.0); // 0=O, 1=B, 2=A, 3=F, 4=G, 5=K, 6=M

    const starParams = $derived.by(() => {
        const presets = [
            SUN_CONFIG.O,
            SUN_CONFIG.B,
            SUN_CONFIG.A,
            SUN_CONFIG.F,
            SUN_CONFIG.G,
            SUN_CONFIG.K,
            SUN_CONFIG.M,
        ];

        if (interpolator <= 0) return presets[0];
        if (interpolator >= 6) return presets[6];

        const idx = Math.floor(interpolator);
        const nextIdx = Math.min(idx + 1, presets.length - 1);
        const t = interpolator - idx;

        const p1 = presets[idx];
        const p2 = presets[nextIdx];

        // Linear interpolation for numeric values
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        // Color interpolation (simplified: pick closest)
        const closestIdx = Math.round(interpolator);

        return {
            type: presets[closestIdx].type,
            size: Math.round(lerp(p1.size, p2.size, t)),
            radius: lerp(p1.radius, p2.radius, t),
            mass: lerp(p1.mass, p2.mass, t),
            powerMultiplier: lerp(p1.powerMultiplier, p2.powerMultiplier, t),
            burnMultiplier: lerp(p1.burnMultiplier, p2.burnMultiplier, t),
            pulseSpeed: lerp(p1.pulseSpeed, p2.pulseSpeed, t),
            color: presets[closestIdx].color,
            glowColor: presets[closestIdx].glowColor,
        };
    });

    let starTime = $state(0);
    let stageWidth = $state(600);
    let stageHeight = $state(400);

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
            glowColor: starParams.glowColor,
            time: starTime,
            pulseSpeed: starParams.pulseSpeed,
            powerZoneRadius: 240, // Show max zone
        });
    }
</script>

<div class="workbench">
    <div class="stage">
        <div class="stage-header">
            <h2>Preview: STAR</h2>
        </div>
        <div
            class="stage-content"
            bind:clientWidth={stageWidth}
            bind:clientHeight={stageHeight}
        >
            <Canvas
                width={stageWidth}
                height={stageHeight}
                draw={drawStarPreview}
            />
        </div>
    </div>

    <aside class="inspector">
        <Controls title="Presets">
            <div class="control-group">
                <label for="sun-type">Sun Type</label>
                <select
                    id="sun-type"
                    bind:value={selectedType}
                    onchange={() => {
                        const types: SunType[] = [
                            "O",
                            "B",
                            "A",
                            "F",
                            "G",
                            "K",
                            "M",
                        ];
                        interpolator = types.indexOf(selectedType);
                    }}
                >
                    <option value="O">Class O (Blue)</option>
                    <option value="B">Class B (Blue-White)</option>
                    <option value="A">Class A (White)</option>
                    <option value="F">Class F (Yellow-White)</option>
                    <option value="G">Class G (Yellow)</option>
                    <option value="K">Class K (Orange)</option>
                    <option value="M">Class M (Red)</option>
                </select>
            </div>
            <div class="control-group">
                <label for="sun-lerp">Smooth Tune (Class O → M)</label>
                <input
                    type="range"
                    id="sun-lerp"
                    min="0"
                    max="6"
                    step="0.01"
                    bind:value={interpolator}
                    oninput={() => {
                        const types: SunType[] = [
                            "O",
                            "B",
                            "A",
                            "F",
                            "G",
                            "K",
                            "M",
                        ];
                        selectedType = types[Math.round(interpolator)];
                    }}
                />
            </div>
        </Controls>

        <Controls title="Parameters (Read-only)">
            <div class="control-group">
                <label>Size Rating (1-100): {starParams.size}</label>
            </div>
            <div class="control-group">
                <label>Radius: {starParams.radius.toFixed(1)}px</label>
            </div>
            <div class="control-group">
                <label>Mass: {starParams.mass}</label>
            </div>
            <div class="control-group">
                <label>Power Multiplier: {starParams.powerMultiplier}x</label>
            </div>
            <div class="control-group">
                <label>Burn Multiplier: {starParams.burnMultiplier}x</label>
            </div>
            <div class="control-group">
                <label>Pulse Speed: {starParams.pulseSpeed}x</label>
            </div>
            <div class="control-group">
                <label
                    >Color: <span
                        class="swatch"
                        style:background={starParams.color}
                    ></span>
                    {starParams.color}</label
                >
            </div>
            <div class="control-group">
                <label
                    >Glow: <span
                        class="swatch"
                        style:background={starParams.glowColor}
                    ></span>
                    {starParams.glowColor}</label
                >
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

    select {
        width: 100%;
        padding: 0.5rem;
        background: var(--color-void);
        color: var(--color-text);
        border: 1px solid var(--color-text-dim);
        font-family: inherit;
    }

    .swatch {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1px solid var(--color-text-dim);
        vertical-align: middle;
    }
</style>
