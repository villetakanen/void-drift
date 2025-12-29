import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2, updatePower } from './Physics';
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
