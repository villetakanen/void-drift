/**
 * Planet factory and management functions
 */
import { Vec2, type Planet } from './Physics';
import { SURVIVAL_CONFIG, PLANET_TYPES } from '../config';

/**
 * Creates deterministic Planet runtime state for Mode A (PBI-032)
 * @param centerX - Center X coordinate (typically star position)
 * @param centerY - Center Y coordinate (typically star position)
 */
export function initializePlanets(centerX: number, centerY: number): Planet[] {
    return SURVIVAL_CONFIG.PLANETS.map((config) => ({
        pos: new Vec2(
            centerX + Math.cos(config.orbitPhase) * config.orbitRadius,
            centerY + Math.sin(config.orbitPhase) * config.orbitRadius,
        ),
        orbitCenter: new Vec2(centerX, centerY),
        orbitRadius: config.orbitRadius,
        orbitSpeed: config.orbitSpeed,
        orbitAngle: config.orbitPhase,
        initialAngle: config.orbitPhase,
        radius: config.radius,
        mass: config.mass,
        color: config.color,
        type: config.type,
        hasRing: config.hasRing,
    }));
}

/**
 * Creates random Planet runtime state for experimentation and stress testing.
 */
export function initializeRandomPlanets(centerX: number, centerY: number): Planet[] {
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

                planet = {
                    pos: new Vec2(
                        centerX + Math.cos(orbitPhase) * orbitRadius,
                        centerY + Math.sin(orbitPhase) * orbitRadius,
                    ),
                    orbitCenter: new Vec2(centerX, centerY),
                    orbitRadius,
                    orbitSpeed,
                    orbitAngle: orbitPhase,
                    initialAngle: orbitPhase,
                    radius,
                    mass: Math.round(radius * 10),
                    color: type.color,
                    type: type.id,
                    hasRing: Math.random() < cfg.ringProbability,
                };
                break;
            }
            attempts++;
        }

        if (planet) {
            planets.push(planet);
        }
    }

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
