<script lang="ts">
    import Controls from "../Controls.svelte";
    import LabStats from "./LabStats.svelte";
    import {
        SUN_CONFIG,
        SURVIVAL_CONFIG,
        type SunType,
    } from "@void-drift/core";
    import { starParamsState } from "./star-state.svelte";

    const starParams = $derived.by(() => {
        const presets = [
            SUN_CONFIG.O,
            SUN_CONFIG.B,
            SUN_CONFIG.A,
            SUN_CONFIG.F,
            SUN_CONFIG.G,
            SUN_CONFIG.K,
            SUN_CONFIG.M,
        ];

        const { interpolator } = starParamsState;
        if (interpolator <= 0) return presets[0];
        if (interpolator >= 6) return presets[6];

        const idx = Math.floor(interpolator);
        const nextIdx = Math.min(idx + 1, presets.length - 1);
        const t = interpolator - idx;

        const p1 = presets[idx];
        const p2 = presets[nextIdx];

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        return {
            type: presets[Math.round(interpolator)].type,
            size: Math.round(lerp(p1.size, p2.size, t)),
            radius: lerp(p1.radius, p2.radius, t),
            mass: lerp(p1.mass, p2.mass, t),
            powerMultiplier: lerp(p1.powerMultiplier, p2.powerMultiplier, t),
            burnMultiplier: lerp(p1.burnMultiplier, p2.burnMultiplier, t),
            pulseSpeed: lerp(p1.pulseSpeed, p2.pulseSpeed, t),
        };
    });

    const sunStatsGroups = $derived.by(() => {
        const radiusScale = starParams.radius / 35;
        return [
            {
                label: "Classification",
                stats: [
                    { key: "Class", value: starParams.type },
                    { key: "Rating", value: starParams.size, unit: "/ 100" },
                ],
            },
            {
                label: "Physical",
                stats: [
                    {
                        key: "Radius",
                        value: starParams.radius.toFixed(1),
                        unit: "px",
                    },
                    { key: "Mass", value: Math.round(starParams.mass) },
                    {
                        key: "Pulse",
                        value: starParams.pulseSpeed.toFixed(1),
                        unit: "x",
                    },
                ],
            },
            {
                label: "Gameplay",
                stats: [
                    {
                        key: "Power",
                        value: starParams.powerMultiplier.toFixed(1),
                        unit: "x",
                    },
                    {
                        key: "Burn",
                        value: starParams.burnMultiplier.toFixed(1),
                        unit: "x",
                    },
                ],
            },
            {
                label: "Proximity Zones",
                stats: [
                    {
                        key: "Inner (100%)",
                        value: Math.round(
                            SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS * radiusScale,
                        ),
                        unit: "px",
                    },
                    {
                        key: "Outer (Low)",
                        value: Math.round(
                            SURVIVAL_CONFIG.POWER_ZONE_3_RADIUS * radiusScale,
                        ),
                        unit: "px",
                    },
                ],
            },
        ];
    });
</script>

<Controls title="Presets">
    <div class="control-group">
        <label for="sun-type">Sun Type</label>
        <select
            id="sun-type"
            bind:value={starParamsState.selectedType}
            onchange={() => {
                const types: SunType[] = ["O", "B", "A", "F", "G", "K", "M"];
                starParamsState.interpolator = types.indexOf(
                    starParamsState.selectedType,
                );
            }}
        >
            <option value="O">Class O (Blue)</option>
            <option value="B">Class B (Blue-White)</option>
            <option value="A">Class A (White)</option>
            <option value="F">Class F (Yellow-White)</option>
            <option value="G">Class G (Yellow)</option>
            <option value="K">Class K (Orange)</option>
            <option value="M">Class M (Red)</option>
        </select>
    </div>
    <div class="control-group">
        <label for="sun-lerp">Smooth Tune (Class O → M)</label>
        <input
            type="range"
            id="sun-lerp"
            min="0"
            max="6"
            step="0.01"
            bind:value={starParamsState.interpolator}
            oninput={() => {
                const types: SunType[] = ["O", "B", "A", "F", "G", "K", "M"];
                starParamsState.selectedType =
                    types[Math.round(starParamsState.interpolator)];
            }}
        />
    </div>
</Controls>

<Controls title="Stats">
    <LabStats groups={sunStatsGroups} />
</Controls>

<style>
    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    label {
        color: var(--color-text-dim);
        font-size: 0.9rem;
    }

    input[type="range"] {
        width: 100%;
        accent-color: var(--color-acid-lime);
    }

    select {
        width: 100%;
        padding: 0.5rem;
        background: var(--color-void);
        color: var(--color-text);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: inherit;
    }
</style>
