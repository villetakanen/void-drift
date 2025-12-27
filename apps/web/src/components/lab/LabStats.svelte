<script lang="ts">
    interface StatGroup {
        label: string;
        stats: { key: string; value: string | number; unit?: string }[];
    }

    let { groups }: { groups: StatGroup[] } = $props();
</script>

<div class="stats-panel">
    {#each groups as group}
        <div class="stat-group">
            <h4>{group.label}</h4>
            <dl>
                {#each group.stats as stat}
                    <div class="stat-row">
                        <dt>{stat.key}</dt>
                        <dd>{stat.value}{stat.unit ? ` ${stat.unit}` : ""}</dd>
                    </div>
                {/each}
            </dl>
        </div>
    {/each}
</div>

<style>
    .stats-panel {
        background: transparent;
        padding: 0;
        font-size: 0.8125rem;
    }

    .stat-group {
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
    }

    .stat-group:first-child {
        border-top: none;
        padding-top: 0;
    }

    h4 {
        color: var(--color-text-dim);
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: var(--spacing-xs);
        font-weight: 600;
    }

    dl {
        margin: 0;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        line-height: 1.4;
    }

    dt {
        color: var(--color-text-dim);
        font-family: var(--font-primary);
    }

    dd {
        color: var(--color-neon-blue);
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }
</style>
