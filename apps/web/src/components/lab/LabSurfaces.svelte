<script lang="ts">
import Dialog from "../Dialog.svelte";
import Switch from "../inputs/Switch.svelte";

let open = $state(false);
let closable = $state(true);
const controlId = $props.id();
</script>

<div class="dialog-example">
  <label for={controlId} class="escape-control">
    <Switch id={controlId} bind:checked={closable} />
    Escape closes the dialog
  </label>
  <div class="demo-host">
    <div class="demo-stage" data-stage>
      <div class="star" aria-hidden="true"></div>
      <p class="demo-hud" data-deck>HULL 100% · POWER 100%</p>
      <div class="demo-deck" data-deck>
        <button
          type="button"
          class="btn btn-link"
          onclick={() => (open = true)}
        >
          Open dialog
        </button>
      </div>
    </div>
    {#if open}
      <Dialog
        label="Demo dialog"
        onclose={closable ? () => (open = false) : undefined}
      >
        <p class="dialog-note">The deck is hidden and the stage is inactive.</p>
        <div class="button-group button-group--vertical">
          <button
            type="button"
            class="btn btn-filled"
            data-autofocus
            onclick={() => (open = false)}
          >
            Close
          </button>
          <button type="button" class="btn btn-ghost">Another control</button>
        </div>
      </Dialog>
    {/if}
  </div>
</div>

<style>
.escape-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.demo-host {
  position: relative;
  overflow: hidden;
  height: 22rem;
  background: var(--color-void);
}
.demo-stage {
  position: absolute;
  inset: 0;
  background: var(--color-void);
}
.star {
  position: absolute;
  width: 160px;
  aspect-ratio: 1;
  left: 20%;
  top: 50%;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--color-caution-tape) 0 40%,
    color-mix(in lch, var(--color-caution-tape) 30%, transparent) 55%,
    transparent 70%
  );
}
.demo-hud {
  position: absolute;
  z-index: var(--layer-hud);
  inset: var(--spacing-md) var(--spacing-md) auto;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.demo-deck {
  position: absolute;
  z-index: var(--layer-hud);
  inset: auto var(--spacing-md) var(--spacing-md);
  display: flex;
  justify-content: center;
}
.dialog-note {
  margin-bottom: var(--spacing-md);
}
</style>
