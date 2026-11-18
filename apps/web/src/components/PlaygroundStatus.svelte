<script lang="ts">
let {
  active,
  blocked = false,
  challengePending = false,
}: {
  active: boolean;
  blocked?: boolean;
  challengePending?: boolean;
} = $props();
</script>

{#if blocked || active || challengePending}
  <p role="status">
    {#if blocked}
      UNSANCTIONED BUILD<br>PLAYGROUND REQUIRED
    {:else if challengePending}
      NEXT CHALLENGE PENDING<br>RANKED PLAY UNAVAILABLE
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
