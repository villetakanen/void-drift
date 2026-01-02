import { z } from 'zod';

export const ScreenShakeConfigSchema = z.object({
    maxOffset: z.number().positive(), // Max pixel displacement at trauma=1.0
    decay: z.number().min(0).max(10), // Trauma decay per second. Allow > 1 for fast recovery
    frequency: z.number().positive(), // Shake oscillation speed
});

export type ScreenShakeConfig = z.infer<typeof ScreenShakeConfigSchema>;

export class ScreenShake {
    private trauma = 0; // 0.0 to 1.0
    private time = 0;

    constructor(private config: ScreenShakeConfig) { }

    /**
     * Add trauma to the shake system.
     * @param amount - Trauma amount (0.0 to 1.0). Values > 1.0 are clamped.
     */
    addTrauma(amount: number): void {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    /**
     * Update shake state and return current offset.
     * @param deltaTime - Time since last update (seconds)
     * @returns Offset { x, y } in pixels
     */
    update(deltaTime: number): { x: number; y: number } {
        // Decay trauma
        this.trauma = Math.max(0, this.trauma - this.config.decay * deltaTime);

        // Early exit if no trauma
        if (this.trauma === 0) {
            return { x: 0, y: 0 };
        }

        // Advance time for oscillation
        this.time += deltaTime;

        // Calculate shake using Perlin-like noise simulation
        // Use trauma^2 for smoother falloff (small traumas barely shake)
        const intensity = this.trauma * this.trauma;

        // Simple pseudo-random oscillation based on time
        // We use different frequencies for X and Y to create chaotic motion vs diagonal
        const offsetX = Math.sin(this.time * this.config.frequency) *
            this.config.maxOffset * intensity;

        const offsetY = Math.cos(this.time * this.config.frequency * 1.3) *
            this.config.maxOffset * intensity;

        return { x: offsetX, y: offsetY };
    }

    /**
     * Get current trauma level (for debugging/UI).
     */
    getTrauma(): number {
        return this.trauma;
    }

    /**
     * Reset trauma to zero (for game restart).
     */
    reset(): void {
        this.trauma = 0;
        this.time = 0;
    }
}
