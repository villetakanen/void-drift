<script lang="ts">
let {
  id,
  checked = $bindable(false),
  disabled = false,
}: {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
} = $props();
</script>

<span class="switch">
  <input {id} class="switch__input" type="checkbox" bind:checked {disabled}>
  <span class="switch__track" aria-hidden="true">
    <span class="switch__thumb">{checked ? "ON" : "OFF"}</span>
  </span>
</span>

<style>
.switch {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: var(--control-min-height);
  isolation: isolate;
}

.switch__input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.switch:has(.switch__input:focus-visible) {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}

.switch__track {
  position: relative;
  display: flex;
  align-items: center;
  width: 80px;
  height: 30px;
  padding: 2px;
  box-sizing: border-box;
  background: var(--color-elev-2);
  clip-path: polygon(
    var(--cut-size-sm) 0,
    100% 0,
    100% calc(100% - var(--cut-size-sm)),
    calc(100% - var(--cut-size-sm)) 100%,
    0 100%,
    0 var(--cut-size-sm)
  );
}

.switch__thumb {
  position: absolute;
  left: 2px;
  display: grid;
  place-items: center;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  box-sizing: border-box;
  background: var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  clip-path: polygon(
    var(--cut-size-sm) 0,
    100% 0,
    100% calc(100% - var(--cut-size-sm)),
    calc(100% - var(--cut-size-sm)) 100%,
    0 100%,
    0 var(--cut-size-sm)
  );
  transition:
    transform var(--duration-fast) var(--ease-standard),
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.switch:has(.switch__input:checked) .switch__thumb {
  background: var(--color-selected);
  color: var(--color-on-brand);
  transform: translateX(38px);
}

.switch:has(.switch__input:hover) .switch__track {
  filter: brightness(var(--state-hover-brightness));
}

.switch:has(.switch__input:disabled) {
  opacity: var(--state-disabled-opacity);
}

.switch__input:disabled {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .switch__thumb {
    transition: none;
  }
}
</style>
