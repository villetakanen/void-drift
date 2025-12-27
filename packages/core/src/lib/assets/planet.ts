export interface DrawPlanetOptions {
    x: number;
    y: number;
    radius: number;
    color: string;
}

export function drawPlanet(ctx: CanvasRenderingContext2D, options: DrawPlanetOptions) {
    const { x, y, radius, color } = options;

    ctx.save();
    ctx.translate(x, y);

    // Planet Body
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Subtle lighting/shading
    const gradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, radius * 0.2,
        0, 0, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Atmosphere/Glow effect (Subtle)
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.stroke();

    ctx.restore();
}
