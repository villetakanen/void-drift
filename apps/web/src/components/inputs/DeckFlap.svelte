<script lang="ts">
interface Props {
  kind: "pause" | "auto" | "off" | "emergency";
  /** Omit for a passive readout. */
  onactivate?: () => void;
  /** Align with a production turn pad underneath. */
  abovePad?: boolean;
  button?: HTMLButtonElement;
}

let { kind, onactivate, abovePad, button = $bindable() }: Props = $props();
const pause = $derived(kind === "pause");
const emergency = $derived(kind === "emergency");
const operable = $derived(onactivate !== undefined && !emergency);

const tapSlop = 10; // CSS pixels; a moving thumb is not a tap.
let touchStart: { button: HTMLButtonElement; touch: Touch } | undefined;

type FlapTouchEvent = TouchEvent & { currentTarget: HTMLButtonElement };

function startTap(event: FlapTouchEvent) {
  const touch = Array.from(event.changedTouches).find((touch) =>
    event.currentTarget.contains(touch.target as Node),
  );
  touchStart = touch && { button: event.currentTarget, touch };
}

function changedTouch(event: FlapTouchEvent) {
  if (touchStart?.button !== event.currentTarget) return;
  const { identifier } = touchStart.touch;
  return Array.from(event.changedTouches).find(
    (touch) => touch.identifier === identifier,
  );
}

function moved(touch: Touch) {
  const start = touchStart?.touch;
  return (
    !start ||
    Math.hypot(touch.clientX - start.clientX, touch.clientY - start.clientY) >
      tapSlop
  );
}

function moveTap(event: FlapTouchEvent) {
  const touch = changedTouch(event);
  if (touch && moved(touch)) touchStart = undefined;
}

function cancelTap(event: FlapTouchEvent) {
  if (changedTouch(event)) touchStart = undefined;
}

function finishTap(event: FlapTouchEvent) {
  // A second finger may never get a click. Handle its completed tap here,
  // and suppress the compatibility click (also for rejected gestures).
  event.preventDefault();
  const touch = changedTouch(event);
  if (!touch) return;
  const isTap = !moved(touch);
  touchStart = undefined;
  // Touch events keep their start target; hit-test the skewed pane at release.
  if (
    isTap &&
    operable &&
    event.currentTarget.contains(
      document.elementFromPoint(touch.clientX, touch.clientY),
    )
  )
    onactivate?.();
}
</script>

{#snippet marking()}
  <span class="mark">
    <strong>{pause ? "Pause" : emergency ? "Emergency" : "Weapons"}</strong>
    {#if !pause}
      <span>{emergency ? "Low energy" : kind === "auto" ? "Auto" : "Off"}</span>
    {/if}
  </span>
{/snippet}

<div class="flap-slot" class:above-pad={abovePad}>
  {#if operable}
    <button
      bind:this={button}
      type="button"
      class={["flap", kind]}
      aria-label={pause ? undefined : "Automatic weapons"}
      aria-pressed={pause ? undefined : kind === "auto"}
      aria-keyshortcuts={pause ? "Escape" : "Shift"}
      onclick={onactivate}
      ontouchstart={startTap}
      ontouchmove={moveTap}
      ontouchcancel={cancelTap}
      ontouchend={finishTap}
    >
      <span class="art" aria-hidden="true"></span>
      {@render marking()}
      {#if !pause}
        <span class="cue" aria-hidden="true"><strong>⇧</strong>Shift</span>
      {/if}
    </button>
  {:else}
    <div class={["flap", kind]} role={emergency ? "alert" : undefined}>
      <span class="art" aria-hidden="true"></span>
      {@render marking()}
    </div>
  {/if}
</div>

<style>
.flap-slot {
  --flap-width: 172.3px;
  --flap-height: 128px;
  --flap-inset: 4px;
  --flap-gap: 16px;
  --flap-angle: 30deg;
  width: var(--flap-width);
  height: calc(var(--flap-height) + var(--flap-width) * tan(var(--flap-angle)));
  pointer-events: none;
}

.above-pad {
  /* The skew adds to the bounding box, not the height at the bezel. The
     lower edge follows the pad's slope, leaving a gap even over its box. */
  height: var(--flap-height);
  margin: 0 var(--flap-inset)
    calc(var(--flap-gap) - var(--flap-inset) * tan(var(--flap-angle)));
}

.flap {
  --angle: calc(-1 * var(--flap-angle));
  --origin: right;
  --surface: var(--color-elev-3);
  --fill: color-mix(in lch, var(--surface) 16%, transparent);
  --edge: var(--surface);
  --edge-width: 1.5px;
  --stripe: color-mix(in lch, var(--color-resource-hull) 25%, transparent);
  --stripe-angle: -45deg;
  position: relative;
  display: block;
  width: 100%;
  height: var(--flap-height);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--color-text);
  font: var(--font-size-caption) / 15px var(--font-family-ui);
  text-transform: uppercase;
  text-align: center;
  transform: skewY(var(--angle));
  transform-origin: var(--origin) top;
  pointer-events: none;
}

.pause {
  --angle: var(--flap-angle);
  --origin: left;
  --edge-width: 0px;
}

.off {
  --fill: color-mix(in lch, var(--surface) 11%, transparent);
  --edge: color-mix(in lch, var(--color-text) 32%, transparent);
  --edge-width: 2px;
  --stripe: color-mix(in lch, var(--color-text) 22%, transparent);
}

.emergency {
  --warning: var(--color-resource-warning);
  --fill: color-mix(in lch, var(--warning) 11%, transparent);
  --edge: color-mix(in lch, var(--warning) 70%, transparent);
  --stripe: color-mix(in lch, var(--warning) 30%, transparent);
  --stripe-angle: 45deg;
}

.art {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--fill);
  pointer-events: none;
}

.art::after {
  content: "";
  position: absolute;
  inset: 0;
  border: solid var(--edge);
  border-width: calc(var(--edge-width) / cos(var(--flap-angle)))
    var(--edge-width);
}

.flap:not(.pause) .art::before {
  content: "";
  position: absolute;
  inset: -20px auto -20px 0;
  width: 25px;
  transform: skewY(var(--flap-angle));
  background: repeating-linear-gradient(
    var(--stripe-angle),
    var(--stripe) 0 2px,
    transparent 2px 4px
  );
}

.mark,
.cue {
  position: absolute;
  top: calc(50% + 6px);
  right: 72px;
  transform: translate(50%, -50%) skewY(calc(-1 * var(--angle)));
  display: grid;
  white-space: nowrap;
  pointer-events: none;
}

.pause .mark {
  right: auto;
  left: 72px;
  transform: translate(-50%, -50%) skewY(calc(-1 * var(--angle)));
}

.cue {
  right: 27px;
}

.cue strong {
  font-size: 1rem;
}

.mark strong,
.cue strong {
  font-weight: var(--font-weight-bold);
}

button.flap {
  cursor: pointer;
  pointer-events: auto;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

button.flap:active .art {
  background-color: color-mix(
    in lch,
    var(--color-surface-hover) 65%,
    var(--fill)
  );
}

@media (hover: hover) {
  button.flap:hover:not(:active) .art {
    background-color: color-mix(
      in lch,
      var(--color-surface-hover) 40%,
      var(--fill)
    );
  }
}

button.flap:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
</style>
