import { PLANET_TYPES, type PlanetTypeId } from "@void-drift/core";

/** Orbit slider range: 1-100 maps to 200-1000px */
const ORBIT_MIN = 200;
const ORBIT_MAX = 1000;

/** Size slider range: 1-100 maps to 10-100px */
const SIZE_MIN = 10;
const SIZE_MAX = 100;

/** Convert slider value (1-100) to orbit radius in px */
export function sliderToOrbit(value: number): number {
    return ORBIT_MIN + ((value - 1) / 99) * (ORBIT_MAX - ORBIT_MIN);
}

/** Convert slider value (1-100) to planet radius in px */
export function sliderToSize(value: number): number {
    return SIZE_MIN + ((value - 1) / 99) * (SIZE_MAX - SIZE_MIN);
}

/** Shared state for planet lab - single planet explorer */
export const planetLabState = $state({
    // Sliders (1-100 range)
    orbitSlider: 50,
    sizeSlider: 50,

    // Type and features
    planetType: 'rock' as PlanetTypeId,
    hasRing: false,

    // Animation controls
    animating: true,
    showOrbit: true,
    showGravityWell: true,
    timeScale: 1.0,
});

/** Get current planet color from type */
export function getPlanetColor(): string {
    return PLANET_TYPES[planetLabState.planetType].color;
}

/** Get all planet type options for dropdown */
export function getPlanetTypeOptions(): { id: PlanetTypeId; name: string }[] {
    return Object.values(PLANET_TYPES);
}
