<script lang="ts">
import { onMount } from "svelte";
import { version } from "../../package.json";
import Logo from "./Logo.svelte";

let { onStart, disabled = false }: { onStart: () => void; disabled?: boolean } =
	$props();
let startButton: HTMLButtonElement;
let hint = $state(0);
let portrait = $state(false);
const hints = [
	"A / D or ← / → steer. Hold both to accelerate. On touchscreens, use the engine pads.",
	"Survive as long as you can. Keep clear of stars and planets.",
	"Visit Hangar to choose another ship and try a test flight.",
];

onMount(() => {
	const resize = () => {
		portrait = window.innerWidth <= window.innerHeight;
	};
	resize();
	window.addEventListener("resize", resize);
	startButton.focus();
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const timer = window.setInterval(() => {
		if (!motion.matches && !portrait) hint = (hint + 1) % hints.length;
	}, 8000);
	return () => {
		window.removeEventListener("resize", resize);
		window.clearInterval(timer);
	};
});
</script>

<div class="title-screen">
	<div class="title-slot">
		<section class="title-panel panel" aria-label="Game menu">
			<div class="identity">
				<Logo size="sm" />
				<h1>VOID DRIFT</h1>
			</div>
			<nav aria-label="Title screen">
				<div class="button-group button-group--vertical">
					<button
						bind:this={startButton}
						type="button"
						class="btn btn-filled"
						{disabled}
						onclick={onStart}
					>
						PRESS START
					</button>
					<a href="/builder" class="btn btn-ghost">HANGAR · CHOOSE SHIPS</a>
					<a href="/leaderboard" class="btn btn-ghost">TOP SCORES</a>
					<a href="/settings" class="btn btn-ghost">SETTINGS</a>
					<a href="/credits" class="btn btn-ghost">CREDITS</a>
				</div>
			</nav>
			<p class="version">{version}</p>
		</section>
		<aside class="hint" aria-label="Flight hint">
			{#if portrait}
				<p role="status" class="orientation-warning">
					Rotate your screen to landscape.
				</p>
			{:else}
				{#key hint}
					<p>{hints[hint]}</p>
				{/key}
			{/if}
		</aside>
	</div>
</div>

<style>
.title-screen {
	position: fixed;
	inset: 0;
	display: grid;
	place-items: center;
	pointer-events: none;
}
.title-slot {
	position: relative;
	width: min(100%, calc(100dvh * 16 / 9));
	aspect-ratio: 16 / 9;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	align-items: center;
	gap: var(--spacing-xl);
	padding: var(--spacing-md);
	box-sizing: border-box;
}
.title-panel {
	width: 100%;
	max-width: 26rem;
	justify-self: center;
	padding: var(--spacing-md);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-sm);
	pointer-events: auto;
}
.identity {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-sm);
	color: var(--color-brand);
}
.identity h1 {
	margin: 0;
	color: var(--color-text);
	font-size: var(--font-size-heading);
}
.title-panel nav {
	width: 100%;
}
.hint {
	max-width: 32rem;
	color: var(--color-android-green);
	line-height: var(--line-height-ui);
	pointer-events: auto;
}
.hint p {
	animation: appear 600ms ease both;
}
.hint .orientation-warning {
	animation: none;
}
.version {
	margin: 0;
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
	text-align: center;
}
@keyframes appear {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
@media (prefers-reduced-motion: reduce) {
	.hint p {
		animation: none;
	}
}
</style>
