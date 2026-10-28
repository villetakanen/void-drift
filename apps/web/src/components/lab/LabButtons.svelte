<script lang="ts">
let { label = "Button design system" }: { label?: string } = $props();
let selected = $state(false);
let saving = $state(false);
let message = $state("Interactive examples only; no game data is changed.");
async function save() {
	saving = true;
	message = "Saving example…";
	await new Promise((resolve) => setTimeout(resolve, 900));
	saving = false;
	message = "Example saved.";
}
</script>
<section class="catalog" aria-label={label}>
	<p>
		One button language for game-state navigation, player data actions, and Lab
		tools.
		<a href="/lab/studies/buttons">Accepted study and decision history →</a>
	</p>
	<section>
		<h2>Vertical group</h2>
		<p>
			Equal-width buttons; transparent container; 8px padding and gaps. Use for
			startup, pause, and navigation menus.
		</p>
		<div class="example">
			<div
				class="button-group button-group--vertical"
				data-testid="vertical-buttons"
			>
				<button
					type="button"
					class="btn btn-filled"
					onclick={() => (message = "Continue game selected.")}
				>
					Continue game
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => (message = "Setup selected.")}
				>
					Setup
				</button>
				<a class="btn btn-ghost" href="/">Back to game</a>
			</div>
		</div>
	</section>
	<section>
		<h2>Anchored action strip</h2>
		<p>
			Solid void background; 8px padding and minimum gaps. Supporting actions
			lead; the primary action trails. Below 580px of container width, groups
			stack deliberately.
		</p>
		<div class="example button-group-frame">
			<div class="button-group button-group--strip" data-testid="strip-buttons">
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						disabled={saving}
						onclick={() => (message = "Example reset.")}
					>
						Reset form
					</button>
				</div>
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						disabled={saving}
						onclick={() => (message = "Example changes reverted.")}
					>
						Revert
					</button><button
						type="button"
						class="btn btn-filled"
						disabled={saving}
						aria-busy={saving}
						onclick={save}
					>
						{saving ? "Saving…" : "Save settings"}
					</button>
				</div>
			</div>
		</div>
	</section>
	<section>
		<h2>Hierarchy and states</h2>
		<p>
			Filled primary, outlined secondary, red consequence, and link treatment.
			Tab through the examples to inspect the inset focus ring. Selected and
			disabled states share system tokens.
		</p>
		<div class="example button-group-frame">
			<div class="button-group button-group--strip">
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						aria-pressed={selected}
						onclick={() => (selected = !selected)}
					>
						Selected: {selected ? "on" : "off"}
					</button><button type="button" class="btn btn-ghost" disabled>
						Unavailable
					</button>
				</div>
				<button
					type="button"
					class="btn btn-danger"
					onclick={() =>
						(message = "Destructive example activated; nothing deleted.")}
				>
					Discard example
				</button>
			</div>
		</div>
		<a class="btn btn-link" href="/lab/studies/buttons#token-audit-title"
			>Read the token audit</a
		>
	</section>
	<p role="status">{message}</p>
	<section>
		<h2>Token contract</h2>
		<ul>
			<li>
				Spacing: <code>--spacing-sm</code> (8px), privately aliased as
				<code>--_group-spacing</code>.
			</li>
			<li>
				Control height: <code>--control-min-height</code> (44px). Font:
				<code>--font-control-size</code>
				(1rem),
				<code>--font-weight-medium</code>
				(500).
			</li>
			<li>
				Color: lime <code>--color-acid-lime</code>, void
				<code>--color-void</code>, consequence <code>--color-red</code>.
			</li>
			<li>
				States: <code>--state-disabled-opacity</code> (0.45),
				<code>--state-hover-brightness</code>
				(1.2),
				<code>--state-selected-indicator-width</code>
				(4px).
			</li>
			<li>
				Focus: <code>--color-focus-ring</code>,
				<code>--focus-ring-width</code>
				(2px),
				<code>--focus-ring-offset-inset</code>
				(−5px).
			</li>
			<li>
				Motion: <code>--duration-fast</code> (150ms),
				<code>--ease-standard</code>
				(ease). Reduced motion removes transitions.
			</li>
			<li>
				Private composition: <code>--_cut-size</code>,
				<code>--_outline-inset</code>, <code>--_radius</code>,
				<code>--_line-height</code>, <code>--_transition</code>; vertical groups
				own <code>--_stack-max</code> (320px).
			</li>
		</ul>
		<p>
			Existing public <code>--button-*</code> names remain compatibility
			aliases. Use shared foundations for new cross-component styling; do not
			override private properties. Use native disabled buttons; disabled links
			need activation suppression as well as ARIA state.
		</p>
	</section>
</section>
<style>
.catalog {
	padding: var(--spacing-lg);
	font-family: var(--font-display);
	display: grid;
	gap: var(--spacing-lg);
}
section {
	min-width: 0;
}
h2 {
	font-size: var(--font-large);
	margin-bottom: var(--spacing-md);
}
p,
li {
	line-height: 1.6;
}
p {
	margin-block: var(--spacing-md);
}
a,
code {
	color: var(--color-acid-lime);
}
.example {
	background: var(--color-void-light);
	padding: var(--spacing-md);
}
[role="status"] {
	padding: var(--spacing-md);
	border: var(--flight-border);
}
code {
	overflow-wrap: anywhere;
}
</style>
