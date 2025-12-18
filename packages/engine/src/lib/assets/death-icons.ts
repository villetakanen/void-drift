// death-icons.ts
import type { DeathCause } from '../schemas/game-state';

/**
 * Draw death cause icon (for leaderboard/Game Over screen)
 */
export function drawDeathIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    cause: DeathCause
): void {
    ctx.save();
    ctx.translate(x, y);

    switch (cause) {
        case 'STAR':
            // Draw star/sun icon (8-pointed star)
            drawStarIcon(ctx, size);
            break;
        case 'HULL':
            // Draw cracked shield icon
            drawHullIcon(ctx, size);
            break;
        case 'POWER':
            // Draw empty droplet/tank icon
            drawPowerIcon(ctx, size);
            break;
    }

    ctx.restore();
}

function drawStarIcon(ctx: CanvasRenderingContext2D, size: number): void {
    const points = 8;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.5;

    ctx.fillStyle = '#ffaa00'; // Warning color
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / points) * i;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
    ctx.fill();
}

function drawHullIcon(ctx: CanvasRenderingContext2D, size: number): void {
    const halfSize = size / 2;

    // Shield outline
    ctx.strokeStyle = '#ff0064'; // Danger color
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -halfSize);
    ctx.lineTo(halfSize, 0);
    ctx.lineTo(0, halfSize);
    ctx.lineTo(-halfSize, 0);
    ctx.closePath();
    ctx.stroke();

    // Crack through shield
    ctx.strokeStyle = '#ff0064';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfSize * 0.7, -halfSize * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(halfSize * 0.7, halfSize * 0.3);
    ctx.stroke();
}

function drawPowerIcon(ctx: CanvasRenderingContext2D, size: number): void {
    const halfSize = size / 2;

    // Droplet shape (now representing power/energy)
    ctx.fillStyle = '#D4FF00'; // Acid Lime (Power Color)
    ctx.beginPath();
    ctx.arc(0, halfSize * 0.2, halfSize * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Top point of droplet
    ctx.beginPath();
    ctx.moveTo(0, -halfSize);
    ctx.lineTo(-halfSize * 0.3, halfSize * 0.2);
    ctx.lineTo(halfSize * 0.3, halfSize * 0.2);
    ctx.closePath();
    ctx.fill();

    // Empty indicator (X through droplet)
    ctx.strokeStyle = '#ff0064';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfSize * 0.5, -halfSize * 0.5);
    ctx.lineTo(halfSize * 0.5, halfSize * 0.5);
    ctx.moveTo(halfSize * 0.5, -halfSize * 0.5);
    ctx.lineTo(-halfSize * 0.5, halfSize * 0.5);
    ctx.stroke();
}
