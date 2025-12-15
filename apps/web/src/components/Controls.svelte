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
        background: #111;
        border-left: 1px solid #333;
        padding: 1rem;
        height: 100%;
        color: #eee;
        font-family: monospace;
        overflow-y: auto;
    }

    h3 {
        margin-top: 0;
        font-size: 1rem;
        color: cyan;
        text-transform: uppercase;
        border-bottom: 2px solid #333;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
    }
</style>
