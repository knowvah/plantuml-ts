# T9 — Grouping `&`, autonumber increment/stop/resume, activate family

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Three small command families account
for **~20 corpus fixtures**, each pinned with its `file:line`.

## Task

**Grouping PARALLEL** (~10 fixtures) — `CommandGrouping`'s `(&[%s]*)?` group
(`CommandGrouping.java:66`), the teoz `&` prefix that runs a group on the same
row as the previous one. Per D4 this is **parsed, stored on `FrameEvent`, and
not drawn**: every consumer of `GroupingStart.isParallel()` is under
`sequencediagram/teoz/` (`teoz/GroupingTile.java:145,864`). Upstream's classic
renderer ignores it too — no `DIVERGENCES.md` entry.

**Autonumber** (~6 fixtures) — `CommandAutonumberIncrement`, whose
`([A-Za-z])` names the digit group to bump; `CommandAutonumberStop`;
`CommandAutonumberResume`. Registered at `SequenceDiagramFactory.java:147-150`.

**Activate family** (~4 fixtures):
- `CommandActivate` calls `getOrCreateParticipant`, so a bare `activate X`
  **declares** X (`CommandActivate.java:109`). This port currently requires a
  prior participant declaration — that is the defect.
- `CommandActivate`'s WHO group `([%pLN_.@]+|[%g][^%g]+[%g])` — the QUOTED
  alternative, for a participant name containing a space (`:6x`, read it).
- `CommandDeactivateShort` — a bare `deactivate` with no participant
  (`SequenceDiagramFactory.java:103`).

## Write-set

- `src/diagrams/sequence/command-grouping.ts`
- `src/diagrams/sequence/command-autonumber.ts`
- `src/diagrams/sequence/command-lifeline.ts`
- `tests/unit/sequence/` — one test file per module

Not `ast.ts`, not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandGrouping.java:55-90`
- `.../command/CommandAutonumberIncrement.java`, `CommandAutonumberStop.java`,
  `CommandAutonumberResume.java`
- `.../command/CommandActivate.java:55-120` — especially `:109`
- `.../sequencediagram/SequenceDiagramFactory.java:99-155` — registration order
- `src/diagrams/sequence/sequence-parse-helpers.ts` — `applyAutonumber` and the
  existing `DottedNumber` formatting
- `../decisions.md#d4`

## Architecture decisions in force

D4 (grouping `&` stored, not drawn), D2 (order frozen). Both locked.

## Interface contracts

Consumes T6's `FrameEvent.parallel` and the existing autonumber state on
`SequenceDiagramAST`. Produces no new interface.

## Acceptance criteria

- Given `& group X`, then the frame parses, carries `parallel`, and draws
  exactly as it would without the `&`.
- Given `autonumber inc A`, `autonumber stop`, `autonumber resume`, then each
  parses and the emitted numbering matches the jar for the pinned fixtures.
- Given a source whose only mention of `X` is `activate X`, then `X` is
  declared as a participant — matching `getOrCreateParticipant`.
- Given `activate "Some Name"`, then the quoted WHO alternative matches.
- Given the ~20 pinned fixtures, then none refuses and all route `SEQUENCE`.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** Three command modules.

## Quality bar

All four gates green; 90/90/90. Author fixtures with
`scripts/oracle-render.sh` where needed.

## Boundaries

- **Always**: read the Java method body; cite `file:line`.
- **Never**: fit a value; never edit `ast.ts`; never write a divergence entry
  for teoz-only behavior.
- **Ask first**: `activate X` declaring a participant changes what
  `applyHideUnlinked` sees. If the pinned fixtures disagree with the jar after
  the change, journal before adjusting.

## Commit

`feat(T9): port grouping parallel, autonumber inc/stop/resume, activate family`
