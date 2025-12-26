export interface DrawStarOptions {
    x: number;
    y: number;
    radius: number;
    color: string;
    time: number; // millisecond timestamp to drive animation
    pulseSpeed?: number; // Optional scaling factor for speed (default 1)
    powerZoneRadius?: number; // Optional radius for power regen zone visualization
}

export function drawStar(ctx: CanvasRenderingContext2D, options: DrawStarOptions): void {
    const { x, y, radius, color, time, pulseSpeed = 1.0, powerZoneRadius } = options;

    // Draw Power Regen Zone (Behind star)
    if (powerZoneRadius) {
        ctx.beginPath();
        ctx.arc(x, y, powerZoneRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 200, 255, 0.2)"; // Power Color #00c8ff at 20% opacity
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line to differentiate from other visuals
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }

    // Draw Core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pulse Rings
    // We want the rings to expand moving away from the surface
    const maxDist = radius * 3.5; // Rings travel visual distance
    const speed = 0.05 * pulseSpeed; // Base speed tuned vs ms
    const numRings = 3;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let i = 0; i < numRings; i++) {
        // Calculate phase-shifted radius
        // We use (time * speed) to get total distance traveled
        // We add an offset based on ring index
        // We modulo by maxDist to loop

        const loopLength = maxDist - radius; // Distance from surface to fade out
        if (loopLength <= 0) continue;

        const totalDist = time * speed;
        const phaseOffset = (i / numRings) * loopLength;
        const currentPos = (totalDist + phaseOffset) % loopLength;

        const ringRadius = radius + currentPos;

        // Calculate opacity: 1 near surface, 0 at maxDist
        const alpha = 1 - (currentPos / loopLength);

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.6)); // Max opacity 0.6
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}
