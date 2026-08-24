# T3 — filter candidates by the `@start` line's declared types

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is canonical. Read the Java method body before writing.

`DiagramRegistry.resolve` (`src/core/dispatcher.ts:245`) carries a hardcoded
`AMBIGUOUS_TYPES = new Set(['sequence', 'class', 'state', 'unknown'])` that
decides which sources must go through `accepts()` scanning rather than a
direct type match. That set is an ad-hoc local invention.

Upstream expresses the same idea properly: `DiagramType.findStartTypes` turns
the `@start` line into a **set of candidate types**, and the factory loop
skips any factory whose `getDiagramType()` is not in that set
(`PSystemBuilder.java:258-260`).

## Task

Replace the ad-hoc ambiguity list with upstream's candidate-set filter.

Write the tests first (TDD).

## Read-set

- `~/git/plantuml/.../PSystemBuilder.java:239-241,255-270` — `findStartTypes`
  on the first line, and the `diagramTypes.contains(...)` skip
- `~/git/plantuml/.../core/DiagramType.java` — the whole enum and
  `findStartTypes`; note it returns a **collection**, not one value
- `src/core/dispatcher.ts:245-270` — `resolve()` as it stands
- `src/core/block-extractor.ts:202-260` — `detectUmlType`, which currently
  produces the single `source.type` that `resolve` keys off
- `../decisions.md#d4`

## Interface contract

If `detectUmlType`'s single return becomes a set, that is a change to
`UmlSource.type`'s meaning and every reader must be found first —
`grep -rn 'source\.type\|\.type ===' src/ tests/`. Declare the new shape in
your report. Prefer **adding** a candidate-set field beside `type` to
rewriting `type`'s meaning, if both satisfy the acceptance criteria.

## Write-set

- `src/core/dispatcher.ts`
- `src/core/block-extractor.ts`
- `tests/unit/core/dispatcher.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given `resolve()`, when a source declares a specific `@start` type, then
   only plugins whose type is in that candidate set are consulted, mirroring
   `PSystemBuilder.java:259` with the citation in a comment
2. Given `AMBIGUOUS_TYPES`, then it no longer exists as a hardcoded list
3. Given the routing gate re-run, then the residual misroute count is recorded
   **per bucket** in the journal, not just as a total
4. Given any fixture that newly misroutes, or any de-promotion among the 482
   zero-diff fixtures, then **STOP**

## Quality bar

All four gates green. Do not re-pin any baseline — batch 5 owns that.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently — see T2's rollback note.

## Boundaries

- **Always:** keep `@startuml`'s multi-candidate behaviour. Upstream returns a
  *set* precisely because `@startuml` is genuinely ambiguous; collapsing it to
  one type re-introduces this mission's defect in a new place
- **Never:** change any `accepts()` implementation (batch 4); re-pin baselines
- **Ask first:** if `UmlSource.type` must change meaning rather than gain a
  sibling field — that widens the blast radius to every reader of that field

## Commit

One commit: `fix(T3): filter dispatch candidates by declared start types`
