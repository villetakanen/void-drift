export interface DamageFlash {
    active: boolean;
    intensity: number; // 0.0 to 1.0
    duration: number; // seconds remaining
}

export function createDamageFlash(): DamageFlash {
    return { active: false, intensity: 0, duration: 0 };
}

export function triggerDamageFlash(
    flash: DamageFlash,
    intensity: number,
    duration: number
): void {
    flash.active = true;
    flash.intensity = intensity;
    flash.duration = duration;
}

export function updateDamageFlash(
    flash: DamageFlash,
    deltaTime: number
): void {
    if (!flash.active) return;

    flash.duration -= deltaTime;

    if (flash.duration <= 0) {
        flash.active = false;
        flash.intensity = 0;
    } else {
        // Exponential decay for smoother fade
        flash.intensity *= 0.95;
    }
}

export function renderDamageFlash(
    ctx: CanvasRenderingContext2D,
    flash: DamageFlash,
    width: number,
    height: number
): void {
    if (!flash.active || flash.intensity < 0.01) return;

    ctx.save();
    // Reset transform to identity to cover full screen regardless of camera
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255, 50, 50, ${flash.intensity * 0.3})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
