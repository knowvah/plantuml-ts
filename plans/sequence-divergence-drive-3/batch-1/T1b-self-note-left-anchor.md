# T1b — a self-message `note left` anchors at the loop's left edge

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1b`. Commit:
`fix(sequence): anchor self-message left notes at tile min x`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `self-note-left-anchor`; Java re-read)
`CommunicationTileSelfNoteLeft#getNotePosition` is `tile.getMinX()
.addFixed(-dim.getWidth())` (`teoz/CommunicationTileSelfNoteLeft.java:108-114`;
sdd2 cited `:107-115`, of which `:107` is blank), with `addConstraints` growing the box's left margin by
`ensureOwnBoxClearsNote` (`:152-159`, `overflowLeft = posB - getMinX()`).
Ours: `noteAnchor` (`sequence-note-anchor.ts:101-111`) returns only
`{ participant }` for a left note, so the note sits at
`posC + level * LIVE_DELTA_SIZE` instead of `selfMinX(...) - noteWidth`.
`selfMinX` already exists (`:73-81`). The note's width is known only inside
`noteTile` (`sequence-note-tile.ts:196-214`), so the anchor must carry the
tile's min x (a `leftX`, mirroring `rightX`) and `noteTile` subtract the
width — the consumers are `sequence-layout-note.ts:365-380` and
`sequence-note-tile.ts:60-80,205-212` (the task text named only the anchor
file; these two are added to the write-set).

## Targets
nuzise-60-temi305 to 0 (87 units).

## Write-set
`src/diagrams/sequence/sequence-note-anchor.ts`, `sequence-note-tile.ts`,
`sequence-layout-note.ts` and their tests. No other batch-1 task writes them.

## Read-set
`sequence-note-anchor.ts:20-26,60-111`; `sequence-note-tile.ts:60-80,195-225`;
`sequence-layout-note.ts:360-421`; Java: `CommunicationTileSelfNoteLeft.java:
100-165`, `CommunicationTileSelfNoteRight.java:100-112` (the right twin, to
keep the two symmetric).

## Acceptance
- Given `A -> A : x` + `note left : n`, when laid out, then the note's x is
  `selfMinX - noteWidth` and the participant margin grows by `overflowLeft`
  when positive (unit test citing `:108-114,152-159`).
- Given nuzise, then it diffs to 0; reverse (`A <- A`) self notes keep their
  current output unless the Java differs (say which).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
