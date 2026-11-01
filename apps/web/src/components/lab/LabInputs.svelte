<script lang="ts">
import "./catalog.css";
import RingSlider from "../inputs/RingSlider.svelte";
import Toggle from "../inputs/Toggle.svelte";

// Reference for the inputs beside the buttons: the toggle and the ring slider.
let { label = "Toggle and slider design system" }: { label?: string } =
	$props();

let two = $state("Fit all");
let three = $state("B1");
let stretched = $state("B2");
let time = $state(7);
let thrust = $state(38000);
</script>

<section class="catalog" aria-label={label}>
	<section>
		<h2>Toggle</h2>
		<p>
			One button-shaped control split into equal parts, one per option. The
			outer edge has the buttons' cut corners; the split inside is straight. The
			selected part is filled lime; the others are a faint fill that takes a
			faint lime tint under a pointer. Arrow keys move the selection.
			<a href="/lab/studies/lab-instrument-2026-11-01#toggle">Study →</a>
		</p>
		<div class="example">
			<span class="caption">Two options</span>
			<Toggle
				label="Path scale"
				options={["Fit all", "Default scale"]}
				bind:value={two}
			/>
			<span class="caption">Three options, compact, beside a diagram</span>
			<Toggle
				compact
				label="Burn"
				options={["B1", "B2", "B3"]}
				bind:value={three}
			/>
			<span class="caption">Stretched to its container</span>
			<div style="width: 100%; max-width: 480px">
				<Toggle
					stretch
					label="Burn, stretched"
					options={["B1", "B2", "B3"]}
					bind:value={stretched}
				/>
			</div>
		</div>
		<p>
			<code>Toggle</code>: <code>options</code>, bindable <code>value</code>,
			<code>label</code>
			for the group, <code>compact</code> for 8px side padding,
			<code>stretch</code>
			to fill the width.
		</p>
	</section>

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
