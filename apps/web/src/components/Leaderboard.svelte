<script lang="ts">
    import { supabase } from "@void-drift/mode-a/supabase";
    import { onMount } from "svelte";

    type HighScoreRow = {
        id: string;
        user_id: string;
        initials: string;
        uid_hash: string;
        seconds: number;
        death_cause: "STAR" | "HULL" | "POWER";
        created_at: string;
    };

    let { ...props }: { [key: string]: any } = $props();

    let scores = $state<HighScoreRow[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let currentUserId = $state<string | null>(null);

    onMount(async () => {
        await loadLeaderboard();
    });

    async function loadLeaderboard() {
        isLoading = true;
        error = null;

        try {
            // Get current user ID for highlighting
            const {
                data: { session },
            } = await supabase.auth.getSession();
            currentUserId = session?.user.id ?? null;

            // Fetch top 20 scores
            const { data, error: fetchError } = await supabase
                .from("highscores")
                .select("*")
                .order("seconds", { ascending: false }) // Descending for duration (longer is better)
                .order("created_at", { ascending: true }) // Tie-breaker: earlier is better
                .limit(20);

            if (fetchError) {
                throw fetchError;
            }

            scores = data ?? [];
        } catch (err) {
            console.error("[Leaderboard] Failed to load scores:", err);
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to load leaderboard";
        } finally {
            isLoading = false;
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function getDeathCauseColor(cause: "STAR" | "HULL" | "POWER"): string {
        switch (cause) {
            case "STAR":
                return "var(--color-resource-danger)"; // Red
            case "HULL":
                return "var(--color-resource-hull)"; // Blue
            case "POWER":
                return "var(--color-resource-power)"; // Lime
            default:
                return "var(--color-text-dim)";
        }
    }

    function getDeathCauseIcon(cause: "STAR" | "HULL" | "POWER"): string {
        switch (cause) {
            case "STAR":
                return "☀️";
            case "HULL":
                return "💥";
            case "POWER":
                return "🔋";
            default:
                return "💀";
        }
    }
</script>

<div class="leaderboard-page">
    <header>
        <h1>Global Leaderboard</h1>
        <p class="subtitle">Top 20 Longest Survival Times</p>
    </header>

    {#if isLoading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading leaderboard...</p>
        </div>
    {:else if error}
        <div class="error">
            <p>Failed to load leaderboard</p>
            <p class="error-message">{error}</p>
            <button class="btn btn-filled" onclick={loadLeaderboard}>
                Retry
            </button>
        </div>
    {:else if scores.length === 0}
        <div class="empty">
            <p>No scores yet!</p>
            <p class="empty-hint">Be the first to submit a score.</p>
            <a href="/" class="btn btn-filled">Play Game</a>
        </div>
    {:else}
        <div class="leaderboard">
            <table>
                <thead>
                    <tr>
                        <th class="rank-col">Rank</th>
                        <th class="player-col">Player</th>
                        <th class="time-col">Time</th>
                        <th class="death-col">Death</th>
                    </tr>
                </thead>
                <tbody>
                    {#each scores as score, index}
                        <tr class:highlight={score.user_id === currentUserId}>
                            <td class="rank-col">
                                #{index + 1}
                            </td>
                            <td class="player-col">
                                <span class="initials">{score.initials}</span>
                                <span class="uid-hash">_{score.uid_hash}</span>
                            </td>
                            <td class="time-col">
                                {formatTime(score.seconds)}
                            </td>
                            <td class="death-col">
                                <span
                                    class="death-badge"
                                    style="color: {getDeathCauseColor(
                                        score.death_cause,
                                    )}"
                                    title={score.death_cause}
                                >
                                    {getDeathCauseIcon(score.death_cause)}
                                    {score.death_cause}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="actions">
            <a href="/" class="btn btn-filled">Play Again</a>
            <button class="btn btn-ghost" onclick={loadLeaderboard}>
                Refresh
            </button>
        </div>
    {/if}
</div>

<style>
    .leaderboard-page {
        max-width: 900px;
        margin: 0 auto;
        padding: var(--spacing-xl);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    header {
        text-align: center;
    }

    h1 {
        font-size: 2.5rem;
        color: var(--color-resource-danger);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .subtitle {
        color: var(--color-text-dim);
        margin-top: var(--spacing-xs);
    }

    .loading,
    .error,
    .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-xl);
        text-align: center;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-text-dim);
        border-top-color: var(--color-neon-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-message {
        color: var(--color-resource-danger);
        font-size: 0.875rem;
    }

    .empty-hint {
        color: var(--color-text-dim);
        font-size: 0.875rem;
    }

    .leaderboard {
        overflow-x: auto;
        border: 1px solid var(--color-text-dim);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.02);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-family: monospace;
    }

    thead {
        border-bottom: 2px solid var(--color-text-dim);
        background: rgba(0, 0, 0, 0.3);
    }

    th {
        padding: var(--spacing-md);
        text-align: left;
        font-weight: bold;
        color: var(--color-text-dim);
        font-size: 0.875rem;
        text-transform: uppercase;
    }

    tbody tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: background-color 0.2s ease;
    }

    tbody tr:last-child {
        border-bottom: none;
    }

    tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }

    tbody tr.highlight {
        background-color: rgba(238, 255, 65, 0.1); /* acid-lime alpha */
        border-left: 4px solid var(--color-acid-lime);
    }

    td {
        padding: var(--spacing-md);
    }

    .rank-col {
        width: 80px;
        text-align: center;
        color: var(--color-text-dim);
    }

    .player-col {
        min-width: 150px;
    }

    .initials {
        font-weight: bold;
        color: var(--color-text);
        font-size: 1.125rem;
    }

    .uid-hash {
        color: var(--color-text-dim);
        font-size: 0.75rem;
        margin-left: var(--spacing-xs);
    }

    .time-col {
        width: 120px;
        font-weight: bold;
        color: var(--color-neon-blue);
        font-size: 1.125rem;
        font-variant-numeric: tabular-nums;
    }

    .death-col {
        width: 150px;
    }

    .death-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .actions {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md);
        padding-top: var(--spacing-md);
    }

    /* Mobile responsive */
    @media (max-width: 600px) {
        table {
            font-size: 0.875rem;
        }

        th,
        td {
            padding: var(--spacing-sm);
        }

        .uid-hash {
            display: block;
            margin-left: 0;
            margin-top: 2px;
        }

        .death-badge {
            font-size: 0.75rem;
        }
    }
</style>
