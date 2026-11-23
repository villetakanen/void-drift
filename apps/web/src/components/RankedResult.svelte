<script lang="ts">
import {
  InitialsSchema,
  isNewPersonalBest,
  loadPersonalBest,
  type RankedRun,
  scoresAvailable,
  submitHighScore,
} from "@void-drift/mode-a";
import { onMount, tick } from "svelte";
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
let view = $state<View>(
  scoresAvailable() ? { step: "checking" } : { step: "offline" },
);
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
  if (view.step === "checking") void check();
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
const placeholder = $derived(view.step === "checking");
const complete = $derived(InitialsSchema.safeParse(initials).success);

/* A control that held focus and is gone hands focus to the dialog's own
   default control instead of dropping it to the page; while a check is
   pending that is the dialog itself. After a check, focus lands only if it
   is still on the dialog: on the field of a new best, else the default. */
let root: HTMLElement;
let saveButton: HTMLButtonElement | undefined = $state();
let fields: { focus: () => void } | undefined = $state();
let held: Element | null = null;
let wasChecking = true;
const dialog = () => root.closest<HTMLElement>('[role="dialog"]');
const defaultControl = () =>
  dialog()?.querySelector<HTMLElement>("[data-autofocus]");
$effect.pre(() => {
  void view;
  const focused = document.activeElement;
  held = root?.contains(focused) ? focused : null;
});
$effect(() => {
  const step = view.step;
  const gone = held && !held.isConnected;
  held = null;
  const resolved = wasChecking && step !== "checking";
  wasChecking = step === "checking";
  if (step === "checking") {
    if (gone) dialog()?.focus();
    return;
  }
  if (resolved && document.activeElement === dialog()) {
    if (step === "entry") {
      if (complete) saveButton?.focus();
      else fields?.focus();
    } else defaultControl()?.focus();
  } else if (gone) defaultControl()?.focus();
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

<div
  class="ranked-result"
  bind:this={root}
  data-hold-focus={placeholder ? "" : undefined}
>
  <p class="ranked-status" role="status">{status}</p>
  {#if view.step === "unavailable"}
    <button type="button" class="btn btn-filled" onclick={check}>
      Check Again
    </button>
  {:else if entry || placeholder}
    <form class="ranked-entry" onsubmit={save}>
      <span
        class="ranked-initials"
        onkeydowncapture={hold}
        onbeforeinputcapture={hold}
        onpastecapture={hold}
      >
        <Initials
          bind:this={fields}
          disabled={placeholder}
          bind:value={
            () => initials,
            (value) => {
  // The initials stay as submitted while a save is in flight.
  if (busy) return;
  const was = complete;
  initials = value;
  if (!was && InitialsSchema.safeParse(value).success)
    void tick().then(() => saveButton?.focus());
}
          }
          host={2}
        />
      </span>
      <button
        type="submit"
        class="btn btn-filled"
        bind:this={saveButton}
        disabled={placeholder || (!busy && !complete)}
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
