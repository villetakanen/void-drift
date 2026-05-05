import { describe, expect, it } from 'vitest';
import { SURVIVAL_CONFIG } from '../config';
import { initializePlanets } from './planets';

describe('initializePlanets', () => {
    it('returns deterministic three-planet roster from config', () => {
        const planets = initializePlanets(960, 540);

        expect(planets).toHaveLength(3);
        expect(planets.map((planet) => planet.orbitRadius)).toEqual(
            SURVIVAL_CONFIG.PLANETS.map((planet) => planet.orbitRadius),
        );
        expect(planets.map((planet) => planet.orbitSpeed)).toEqual(
            SURVIVAL_CONFIG.PLANETS.map((planet) => planet.orbitSpeed),
        );
    });

    it('initializes moon with retrograde orbit speed', () => {
        const moonConfig = SURVIVAL_CONFIG.PLANETS.find((planet) => planet.id === 'moon');
        expect(moonConfig).toBeDefined();
        expect((moonConfig?.orbitSpeed ?? 0) < 0).toBe(true);
    });
});
