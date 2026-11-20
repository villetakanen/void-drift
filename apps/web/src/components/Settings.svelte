<script lang="ts">
import { settings } from "../lib/stores/settings";
import FlightDeck from "./FlightDeck.svelte";
import Switch from "./inputs/Switch.svelte";
import Logo from "./Logo.svelte";

const id = $props.id();
const groups = [
  {
    title: "Controls",
    key: "invertControls",
    name: "Invert controls",
    hint: "Swap left/right engine controls",
  },
  {
    title: "Camera",
    key: "speedCamera",
    name: "Speed camera",
    hint: "Zooms out with speed and shows more space ahead.",
  },
  {
    title: "Display",
    key: "combatHud",
    name: "Combat HUD",
    hint: "Show direction and distance cues for pirates, the sun, derelicts and energy cells.",
  },
] as const;
</script>

<FlightDeck>
  {#snippet menu()}
    <div class="settings-screen">
      <main class="panel settings-panel" aria-labelledby={`${id}-title`}>
        <header>
          <a href="/" class="brand" aria-label="Void Drift home"
            ><Logo size="sm" /></a
          >
          <h1 id={`${id}-title`}>Options</h1>
        </header>

        <div class="settings-groups">
          {#each groups as group (group.key)}
            <section aria-labelledby={`${id}-${group.key}-heading`}>
              <h2 id={`${id}-${group.key}-heading`}>{group.title}</h2>
              <div class="setting-row">
                <div class="setting-copy">
                  <label for={`${id}-${group.key}`}>{group.name}</label>
                  <p id={`${id}-${group.key}-hint`}>
                    {group.hint}
                  </p>
                </div>
                <Switch
                  id={`${id}-${group.key}`}
                  aria-describedby={`${id}-${group.key}-hint`}
                  bind:checked={
                    () => $settings[group.key],
                    (checked) => settings.set({ ...$settings, [group.key]: checked })
                  }
                />
              </div>
            </section>
          {/each}
        </div>

        <footer class="button-group-frame">
          <div class="button-group button-group--strip">
            <a href="/" class="btn btn-normal">Return to title screen</a>
          </div>
        </footer>
      </main>
    </div>
  {/snippet}
</FlightDeck>

<style>
.settings-screen {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: safe center;
  padding: var(--spacing-md);
  overflow: auto;
  touch-action: pan-y;
}

.settings-panel {
  width: min(100%, 32rem);
  display: grid;
  gap: var(--spacing-lg);
  font: var(--font-size-body) / var(--line-height-ui) var(--font-family-ui);
}

header {
  display: grid;
  justify-items: center;
  gap: var(--spacing-sm);
}

.brand {
  min-height: var(--control-min-height);
}

h1 {
  font-size: var(--font-size-heading);
  line-height: var(--line-height-heading);
  font-weight: var(--font-weight-bold);
}

h2 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}

section + section {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-subtle);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.setting-copy {
  min-width: 0;
  display: grid;
  gap: var(--spacing-xs);
}

label {
  color: var(--color-text);
  font-size: var(--font-size-label);
  cursor: pointer;
}

p {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
</style>
