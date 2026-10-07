# T2a — note families (wave B, re-cut at the b1 close)

Agent: typescript-pro, worktree `add3-T2a`. Rules: [../common-rules.md](../common-rules.md).

Order (census, journal row 6): NOTEW/NOTE-SIZE first (`Opale.java:56-59,89-96`;
we measure the note as one line, `gtile-note.ts:28-30`), THEN NOTELEFT
(`NotePosition.java:43-48`, `CommandNote3.java:123` — alone it rises +182),
then IFNOTE (`InstructionIf.java:222-227` -> `FtileIfWithDiamonds.java:79-111,200-213,234-240`,
`FtileIfDown.java:116-120,523-529`), NOTE-MULTI (`FtileWithNoteOpale.java:114-123`
-> FtileWithNotes), NOTE-SWIMLANE (`FtileWithNoteOpale.java:86,92-99,217`),
BACKNOTE (`InstructionRepeat.java:177-185,218-226`), GROUPNOTE
(`InstructionGroup.java:104-105,125-131`), PCTN (`%n()` ->
`NewlineShort.java`, `Jaws.BLOCK_E1_NEWLINE`, `DisplayNewlines.ts#parseWithNewlines`).
NOTE-CREOLE is deferred (its `renderNote` site is in `activity-renderer-shapes.ts`, T2b's file).

## Write-set
`tiles/gtile-note.ts`, `layout/tile-layout*.ts`, `activity-layout-constants.ts`,
note branches of `layout/tile-coordinates.ts`, `node-dispatch.ts`, `if-dispatch.ts`,
`layout/conditional-builder*.ts`, `layout/walk-if-*.ts` (note placement only),
`tiles/gtile-if*.ts`, `tiles/gtile-group.ts`, `layout/tile-layout-backward.ts`, tests, fixtures.

## Acceptance
- Each NOTE row: shape + geometry = jar, or residual named; 0 unexplained risers;
  pins byte-equal; harness-parity green.
