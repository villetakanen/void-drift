<script lang="ts">
import type { Snippet } from "svelte";
import Logo from "./Logo.svelte";

let {
  title,
  pageName,
  href = "/",
  links = [],
  navigationLabel = "Page navigation",
  actions,
}: {
  title: string;
  pageName?: string;
  href?: string;
  links?: { href: string; label: string }[];
  navigationLabel?: string;
  actions?: Snippet;
} = $props();
</script>

<div class="header-container">
  <header class="page-header">
    <div class="identity">
      <a class="brand" href="/" aria-label="Void Drift"><Logo size="sm" /></a>
      <div class="page-title">
        {#if pageName}
          <a class="site-name" {href}>{title}</a>{" "}<span class="page-name"
            >// {pageName}</span
          >
        {:else}
          <span class="site-name">{title}</span>
        {/if}
      </div>
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
  width: 100%;
  min-width: 0;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  min-height: var(--control-min-height);
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
.brand:focus-visible,
a.site-name:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
.page-title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-lead);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}
.site-name {
  color: inherit;
  text-decoration: none;
}
.page-name {
  font-size: var(--font-size-body);
}
.trailing,
.actions,
nav {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: var(--spacing-md);
}
.trailing {
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
