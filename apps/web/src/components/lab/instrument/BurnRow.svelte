<script lang="ts">
import {
	BURN_IDS,
	BURNS,
	type BurnId,
	SECONDS,
	TICK_RATE,
	TOTAL_TICKS,
} from "../../../lib/instrument";
import Toggle from "../../inputs/Toggle.svelte";

// The burn row (lab-instrument study, 02.6 and 02.11): the compact B1–B3
// switcher, then the chosen burn's lanes (left engine above, right below), lit
// soft white, with the input firing at the current time in full white and a
// line at that time.
let {
	burn = $bindable(),
	tick,
}: {
	burn: BurnId;
	/** Current time in ticks. */
	tick: number;
} = $props();

const segments = $derived.by(() => {
	let start = 0;
	return BURNS[burn].segments.map((seg) => {
		const out = {
			...seg,
			left: (start / TOTAL_TICKS) * 100,
			width: (seg.ticks / TOTAL_TICKS) * 100,
			active: tick >= start && tick < start + seg.ticks,
		};
		start += seg.ticks;
		return out;
	});
});
const seconds = Array.from({ length: SECONDS + 1 }, (_, i) => i);
</script>

<div class="row">
	<Toggle
		compact
		label="Burn"
		options={BURN_IDS.map((id) => BURNS[id].label)}
		bind:value={
			() => BURNS[burn].label,
			(l) => (burn = BURN_IDS.find((id) => BURNS[id].label === l) ?? burn)
		}
	/>
	<div
		class="strip"
		role="img"
		aria-label={`${BURNS[burn].label}, ${BURNS[burn].name}: engine input over time`}
	>
		{#each ["L", "R"] as lane, i}
			<div class="lane" style={`top:${i * 16}px`}>
				<span class="gutter">{lane}</span>
				{#each segments as seg}
					{#if seg.input === "LR" || seg.input === lane}
						<span
							class="on"
							class:active={seg.active}
							style={`left:${seg.left}%;width:${seg.width}%`}
						></span>
					{/if}
				{/each}
			</div>
		{/each}
		<span class="time" style={`left:${(tick / TOTAL_TICKS) * 100}%`}></span>
		<div class="axis">
			{#each seconds as t}
				<span style={`left:${(t * TICK_RATE * 100) / TOTAL_TICKS}%`}>{t}</span>
			{/each}
		</div>
	</div>
</div>

<style>
/* The gap leaves room for the lanes' L and R labels. */
.row {
	display: flex;
	align-items: center;
	gap: 32px;
}
/* Two 12px lanes, a 4px gap, then the seconds: 44px, the control height. */
.strip {
	position: relative;
	flex: 1;
	height: 44px;
	font: 11px / 1 var(--font-family-ui);
}
.lane {
	position: absolute;
	left: 0;
	right: 0;
	height: 12px;
	background: var(--color-flight-trail);
}
.gutter {
	position: absolute;
	right: calc(100% + 6px);
	top: 50%;
	transform: translateY(-50%);
	color: var(--color-text-dim);
}
.on {
	position: absolute;
	top: 0;
	bottom: 0;
	box-sizing: border-box;
	border-right: 1px solid var(--color-void-light);
	background: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.on.active {
	background: var(--color-text);
}
.time {
	position: absolute;
	top: -4px;
	height: 36px;
	width: 1px;
	background: var(--color-text);
}
.axis {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 12px;
	color: var(--color-text-dim);
}
.axis span {
	position: absolute;
	transform: translateX(-50%);
}
</style>
