<script lang="ts">
    import {
        submitHighScore,
        generateUidHash,
        supabase,
    } from "@void-drift/mode-a";
    import type { DeathCause } from "@void-drift/mode-a";

    // Props
    interface Props {
        seconds: number;
        deathCause: DeathCause;
        onSubmitSuccess: () => void;
        onCancel: () => void;
    }

    let { seconds, deathCause, onSubmitSuccess, onCancel }: Props = $props();

    // State
    let letters = $state(["A", "A", "A"]);
    let currentPosition = $state(0);
    let uidHashPreview = $state<string | null>(null);
    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // Load UID hash preview on mount
    $effect(() => {
        loadUidHashPreview();
    });

    async function loadUidHashPreview() {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) {
            uidHashPreview = await generateUidHash(session.user.id);
        }
    }

    // Letter cycling
    function incrementLetter() {
        const currentIndex = ALPHABET.indexOf(letters[currentPosition]);
        const nextIndex = (currentIndex + 1) % ALPHABET.length;
        letters[currentPosition] = ALPHABET[nextIndex];
    }

    function decrementLetter() {
        const currentIndex = ALPHABET.indexOf(letters[currentPosition]);
        const prevIndex =
            (currentIndex - 1 + ALPHABET.length) % ALPHABET.length;
        letters[currentPosition] = ALPHABET[prevIndex];
    }

    // Position navigation
    function moveLeft() {
        currentPosition = Math.max(0, currentPosition - 1);
    }

    function moveRight() {
        currentPosition = Math.min(2, currentPosition + 1);
    }

    // Keyboard handling
    function handleKeydown(event: KeyboardEvent) {
        if (isSubmitting) return;

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                incrementLetter();
                break;
            case "ArrowDown":
                event.preventDefault();
                decrementLetter();
                break;
            case "ArrowLeft":
                event.preventDefault();
                moveLeft();
                break;
            case "ArrowRight":
                event.preventDefault();
                moveRight();
                break;
            case "Enter":
                event.preventDefault();
                if (isFormValid) {
                    handleSubmit();
                }
                break;
            case "Escape":
                event.preventDefault();
                onCancel();
                break;
        }
    }

    // Submission
    async function handleSubmit() {
        if (!isFormValid || isSubmitting) return;

        isSubmitting = true;
        errorMessage = null;

        const initials = letters.join("");

        const result = await submitHighScore({
            initials,
            seconds: Math.floor(seconds),
            deathCause,
        });

        if (result.success) {
            onSubmitSuccess();
        } else {
            errorMessage = result.error;
            isSubmitting = false;
        }
    }

    // Computed
    const isFormValid = $derived(
        letters.every((letter) => ALPHABET.includes(letter)),
    );
    const displayInitials = $derived(letters.join(""));
    const displayHash = $derived(
        uidHashPreview
            ? `${displayInitials}_${uidHashPreview}`
            : displayInitials,
    );
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="initials-entry">
    <h2>Enter Your Initials</h2>

    <div class="initials-display">
        {#each letters as letter, index}
            <div class="letter" class:active={index === currentPosition}>
                <button
                    class="letter-btn letter-btn-up"
                    onclick={() => {
                        currentPosition = index;
                        incrementLetter();
                    }}
                    disabled={isSubmitting}
                    aria-label="Increase letter"
                >
                    ▲
                </button>

                <div class="letter-value">{letter}</div>

                <button
                    class="letter-btn letter-btn-down"
                    onclick={() => {
                        currentPosition = index;
                        decrementLetter();
                    }}
                    disabled={isSubmitting}
                    aria-label="Decrease letter"
                >
                    ▼
                </button>
            </div>
        {/each}
    </div>

    <div class="uid-hash-preview">
        {displayHash}
    </div>

    {#if errorMessage}
        <div class="error-message">
            {errorMessage}
        </div>
    {/if}

    <div class="actions">
        <button
            class="btn btn-ghost"
            onclick={onCancel}
            disabled={isSubmitting}
        >
            Cancel
        </button>

        <button
            class="btn btn-filled"
            onclick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
        >
            {isSubmitting ? "Submitting..." : "Submit Score"}
        </button>
    </div>

    <div class="hint">
        Use Arrow Keys or On-Screen Buttons • Enter to Submit • Esc to Cancel
    </div>
</div>

<style>
    .initials-entry {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-lg);
        padding: var(--spacing-xl);
    }

    h2 {
        font-size: 2rem;
        color: var(--color-resource-danger);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .initials-display {
        display: flex;
        gap: var(--spacing-md);
    }

    .letter {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .letter.active .letter-value {
        border-color: var(--color-neon-blue);
        box-shadow: 0 0 10px var(--color-neon-blue);
        color: var(--color-neon-blue);
    }

    .letter-btn {
        background: transparent;
        border: 1px solid var(--color-text-dim);
        color: var(--color-text-dim);
        cursor: pointer;
        padding: var(--spacing-xs);
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .letter-btn:hover:not(:disabled) {
        border-color: var(--color-neon-blue);
        color: var(--color-neon-blue);
    }

    .letter-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .letter-value {
        font-family: monospace;
        font-size: 3rem;
        font-weight: bold;
        color: var(--color-text);
        border: 2px solid var(--color-text-dim);
        padding: var(--spacing-md) var(--spacing-lg);
        min-width: 4rem;
        text-align: center;
        transition: all 0.2s ease;
    }

    .uid-hash-preview {
        font-family: monospace;
        font-size: 1rem;
        color: var(--color-text-dim);
    }

    .error-message {
        color: var(--color-resource-danger);
        font-size: 0.875rem;
        text-align: center;
    }

    .actions {
        display: flex;
        gap: var(--spacing-md);
    }

    .hint {
        font-size: 0.75rem;
        color: var(--color-text-dim);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
