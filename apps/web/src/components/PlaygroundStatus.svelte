<script lang="ts">
let { active, blocked = false }: { active: boolean; blocked?: boolean } =
  $props();
</script>

{#if blocked || active}
  <p role="status">
    {#if blocked}
      UNSANCTIONED BUILD<br>PLAYGROUND REQUIRED
    {:else}
      PLAYGROUND ACTIVE<br>UNRANKED PLAY
    {/if}
  </p>
{/if}

<style>
p {
  margin: 0;
  color: var(--color-red);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
  line-height: var(--line-height-ui);
}
</style>
