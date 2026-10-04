# T3i — wave-3 leftovers (single agent)

Agent: typescript-pro, worktree `add2-T3i`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md). Runs alone.

## Items (journal rows 44, 47; .agent-notes/T3f.md, T3h.md, T3b.md)
1. ELSEIFIN: `ActivityElseIf.incomingLabel` is captured but never drawn (dead
   field). Thread it onto `labels.west` in `conditional-builder.ts`
   (`FtileIfLongHorizontal.java:178-186` `diamond.withWest`). Must land or the
   field is removed.
2. BACKLBL (boxefe-81-situ725): `CommandBackward3.java:64-89` in/out labels ->
   `FtileWhile.java:146,158-161,313-408` / `FtileRepeat.java:170-187,406-535`,
   placed per `Snake.java:244-270`.
3. CSTYLE on repeat/while rows (novata-87-muti352, perate-09-gale335,
   reluvi-59-pifi444 EMPTY_DIAMOND `FtileRepeat.java:156-159`) and on
   `buildIfWithLinks` (widen `GtileIfWithLinks.diamond1` + walker to
   `DiamondConditionTile`).
4. xabesu-51-dimi831: `node-dispatch.ts#parseRepeatClose` unescape `\n`.
5. N (zafoxu-20-xofe568): `end fork {label}` -> `FtileBlackBlock.java:84-92,
   111-112`, `ParallelBuilderFork.java:115`, wired at `tile-layout-structural.ts#tileFork`.
6. O (cejupe-34-muti621): `|#color|lane|` background `Swimlanes.java:332-340`.
7. levuma-67-cego489: start/stop circle ink hardcoded (`CIRCLE_INK`) in
   `activity-renderer-terminals.ts`; read the dark-mode seed (T3h).

## Write-set
`src/diagrams/activity/**` and its tests (no core, no klimt). Not oracle/**.

## Acceptance
Each item lands (row diffs gone) or is re-slotted with mechanism; 0 unexplained
risers; pinned goldens byte-equal; no dead fields left.
