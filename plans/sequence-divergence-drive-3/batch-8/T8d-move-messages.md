# T8d — move messages, arrowheads, self messages through UGraphic (pure move)

Agent: `refactoring-specialist` (sonnet), worktree `sdd3-T8d`. Commit:
`refactor(sequence): draw messages and arrowheads through UGraphic`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verify by opening the Java)
Upstream: `teoz/CommunicationTile.java:324-389` applies dy/dx translates
(`:327,351,364,387`) then `comp.drawU(ug, area, ctx)` with
`skin/rose/ComponentRoseArrow.java` / `ComponentRoseSelfArrow.java` /
`AbstractComponentRoseArrow.java` (arrowhead polygon/path via the `ug`
passed in); self messages `CommunicationTileSelf.java`. Ours:
`renderer-message.ts` (`renderMessage` :133), `renderer-message-self.ts`,
`renderer-arrowhead.ts`, `renderer-arrowhead-glyph.ts`. Reproduce the
apply order exactly — it sets the future RNG restart points (T8f) — but
change no emitted byte now.

## Targets
All 1143 rows + all other engines hash-identical (stop 7).

## Write-set
`src/diagrams/sequence/renderer-message.ts`, `renderer-message-self.ts`,
`renderer-arrowhead.ts`, `renderer-arrowhead-glyph.ts`, their tests;
500-line pure-move splits.

## Read-set
`diagnosis/handwritten.md`; the four files above (`renderer-message.ts:
60-177`, `renderer-arrowhead.ts:1-297`); `CommunicationTile.java:320-395`;
`ComponentRoseArrow.java`, `ComponentRoseSelfArrow.java`.

## Interface contracts
Consumes the T8a seam. `renderMessage` keeps its role for `renderer.ts`;
label text still draws through the existing creole seam (text passes through
the decorator unchanged, `UGraphicHandwritten.java:67-87`).

## Acceptance
- Given the pre-move hashes, when all rows and engines render, then every
  hash is identical (stop 7).
- Given a self message with a multicast arrow, then the shapes reach the
  graphic in the order T8a's artifact records.
- Given gates, then all pass.

## Observability: N/A. Rollback: Reversible.
