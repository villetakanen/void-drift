<script lang="ts">
import { settings } from "../lib/stores/settings";
import Switch from "./inputs/Switch.svelte";

const id = $props.id();
</script>

<div class="speed-camera-setting">
  <label for={id}>
    <span>Speed camera</span>
    <Switch
      {id}
      bind:checked={
        () => $settings.speedCamera,
        (speedCamera) => settings.set({ ...$settings, speedCamera })
      }
    />
  </label>
  <span class="experimental">Experimental</span>
  <p>Zooms out with speed and shows more space ahead.</p>
</div>

<style>
.speed-camera-setting {
  margin-block: var(--spacing-md);
}
label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  cursor: pointer;
}
.experimental,
p {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
p {
  margin: var(--spacing-xs) 0 0;
}
</style>
