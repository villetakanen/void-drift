<script lang="ts">
  import type { GameState } from "@void-drift/mode-a";
  import { drawDeathIcon } from "@void-drift/core";
  import InitialsEntry from "./InitialsEntry.svelte";

  let {
    gameState,
    onRestart,
  }: {
    gameState: GameState;
    onRestart: () => void;
  } = $props();

  let showInitialsEntry = $state(false);

  function handleSubmitScore() {
    showInitialsEntry = true;
  }

  function handleSubmitSuccess() {
    window.location.href = "/leaderboard";
  }

  function handleCancel() {
    showInitialsEntry = false;
  }

  const deathMessages: Record<string, string> = {
    STAR: "Incinerated by the star",
    HULL: "Hull failure",
    POWER: "Out of power",
  };

  const causeMessage = $derived(
    gameState.deathCause ? deathMessages[gameState.deathCause] : "Unknown",
  );

  const finalTime = $derived(gameState.elapsedTime.toFixed(2));

  // Render death icon on canvas
  let iconCanvas = $state<HTMLCanvasElement>();
  $effect(() => {
    if (iconCanvas && gameState.deathCause) {
      const ctx = iconCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        drawDeathIcon(ctx, 16, 16, 24, gameState.deathCause);
      }
    }
  });
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="card">
    {#if showInitialsEntry && gameState.deathCause}
      <InitialsEntry
        seconds={gameState.elapsedTime}
        deathCause={gameState.deathCause}
        onSubmitSuccess={handleSubmitSuccess}
        onCancel={handleCancel}
      />
    {:else}
      <h1>MISSION FAILED</h1>

      <p class="time">
        You survived <strong>{finalTime}s</strong>
      </p>

      <div class="cause-container">
        <canvas bind:this={iconCanvas} width="32" height="32" class="death-icon"
        ></canvas>
        <p class="cause">{causeMessage}</p>
      </div>

      <div class="actions">
        <button onclick={handleSubmitScore} class="btn btn-filled">
          Submit Score
        </button>
        <button onclick={onRestart} class="btn btn-ghost"> Try Again </button>
        <a href="/leaderboard" class="btn btn-ghost"> View Leaderboard </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
    pointer-events: auto;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .card {
    text-align: center;
    padding: var(--spacing-xl);
    border: 2px solid var(--color-resource-danger);
    background: rgba(255, 0, 100, 0.1);
    border-radius: 8px;
    max-width: 500px;
  }

  h1 {
    color: var(--color-resource-danger);
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .time {
    font-size: 1.5rem;
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
  }

  strong {
    color: var(--color-neon-blue);
    font-variant-numeric: tabular-nums;
  }

  .cause-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .death-icon {
    width: 32px;
    height: 32px;
  }

  .cause {
    font-size: 1.125rem;
    color: var(--color-resource-danger);
    margin: 0;
  }

  .actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .card {
      padding: var(--spacing-lg);
      max-width: 90vw;
    }

    h1 {
      font-size: 2rem;
    }

    .actions {
      flex-direction: column;
      width: 100%;
    }

    button,
    a {
      width: 100%;
    }
  }
</style>
