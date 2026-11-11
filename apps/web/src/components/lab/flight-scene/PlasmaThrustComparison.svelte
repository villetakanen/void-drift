<script lang="ts">
import {
  PLASMA_ACCEPTED_027,
  PLASMA_SCENE_027,
  plasmaLight027,
} from "../../studies/plasma-light-027";
import FlightSceneInstrument from "./FlightSceneInstrument.svelte";

// Suppress the reference bead so this compares thrust only; charge is slice 4.
const reference = plasmaLight027({
  size: PLASMA_ACCEPTED_027.size,
  intensity: 0,
});
</script>

<h2>Production plasma thrust</h2>
<FlightSceneInstrument
  config={PLASMA_SCENE_027}
  label="Production plasma thrust"
/>
<h2>Accepted study thrust reference</h2>
<FlightSceneInstrument
  config={PLASMA_SCENE_027}
  label="Accepted plasma thrust reference"
  light={reference}
/>
<p>
  Both scenes use the accepted Wasp flight and open at the same instant. Seek
  both to the same thrust instant; charge light is excluded from this
  comparison.
</p>
