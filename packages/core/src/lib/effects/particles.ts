export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number; // 0.0 to 1.0
    maxLife: number; // seconds
    hue: number; // 0 to 360
    size: number; // radius in pixels
}

export function createParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    hue: number,
    life: number,
    size = 2
): Particle {
    return { x, y, vx, vy, life: 1.0, maxLife: life, hue, size };
}

// Eased alpha for smoother fades
export function getParticleAlpha(life: number): number {
    // Quadratic ease-out: starts fast, ends slow
    return life * (2 - life);
}

// Color shift based on velocity
export function getThrustHue(speed: number, powerPercent: number): number {
    // Blue (200) at low speed/power → Cyan (180) → Green (120) at high
    const baseHue = 200;
    const speedFactor = Math.min(speed / 500, 1.0); // 500 = max speed
    const powerFactor = powerPercent / 100;

    return baseHue - (speedFactor * 80) - ((1 - powerFactor) * 20);
}

// Collision burst particles
export function createCollisionBurst(
    x: number,
    y: number,
    count: number,
    color: string
): Particle[] {
    const particles: Particle[] = [];
    const hue = colorToHue(color); // Extract hue from planet color

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particles.push(createParticle(
            x,
            y,
            vx,
            vy,
            hue + (Math.random() * 40 - 20), // Hue variance ±20°
            0.5 + Math.random() * 0.3, // 0.5-0.8s lifetime
            3 + Math.random() * 2 // 3-5px size
        ));
    }

    return particles;
}

function colorToHue(hexColor: string): number {
    // Convert hex to HSL and extract hue
    // Simplified: map common planet colors to hues
    const colorMap: Record<string, number> = {
        '#8B7355': 30,  // Brown (The Rock)
        '#6B4C9A': 270, // Purple (The Gas)
        '#D0D0D0': 0,   // Gray (The Moon) - use white sparks
        '#6666CC': 240, // Slate Blue (Default)
    };
    return colorMap[hexColor] ?? 0;
}
