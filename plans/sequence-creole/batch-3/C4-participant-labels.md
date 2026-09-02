# C4 — participant names and stereotypes

## Context

A participant head is already one-to-N runs — the parent mission's A3 made the
stereotype rows their own runs, which is exactly the shape creole needs. What
is missing is that each row's TEXT is not parsed.

`bodobu-73-noli773` is the reference: we emit `<<createRequest>>` where the jar
emits `«createRequest»`.

## Task

Route each head row's display through C1's producer, and have the renderer emit
each run's style.

## Write-set

- `src/diagrams/sequence/geo-participant.ts`
- `src/diagrams/sequence/sequence-layout-participants.ts` — `buildLabelRuns`
- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `tests/unit/sequence/participant-label-placement.test.ts`,
  `tests/unit/sequence/participant-sizing.test.ts`, and any this turns red

## Read-set

- `src/diagrams/sequence/sequence-layout-participants.ts#buildLabelRuns` — the
  existing row builder; a creole row becomes several runs on one row.
- `src/diagrams/sequence/renderer-participant-shapes.ts#renderNameBlock` — the
  head/foot translation, which must keep working per-run.
- `decisions.md#d3`

## Architecture decisions in force

- **D3** — one atom, one run. A row may now hold several.
- The parent mission's **D4** still holds: `leftX = centerX - textWidth / 2`,
  and `centerX` stays the model's authoritative anchor. With several runs per
  row the CENTRING is over the row's total width, not each run's.

## Acceptance criteria

- Given `bodobu-73-noli773`, when rendered, then its stereotype row reads
  `«createRequest»`.
- Given a head row with mixed markup, when rendered, then the row's runs are
  centred as a BLOCK on the name-block centre, not individually.
- Given the multi-line participant body `jozomu-87-tajo507`, when rendered,
  then `=MyTitle` is a heading run and `""MySubTitle""` is monospace — or, if
  the atom engine does not classify those, the residual is RECORDED with its
  mechanism rather than left silent.
- Given a plain participant name, when rendered, then its output is
  byte-identical to before this task.
- Given the corpus, when measured, then `descended` has not fallen.

## Observability

N/A beyond the content census.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`fix(C4): render participant names and stereotypes through creole`
