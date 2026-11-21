<script lang="ts">
import { onMount, type Snippet } from "svelte";

let {
  children,
  layout = "vertical",
  navigation = "native",
  wrap = true,
  label,
}: {
  children: Snippet;
  /** Strip layout stacks at the shared container threshold. */
  layout?: "vertical" | "horizontal" | "strip";
  navigation?: "native" | "directional";
  /** Directional navigation wraps at the ends by default. */
  wrap?: boolean;
  label?: string;
} = $props();

let group: HTMLDivElement;
const keyOwners =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="tablist"], [role="radiogroup"], [role="slider"], [role="toolbar"], [role="menu"], [role="listbox"], [role="tree"], [role="grid"], [role="combobox"]';

function navigate(event: KeyboardEvent) {
  if (
    navigation !== "directional" ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.isComposing ||
    !(event.target instanceof Element)
  )
    return;

  const target = event.target;
  // Nested groups and value-editing controls retain their own keyboard contract.
  if (
    target.closest("[data-button-group]") !== group ||
    target.closest(keyOwners)
  )
    return;

  const actions = Array.from(
    group.querySelectorAll<HTMLElement>("button.btn, a.btn[href]"),
  ).filter(
    (action) =>
      action.closest("[data-button-group]") === group &&
      !action.closest(keyOwners) &&
      !action.matches(
        ':disabled, [aria-disabled="true"], [role]:not([role="button"]):not([role="link"])',
      ) &&
      !action.closest('[hidden], [inert], [aria-hidden="true"]') &&
      action.tabIndex >= 0 &&
      action.getClientRects().length > 0 &&
      getComputedStyle(action).visibility === "visible",
  );
  const action = target.closest<HTMLElement>("button.btn, a.btn[href]");
  if (!action) return;
  const current = actions.indexOf(action);
  if (current < 0) return;

  // Read the rendered layout, including the strip's responsive stacked state.
  const style = getComputedStyle(group);
  const vertical = style.flexDirection === "column" || style.display === "grid";
  const previous = vertical
    ? "ArrowUp"
    : style.direction === "rtl"
      ? "ArrowRight"
      : "ArrowLeft";
  const next = vertical
    ? "ArrowDown"
    : style.direction === "rtl"
      ? "ArrowLeft"
      : "ArrowRight";
  let index: number;
  if (event.key === "Home") index = 0;
  else if (event.key === "End") index = actions.length - 1;
  else if (event.key === previous || event.key === next) {
    index = current + (event.key === next ? 1 : -1);
    index = wrap
      ? (index + actions.length) % actions.length
      : Math.max(0, Math.min(actions.length - 1, index));
  } else return;

  event.preventDefault();
  actions[index].focus();
}

onMount(() => {
  group.addEventListener("keydown", navigate);
  return () => group.removeEventListener("keydown", navigate);
});
</script>

<div class="button-group-frame">
  <!-- biome-ignore lint/a11y/useSemanticElements: This groups commands and navigation, not form fields. -->
  <div
    bind:this={group}
    class="button-group"
    class:button-group--vertical={layout === "vertical"}
    class:button-group--strip={layout === "strip"}
    data-button-group
    role="group"
    aria-label={label}
  >
    {@render children()}
  </div>
</div>
