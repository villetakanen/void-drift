<script lang="ts">
import {
  InitialsSchema,
  isNewPersonalBest,
  loadPersonalBest,
  type RankedRun,
  scoresAvailable,
  submitHighScore,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { readInitials, rememberInitials } from "../lib/stores/initials";
import Initials from "./inputs/Initials.svelte";

/* The ranked result action of game over: checks the player's stored best for
   the run's challenge and ship, and offers to save a new one. It lives only
   as long as its completed run is on screen; anything that finishes after
   that changes nothing and navigates nowhere. */
let {
  run,
  onsaved,
}: {
  run: RankedRun;
  /** Called once this run is the stored best. */
  onsaved: () => void;
} = $props();

type View =
  | { step: "offline" }
  | { step: "checking" }
  | { step: "unavailable"; error: string }
  | { step: "stands"; best: number; raced?: boolean }
  | { step: "entry"; error?: string }
  | { step: "saving" }
  | { step: "saved" };
let view = $state<View>({ step: "checking" });
let initials = $state("");
let current = true;
let checking = false;

async function check() {
  if (!current || checking) return;
  view = { step: "checking" };
  checking = true;
  const best = await loadPersonalBest(run.shipId);
  checking = false;
  if (!current) return;
  if (best.status === "unavailable")
    view = { step: "unavailable", error: best.error };
  else if (best.status === "found" && !isNewPersonalBest(best, run.score))
    view = { step: "stands", best: best.score };
  else view = { step: "entry" };
}

async function submit() {
  if (!current || view.step !== "entry" || !complete) return;
  const signed = initials;
  view = { step: "saving" };
  const result = await submitHighScore({ ...run, initials: signed });
  if (!current) return;
  if (result.outcome === "saved") {
    // Remembering is a convenience; the save stands whether it works or not.
    rememberInitials(signed);
    view = { step: "saved" };
    onsaved();
  } else if (result.outcome === "kept")
    view = { step: "stands", best: result.best, raced: true };
  else view = { step: "entry", error: result.error };
}

onMount(() => {
  initials = readInitials();
  if (scoresAvailable()) void check();
  else view = { step: "offline" };
  return () => {
    current = false;
  };
});

const status = $derived.by(() => {
  switch (view.step) {
    case "offline":
      return "Score submission is currently unavailable.";
    case "checking":
      return "Checking your best with this ship…";
    case "unavailable":
      return `Your best could not be checked. ${view.error}`;
    case "stands":
      return view.raced
        ? `Your best with this ship is already ${view.best}. This run was not saved.`
        : `Your best with this ship stands at ${view.best}.`;
    case "entry":
      return view.error
        ? `Score not saved. ${view.error} Your initials are kept; save again.`
        : "New best with this ship. Sign it with your initials.";
    case "saving":
      return "Saving score…";
    case "saved":
      return "Score saved. Opening Top Scores…";
  }
});
const entry = $derived(
  view.step === "entry" || view.step === "saving" || view.step === "saved",
);
const busy = $derived(view.step === "saving" || view.step === "saved");
const complete = $derived(InitialsSchema.safeParse(initials).success);

/* A control that held focus and is gone hands focus to the dialog's own
   default control instead of dropping it to the page. */
let root: HTMLElement;
let held: Element | null = null;
$effect.pre(() => {
  void view;
  const focused = document.activeElement;
  held = root?.contains(focused) ? focused : null;
});
$effect(() => {
  void view;
  if (!held || held.isConnected) return;
  held = null;
  root
    .closest<HTMLElement>('[role="dialog"]')
    ?.querySelector<HTMLElement>("[data-autofocus]")
    ?.focus();
});

/* While a save is in flight the initials stay as submitted: keys, typing and
   paste that would change them never reach the field. Tab still moves on. */
function hold(event: Event) {
  if (!busy) return;
  if (event instanceof KeyboardEvent && event.key === "Tab") return;
  if (event instanceof KeyboardEvent && (event.metaKey || event.ctrlKey))
    return;
  event.preventDefault();
  event.stopPropagation();
}

function save(event: SubmitEvent) {
  event.preventDefault();
  void submit();
}
</script>

<div class="ranked-result" bind:this={root}>
  <p class="ranked-status" role="status">{status}</p>
  {#if view.step === "unavailable"}
    <button type="button" class="btn btn-filled" onclick={check}>
      Check Again
    </button>
  {:else if entry}
    <form class="ranked-entry" onsubmit={save}>
      <span
        class="ranked-initials"
        onkeydowncapture={hold}
        onbeforeinputcapture={hold}
        onpastecapture={hold}
      >
        <Initials
          bind:value={
            () => initials,
            (value) => {
  // The initials stay as submitted while a save is in flight.
  if (!busy) initials = value;
}
          }
          host={2}
        />
      </span>
      <button
        type="submit"
        class="btn btn-filled"
        disabled={!busy && !complete}
        aria-disabled={busy ? "true" : undefined}
      >
        {view.step === "saving"
          ? "Saving…"
          : view.step === "saved"
            ? "Saved"
            : "Save Score"}
      </button>
    </form>
  {/if}
</div>

<style>
.ranked-result,
.ranked-entry {
  display: grid;
  gap: var(--spacing-md);
}
.ranked-initials {
  justify-self: center;
}
</style>
