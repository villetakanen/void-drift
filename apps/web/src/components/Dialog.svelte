<script lang="ts" module>
// Keep isolation until the last holder releases it during dialog handovers.
const holders = new WeakMap<Element, { count: number; wasInert: boolean }>();
const stages = new WeakMap<Element, number>();
const active: HTMLElement[] = [];
function hold(element: Element) {
  const held = holders.get(element);
  if (held) held.count++;
  else
    holders.set(element, { count: 1, wasInert: element.hasAttribute("inert") });
  element.setAttribute("inert", "");
}
function release(element: Element) {
  const held = holders.get(element);
  if (!held || --held.count > 0) return;
  if (!held.wasInert) element.removeAttribute("inert");
  holders.delete(element);
}
function holdStage(stage: Element) {
  stages.set(stage, (stages.get(stage) ?? 0) + 1);
  stage.classList.add("scrim-stage");
}
function releaseStage(stage: Element) {
  const count = (stages.get(stage) ?? 1) - 1;
  if (count > 0) stages.set(stage, count);
  else {
    stages.delete(stage);
    stage.classList.remove("scrim-stage");
  }
}
</script>

<script lang="ts">
import { onMount, type Snippet } from "svelte";

let {
  label,
  onclose,
  returnFocus = true,
  class: className = "",
  children,
}: {
  label: string;
  onclose?: () => void;
  returnFocus?: boolean;
  class?: string;
  children: Snippet;
} = $props();

let layer: HTMLElement;
let panel: HTMLElement;
const CONTROLS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function controls() {
  return Array.from(panel.querySelectorAll<HTMLElement>(CONTROLS)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      !element.closest("[inert]"),
  );
}
function focusFirst() {
  (
    panel.querySelector<HTMLElement>("[data-autofocus]") ??
    controls()[0] ??
    panel
  ).focus();
}

onMount(() => {
  const previous =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const stage = layer.parentElement?.querySelector(":scope > [data-stage]");
  const isolated: Element[] = [];
  // Isolate every sibling along the path to the document, including the header.
  for (
    let node: Element | null = layer;
    node?.parentElement;
    node = node.parentElement
  ) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && !sibling.classList.contains("dialog-layer")) {
        hold(sibling);
        isolated.push(sibling);
      }
    }
    if (node.parentElement === document.body) break;
  }
  if (stage) holdStage(stage);
  active.push(panel);
  focusFirst();
  const containFocus = (event: FocusEvent) => {
    if (
      active.at(-1) === panel &&
      event.target instanceof Node &&
      !panel.contains(event.target)
    )
      focusFirst();
  };
  document.addEventListener("focusin", containFocus);
  return () => {
    document.removeEventListener("focusin", containFocus);
    const index = active.indexOf(panel);
    if (index !== -1) active.splice(index, 1);
    for (const element of isolated) release(element);
    if (stage) releaseStage(stage);
    // A replacement dialog may mount in the same update; never steal its focus.
    queueMicrotask(() => {
      if (
        active.length === 0 &&
        returnFocus &&
        previous?.isConnected &&
        !previous.closest("[inert]")
      )
        previous.focus();
    });
  };
});

function keydown(event: KeyboardEvent) {
  if (active.at(-1) !== panel) return;
  if (event.key === "Escape" && onclose) {
    event.preventDefault();
    onclose();
  } else if (event.key === "Tab") {
    const items = controls();
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) {
      event.preventDefault();
      panel.focus();
    } else if (
      event.shiftKey &&
      (document.activeElement === first ||
        !panel.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || document.activeElement === panel)
    ) {
      event.preventDefault();
      first.focus();
    }
  }
}
</script>

<svelte:window onkeydown={keydown} />
<div class="dialog-layer" bind:this={layer}>
  <div class="dialog-scrim" aria-hidden="true"></div>
  <div
    bind:this={panel}
    class={`panel ${className}`}
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
  >
    {@render children()}
  </div>
</div>
