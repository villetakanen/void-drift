<script lang="ts">
let {
  active,
  blocked = false,
  id,
}: { active: boolean; blocked?: boolean; id?: string } = $props();
</script>

{#if blocked || active}
  <p {id} role="status">
    {#if blocked}
      PLAYGROUND OFF<br>UNSANCTIONED BUILD
    {:else}
      PLAYGROUND ACTIVE<br>UNRANKED PLAY
    {/if}
  </p>
{/if}

<style>
p {
  margin: 0;
  white-space: nowrap;
  color: var(--color-alert);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
  line-height: var(--line-height-ui);
}
</style>
