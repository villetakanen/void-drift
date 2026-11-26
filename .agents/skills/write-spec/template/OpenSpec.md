---
generated:
  by: openai-codex/gpt-6
  at: "2026-11-26T10:07:50Z"
verified: []
---

# Row export

## Purpose

Readers need a file containing only the rows they select in a table.

## Requirements

### Requirement: Export selected rows

The system SHALL export up to 20 selected rows. If more than 20 rows are selected, the system SHALL show an error and create no file.

#### Scenario: Export exactly 20 rows

- **GIVEN** a reader has selected 20 rows
- **WHEN** the reader requests an export
- **THEN** the file contains all 20 selected rows

#### Scenario: Export more than 20 rows

- **GIVEN** a reader has selected 21 rows
- **WHEN** the reader requests an export
- **THEN** the reader sees an error
- **AND** no file is created
