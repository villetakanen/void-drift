/**
 * Planet factory and management functions for multi-planet system (PBI-038)
 */
import { Vec2, type Planet } from './Physics';
import { SURVIVAL_CONFIG, PLANET_TYPES } from '../config';

/**
 * Creates Planet runtime state dynamically (PBI-038)
 * @param centerX - Center X coordinate (typically star position)
 * @param centerY - Center Y coordinate (typically star position)
 */
export function initializePlanets(centerX: number, centerY: number): Planet[] {
    const cfg = SURVIVAL_CONFIG.PLANET_SPAWN_CONFIG;
    const count = Math.floor(Math.random() * (cfg.maxCount - cfg.minCount + 1)) + cfg.minCount;
    const planets: Planet[] = [];

    const typeOptions = Object.values(PLANET_TYPES);

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let planet: Planet | null = null;

        while (attempts < 10) {
            const orbitRadius = cfg.orbitRange.min + Math.random() * (cfg.orbitRange.max - cfg.orbitRange.min);
            const radius = cfg.radiusRange.min + Math.random() * (cfg.radiusRange.max - cfg.radiusRange.min);

            if (validatePlacement(orbitRadius, radius, planets)) {
                const type = typeOptions[Math.floor(Math.random() * typeOptions.length)];
                const orbitSpeed = (cfg.speedRange.min + Math.random() * (cfg.speedRange.max - cfg.speedRange.min)) * (Math.random() > 0.5 ? 1 : -1);
                const orbitPhase = Math.random() * Math.PI * 2;
                const hasRing = Math.random() < cfg.ringProbability;

                planet = {
                    pos: new Vec2(
                        centerX + Math.cos(orbitPhase) * orbitRadius,
                        centerY + Math.sin(orbitPhase) * orbitRadius
                    ),
                    orbitCenter: new Vec2(centerX, centerY),
                    orbitRadius,
                    orbitSpeed,
                    orbitAngle: orbitPhase,
                    initialAngle: orbitPhase,
                    radius,
                    mass: Math.round(radius * 10), // Proportional to size
                    color: type.color,
                    type: type.id,
                    hasRing,
                };
                break;
            }
            attempts++;
        }

        if (planet) {
            planets.push(planet);
        }
    }

    // Sort by orbit radius to make rendering/path visualization logical
    return planets.sort((a, b) => b.orbitRadius - a.orbitRadius);
}

/**
 * Validates that a new planet doesn't overlap with existing ones
 * Separation must be at least (r1*4 + r2*4)
 */
function validatePlacement(orbitRadius: number, radius: number, existingPlanets: Planet[]): boolean {
    for (const other of existingPlanets) {
        const minGap = (radius * 4) + (other.radius * 4);
        if (Math.abs(orbitRadius - other.orbitRadius) < minGap) {
            return false;
        }
    }
    return true;
}

/**
 * Resets all planets to their initial orbital positions
 * Used when restarting the game
 */
export function resetPlanets(planets: Planet[]): void {
    planets.forEach((p) => {
        p.orbitAngle = p.initialAngle;
        p.pos.x = p.orbitCenter.x + Math.cos(p.initialAngle) * p.orbitRadius;
        p.pos.y = p.orbitCenter.y + Math.sin(p.initialAngle) * p.orbitRadius;
    });
}
