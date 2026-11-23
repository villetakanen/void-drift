---
generated:
  by: "openai-codex/gpt-6.2"
  at: "2026-11-23T08:40:39+02:00"
verified: []
---

# Ranked result

## Blueprint

### Context

After a ranked Survival run, the player can save a new personal best and sign
it with initials. This action is part of [game over](../spec.md); the
[Scores contract](../../scores/spec.md) owns the shared records and board.

### Architecture

The ranked result action receives the completed score and flown setup. It
checks, presents and submits that result without making the game-over screen
responsible for score storage. It uses the shared
[Initials](../../../factory/design-system/initials/spec.md) component and the
score schemas and Firestore record defined by Scores. The score store remains
the authority for the best; browser-local initials are a convenience only.

### Constraints

- The action is present only for eligible ranked Survival results. A best is
  scoped to the current anonymous player, challenge and ship, regardless of
  fitting. A first score or a score strictly greater than the saved score is a
  new personal best; an equal or lower score keeps the existing best.
- On opening the result, check the player's actual Firestore record, including
  when it is outside the top 30. While checking, explain that the check is in
  progress and show the initials field and Save Score in the slot a new best
  uses, at the same size, disabled: they take no input, never submit and are
  replaced in place, so the panel does not change height when the check
  resolves. An absent record permits a first score; a failed, timed-out or
  unreadable lookup is not an absent record. Explain the failure and offer a
  retry of the check.
- A new best shows the Initials field and Save Score. Require exactly three
  uppercase A–Z letters to submit. Prefill the last successfully saved initials
  from this browser, or start with an empty field if none are available.
- After a successful write, remember the submitted initials on this browser.
  Missing, invalid or inaccessible local storage leaves entry and saving usable;
  a failure to remember initials does not turn a successful score save into a
  failure. Local initials do not determine score eligibility.
- When the player's own input makes the initials complete (three letters),
  focus moves to Save Score so Enter saves. Remembered initials filling the
  field on opening, and edits that leave it incomplete, never move focus.
- While the check is pending, focus rests on the dialog itself and never on
  Retry, the launch-source action or the disabled controls. When the check
  resolves and focus is still on the dialog, a new best moves focus to the
  first empty box of the initials field, or to Save Score when remembered
  initials already fill it; any other result moves it to the dialog's default
  control. Focus the player has already placed on a control stays there.
- An equal or lower result shows the player's existing best for that ship and
  offers neither initials entry nor Save Score.
- While saving, indicate progress and prevent duplicate submissions. Recheck
  the best atomically in the score transaction: a concurrent equal or higher
  save keeps the existing record and is reported as such, not as a successful
  save of this run. On a failed or timed-out submission, explain the failure,
  retain the entered initials and allow retry. A timeout does not establish
  whether a write completed; a retry must safely resolve the stored result.
- A successful save of this run opens the existing Top Scores page. That page
  owns loading and displaying the board, including its failure and retry state;
  saving a personal best does not guarantee a place in its top 30.
- Lookup and save progress never block Retry or the launch-source action.
  An asynchronous result affects the interface or navigates only while its
  completed run is still current. Status changes are announced without taking
  focus away from the player's current control.

## Contract

### Definition of Done

- A ranked result checks the correct personal best and explains whether the
  player can save, including when the check is unavailable.
- A qualifying result accepts initials, submits safely and opens Top Scores
  after its score is saved. Browser-local initials are reused when available.
- A concurrent improvement and a failed submission have truthful, recoverable
  outcomes, and leaving the result remains possible throughout.

### Regression guardrails

- Unranked results never offer score entry or submission.
- The [Scores contract](../../scores/spec.md) governs record shape, ownership,
  monotonic writes and board membership. Client-side checks do not replace the
  transaction or Firestore rules.
- [Dialogs](../../dialogs/spec.md) govern focus and announcements; the
  [Initials contract](../../../factory/design-system/initials/spec.md) governs
  field interaction. Score access does not block play.

### Scenarios

```gherkin
Scenario: First score for a ship
  Given a ranked run and no saved record for its player, challenge and ship
  When the best check completes
  Then initials entry and Save Score are offered

Scenario: Improve a best outside the top 30
  Given my saved best for this challenge and ship is 420 and outside the top 30
  When my ranked run scores 421 and the best check completes
  Then initials entry and Save Score are offered

Scenario Outline: The existing best stands
  Given my saved best for this challenge and ship is 420
  When my ranked run scores <score> and the best check completes
  Then the result shows my best of 420
  And offers neither initials entry nor Save Score
  Examples:
    | score |
    | 420   |
    | 419   |

Scenario: A different ship or challenge has its own best
  Given I have a saved best for another ship or challenge
  And I have no record for this run's ship and challenge
  When the best check completes
  Then initials entry and Save Score are offered

Scenario: A placeholder holds the save slot while checking
  Given a ranked run whose best check is pending
  Then the result indicates that it is checking
  And it shows the initials field and Save Score disabled
  When I press Enter or click Save Score
  Then nothing is submitted
  When the check finds a new best
  Then the same field and button become usable in the same place
  When the check finds that my best stands
  Then the field and button are no longer shown

Scenario: Focus waits for the check
  Given a ranked run whose best check is pending
  Then focus is on the dialog and on neither Retry nor the launch-source action
  When the check finds a new best and I have not moved focus
  Then focus is on the first empty box of the initials field
  When remembered initials already fill the field
  Then focus is on Save Score instead
  When the check finds that my best stands, is unavailable or is offline
  Then focus is on the dialog's default control

Scenario: Focus I placed stays
  Given a ranked run whose best check is pending
  When I move focus to Retry and the check then resolves
  Then focus is still on Retry

Scenario: The third letter moves focus to Save Score
  Given a new personal best with no remembered initials and focus in the field
  When I type A, C and E
  Then focus is on Save Score
  When I press Enter
  Then the score is saved
  Given remembered initials that fill the field
  When the result opens
  Then focus is not moved to Save Score by the prefill
  Given a focused field holding ACE
  When I press Backspace and type nothing more
  Then focus stays in the field

Scenario: Best check is unavailable
  Given the personal-best check is pending
  Then the result indicates that it is checking
  When the check fails, times out or returns an unreadable record
  Then it explains the check could not be completed and offers retry
  And it does not offer Save Score until a check establishes eligibility

Scenario: Save and remember initials
  Given a new personal best and no remembered initials
  When I enter ACE and successfully save the score
  Then ACE is remembered on this browser and Top Scores opens
  When a later qualifying result opens on this browser
  Then its initials field is prefilled with ACE

Scenario: Browser storage is unavailable
  Given browser-local initials cannot be read or written
  When I enter three letters and successfully save a new best
  Then the score is saved and Top Scores opens

Scenario: Initials are incomplete
  Given a qualifying result with fewer than three letters in initials
  Then Save Score cannot submit the result

Scenario: Another score wins the race
  Given this run was eligible when checked
  And another submission saves an equal or higher best before this run is written
  When I submit this run
  Then the existing best stands and is reported
  And this run is not reported as saved or opened on Top Scores

Scenario: A save fails or times out
  Given I have entered valid initials on a qualifying result
  When saving fails or times out
  Then the result explains the failure and keeps my initials for retry
  And retry resolves the stored score without lowering it or falsely reporting a save

Scenario: Leave during an operation
  Given a best check or save is pending on a completed run
  When I choose Retry or the launch-source action
  Then I can leave without waiting
  And a later completion does not change the new screen or navigate to Top Scores

Scenario: Unranked result
  Given an unranked run ends
  When its game-over screen opens
  Then it offers no ranked initials entry or Save Score
```
