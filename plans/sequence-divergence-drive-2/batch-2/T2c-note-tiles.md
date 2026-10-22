# T2c — note tiles: `/ note` merge, top/bottom line, order

Agent: `typescript-pro` (sonnet), worktree `sdd2-T2c`. Commit:
`fix(sequence): merge slash notes and draw top/bottom note connectors`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms
1. **VMERGE** (research C). `/ note` merges into the previous note's row:
   `SequenceDiagram.java:226-241` (`addNote` tryMerge → `Notes`);
   `teoz/NotesTile.java:124-137,192-197` (same top for all notes,
   height = max). `ast.vmerge` is parsed and never read. mozofa: second
   note jar y=79, port 112. Prototype `prototypes/m_vmerge.patch`.
2. **G3** (research D). `note top`/`note bottom` on a message draws two
   dashed connector lines: `teoz/CommunicationTileNoteBottom.java:59-77`,
   `CommunicationTileNoteTop.java:59-75`,
   `CommunicationTileNoteBottomTopAbstract.java:121-130`. The port draws
   an "over" note with no line (`sequence-note-tile.ts:201-212`
   `legacyOverTile`, documented "NOT ported").
3. **G4** (research D). A `note right:` after an intervening standalone
   note attaches to `getLastEventWithNote` (`SequenceDiagram.java:154-158`;
   `TileBuilder.java:102-120`), not to source order. Use T2a's
   note-on-message tiles.

## Targets
mozofa, kibope (`zeroAfterTask.T2c`); ceduvo, macuca, momivo (G3, structural
→ 0); masibi (G4).

## Write-set
`src/diagrams/sequence/sequence-note-tile.ts`, `renderer-note.ts`, the
vmerge handling in `sequence-layout-note.ts` (T2a merged its changes to
that file before you start; touch only note-row merging), their tests.

## Read-set
`research/research-c-vertical.md` (VMERGE); `research/research-d-
structure.md` (G3, G4); `sequence-note-tile.ts` (whole); `renderer-
note.ts`; `sequence-layout-note.ts` after T2a; the Java above.

## Acceptance
- Given `note over A : 1` + `/ note over B : 2`, then both notes share one
  top and the row height is the max (`NotesTile.java:124-137`, test).
- Given `A -> B : m` + `note bottom : n`, then two dashed lines are drawn
  as the jar draws them (test against a golden's elements).
- Given the targets, then each is zero-diff or its residual is journaled to
  another family; no pinned row changes.

## Added at T2a hand-back (journal row 24)
Write-set + `src/diagrams/sequence/sequence-layout-events.ts` (fold top/bottom notes in `foldsInto`). Also: self-note x (`CommunicationTileSelfNoteRight/Left.java:108-112`; fozeva), create-message right note at posD (`CommunicationTileNoteRight.java:122-124`), reversed-message note anchor (`TileBuilder.java:108-115`).
