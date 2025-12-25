# PBI-029: Initials Entry UI

**Status:** TODO  
**Priority:** HIGH  
**Estimate:** 5 Story Points  
**Phase:** 6 (High Scores)  
**Target Version:** v0.2.0

---

## User Story

**As a** player  
**I want** to enter my initials after achieving a high score  
**So that** my achievement is recorded on the leaderboard

---

## Context

This PBI implements the arcade-style initials entry UI that appears after the player dies. It provides both keyboard and on-screen input for entering 3 uppercase letters.

**Prerequisites:**
- PBI-026 (Supabase Project Setup)
- PBI-027 (Supabase Client Setup)
- PBI-028 (High Score Schema + Submission)

---

## Acceptance Criteria

### Component Creation
- [ ] Create `apps/web/src/components/InitialsEntry.svelte`
- [ ] Component renders in GameOver screen flow

### User Interface
- [ ] 3-letter input display (A-Z only)
- [ ] Current letter highlighted
- [ ] UID hash preview shown below initials
- [ ] Submit button (disabled until 3 letters entered)
- [ ] Loading state during submission
- [ ] Success/error messages

### Keyboard Input
- [ ] Arrow Up/Down to cycle letters (A → Z → A)
- [ ] Arrow Left/Right to move between letter positions
- [ ] Enter key to submit (when 3 letters entered)
- [ ] Escape key to cancel (return to game over screen)

### On-Screen Input
- [ ] Up/Down buttons per letter position
- [ ] Left/Right buttons to navigate positions
- [ ] Submit button
- [ ] Cancel button

### Integration
- [ ] Component shown on game over (if score qualifies for submission)
- [ ] Calls `submitHighScore()` on submit
- [ ] Navigates to `/leaderboard` on success
- [ ] Shows error message on failure
- [ ] Returns to game over screen on cancel

---

## Technical Implementation

### Component Structure

**File:** `apps/web/src/components/InitialsEntry.svelte`

```svelte
<script lang="ts">
  import { submitHighScore } from '@void-drift/mode-a/api/submit-high-score';
  import { generateUidHash } from '@void-drift/mode-a/utils/uid-hash';
  import { supabase } from '@void-drift/mode-a/supabase';
  import type { DeathCause } from '@void-drift/mode-a/schemas/game-state';

  // Props
  export let seconds: number;
  export let deathCause: DeathCause;
  export let onSubmitSuccess: () => void;
  export let onCancel: () => void;

  // State
  let letters = $state(['A', 'A', 'A']);
  let currentPosition = $state(0);
  let uidHashPreview = $state<string | null>(null);
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Load UID hash preview on mount
  $effect(() => {
    loadUidHashPreview();
  });

  async function loadUidHashPreview() {
    const { data: { session } } = await supabase.auth.getSession();
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
    const prevIndex = (currentIndex - 1 + ALPHABET.length) % ALPHABET.length;
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
      case 'ArrowUp':
        event.preventDefault();
        incrementLetter();
        break;
      case 'ArrowDown':
        event.preventDefault();
        decrementLetter();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveRight();
        break;
      case 'Enter':
        event.preventDefault();
        if (isFormValid) {
          handleSubmit();
        }
        break;
      case 'Escape':
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

    const initials = letters.join('');

    const result = await submitHighScore({
      initials,
      seconds,
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
  const isFormValid = $derived(letters.every((letter) => ALPHABET.includes(letter)));
  const displayInitials = $derived(letters.join(''));
  const displayHash = $derived(uidHashPreview ? `${displayInitials}_${uidHashPreview}` : displayInitials);
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
    <button class="btn btn-ghost" onclick={onCancel} disabled={isSubmitting}>
      Cancel
    </button>

    <button
      class="btn btn-filled"
      onclick={handleSubmit}
      disabled={!isFormValid || isSubmitting}
    >
      {isSubmitting ? 'Submitting...' : 'Submit Score'}
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
    gap: var(--space-lg);
    padding: var(--space-xl);
  }

  h2 {
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
    margin: 0;
  }

  .initials-display {
    display: flex;
    gap: var(--space-md);
  }

  .letter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  .letter.active .letter-value {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 10px var(--color-accent-primary);
  }

  .letter-btn {
    background: transparent;
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: var(--space-xs);
    font-size: var(--font-size-sm);
    transition: all 0.2s ease;
  }

  .letter-btn:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
  }

  .letter-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .letter-value {
    font-family: var(--font-mono);
    font-size: 3rem;
    font-weight: bold;
    color: var(--color-text-primary);
    border: 2px solid var(--color-border-default);
    padding: var(--space-md) var(--space-lg);
    min-width: 4rem;
    text-align: center;
    transition: all 0.2s ease;
  }

  .uid-hash-preview {
    font-family: var(--font-mono);
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
  }

  .error-message {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .actions {
    display: flex;
    gap: var(--space-md);
  }

  .hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    text-align: center;
  }
</style>
```

---

### Integration with GameOver

**File:** `apps/web/src/components/GameOver.svelte`

```svelte
<script lang="ts">
  import type { DeathCause } from '@void-drift/mode-a/schemas/game-state';
  import InitialsEntry from './InitialsEntry.svelte';

  export let deathCause: DeathCause;
  export let seconds: number;
  export let onRestart: () => void;

  let showInitialsEntry = $state(false);

  function handleSubmitScore() {
    showInitialsEntry = true;
  }

  function handleSubmitSuccess() {
    // Navigate to leaderboard
    window.location.href = '/leaderboard';
  }

  function handleCancel() {
    showInitialsEntry = false;
  }
</script>

{#if showInitialsEntry}
  <InitialsEntry
    {seconds}
    {deathCause}
    onSubmitSuccess={handleSubmitSuccess}
    onCancel={handleCancel}
  />
{:else}
  <!-- Existing GameOver UI -->
  <div class="game-over">
    <h1>Game Over</h1>
    <p>Time Survived: {seconds}s</p>
    <p>Cause of Death: {deathCause}</p>

    <button class="btn btn-filled" onclick={handleSubmitScore}>
      Submit Score
    </button>

    <button class="btn btn-ghost" onclick={onRestart}>
      Play Again
    </button>
  </div>
{/if}
```

---

## Definition of Done

- [ ] `InitialsEntry.svelte` component created
- [ ] Component renders correctly
- [ ] Keyboard input works (arrows, enter, escape)
- [ ] On-screen buttons work
- [ ] UID hash preview displays correctly
- [ ] Submit button disabled until 3 letters entered
- [ ] Loading state shows during submission
- [ ] Success navigates to `/leaderboard`
- [ ] Error messages display correctly
- [ ] Cancel returns to game over screen
- [ ] Zero TypeScript errors
- [ ] Component styled consistently with design system

---

## Testing Checklist

### Keyboard Input
- [ ] Arrow Up cycles letter upward (A → B → ... → Z → A)
- [ ] Arrow Down cycles letter downward (Z → Y → ... → A → Z)
- [ ] Arrow Left moves to previous letter position
- [ ] Arrow Right moves to next letter position
- [ ] Enter submits when 3 letters entered
- [ ] Enter does nothing when <3 letters
- [ ] Escape cancels and returns to game over

### On-Screen Input
- [ ] Click up arrow cycles letter upward
- [ ] Click down arrow cycles letter downward
- [ ] Click on letter position activates it
- [ ] Submit button enabled only when 3 letters entered
- [ ] Cancel button returns to game over

### UID Hash Preview
- [ ] Displays initials + underscore + 6-char hash
- [ ] Hash matches actual submission hash
- [ ] Updates in real-time as letters change

### Submission
- [ ] Clicking submit shows "Submitting..." text
- [ ] Buttons disabled during submission
- [ ] Success navigates to `/leaderboard`
- [ ] Error shows user-friendly message
- [ ] Can retry submission after error

### Edge Cases
- [ ] Rapid key presses don't break state
- [ ] Submission prevented during loading
- [ ] Works on mobile touch screens
- [ ] Works on desktop keyboards

---

## Out of Scope

- Checking if score qualifies for top 20 (submit all scores for v0.2.0)
- Animated letter transitions (defer to polish phase)
- Sound effects (Phase 7+)
- Custom key bindings (defer to settings)

---

## Dependencies

- **Requires:** PBI-026 (Supabase Project Setup)
- **Requires:** PBI-027 (Supabase Client Setup)
- **Requires:** PBI-028 (High Score Schema + Submission)
- **Recommended:** PBI-022 (Button Design System) — for consistent styling

---

## Related Documents

- [Phase 6 Roadmap](../PHASE-6-ROADMAP.md)
- [Supabase Migration Assessment](../SUPABASE-MIGRATION-ASSESSMENT.md)
- [PBI-028: High Score Schema + Submission](./PBI-028-High-Score-Schema.md)
- [PBI-030: Leaderboard Display](./PBI-030-Leaderboard-Display.md)

---

## Notes

**UX Inspiration:**
- Classic arcade high score entry (Pac-Man, Donkey Kong, etc.)
- Modern examples: SUPERHOT, Nuclear Throne

**Accessibility:**
- Keyboard navigation is primary input method
- On-screen buttons for touch/mobile
- Clear visual feedback for current position
- Escape key for quick cancel

**Future Enhancements (deferred):**
- Check if score qualifies for top 20 before showing UI
- Animated letter flipping transitions
- Sound effects for letter cycling
- Haptic feedback on mobile

---

## Acceptance

**Verified by:** Manual testing on desktop + mobile  
**Sign-off:** @Lead
