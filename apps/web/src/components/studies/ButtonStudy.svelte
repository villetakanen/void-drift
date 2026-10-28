<script lang="ts">
import "@void-drift/core/styles/buttons.css";

let { label = "Button composition examples" }: { label?: string } = $props();
let gameScreen = $state<"startup" | "playing" | "paused" | "setup" | "mode2">(
	"startup",
);
let arrangement = $state("vertical");
let narrow = $state(false);
let ticks = $state(0);
let paused = $state(true);
let dirty = $state(true);
let saving = $state(false);
let result = $state("Local demonstration only. No game data is changed.");
let dialog: HTMLDialogElement;
async function save() {
	saving = true;
	result = "Saving the example blueprint…";
	await new Promise((resolve) => setTimeout(resolve, 900));
	saving = false;
	dirty = false;
	result = "Example blueprint saved. Edit again to repeat.";
}
</script>
<section aria-label={label}>
	<h2>02 / Compare the composition</h2>
	<p>
		Two containers, one button language. Vertical groups stack equal-width
		buttons on a transparent background, as in startup and pause screens. Action
		strips use a solid background with supporting actions on the left and the
		main action anchored on the right.
	</p>
	<p>
		Switch between the two compositions below. Narrow strips deliberately stack
		their groups while retaining the strip background; they do not become
		transparent navigation groups.
	</p>
	<p>
		<strong>Spacing contract:</strong>
		every button container has padding on all four sides equal to its button
		gap, even when transparent. Vertical groups use compact spacing (8px);
		action strips use minimal spacing (8px). Anchored groups may have additional
		flexible space between them; their minimum gap and outer padding remain 8px.
	</p>
	<div class="controls">
		<label
			>Arrangement
			<select bind:value={arrangement}>
				<option value="vertical">A · Vertical button group</option>
				<option value="strip">B · Anchored action strip</option>
			</select></label
		>
		<label><input type="checkbox" bind:checked={narrow}> Narrow panel</label>
	</div>
	<div class="examples" class:narrow>
		<article>
			<p class="tag">GAME / STATE NAVIGATION</p>
			<h3>
				{gameScreen === "startup"
					? "Ready to fly"
					: gameScreen === "playing"
						? "Flight in progress"
						: gameScreen === "paused"
							? "Game paused"
							: gameScreen === "setup"
								? "Game setup"
								: "Game mode two"}
			</h3>
			<p>
				Start and Continue are primary navigation actions. Setup and mode
				selection are supporting destinations in the same game flow.
			</p>
			<div
				class="actions button-group"
				class:button-group--vertical={arrangement === "vertical"}
				class:button-group--strip={arrangement === "strip"}
			>
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => (gameScreen = "setup")}
						disabled={gameScreen === "setup"}
					>
						Setup
					</button>
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => (gameScreen = "mode2")}
						disabled={gameScreen === "mode2"}
					>
						Game mode two
					</button>
				</div>
				<button
					type="button"
					class="btn btn-filled"
					onclick={() =>
						(gameScreen = gameScreen === "playing" ? "paused" : "playing")}
				>
					{gameScreen === "playing"
						? "Pause game"
						: gameScreen === "paused"
							? "Continue game"
							: "Start game"}
				</button>
			</div>
			<p class="detail" role="status">
				Example state: {gameScreen}. Mode two and setup are illustrative
				destinations; no game is running.
			</p>
		</article>

		<article>
			<p class="tag">PLAYER SHIP DESIGNER / DATA ACTIONS</p>
			<h3>Kestrel blueprint</h3>
			<p>
				Players save their own ship designs here. Settings use the same
				save/revert pattern. Save keeps its position through idle, busy, and
				saved states.
			</p>
			<div
				class="actions button-group"
				class:button-group--vertical={arrangement === "vertical"}
				class:button-group--strip={arrangement === "strip"}
			>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => {
						dirty = true;
						result = "Example blueprint edited.";
					}}
				>
					Edit example
				</button>
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						disabled={saving || !dirty}
						onclick={() => {
							dirty = false;
							result = "Example changes reverted.";
						}}
					>
						Revert
					</button><button
						type="button"
						class="btn btn-filled"
						disabled={saving || !dirty}
						aria-busy={saving}
						onclick={save}
					>
						{saving ? "Saving…" : dirty ? "Save blueprint" : "Saved"}
					</button>
				</div>
			</div>
		</article>
		<article>
			<p class="tag">LAB / SHARED APPLICATION LANGUAGE</p>
			<h3>Replay controls</h3>
			<p>
				The same button styling and hierarchy serve developer tools. Transport
				belongs together; reset is a separate operation.
			</p>
			<div
				class="actions button-group"
				class:button-group--vertical={arrangement === "vertical"}
				class:button-group--strip={arrangement === "strip"}
			>
				<div class="button-group__section">
					<button
						type="button"
						class="btn btn-ghost"
						aria-pressed={!paused}
						onclick={() => {
							paused = !paused;
							result = paused
								? "Replay paused."
								: "Replay selected: illustrative state, no simulation running.";
						}}
					>
						{paused ? "Play" : "Pause"}
					</button><button
						type="button"
						class="btn btn-ghost"
						disabled={!paused}
						onclick={() => (ticks += 1)}
					>
						Step 1 frame
					</button>
				</div>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => {
						ticks = 0;
						paused = true;
						result = "Example replay reset.";
					}}
				>
					Reset replay
				</button>
			</div>
			<p class="detail">
				Tick {ticks} · Step is available while paused. Transport is a fixture;
				use the flight Lab to assess real playback.
			</p>
		</article>
	</div>
	<p role="status" class="feedback">{result}</p>
</section>
<section>
	<h2>03 / Hierarchy & states</h2>
	<p>
		Filled lime marks the main goal, whether navigation or saving; lime-outline
		ghost buttons support it. Red indicates consequence, not priority. Selected
		is a persistent state (Play/Pause above); pressed is momentary. Hover and
		keyboard focus must remain distinct.
	</p>
	<div class="states">
		<button
			type="button"
			class="btn btn-filled"
			onclick={() => (result = "Primary action activated.")}
		>
			Primary action
		</button><button
			type="button"
			class="btn btn-ghost"
			onclick={() => (result = "Secondary action activated.")}
		>
			Secondary action
		</button><button type="button" class="btn btn-ghost" disabled>
			Unavailable
		</button><button
			type="button"
			class="btn btn-danger"
			onclick={() => dialog.showModal()}
		>
			Destructive action…
		</button>
	</div>
	<p>
		Try Tab, Shift+Tab, Enter, and Space. Focus uses an inset outline so the
		button shape cannot clip it. All targets retain at least 44px height. Busy
		and unavailable controls cannot run again.
	</p>
</section>
<dialog bind:this={dialog}>
	<h2>Discard example changes?</h2>
	<p>This only changes the demonstration message.</p>
	<form method="dialog" class="actions button-group button-group--strip">
		<button type="submit" class="btn btn-ghost">Keep editing</button
		><button
			type="submit"
			class="btn btn-danger"
			onclick={() => (result = "Example changes discarded.")}
		>
			Discard changes
		</button>
	</form>
</dialog>
<style>
.controls,
.states {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-md);
	margin-block: var(--spacing-md);
}
label {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
select {
	background: var(--color-void-light);
	color: var(--color-text);
	padding: var(--spacing-sm);
	min-height: 44px;
	border: var(--flight-border);
}
.examples {
	display: grid;
	gap: var(--spacing-md);
}
.examples.narrow {
	max-width: 360px;
}
article,
dialog {
	background: var(--color-void-light);
	border: var(--flight-border);
	padding: var(--spacing-lg);
	color: var(--color-text);
}
article {
	container-type: inline-size;
}
h3 {
	font-size: var(--font-large);
	margin-block: var(--spacing-md);
}
.tag,
.detail {
	font: var(--font-small) var(--font-flight);
	color: var(--color-text-dim);
}
.actions {
	margin-top: var(--spacing-lg);
}

.feedback {
	border-left: 3px solid var(--color-acid-lime);
	padding: var(--spacing-md);
	min-height: 70px;
}
dialog {
	max-width: min(520px, 90vw);
	margin: auto;
}
dialog::backdrop {
	background: var(--color-overlay);
}
</style>
