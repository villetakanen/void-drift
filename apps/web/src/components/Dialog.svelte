<script lang="ts" module>
// Dialogs can hand over to each other (run complete → menu); count holders
// so one closing does not release a stage the next one has taken.
const holders = new WeakMap<Element, number>();
function hold(stage: Element) {
	holders.set(stage, (holders.get(stage) ?? 0) + 1);
	stage.setAttribute("inert", "");
}
function release(stage: Element) {
	const left = (holders.get(stage) ?? 1) - 1;
	holders.set(stage, left);
	if (left <= 0) stage.removeAttribute("inert");
}
</script>

<script lang="ts">
import { onMount, type Snippet } from "svelte";

// The one dialog behaviour (docs/specs/dialogs.md). Place it beside the stage
// it covers, inside a positioned host; the stage is the sibling marked
// `data-stage`. While open, the stage is inert and shaded (the scrim), and
// its `data-hud` parts are hidden. Focus moves to `[data-autofocus]`, else
// the first control, else the panel; on close it returns to where it was.
// Escape calls `onclose`; leave `onclose` out where closing is not allowed.
let {
	label,
	onclose,
	returnFocus = true,
	class: className = "",
	children,
}: {
	/** Accessible name of the dialog. */
	label: string;
	onclose?: () => void;
	/** False where closing hands the keyboard to the game, not back. */
	returnFocus?: boolean;
	/** Extra classes for the panel. */
	class?: string;
	children: Snippet;
} = $props();

let layer: HTMLElement;
let panel: HTMLElement;

const CONTROLS =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

onMount(() => {
	const previous =
		document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
	const stage = layer.parentElement?.querySelector(":scope > [data-stage]");
	if (stage) hold(stage);
	const target =
		panel.querySelector<HTMLElement>("[data-autofocus]") ??
		panel.querySelector<HTMLElement>(CONTROLS) ??
		panel;
	target.focus();
	return () => {
		if (stage) release(stage);
		if (returnFocus && previous?.isConnected && !previous.closest("[inert]"))
			previous.focus();
	};
});

function keydown(event: KeyboardEvent) {
	if (event.key !== "Escape" || !onclose) return;
	event.preventDefault();
	onclose();
}
</script>

<svelte:window onkeydown={keydown} />

<div class="dialog-layer" bind:this={layer}>
	<div class="dialog-scrim" aria-hidden="true"></div>
	<div
		bind:this={panel}
		class={`panel ${className}`}
		role="dialog"
		aria-label={label}
		tabindex="-1"
	>
		{@render children()}
	</div>
</div>
