<script lang="ts">
    import { requestFullscreen } from "@void-drift/core";

    let {
        onStart,
        container,
    }: { onStart: () => void; container?: HTMLElement } = $props();

    let startButton: HTMLButtonElement;

    async function handleStart() {
        if (container) {
            await requestFullscreen(container);
        }
        onStart();
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
        if (document.activeElement?.classList.contains("settings-link")) {
            return;
        }

        handleStart();
    }

    function handleOverlayClick(event: MouseEvent) {
        // Don't start if clicking the settings link
        if ((event.target as Element).closest(".settings-link")) {
            return;
        }
        handleStart();
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
        <button
            bind:this={startButton}
            class="btn btn-ghost"
            onclick={handleStart}
        >
            TAP TO START
        </button>

        <a href="/settings" class="btn btn-link">Settings</a>
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
    }

    /* Start button specific overrides if any (none needed currently) */
</style>
