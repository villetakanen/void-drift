<script lang="ts">
import { NO_SCORE_NOTICE } from "../../lib/experimental";
import PreviewMarker from "../PreviewMarker.svelte";
import "./catalog.css";
</script>

<div class="catalog">
  <section aria-labelledby="run-status-heading">
    <h2 id="run-status-heading">Run status marker</h2>
    <p>The shared marker used beside launch actions and on catalog items.</p>
    <div class="examples">
      <div class="example">
        <span class="caption">Playground On</span><PreviewMarker />
      </div>
      <div class="example">
        <span class="caption">Catalog item</span><PreviewMarker item />
      </div>
    </div>
    <p>Proposed run notice: {NO_SCORE_NOTICE}</p>
    <a href="/lab/studies/run-status-2026-11-10">Naming study →</a>
  </section>
</div>

<style>
.examples {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}
</style>
