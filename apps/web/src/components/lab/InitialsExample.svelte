<script lang="ts">
let {
  value = $bindable(""),
  label = "Initials",
  host = 0,
}: { value?: string; label?: string; host?: 0 | 1 | 2 } = $props();

const id = $props.id();
const SLOTS = [0, 1, 2];
const clean = (text: string) => text.toUpperCase().replace(/[^A-Z]/g, "");
/* The letters entered so far: none to three, with no gaps. */
const text = $derived(clean(value).slice(0, 3));
/* The last selectable slot: the first empty one, or the third letter. */
const last = (letters: string) => Math.min(letters.length, 2);

let input: HTMLInputElement;
let slots: HTMLElement;
/* The selected slot, mirrored from the field's selection: one letter, or the
   caret at the end of the letters for the first empty slot. */
let selected = $state(0);
let announced = $state("");

function select(index: number, letters = text) {
  selected = Math.max(0, Math.min(last(letters), index));
  input.setSelectionRange(selected, Math.min(selected + 1, letters.length));
}
function commit(next: string, index: number) {
  value = next;
  input.value = next;
  select(index, next);
}
/* Writes letters from the selected slot, shifted left when they would not
   fit, and selects the slot after them. */
function write(letters: string, from = selected) {
  const part = letters.slice(0, 3);
  const start = Math.min(from, 3 - part.length);
  commit(
    text.slice(0, start) + part + text.slice(start + part.length),
    start + part.length,
  );
}
/* An empty slot takes the letter it shows; a letter steps through A–Z. */
function step(by: number) {
  const index = selected;
  const code =
    index < text.length
      ? ((text.charCodeAt(index) - 65 + by + 26) % 26) + 65
      : 65;
  announced = String.fromCharCode(code);
  write(announced);
  select(index);
}
/* Only the last letter is ever removed, so no gap opens. */
function erase(back: boolean) {
  const onLast = selected === text.length - 1;
  if (text && (onLast || (back && selected === text.length)))
    commit(text.slice(0, -1), text.length - 1);
  else commit(text, back ? selected - 1 : selected);
}

/* Keeps the field's selection on one slot while it has focus. */
function sync() {
  if (document.activeElement !== input) return;
  const start = Math.min(input.selectionStart ?? 0, last(text));
  const end = Math.min(start + 1, text.length);
  if (input.selectionStart === start && input.selectionEnd === end)
    selected = start;
  else select(start);
}

/* Whether the last key pressed anywhere was Shift+Tab: the field was then
   entered backwards, and starts on its last selectable slot. */
let backwards = false;
function onfocus() {
  if (backwards) select(last(text));
  else sync();
}

function onkeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  /* Tab walks the slots, and leaves the field from the last or first one. */
  if (event.key === "Tab") {
    const next = selected + (event.shiftKey ? -1 : 1);
    if (next < 0 || next > last(text)) return;
    event.preventDefault();
    return select(next);
  }
  const act = {
    ArrowUp: () => step(1),
    ArrowDown: () => step(-1),
    ArrowLeft: () => select(selected - 1),
    ArrowRight: () => select(selected + 1),
    Backspace: () => erase(true),
    Delete: () => erase(false),
    Home: () => select(0),
    End: () => select(last(text)),
  }[event.key];
  if (!act) return;
  event.preventDefault();
  act();
}
/* Typed text carries its letters in the event; autofill replaces the whole
   value and carries none. */
function oninput(event: Event) {
  const { data, inputType } = event as InputEvent;
  if (inputType?.startsWith("delete"))
    erase(inputType !== "deleteContentForward");
  else if (data != null) write(clean(data));
  else commit(clean(input.value).slice(0, 3), 3);
}
function onpaste(event: ClipboardEvent) {
  event.preventDefault();
  write(clean(event.clipboardData?.getData("text") ?? ""));
}
function onclick(event: MouseEvent) {
  const index = [...slots.children].findIndex(
    (slot) => event.clientX <= slot.getBoundingClientRect().right,
  );
  select(index < 0 ? 2 : index);
}
</script>

<svelte:document
  onselectionchange={sync}
  onkeydown={(event) => (backwards = event.key === "Tab" && event.shiftKey)}
/>

<span class="example" data-host={host}>
  <label>
    <span class="field" data-selected={selected}>
      <span class="slots" aria-hidden="true" bind:this={slots}>
        {#each SLOTS as index}
          <span class="slot" data-empty={index < text.length ? undefined : ""}
            >{text[index] ?? "A"}</span
          >
        {/each}
      </span>
      <input
        bind:this={input}
        type="text"
        maxlength="3"
        value={text}
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        aria-describedby="{id}-hint"
        {onkeydown}
        {oninput}
        {onpaste}
        {onclick}
        {onfocus}
        onblur={() => (announced = "")}
      >
    </span>
    <span class="label">{label}</span>
  </label>
  <span hidden id="{id}-hint">Up and Down change the letter.</span>
  <span class="hidden" aria-live="polite">{announced}</span>
</span>

<style>
.example {
  position: relative;
  width: fit-content;
  font-family: var(--font-family-ui);
}
/* The ground of a slot that holds a letter: one elevation step above the
   host the field sits on. */
.example {
  --_raised: var(--color-elev-1);
}
.example[data-host="1"] {
  --_raised: var(--color-elev-2);
}
.example[data-host="2"] {
  --_raised: var(--color-elev-3);
}
.example,
label {
  display: grid;
  gap: var(--spacing-sm);
}
.label {
  font-size: var(--font-size-caption);
}
.field {
  position: relative;
  display: inline-block;
  font: var(--font-size-display) / var(--line-height-ui) var(--font-family-ui);
}
.slots {
  display: flex;
  gap: var(--spacing-gap);
}
/* A slot is a cut pane on the void with a bracket around each end, drawn as
   a focused call to action draws its own (buttons.css): a line inside the
   slot's edge that follows the cut, left open across the middle of the top
   and bottom. */
.slot {
  --_cut: var(--cut-size-md);
  --_edge: var(--color-bracket);
  --_arm: 30%;
  position: relative;
  width: 2ch;
  text-align: center;
  color: var(--color-text);
  background: var(--color-void);
  clip-path: polygon(
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut)
  );
}
.slot::after {
  --_w: var(--bracket-width);
  /* The inner corner of a diagonal edge sits 0.414 × its width further in. */
  --_inner: calc(var(--_cut) + 0.4142 * var(--_w));
  content: "";
  position: absolute;
  inset: var(--bracket-inset);
  background: linear-gradient(
    to right,
    var(--_edge) 0 var(--_arm),
    transparent var(--_arm) calc(100% - var(--_arm)),
    var(--_edge) calc(100% - var(--_arm))
  );
  clip-path: polygon(
    evenodd,
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut),
    var(--_cut) 0,
    var(--_inner) var(--_w),
    calc(100% - var(--_w)) var(--_w),
    calc(100% - var(--_w)) calc(100% - var(--_inner)),
    calc(100% - var(--_inner)) calc(100% - var(--_w)),
    var(--_w) calc(100% - var(--_w)),
    var(--_w) var(--_inner),
    var(--_inner) var(--_w),
    var(--_cut) 0
  );
}
/* A slot without a letter shows the letter Up or Down would enter. */
.slot[data-empty] {
  color: var(--color-placeholder);
}
.slot:not([data-empty]) {
  background: var(--_raised);
}
/* The selected slot, only while the field has focus: the same brackets in the
   selected colour, on the void. The slot draws no ring. */
.field:focus-within[data-selected="0"] .slot:nth-child(1),
.field:focus-within[data-selected="1"] .slot:nth-child(2),
.field:focus-within[data-selected="2"] .slot:nth-child(3) {
  --_edge: var(--color-selected);
  background: var(--color-void);
}
/* The field lies over the slots with its own text, caret and selection
   unpainted; one letter advances one slot and one gap. */
input {
  position: absolute;
  inset: 0;
  /* Room for the spacing after the last letter, so the text never scrolls. */
  width: calc(100% + 1ch + var(--spacing-gap));
  box-sizing: border-box;
  padding: 0 0 0 0.5ch;
  border: 0;
  background: none;
  color: transparent;
  caret-color: transparent;
  font: inherit;
  letter-spacing: calc(1ch + var(--spacing-gap));
  outline: none;
}
input::selection {
  color: transparent;
  background: none;
}
.hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
