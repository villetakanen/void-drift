<script lang="ts">
import type { Snippet } from "svelte";
import Logo from "./Logo.svelte";

let {
  title,
  level = 1,
  links = [],
  navigationLabel = "Page navigation",
  actions,
}: {
  title: string;
  level?: 1 | 2 | 3;
  links?: { href: string; label: string }[];
  navigationLabel?: string;
  actions?: Snippet;
} = $props();
</script>

<div class="header-container">
  <header class="page-header">
    <div class="identity">
      <a class="brand" href="/" aria-label="Void Drift"><Logo size="sm" /></a>
      <svelte:element this={`h${level}`} class="page-name"
        >{title}</svelte:element
      >
    </div>
    {#if actions || links.length}
      <div class="trailing">
        {#if actions}
          <div class="actions">{@render actions()}</div>
        {/if}
        {#if links.length}
          <nav aria-label={navigationLabel}>
            {#each links as link}
              <a class="btn btn-normal" href={link.href}>{link.label}</a>
            {/each}
          </nav>
        {/if}
      </div>
    {/if}
  </header>
</div>

<style>
.header-container {
  container: page-header / inline-size;
  width: 100%;
  min-width: 0;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-block: var(--spacing-md);
  font-family: var(--font-family-ui);
}
.identity {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}
.brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--control-min-height);
  min-height: var(--control-min-height);
  flex-shrink: 0;
  color: var(--color-brand);
}
.brand:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
.page-name {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-bold);
  overflow-wrap: anywhere;
}
.trailing,
.actions,
nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}
.trailing {
  justify-content: flex-end;
  flex-shrink: 0;
}
@container page-header (width < 40rem) {
  .page-header {
    flex-wrap: wrap;
  }
  .trailing {
    flex-basis: 100%;
    justify-content: flex-start;
    flex-shrink: 1;
  }
}
</style>
