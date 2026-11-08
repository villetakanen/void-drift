<script lang="ts">
import { BURNS, type BurnId } from "./burns";
import { TOTAL_TICKS } from "./movement-bench";

// Study-local: the burn's input lanes as they sit under the traces. The upper
// lane is the left engine, the lower the right; both lit is LR.
let {
  burn,
  tone,
  tick,
}: {
  burn: BurnId;
  /** Colour of a lit lane. */
  tone: "lime" | "lime-soft" | "white" | "white-soft" | "grey";
  /** Current time in ticks: draws a time line and lights the active input
   * white. Omitted, the strip shows the burn alone. */
  tick?: number;
} = $props();

const segments = $derived.by(() => {
  let start = 0;
  return BURNS[burn].segments.map((seg) => {
    const out = {
      ...seg,
      left: (start / TOTAL_TICKS) * 100,
      width: (seg.ticks / TOTAL_TICKS) * 100,
      active: tick !== undefined && tick >= start && tick < start + seg.ticks,
    };
    start += seg.ticks;
    return out;
  });
});
const seconds = Array.from({ length: TOTAL_TICKS / 60 + 1 }, (_, i) => i);
</script>

<div
  class={`strip ${tone}`}
  role="img"
  aria-label={`${BURNS[burn].label} ${BURNS[burn].name} input`}
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
  {#if tick !== undefined}
    <span class="time" style={`left:${(tick / TOTAL_TICKS) * 100}%`}></span>
  {/if}
  <div class="axis">
    {#each seconds as t}
      <span style={`left:${(t * 60 * 100) / TOTAL_TICKS}%`}>{t}</span>
    {/each}
  </div>
</div>

<style>
/* Same proportions as the instrument: two 12px lanes, a 4px gap, then time. */
.strip {
  --_lit: var(--color-acid-lime);
  position: relative;
  height: 44px;
  font: 11px / 1 var(--font-flight);
}
.lime-soft {
  --_lit: color-mix(in srgb, var(--color-acid-lime) 45%, transparent);
}
.white {
  --_lit: var(--color-text);
}
.white-soft {
  --_lit: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.grey {
  --_lit: var(--color-text-dim);
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
  background: var(--_lit);
}
/* The input firing at the current time is full white. */
.on.active {
  background: var(--color-text);
}
/* The time line crosses both lanes, as the cursor crosses the graphs. */
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
