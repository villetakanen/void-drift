<script lang="ts">
    let { onStart }: { onStart: () => void } = $props();

    let startButton: HTMLButtonElement;

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

        onStart();
    }

    function handleOverlayClick(event: MouseEvent) {
        // Don't start if clicking the settings link
        if ((event.target as Element).closest(".settings-link")) {
            return;
        }
        onStart();
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
    onclick={handleOverlayClick}
>
    <div class="menu-content">
        <button bind:this={startButton} class="start-button" onclick={onStart}>
            TAP TO START
        </button>

        <a href="/settings" class="settings-link">Settings</a>
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

    .start-button {
        background: transparent;
        border: 2px solid var(--color-neon-blue);
        color: var(--color-neon-blue);
        padding: var(--spacing-md) var(--spacing-xl);
        font-size: 1.25rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        cursor: pointer;
        font-family: inherit;
        transition:
            background 0.15s ease,
            color 0.15s ease;
        min-height: 44px;
    }

    .start-button:hover {
        background: var(--color-neon-blue);
        color: var(--color-void);
    }

    .start-button:focus-visible {
        outline: 2px solid var(--color-neon-blue);
        outline-offset: 4px;
    }

    .settings-link {
        color: var(--color-text-dim);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.15s ease;
        padding: var(--spacing-sm);
        min-height: 44px;
        display: flex;
        align-items: center;
        pointer-events: auto;
    }

    .settings-link:hover {
        color: var(--color-text);
    }

    .settings-link:focus-visible {
        outline: 2px solid var(--color-neon-blue);
        outline-offset: 2px;
    }
</style>
