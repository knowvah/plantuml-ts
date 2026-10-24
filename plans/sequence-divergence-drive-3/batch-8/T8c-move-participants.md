# T8c — move participants through UGraphic (pure move)

Agent: `refactoring-specialist` (sonnet), worktree `sdd3-T8c`. Commit:
`refactor(sequence): draw participants through UGraphic`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verify by opening the Java)
Upstream draws a head through `LivingSpace.java:190-211`
(`ug.apply(UTranslate...)` then `comp.drawU(ug, area, context)`), where the
component is `skin/rose/ComponentRoseParticipant.java`, `ComponentRoseActor`,
`ComponentRoseBoundary`, `Control`, `Database`, `Entity`, `Queue`. Ours:
`renderer-participant-shapes.ts` (`renderParticipantBlock` :247,
`renderParticipantBox` :277, `renderFooterBox` :312, `renderCreatedHead`
:272) emits strings; `renderer-participant-symbol.ts` already builds
`TextBlock`s drawn into a private `UGraphicSvg` (lines 87-104, 182-267) and
must instead draw into the shared seam `ug`, not a throwaway one. Pure move.

## Targets
All 1143 rows + all other engines hash-identical (stop 7).

## Write-set
`src/diagrams/sequence/renderer-participant-shapes.ts`,
`renderer-participant-symbol.ts`, their tests; 500-line pure-move splits.

## Read-set
`diagnosis/handwritten.md`; `renderer-participant-shapes.ts:60-314`;
`renderer-participant-symbol.ts:80-421`; `LivingSpace.java:190-215`;
the `ComponentRose*` participant classes named above.

## Interface contracts
Consumes the T8a seam and the `renderer.ts` wiring T8b landed. Exports
(`renderCreatedHead`, `renderParticipantBox`, `renderFooterBox`,
`COLLECTIONS_DELTA`) keep their signatures for callers; internal calls take
the seam graphic.

## Acceptance
- Given the pre-move hashes, when all rows and engines render, then every
  hash is identical (stop 7).
- Given a symbol participant (database, queue, actor), then it draws into
  the shared graphic, with no private `UGraphicSvg` left in the module.
- Given gates (tests, typecheck, lint, build), then all pass.

## Observability: N/A. Rollback: Reversible.
