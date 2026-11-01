<script lang="ts">
import { type Snippet, tick as settled } from "svelte";

// The pane overlay (lab-instrument study, 01 and 03). Placed on its container,
// unscaled: hidden at first; a menu button in the container's top-right corner
// opens it; its close button takes that corner; Escape closes it when focus is
// inside, returning focus to the menu. Elevation 3, 45% wide, over an 11%
// backdrop. The host must be positioned.
let {
	title = "Values",
	label = "Values under investigation",
	children,
}: {
	title?: string;
	/** Accessible name of the pane. */
	label?: string;
	children: Snippet;
} = $props();

let open = $state(false);
let menuEl = $state<HTMLButtonElement>();
let closeEl = $state<HTMLButtonElement>();
let paneEl = $state<HTMLElement>();
function setOpen(next: boolean) {
	open = next;
	if (next) settled().then(() => closeEl?.focus());
	else menuEl?.focus();
}
function keydown(e: KeyboardEvent) {
	if (e.key === "Escape" && open && paneEl?.contains(document.activeElement))
		setOpen(false);
}
const id = `pane-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svelte:window onkeydown={keydown} />

<button
	bind:this={menuEl}
	type="button"
	class="corner menu"
	aria-label={`Open ${title.toLowerCase()}`}
	aria-expanded={open}
	aria-controls={id}
	onclick={() => setOpen(true)}
>
	☰
</button>
<div class="backdrop" hidden={!open}></div>
<aside bind:this={paneEl} {id} class="pane" hidden={!open} aria-label={label}>
	<div class="head">
		<h3>{title}</h3>
		<button
			bind:this={closeEl}
			type="button"
			class="corner"
			aria-label={`Close ${title.toLowerCase()}`}
			onclick={() => setOpen(false)}
		>
			×
		</button>
	</div>
	{@render children()}
</aside>

<style>
/* The menu button and the pane's close button share one corner. */
.corner {
	width: 48px;
	min-height: 40px;
	padding: 0;
	background: transparent;
	color: var(--color-action);
	border: 1px solid var(--color-action);
	font: 20px var(--font-family-ui);
	cursor: pointer;
}
.corner:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
.menu {
	position: absolute;
	top: var(--spacing-sm);
	right: var(--spacing-sm);
}
.backdrop {
	position: absolute;
	inset: 0;
	background: var(--color-backdrop);
}
.pane {
	position: absolute;
	inset-block: 0;
	right: 0;
	z-index: 1;
	width: 45%;
	box-sizing: border-box;
	overflow: auto;
	padding: 0 var(--spacing-md) var(--spacing-md);
	background: var(--color-elev-3);
	color: var(--color-text);
	font: 15px var(--font-family-ui);
}
.backdrop[hidden],
.pane[hidden] {
	display: none;
}
.head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-right: calc(var(--spacing-sm) - var(--spacing-md));
	padding-top: var(--spacing-sm);
}
h3 {
	margin: 0;
	font-size: 19px;
	font-weight: normal;
}
</style>
