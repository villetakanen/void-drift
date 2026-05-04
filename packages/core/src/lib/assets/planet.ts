export interface DrawPlanetOptions {
    x: number;
    y: number;
    radius: number;
    color: string;
    hasRing?: boolean;
}

export function drawPlanet(ctx: CanvasRenderingContext2D, options: DrawPlanetOptions) {
    const { x, y, radius, color, hasRing } = options;

    ctx.save();
    ctx.translate(x, y);

    // Ring System (PBI-039)
    if (hasRing) {
        const ringInner = radius * 1.4;
        const ringOuter = radius * 2.1;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = (ringOuter - ringInner) * 0.55;
        ctx.beginPath();
        // Tilted ellipse for the ring
        ctx.ellipse(0, 0, (ringInner + ringOuter) / 2, (ringInner + ringOuter) / 4, Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Planet Body (flat vector fill)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Crisp outline to match flat HUD/game shapes
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = Math.max(1, radius * 0.06);
    ctx.globalAlpha = 1;
    ctx.stroke();

    ctx.restore();
}
