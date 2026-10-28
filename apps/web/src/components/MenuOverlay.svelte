<script lang="ts">
    import { requestFullscreen } from "@void-drift/core";
    import {
        SHIP_PROFILE_BY_ID,
        SHIP_PROFILES,
        type ShipProfileId,
    } from "@void-drift/mode-a";
    import { settings } from "../lib/stores/settings";

    let {
        onStart,
        container,
    }: { onStart: (enablePerf?: boolean) => void; container?: HTMLElement } =
        $props();

    const showPerfStartButton =
        import.meta.env.PUBLIC_ENABLE_PERF_START_BUTTON === "true";

    const selectedShipProfile = $derived(
        SHIP_PROFILE_BY_ID[$settings.selectedShipId],
    );

    let startButton: HTMLButtonElement;

    async function handleStart() {
        if (container) {
            await requestFullscreen(container);
        }
        onStart();
    }

    async function handleStartPerf() {
        if (container) {
            await requestFullscreen(container);
        }
        onStart(true);
    }

    function handleKeydown(event: KeyboardEvent) {
        // Ignore navigation and modifier keys
        if (
            [
                "Tab",
                "Escape",
                "Shift",
                "Control",
                "Alt",
                "Meta",
                "CapsLock",
            ].includes(event.key)
        ) {
            return;
        }

        // Don't start if focused on settings link
        if (
            document.activeElement?.classList.contains("settings-link") ||
            document.activeElement?.classList.contains("perf-link") ||
            document.activeElement?.classList.contains("ship-select")
        ) {
            return;
        }

        handleStart();
    }

    function handleOverlayClick(event: MouseEvent) {
        // Ignore clicks inside the menu content itself
        if ((event.target as Element).closest(".menu-content")) {
            return;
        }

        // Don't start if clicking the settings link
        if (
            (event.target as Element).closest(".settings-link") ||
            (event.target as Element).closest(".perf-link") ||
            (event.target as Element).closest(".ship-select")
        ) {
            return;
        }
        handleStart();
    }

    function handleShipSelection(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const selectedShipId = target.value as ShipProfileId;
        settings.set({
            ...$settings,
            selectedShipId,
        });
    }

    $effect(() => {
        // Focus start button on mount
        startButton?.focus();

        // Listen for any key press
        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    });
</script>

<div
    class="menu-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Game menu"
    tabindex="-1"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
>
    <div class="menu-content">
        <div class="ship-select card-like">
            <label for="ship-select">Ship Chassis</label>
            <select
                id="ship-select"
                value={$settings.selectedShipId}
                onchange={handleShipSelection}
            >
                {#each SHIP_PROFILES as profile}
                    <option value={profile.id}>{profile.name}</option>
                {/each}
            </select>

            <div class="ship-summary">
                <span>Thrust {selectedShipProfile.thrustMultiplier.toFixed(2)}x</span>
                <span>Turn {selectedShipProfile.turnMultiplier.toFixed(2)}x</span>
                <span>Hull {selectedShipProfile.hullMultiplier.toFixed(2)}x</span>
            </div>
        </div>

        <button
            bind:this={startButton}
            class="btn btn-ghost"
            onclick={handleStart}
        >
            TAP TO START
        </button>

        {#if showPerfStartButton}
            <button class="btn btn-link perf-link" onclick={handleStartPerf}>
                Start with Perf HUD
            </button>
        {/if}

        <a href="/settings" class="btn btn-link settings-link">Settings</a>
    </div>
</div>

<style>
    .menu-overlay {
        position: fixed;
        inset: 0;
        background: var(--color-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        cursor: pointer;
        pointer-events: auto;
    }

    .menu-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-lg);
        cursor: default;
        width: min(90vw, 420px);
    }

    .card-like {
        width: 100%;
        padding: var(--spacing-md);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(5, 5, 16, 0.7);
    }

    .ship-select {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .ship-select label {
        color: var(--color-text-dim);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .ship-select select {
        width: 100%;
        min-height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 6px;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.35);
        color: var(--color-text);
        font: inherit;
    }

    .ship-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-xs);
        color: var(--color-neon-blue);
        font-size: 0.75rem;
    }

    /* Start button specific overrides if any (none needed currently) */
</style>
