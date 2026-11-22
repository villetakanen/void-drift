<script lang="ts">
type TrayLink = {
  href: string;
  label: string;
};

type TrayGroup = {
  label: string;
  links: readonly TrayLink[];
};

interface Props {
  label: string;
  links: readonly TrayLink[];
  groups: readonly TrayGroup[];
  footerLinks?: readonly TrayLink[];
  activeHref: string | undefined;
}

const id = $props.id();
let { label, links, groups, footerLinks = [], activeHref }: Props = $props();
</script>

{#snippet row(link: TrayLink)}
  <a
    href={link.href}
    aria-current={link.href === activeHref ? "page" : undefined}
  >
    {link.label}
  </a>
{/snippet}

<nav aria-label={label}>
  {#each links as link}
    {@render row(link)}
  {/each}
  {#each groups as group, index}
    <section aria-labelledby={`${id}-${index}`}>
      <h2 id={`${id}-${index}`}>{group.label}</h2>
      {#each group.links as link}
        {@render row(link)}
      {/each}
    </section>
  {/each}
  {#each footerLinks as link}
    {@render row(link)}
  {/each}
</nav>

<style>
nav {
  box-sizing: border-box;
  padding: var(--spacing-md);
  background: var(--color-void);
  font-family: var(--font-family-ui);
  line-height: var(--line-height-ui);
}

section {
  margin-block-start: var(--spacing-md);
}

h2 {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-inline-start: calc(
    var(--spacing-md) +
    var(--state-selected-indicator-width)
  );
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
}

a {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-block-size: var(--control-min-height);
  padding: var(--spacing-sm) var(--spacing-md);
  border-inline-start: var(--state-selected-indicator-width) solid transparent;
  color: var(--color-text);
  font-size: var(--font-size-label);
  text-decoration: none;
}

a[aria-current="page"] {
  border-inline-start-color: var(--color-selected);
  color: var(--color-selected);
}

a:hover {
  background: var(--color-surface-hover);
}

a:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
</style>
