# T8b — move lifelines and live boxes through UGraphic (pure move)

Agent: `refactoring-specialist` (sonnet), worktree `sdd3-T8b`. Commit:
`refactor(sequence): draw lifelines and live boxes through UGraphic`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verify by opening the Java)
Upstream draws lifelines in `LiveBoxes.java:380-420` (translate at `:400`)
via `skin/rose/ComponentRoseLine.java` and `ComponentRoseActiveLine.java`,
each a UGraphic `apply(...)` chain ending in `draw(ULine/URectangle)`. Ours
emits strings from `renderer-lifeline.ts` (`renderLifeline` :100,
`renderLifelineSegments` :167, `renderActivation` :207,
`renderDestroyCrosses` :295, `renderLifelinePass` :361). Move them to the
T8a seam: same shapes, same order, same attributes. No behaviour change.

## Targets
All 1143 sequence rows and all other engines hash-identical to the
pre-move hashes (stop 7). No row moves.

## Write-set
`src/diagrams/sequence/renderer-lifeline.ts`; the seam in
`src/diagrams/sequence/renderer.ts`; their tests; a pure-move split of
either file if over 500 lines (journal it).

## Read-set
`diagnosis/handwritten.md`; `renderer-lifeline.ts:90-373`;
`renderer.ts:322-406`; `LiveBoxes.java:380-420`;
`skin/rose/ComponentRoseActiveLine.java`, `ComponentRoseLine.java`.

## Interface contracts
Consumes the T8a seam API unchanged; if it is insufficient, stop 1 and
report — do not widen it silently. Exports keep their names (callers and
tests unchanged); T8c-T8e build on the seam this task lands in `renderer.ts`.

## Acceptance
- Given the pre-move hashes, when every sequence row and every other engine
  renders, then every hash is identical (stop 7).
- Given `renderLifelinePass`, when called for a lifeline with activations,
  then the UGraphic receives shapes in the previous emission order.
- Given a non-handwritten document, then no `UGraphicHandwritten` is built.

## Observability: N/A. Rollback: Reversible.
