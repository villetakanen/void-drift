<script lang="ts">
import "./catalog.css";
import RingSlider from "../inputs/RingSlider.svelte";

let { label = "Slider design system" }: { label?: string } = $props();
let time = $state(7);
let thrust = $state(38000);
</script>

<section class="catalog" aria-label={label}>
  <section>
    <h2>Ring slider</h2>
    <p>
      A faint 2px track, lime up to the value, and a lime ring knob; the label
      and value stay neutral. Under a pointer the unfilled track takes the same
      faint lime tint. The native range input stays on top, so keys, touch and
      forms behave as usual, at a 44px touch height.
      <a href="/lab/studies/lab-instrument-2026-11-01#slider">Study →</a>
    </p>
    <div class="example" style="justify-items: stretch">
      <RingSlider
        label="Time"
        unit="s"
        digits={2}
        min={0}
        max={14}
        step={1 / 60}
        bind:value={time}
      />
      <RingSlider
        label="Plasma thrust"
        unit="force"
        min={20000}
        max={60000}
        step={500}
        bind:value={thrust}
      />
    </div>
    <p>
      <code>RingSlider</code>: <code>min</code>, <code>max</code>,
      <code>step</code>, bindable <code>value</code>, <code>label</code>,
      <code>unit</code>, <code>digits</code>; <code>compact</code> hides the
      label line where the host shows it.
    </p>
  </section>
</section>
