<script lang="ts">
// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { slot?: string; "client:only"?: string; "client:load"?: boolean } =
	$props();

import { drawShip } from "@void-drift/core";
import {
	drawBuild,
	SHIP_PROFILE_BY_ID,
	type ShipProfileId,
	starterLoadout,
} from "@void-drift/mode-a";
import Canvas from "../Canvas.svelte";
import { shipParams } from "./ship-state.svelte";

let stageWidth = $state(600);
let stageHeight = $state(400);

function drawShipPreview(ctx: CanvasRenderingContext2D) {
	const cx = ctx.canvas.width / 2;
	const cy = ctx.canvas.height / 2;
	const profile = SHIP_PROFILE_BY_ID[shipParams.profileId as ShipProfileId];

	if (profile.id === "fiddler") {
		drawBuild(
			ctx,
			starterLoadout("fiddler"),
			cx,
			cy,
			(shipParams.rotation * Math.PI) / 180,
			2,
		);
		return;
	}
	drawShip(ctx, {
		x: cx,
		y: cy,
		rotation: shipParams.rotation * (Math.PI / 180),
		size: 2,
		color: profile.tint,
		variant: profile.id,
	});
}
</script>

<div
	class="stage-content"
	bind:clientWidth={stageWidth}
	bind:clientHeight={stageHeight}
>
	<Canvas width={stageWidth} height={stageHeight} draw={drawShipPreview} />
</div>

<style>
.stage-content {
	flex: 1;
	display: flex;
	overflow: hidden;
	position: relative;
	background-image:
		linear-gradient(var(--color-border-faint) 1px, transparent 1px),
		linear-gradient(90deg, var(--color-border-faint) 1px, transparent 1px);
	background-size: 20px 20px;
}
</style>
