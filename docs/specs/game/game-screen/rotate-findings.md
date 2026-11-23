# Rotate prompt findings

Findings about the rotate-to-continue prompt, 2026-11-23. These are
observations, not a spec. The prompt is specified in [Game screen](spec.md).

## A ranked result is lost when the prompt covers game over

Scenario:

1. A ranked run ends, the best check finds a new best and the player types
   initials.
2. The player chooses Save Score. While the save is pending, the device turns
   to portrait or the window becomes narrower than 4:3.
3. The save commits in Firestore, but the game never reports it and Top
   Scores never opens.
4. On rotating back, the result runs a fresh best check. That check finds the
   player's own save and shows "Your best with this ship stands at N", as if
   the run had not beaten it.
5. Typed initials are lost in the same way when the prompt covers game over
   before saving.

Cause: in `apps/web/src/components/FlightDeck.svelte`, the
`{#if narrow && …}` branch that shows the rotate prompt comes before
`{:else if status === "GAME_OVER"}`. While the prompt shows, GameOver and the
ranked result action inside it are unmounted. The ranked result action
(`RankedResult.svelte`) treats unmount as "the completed run is no longer
current", so it ignores the pending check or save and drops its state. The
earlier inline score form kept its state in FlightDeck, so this loss appeared
when the action became self-contained.

Possible fixes:

- Hold the ranked result's state for each completed run in FlightDeck, above
  the narrow switch, and end it only on Retry, leaving or a new run. The
  action then only displays that state.
- Keep GameOver mounted, inert and hidden, while the prompt shows, so the
  action stays mounted.
- Do not cover game over with the prompt at all. Its purpose, blocking flight
  and countdown, does not apply to a completed run.

## The prompt text is wrong after a run ends

Over a completed run the prompt still says "Flight is paused", although
nothing is in flight. While it shows, Retry and the launch-source action are
unavailable.
