# Scores

## Blueprint

### Context

Players can save a Survival score to a shared board and see how they compare.
The competition is casual: scores are reported by the player's own browser and
nobody signs up. The current board is the Ion Storm challenge.

A saved score also records what was flown, the ship, its fitting and its
stabilizer and linked-engines choices, so the
game's designers can see which ships and parts the scores come from. That is
for game design and is not shown to players.

### Architecture and boundaries

- **Contract.** `HighScoreSubmissionSchema` and `HighScoreSchema` in
  `packages/mode-a/src/schemas/highscore.ts` define the saved score, and
  `CHALLENGE` there names the current board. A change to what is saved is made
  in these schemas first.
- **Store.** Scores live in Firestore at
  `artifacts/void-drift/scores/{challenge}_{userId}_{shipId}`. `firestore.rules`
  enforces the same shape as the schemas and who may write.
- **Client.** `packages/mode-a/src/lib/firebase.ts` signs the player in
  anonymously, saves a score and loads the board.
  `apps/web/src/components/Leaderboard.svelte` shows it.
- **Neighbours.** The [game contract](../spec.md) and
  [Experimental mode](../experimental/spec.md) own which runs may be saved.
  [Survival](../survival/spec.md) owns the score and the time. The
  [active ship](../active-ship/spec.md) owns the ship and fitting that a run
  flew.

### Rules

- **What a saved score holds.** Exactly these, and nothing else:

  | Field           | Holds                                                    |
  | --------------- | -------------------------------------------------------- |
  | `initials`      | Three letters, A to Z, typed by the player               |
  | `score`         | The run's Survival score, a whole number with no ceiling |
  | `seconds`       | The time survived, in seconds with milliseconds          |
  | `deathCause`    | How the run ended                                        |
  | `shipId`        | The ship flown                                           |
  | `fitting`       | The parts fitted to that ship, as a list of part ids     |
  | `stabilizers`   | Whether the ship flew with stabilizers on                |
  | `linkedEngines` | Whether the ship flew with linked engines on             |
  | `challenge`     | The board the score belongs to                           |
  | `userId`        | The anonymous player who saved it                        |

- **Any ship.** `shipId` can hold any ship in the game. The store keeps no list
  of ships of its own.
- **One best per ship.** Each player keeps one saved score per ship on a
  board, whatever the fitting. A run replaces it only when its score is higher.
  A player can therefore hold several rows on the board, one for each ship.
- **Scores stay.** A saved score can be raised but not deleted, and only by the
  player who saved it.
- **Anonymous.** The player is signed in anonymously and automatically. Reading
  the board needs that sign-in, and a read is limited to the board's length.
- **The board.** Top Scores lists the 30 highest scores of the current
  challenge, highest first, with score and time, and says that scores are
  casual and reported by players. The player can re-sort the listed rows by
  time. The fitting and the two ship choices are not shown.
- **A challenge is a board.** Scores of different challenges never share a
  board.
- **Never in the way.** Without Firebase, or when saving fails, the game plays
  on and says why scores are unavailable.

## Contract

### Definition of Done

- [x] C1: Saving writes `artifacts/void-drift/scores/{challenge}_{userId}_{shipId}`,
  and an equal or lower score leaves the stored one unchanged.
- [x] C2: Firestore rules reject a write that is unauthenticated, owned by
  another player, malformed, under a mismatched document id, for an unknown
  challenge, lower than the stored score, carrying an extra field, or a
  deletion, and reject unbounded or unauthenticated list reads.
- [ ] C3: `seconds` is saved with milliseconds, in the schema and the rules.
- [ ] C4: `score` has no ceiling in the schema or the rules.
- [ ] C5: `shipId` accepts any ship in the game, and the rules hold no list of
  ships.
- [ ] C6: `fitting` is saved as the list of the flown ship's part ids, with
  `stabilizers` and `linkedEngines` as flown, and each is
  required by the schema and the rules.
- [x] C7: Top Scores lists the current challenge's 30 highest scores with score
  and time, labelled as casual and reported by players.
- [x] C8: The player can re-sort the listed rows by score or by time, score
  first.
- [ ] C9: The board shows no fitting and neither ship choice.
- [x] C10: Two anonymous players can each save a run and see both on the board.
- [x] C11: With Firebase unconfigured, the board explains that shared scores are
  unavailable and offers Retry.

### Regression guardrails

- The schemas and `firestore.rules` describe the same record; a field is never
  in one and not the other.
- Rules bound the data and its owner; they are never treated as proof of an
  honest run.
- A new `CHALLENGE` value has a matching rule in `firestore.rules` and starts a
  separate board.
- A stored row that fails the current schema is skipped when the board loads,
  not shown and not an error.
- No score feature blocks starting, playing or finishing a run.

### Scenarios

```gherkin
Feature: Scores

  Scenario: Saving a score records what was flown
    Given I finished a ranked Survival run
    When I enter my initials and save
    Then my score, time, ship and fitting are saved to the current board
    And whether I flew with stabilizers and with linked engines

  Scenario: An equal run keeps the best
    Given I hold a saved score of 42 with one ship
    When I save another run with that ship scoring 42
    Then the stored score is unchanged

  Scenario: One best per ship
    Given I hold a saved score with one ship
    When I save a run with another ship
    Then I hold a saved score for each ship

  Scenario Outline: Rules reject an invalid write
    Given an anonymous player session
    When the player writes a score that is <invalid>
    Then Firestore rejects the write

    Examples:
      | invalid                               |
      | sent without authentication           |
      | owned by another player               |
      | missing a field or of the wrong type  |
      | stored under a mismatched document id |
      | for an unknown challenge              |
      | lower than the stored score           |
      | carrying an extra field               |
      | a deletion                            |

  Scenario: Players share one board
    Given valid Firebase configuration
    When two anonymous players each save a ranked run
    Then Top Scores shows both scores and times
    And shows neither fitting

  Scenario: Firebase is absent
    Given Firebase is not configured
    When I open Top Scores
    Then it explains that shared scores are unavailable
```
