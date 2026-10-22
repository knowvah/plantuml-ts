# T7c — group-end note; transparent group-comment runs

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7c`. Commit:
`fix(sequence): attach notes after end to the grouping tile`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research D)
- **G2** a note after `end` belongs to the grouping tile and is drawn at
  the frame's top right, before the frame children:
  `teoz/GroupingTile.java:275`, `:995-1013` (`drawNotes`);
  `GroupingLeaf.java:47`. The port anchors it to the last message
  (`command-grouping.ts:210-219` `markGroupingLeafNoteAnchor`). The +9
  right-notes term in `GroupingTile.java:988-990` lives in
  `sequence-layout-width.ts` (T3c) — if the width needs the note extent,
  publish it from the frame geo; do not edit the width module (stop 1).
- **AC** (LOW) group comment `[` `]` runs: the jar omits them because the
  group's FontColor is transparent (`DriverTextSvg.java:93`); the port's
  `renderer-frame-header.ts:171-178` (`drawnRuns`) bracket runs don't carry
  the transparent style colour.

## Targets
lirasa, susati, mukebo (G2); pizupi (AC).

## Write-set
`src/diagrams/sequence/command-grouping.ts`, `sequence-layout-frame.ts`,
`renderer-frame-header.ts`, `renderer-frame-blotter.ts`, tests.

## Read-set
`research/research-d-structure.md` G2, AC; `command-grouping.ts:190-261`;
`sequence-layout-frame.ts`; `renderer-frame-header.ts:150-200`;
`GroupingTile.java:260-290,980-1013`.

## Acceptance
- Given `group g` … `end` + `note right : n`, then the note is drawn at the
  frame's top right before its children (test).
- Given pizupi, then the bracket runs are omitted, or AC's mechanism is
  journaled.
- Given the targets, then structural sites are gone; no pinned change.

## Added at T3c hand-back (journal row 55)
Group-end notes in the frame extent: `GroupingTile.getMinX/getMaxX` add `getNotesWidth(LEFT/RIGHT)`; the port draws a note after `end` as a standalone tile.

## Added at T5b hand-back (journal row 73)
N6: note after a group `end` is drawn at the frame top (`GroupingTile.java:275,984-1012`); susati, lirasa.
