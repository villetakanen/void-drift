<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import { drawStar, SUN_CONFIG } from "@void-drift/core";
    import { starParamsState } from "./star-state.svelte";

    let { ...props }: { [key: string]: any } = $props();

    let stageWidth = $state(600);
    let stageHeight = $state(400);
    let starTime = $state(0);

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

        const { interpolator } = starParamsState;
        if (interpolator <= 0) return presets[0];
        if (interpolator >= 6) return presets[6];

        const idx = Math.floor(interpolator);
        const nextIdx = Math.min(idx + 1, presets.length - 1);
        const t = interpolator - idx;

        const p1 = presets[idx];
        const p2 = presets[nextIdx];

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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

    // Animation Loop
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
            powerZoneRadius: 240,
        });
    }
</script>

<div
    class="stage-content"
    bind:clientWidth={stageWidth}
    bind:clientHeight={stageHeight}
>
    <Canvas width={stageWidth} height={stageHeight} draw={drawStarPreview} />
</div>

<style>
    .stage-content {
        flex: 1;
        display: flex;
        overflow: hidden;
        position: relative;
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
</style>
