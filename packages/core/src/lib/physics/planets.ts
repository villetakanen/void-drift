/**
 * Planet factory and management functions for multi-planet system (PBI-032)
 */
import { Vec2, type Planet } from './Physics';
import { SURVIVAL_CONFIG } from '../config';

/**
 * Creates Planet runtime state from SURVIVAL_CONFIG.PLANETS
 * @param centerX - Center X coordinate (typically star position)
 * @param centerY - Center Y coordinate (typically star position)
 */
export function initializePlanets(centerX: number, centerY: number): Planet[] {
    return SURVIVAL_CONFIG.PLANETS.map((cfg) => ({
        pos: new Vec2(
            centerX + Math.cos(cfg.orbitPhase) * cfg.orbitRadius,
            centerY + Math.sin(cfg.orbitPhase) * cfg.orbitRadius
        ),
        orbitCenter: new Vec2(centerX, centerY),
        orbitRadius: cfg.orbitRadius,
        orbitSpeed: cfg.orbitSpeed,
        orbitAngle: cfg.orbitPhase,
        radius: cfg.radius,
        mass: cfg.mass,
        color: cfg.color,
    }));
}

/**
 * Resets all planets to their initial orbital positions
 * Used when restarting the game
 */
export function resetPlanets(planets: Planet[]): void {
    SURVIVAL_CONFIG.PLANETS.forEach((cfg, i) => {
        if (planets[i]) {
            planets[i].orbitAngle = cfg.orbitPhase;
            planets[i].pos.x = planets[i].orbitCenter.x + Math.cos(cfg.orbitPhase) * cfg.orbitRadius;
            planets[i].pos.y = planets[i].orbitCenter.y + Math.sin(cfg.orbitPhase) * cfg.orbitRadius;
        }
    });
}
