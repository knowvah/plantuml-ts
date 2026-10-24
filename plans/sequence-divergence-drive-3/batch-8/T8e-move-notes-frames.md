# T8e — move notes, frames, divider, link anchor, document (pure move)

Agent: `refactoring-specialist` (sonnet), worktree `sdd3-T8e`. Commit:
`refactor(sequence): draw notes and frames through UGraphic`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verify by opening the Java)
Upstream: `teoz/NoteTile.java` + `skin/rose/ComponentRoseNote.java` /
`NoteBox` / `NoteHexagonal`; `teoz/GroupingTile.java` +
`ComponentRoseGroupingHeader.java`/`Else`/`Space` and `teoz/Blotter.java`;
`teoz/DividerTile.java` + `ComponentRoseDivider.java`;
`teoz/PlayingSpace.java:130-135` `linkAnchor.drawAnchor`. The document chrome
(`TextBlockExporter.java:173-177` margin translate, `:214-231` border) is
ours in `renderer-document.ts`; it stays OUTSIDE the decorator (the wrap is
applied after the margin translate, `:173-175`). Ours: `renderer-note.ts`,
`renderer-frame-header.ts`, `renderer-frame-blotter.ts`,
`renderer-divider.ts`, `renderer-link-anchor.ts`, `renderer-document.ts`.

## Targets
All 1143 rows + all other engines hash-identical (stop 7).

## Write-set
The six files above, their tests, `renderer.ts` only for final composition
wiring if T8a lists it; 500-line pure-move splits.

## Read-set
`diagnosis/handwritten.md`; `renderer-note.ts`; `renderer-frame-header.ts:
1-271`; `renderer-frame-blotter.ts:1-227`; `renderer-divider.ts`;
`renderer-link-anchor.ts`; `renderer-document.ts:40-136`; the Java above.

## Interface contracts
Consumes the T8a seam. Chrome stays plain (non-handwritten) in the seam's
topology; T8f must not route it through the decorator.

## Acceptance
- Given the pre-move hashes, when all rows and engines render, then every
  hash is identical (stop 7).
- Given a document with a group frame and a note, then they draw into the
  seam graphic and no module still returns a shape string for them.
- Given gates, then all pass.

## Observability: N/A. Rollback: Reversible.
