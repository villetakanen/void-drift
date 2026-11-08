<script lang="ts">
import { settings } from "../lib/stores/settings";
import Logo from "./Logo.svelte";

// Svelte's $ prefix subscribes to nanostores automatically
const currentSettings = $derived($settings);

function toggleInvertControls() {
  settings.set({
    ...$settings,
    invertControls: !$settings.invertControls,
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    toggleInvertControls();
  }
}
</script>

<div class="settings-page">
  <header>
    <a href="/" class="brand"><Logo size="sm" /></a>
    <h1>Options</h1>
  </header>

  <section class="setting-group">
    <h2>Controls</h2>

    <label class="toggle-row">
      <input
        type="checkbox"
        class="toggle-input"
        checked={currentSettings.invertControls}
        onchange={toggleInvertControls}
        onkeydown={handleKeydown}
      >
      <div class="toggle-text">
        <span class="toggle-label">Invert Controls</span>
        <span class="toggle-hint">Swap left/right engine controls</span>
      </div>
    </label>
  </section>

  <footer class="button-group-frame">
    <div class="button-group button-group--strip">
      <a href="/" class="btn btn-ghost">Return to title screen</a>
    </div>
  </footer>
</div>

<style>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  margin-bottom: var(--spacing-xl);
}

header .brand {
  margin-bottom: var(--spacing-md);
}

h1 {
  color: var(--color-text);
  font-size: 2.5rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h2 {
  color: var(--color-text);
  font-size: 1.125rem;
  margin: 0 0 var(--spacing-md) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.setting-group {
  background: var(--color-elev-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

.toggle-row:hover {
  background: var(--color-surface-hover);
}

.toggle-input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--color-action);
  flex-shrink: 0;
}

.toggle-input:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.toggle-label {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.toggle-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

footer {
  margin-top: auto;
  padding-top: var(--spacing-xl);
}

@media (max-width: 640px) {
  .settings-page {
    padding: var(--spacing-md);
  }

  h1 {
    font-size: 2rem;
  }
}
</style>
