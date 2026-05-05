import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2, updatePower, updateShip } from './Physics';
import type { GameObject, Planet } from './Physics';
import type { InputState } from '../entities/Input';
import { SURVIVAL_CONFIG } from '../config';

describe('Vec2', () => {
    it('should initialize correctly', () => {
        const v = new Vec2(10, 20);
        expect(v.x).toBe(10);
        expect(v.y).toBe(20);
    });

    it('should add vectors correctly', () => {
        const v1 = new Vec2(10, 20);
        const v2 = new Vec2(5, -5);
        v1.add(v2);
        expect(v1.x).toBe(15);
        expect(v1.y).toBe(15);
    });

    it('should calculate magnitude correctly', () => {
        const v = new Vec2(3, 4);
        expect(v.mag()).toBe(5);
    });
});

describe('updatePower', () => {
    let resources: { hull: number; power: number };
    const mockSun: any = {
        radius: 40,
        powerMultiplier: 1,
        burnMultiplier: 1
    };

    beforeEach(() => {
        resources = { hull: 100, power: 100 };
    });

    it('should consume power over time', () => {
        const dt = 1; // 1 second
        // Far from sun, no thrust
        updatePower(resources, 1000, mockSun, dt);
        expect(resources.power).toBe(100 - SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE);
    });

    it('should regenerate power near sun', () => {
        resources.power = 50;
        const dt = 1;
        // Inside Zone 1
        updatePower(resources, SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS - 10, mockSun, dt);
        const expected = 50 - SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE + SURVIVAL_CONFIG.POWER_REGEN_ZONE_1;
        expect(resources.power).toBe(expected);
    });

    it('should clamp power between 0 and 100', () => {
        resources.power = 99;
        updatePower(resources, SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS - 10, mockSun, 10);
        expect(resources.power).toBe(100);

        resources.power = 0.5;
        updatePower(resources, 1000, mockSun, 10);
        expect(resources.power).toBe(0);
    });
});

describe('Planet gravity (mass-based influence)', () => {
    const noInput: InputState = { leftThruster: false, rightThruster: false, fire: false };
    const arenaSize = 2400;

    function makeShip(x: number, y: number): GameObject {
        return {
            pos: new Vec2(x, y),
            vel: new Vec2(0, 0),
            acc: new Vec2(0, 0),
            rotation: 0,
            radius: 16,
        };
    }

    function makePlanet(overrides: Partial<Planet> = {}): Planet {
        return {
            pos: new Vec2(600, 600),
            orbitCenter: new Vec2(1200, 1200),
            orbitRadius: 700,
            orbitSpeed: 0,
            orbitAngle: 0,
            initialAngle: 0,
            radius: 30,
            mass: 400,
            color: '#8B7355',
            type: 'rock',
            hasRing: false,
            ...overrides,
        };
    }

    it('should calculate influence radius from sqrt(mass) capped at radius * 8', () => {
        // mass=400, radius=30 → sqrt(400)*10 = 200, cap = 240, min = 60 → 200
        const planet = makePlanet({ mass: 400, radius: 30 });
        const expected = Math.sqrt(400) * 10; // 200
        const max = 30 * 8; // 240
        const min = 30 * 2; // 60
        const influence = Math.max(min, Math.min(expected, max));
        expect(influence).toBe(200);
    });

    it('should cap influence radius at radius * 8 for high-mass planets', () => {
        // mass=10000, radius=50 → sqrt(10000)*10 = 1000, cap = 400, min = 100 → 400
        const mass = 10000;
        const radius = 50;
        const raw = Math.sqrt(mass) * 10; // 1000
        const max = radius * 8; // 400
        const min = radius * 2; // 100
        const influence = Math.max(min, Math.min(raw, max));
        expect(influence).toBe(400);
    });

    it('should enforce minimum influence radius of radius * 2 for low-mass planets', () => {
        // mass=1, radius=80 → sqrt(1)*10 = 10, cap = 640, min = 160 → 160
        const mass = 1;
        const radius = 80;
        const raw = Math.sqrt(mass) * 10; // 10
        const max = radius * 8; // 640
        const min = radius * 2; // 160
        const influence = Math.max(min, Math.min(raw, max));
        expect(influence).toBe(160);
    });

    it('should pull ship toward planet within influence radius', () => {
        // Place planet at a fixed position, ship nearby
        const planet = makePlanet({
            pos: new Vec2(600, 600),
            orbitCenter: new Vec2(600, 600),
            orbitRadius: 0,
            orbitSpeed: 0,
            mass: 400,
            radius: 30,
        });

        // Ship 100px to the left of planet (within influence radius of 200)
        const ship = makeShip(500, 600);

        updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [planet]);

        // Ship should have gained positive x velocity (pulled toward planet at x=600)
        expect(ship.vel.x).toBeGreaterThan(0);
        // Y velocity should be ~0 (ship and planet on same y-axis)
        expect(Math.abs(ship.vel.y)).toBeLessThan(0.01);
    });

    it('should NOT pull ship outside influence radius', () => {
        const planet = makePlanet({
            pos: new Vec2(600, 600),
            orbitCenter: new Vec2(600, 600),
            orbitRadius: 0,
            orbitSpeed: 0,
            mass: 400,
            radius: 30,
        });

        // Influence = 200px, place ship 300px away (outside)
        const ship = makeShip(300, 600);

        updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [planet]);

        // No gravitational pull — velocity stays ~0 (only drag applied to 0 = 0)
        expect(Math.abs(ship.vel.x)).toBeLessThan(0.001);
        expect(Math.abs(ship.vel.y)).toBeLessThan(0.001);
    });
});
