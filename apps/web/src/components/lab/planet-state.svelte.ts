import { SURVIVAL_CONFIG } from "@void-drift/core";

// Shared state for planet lab
export const planetParamsState = $state({
    selectedPlanetIndex: 0,
    animating: true,
    showOrbits: true,
    timeScale: 1.0,
});

// Get planet config by index
export function getPlanetConfig(index: number) {
    return SURVIVAL_CONFIG.PLANETS[index] ?? SURVIVAL_CONFIG.PLANETS[0];
}
