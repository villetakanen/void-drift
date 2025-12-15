<script lang="ts">
    import Canvas from "./Canvas.svelte";
    import Controls from "./Controls.svelte";
    import Logo from "./Logo.svelte";

    // State
    let activeAsset = $state("dashboard");

    const ASSETS = [
        { id: "dashboard", label: "Dashboard" },
        { id: "ship", label: "Ship" },
        { id: "asteroid", label: "Asteroid" },
        { id: "typography", label: "Typography" },
    ];

    /* Mock Draw Function */
    function drawDashboard(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#0a0a1f";
        ctx.fillRect(0, 0, 600, 400);

        ctx.fillStyle = "#00f0ff";
        ctx.font = "20px 'Noto Sans Math'";
        ctx.fillText("Select an asset from the left.", 20, 40);
    }
</script>

<div class="gallery-layout">
    <!-- 1. Asset Picker (Sidebar) -->
    <aside class="sidebar">
        <div class="brand">
            <Logo />
        </div>
        <nav>
            {#each ASSETS as asset}
                <button
                    class:active={activeAsset === asset.id}
                    onclick={() => (activeAsset = asset.id)}
                >
                    {asset.label}
                </button>
            {/each}
        </nav>
    </aside>

    <!-- 2. Main Stage -->
    <main class="stage">
        <div class="stage-header">
            <h2>Preview: {activeAsset.toUpperCase()}</h2>
        </div>

        <div class="stage-content">
            {#if activeAsset === "dashboard"}
                <Canvas width={600} height={400} draw={drawDashboard} />
            {:else if activeAsset === "ship"}
                <div class="placeholder">Ship Viewer Coming Soon</div>
            {:else if activeAsset === "typography"}
                <div class="design-system-preview">
                    <section>
                        <h3>Typography: Noto Sans Math</h3>
                        <h1>Heading 1 (Void · Drift)</h1>
                        <h2>Heading 2 (Void · Drift)</h2>
                        <h3>Heading 3 (Void · Drift)</h3>
                        <p>
                            Body copy. The quick brown fox jumps over the lazy
                            dog. E = mc². ∀x ∈ ℝ.
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
                            <div
                                class="swatch"
                                style="background: var(--color-red);"
                            >
                                Red
                            </div>

                            <div
                                class="swatch"
                                style="background: var(--color-void); border: 1px solid #333;"
                            >
                                Void
                            </div>
                            <div
                                class="swatch"
                                style="background: var(--color-void-light);"
                            >
                                Surface
                            </div>
                        </div>
                    </section>
                </div>
            {:else}
                <div class="placeholder">Not Implemented</div>
            {/if}
        </div>
    </main>

    <!-- 3. Inspector (Right Sidebar) -->
    <aside class="inspector">
        <Controls title="Parameters">
            <p style="opacity: 0.5; font-size: 0.8rem;">
                Select an asset to view controls.
            </p>
        </Controls>
    </aside>
</div>

<style>
    .gallery-layout {
        display: grid;
        grid-template-columns: 250px 1fr 300px;
        height: 100vh;
        width: 100vw;
        background: var(--color-void);
        color: var(--color-text);
        font-family: "Noto Sans Math", sans-serif;
    }

    /* Sidebar */
    .sidebar {
        background: var(--color-void-light);
        border-right: 1px solid var(--color-text-dim);
        display: flex;
        flex-direction: column;
    }

    .brand {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--color-text-dim);
    }

    nav {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 0.5rem;
    }

    button {
        background: transparent;
        border: 1px solid transparent;
        color: var(--color-text-dim);
        padding: 0.75rem 1rem;
        text-align: left;
        cursor: pointer;
        text-transform: uppercase;
        font-family: inherit;
        transition: all 0.2s;
        border-radius: var(--radius-sm);
    }

    button:hover {
        color: var(--color-text);
        background: rgba(255, 255, 255, 0.05);
    }

    button.active {
        color: var(--color-neon-blue);
        border: 1px solid rgba(0, 240, 255, 0.3);
        background: rgba(0, 240, 255, 0.1);
    }

    /* Stage */
    .stage {
        display: flex;
        flex-direction: column;
        background: var(--color-void);
    }

    .stage-header {
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--color-text-dim);
    }

    .stage-header h2 {
        margin: 0;
        font-size: 1rem;
        color: var(--color-text-dim);
    }

    .stage-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        /* Grid background effect */
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            );
        background-size: 20px 20px;
    }

    .placeholder {
        color: var(--color-text-dim);
        border: 1px dashed var(--color-text-dim);
        padding: 2rem;
    }

    /* Inspector */
    .inspector {
        border-left: 1px solid var(--color-text-dim);
        background: var(--color-void-light);
    }

    /* Design System Preview */
    .design-system-preview {
        padding: 2rem;
        max-width: 800px;
        width: 100%;
        overflow-y: auto;
        color: var(--color-text);
    }

    .design-system-preview h3 {
        border-bottom: 1px solid var(--color-text-dim);
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        color: var(--color-neon-blue);
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
    }
</style>
