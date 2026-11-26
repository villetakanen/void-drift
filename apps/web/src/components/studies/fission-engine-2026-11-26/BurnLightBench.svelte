<script lang="ts">
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  BURN_SCENE,
  BurnIdeaSchema,
  burnLight,
  GAME_LIGHT,
} from "./burn-light";

// Fission engine 02.3 in the Flight scene instrument: the game's pulsed
// flight on a Fighter, with the push painted one of three ways or as the game
// paints it today.
const options = [...BurnIdeaSchema.options, GAME_LIGHT];
let shown = $state<string>(BurnIdeaSchema.options[0]);
const light = $derived(shown === GAME_LIGHT ? undefined : burnLight(shown));
const _props: { "client:visible"?: boolean } = $props();
</script>

<FlightSceneInstrument
  config={BURN_SCENE}
  label="Fission engine 02.3: what one push shows"
  summary={"Fighter · Fission in the left aft slot · Service ions on the sides\nThe game’s pulse: 0.18 s of thrust in every 0.45 s"}
  {light}
>
  {#snippet pane()}
    <h3>What the push shows</h3>
    <SegmentedControl
      label="What the push shows"
      {options}
      bind:value={shown}
      stretch
    />
    <p>
      Thrown matter: a white flash, then green sparks thrown aft that fork once.
      Burning path: a white core for as long as the push lasts, laying a green
      bar along the ship’s path. Marked place: a white flash, then a green glow
      that stays where the push went off. Game today is the amber beam.
    </p>
    <p>
      Flight is the game’s in all four. The light affects nothing it touches.
    </p>
  {/snippet}
</FlightSceneInstrument>
