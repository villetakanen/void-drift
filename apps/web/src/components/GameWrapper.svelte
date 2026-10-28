<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
	$props();

import FlightDeck from "./FlightDeck.svelte";
</script>
<FlightDeck />
