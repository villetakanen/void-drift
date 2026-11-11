<script lang="ts">
import { defaultLoadout } from "@void-drift/mode-a";
import {
  PLASMA_ACCEPTED_027,
  PLASMA_SCENE_027,
  plasmaLight027,
} from "../../studies/plasma-light-027";
import FlightSceneInstrument from "./FlightSceneInstrument.svelte";

const scout = {
  ...PLASMA_SCENE_027,
  opening: { ...PLASMA_SCENE_027.opening, view: "follow-far" as const },
  loadout: { ...defaultLoadout("scout"), side: "plasma" as const },
};
const corvette = {
  ...PLASMA_SCENE_027,
  opening: { ...PLASMA_SCENE_027.opening, view: "follow-far" as const },
  loadout: {
    ...defaultLoadout("corvette"),
    side: "plasma" as const,
    aft: Array(3).fill("plasma"),
  },
};
const reference = plasmaLight027({
  size: PLASMA_ACCEPTED_027.size,
  intensity: PLASMA_ACCEPTED_027.intensity,
});
</script>

<h2>Production plasma thrust</h2>
<div class="scene-band">
  <FlightSceneInstrument
    config={PLASMA_SCENE_027}
    label="Production plasma thrust"
  />
</div>
<h2>Accepted study thrust reference</h2>
<div class="scene-band">
  <FlightSceneInstrument
    config={PLASMA_SCENE_027}
    label="Accepted plasma thrust reference"
    light={reference}
  />
</div>
<p>
  Both scenes use the accepted Wasp flight and open at the same instant. Seek
  both to the same instant to compare charge or thrust.
</p>
<h2>Scout: paired plasma engines</h2>
<div class="scene-band">
  <FlightSceneInstrument config={scout} label="Scout plasma charge" />
</div>
<h2>Corvette: five plasma engines</h2>
<div class="scene-band">
  <FlightSceneInstrument config={corvette} label="Corvette plasma charge" />
</div>

<style>
.scene-band {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>
