<script lang="ts">
    // Placeholder for controls
    let { title, children } = $props<{ title: string; children?: any }>();
</script>

<div class="controls-panel">
    <h3>{title}</h3>
    <div class="controls-content">
        {@render children?.()}
    </div>
</div>

<style>
    .controls-panel {
        background: transparent;
        padding: 1rem;
        height: 100%;
        color: var(--color-text);
        font-family: "Noto Sans Math", sans-serif;
        overflow-y: auto;
    }

    h3 {
        margin-top: 0;
        font-size: 1rem;
        color: var(--color-neon-blue); /* Maps to Acid Lime */
        text-transform: uppercase;
        border-bottom: 2px solid var(--color-text-dim);
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
        font-weight: bold;
    }
</style>
