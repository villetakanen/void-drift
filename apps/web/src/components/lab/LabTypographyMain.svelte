<script lang="ts">
    let { ...props }: { [key: string]: any } = $props();
</script>

<div class="design-system-preview">
    <section>
        <h3>Typography: Noto Sans Math</h3>
        <h1>Heading 1 (Void · Drift)</h1>
        <h2>Heading 2 (Void · Drift)</h2>
        <h3>Heading 3 (Void · Drift)</h3>
        <p>
            Body copy. The quick brown fox jumps over the lazy dog. E = mc². ∀x
            ∈ ℝ.
        </p>
        <p class="muted">Muted text looks like this.</p>
    </section>

    <section>
        <h3>Colors</h3>
        <div class="swatch-grid">
            <div
                class="swatch"
                style="background: var(--color-acid-lime); color: black;"
            >
                Acid Lime
            </div>
            <div
                class="swatch"
                style="background: var(--color-android-green); color: black;"
            >
                Android Green
            </div>
            <div
                class="swatch"
                style="background: var(--color-caution-tape); color: black;"
            >
                Caution Tape
            </div>
            <div class="swatch" style="background: var(--color-red);">Red</div>

            <div
                class="swatch"
                style="background: var(--color-void); border: 1px solid #333;"
            >
                Void
            </div>
            <div class="swatch" style="background: var(--color-void-light);">
                Surface
            </div>
        </div>
    </section>
</div>

<style>
    .design-system-preview {
        padding: 2rem;
        width: 100%;
        color: var(--color-text);
        box-sizing: border-box;
    }

    .design-system-preview h3 {
        border-bottom: 1px solid var(--color-text-dim);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        color: var(--color-neon-blue);
        text-transform: uppercase;
        font-size: 0.8rem;
    }

    .design-system-preview section {
        margin-bottom: 3rem;
    }

    .muted {
        color: var(--color-text-dim);
    }

    .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
    }

    .swatch {
        height: 80px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        text-align: center;
        padding: 0.5rem;
        font-size: 0.9rem;
    }
</style>
