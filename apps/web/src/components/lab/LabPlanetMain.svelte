<script lang="ts">
    import Canvas from "../Canvas.svelte";
    import { drawPlanet, SURVIVAL_CONFIG } from "@void-drift/core";
    import { planetParamsState } from "./planet-state.svelte";

    let { ...props }: { [key: string]: any } = $props();
    let stageWidth = $state(600);
    let stageHeight = $state(400);
    let elapsedTime = $state(0);

    // Animation Loop
    $effect(() => {
        let lastTime = performance.now();
        let handle: number;
        const loop = (t: number) => {
            const dt = (t - lastTime) / 1000;
            lastTime = t;
            if (planetParamsState.animating) {
                elapsedTime += dt * planetParamsState.timeScale;
            }
            handle = requestAnimationFrame(loop);
        };
        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    });

    function drawPlanetPreview(ctx: CanvasRenderingContext2D) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        // Draw central star placeholder (small circle)
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw all planets
        for (let i = 0; i < SURVIVAL_CONFIG.PLANETS.length; i++) {
            const cfg = SURVIVAL_CONFIG.PLANETS[i];
            const isSelected = i === planetParamsState.selectedPlanetIndex;

            // Calculate current orbital position
            const angle = cfg.orbitPhase + cfg.orbitSpeed * elapsedTime;

            // Scale orbit radius to fit canvas (use 40% of smaller dimension)
            const scale = (Math.min(stageWidth, stageHeight) * 0.4) / 700;
            const orbitRadius = cfg.orbitRadius * scale;

            const px = cx + Math.cos(angle) * orbitRadius;
            const py = cy + Math.sin(angle) * orbitRadius;

            // Draw orbit path
            if (planetParamsState.showOrbits) {
                ctx.strokeStyle = isSelected
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(255, 255, 255, 0.1)";
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw planet
            const planetRadius = cfg.radius * scale * 1.5; // Scale up for visibility
            drawPlanet(ctx, {
                x: px,
                y: py,
                radius: Math.max(planetRadius, 8), // Minimum 8px
                color: cfg.color,
            });

            // Draw selection ring
            if (isSelected) {
                ctx.strokeStyle = "var(--color-acid-lime, #d4ff00)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px, py, Math.max(planetRadius, 8) + 6, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw planet name label
            ctx.fillStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
            ctx.font = isSelected ? "bold 12px sans-serif" : "11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(cfg.name, px, py + Math.max(planetRadius, 8) + 18);
        }

        // Draw direction indicators
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("↺ Counter-clockwise: The Rock, The Gas", 10, 20);
        ctx.fillText("↻ Clockwise (Retrograde): The Moon", 10, 35);
    }
</script>

<div
    class="stage-content"
    bind:clientWidth={stageWidth}
    bind:clientHeight={stageHeight}
>
    <Canvas width={stageWidth} height={stageHeight} draw={drawPlanetPreview} />
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
