<script lang="ts">
    let { width, height, draw } = $props<{
        width: number;
        height: number;
        draw: (ctx: CanvasRenderingContext2D) => void;
    }>();

    let canvas: HTMLCanvasElement;

    $effect(() => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Reset transform and clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Invoke draw callback
        draw(ctx);
    });
</script>

<canvas
    bind:this={canvas}
    {width}
    {height}
    style:width="{width}px"
    style:height="{height}px"
></canvas>

<style>
    canvas {
        background: #000;
        border: 1px solid #333;
        image-rendering: pixelated;
    }
</style>
