export interface DrawShipOptions {
    x: number;
    y: number;
    rotation: number;
    color?: string;
    size?: number;
    variant?: "scout" | "balanced" | "tank";
}

export function drawShip(ctx: CanvasRenderingContext2D, options: DrawShipOptions) {
    const { x, y, rotation, color = "#00ffcc", size = 1, variant = "balanced" } = options;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(size, size);

    // Ship Shape (Paper Airplane)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0); // Nose
    ctx.lineTo(-8, 8); // Back Right
    ctx.lineTo(-4, 0); // Engine Indent
    ctx.lineTo(-8, -8); // Back Left
    ctx.closePath();
    ctx.stroke();

    if (variant === "scout") {
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-12, 0);
        ctx.stroke();
    }

    if (variant === "tank") {
        ctx.beginPath();
        ctx.moveTo(-7, 5.5);
        ctx.lineTo(-11, 3);
        ctx.moveTo(-7, -5.5);
        ctx.lineTo(-11, -3);
        ctx.stroke();
    }

    ctx.restore();
}
