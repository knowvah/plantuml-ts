# T3f — cross-lane connectors + swimlane details (wave 2)

Agent: typescript-pro, worktree `add2-T3f`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: XLANE (cross-lane connections drawn as routeEdge's generic jog `swimlane-placement.ts:344-352` instead of their own drawTranslate: `FtileIfWithLinks.java:149-174,238-286,369-420`, `FtileRepeat.java:432-438,480-511`), O (`|#color|` lane background, `Swimlanes.java:332-340`), M (title band stroke = background, `Swimlanes.java:357-366`), SLURL (`Swimlanes.java:285-293`), ELSEIFIN (`CommandElseIf2.java:70-76,147-151`), N (`end fork {label}`, `FtileBlackBlock.java:84-92,111-112`, `ParallelBuilderFork.java:115`).

## Added at the b3w1 close (journal rows 38, 40, 41)
- Split cross-lane arrows: `ParallelBuilderSplit.java:207-225,264-285` never
  calls `ignoreForCompression()` (fork does); fork and split share the
  `'parallel-in'/'parallel-out'` EdgeShape -> add a builder-kind discriminant on
  `EdgeMeta` and read it in `compress/shapes-of.ts#terminalArrowhead` (racana,
  bugaja, nupose, roboja, jevoce; residuals of maketa, decudi). Retire any
  `invariant.test.ts` allowlist entry that stops overlapping.
- BACKLBL (boxoto/boxefe-81-situ725): `CommandBackward3.java:64-89` in/out
  labels -> `FtileWhile.java:146,158-161,313-408` / `FtileRepeat.java:170-187,
  406-535` back1/back2 text blocks, placed per `Snake.java:244-270`
  (.agent-notes/T3b.md has the plan).
- CSTYLE on repeat rows (novata, perate, reluvi EMPTY_DIAMOND
  `FtileRepeat.java:156-159`): `theme.conditionStyle` + `GtileDiamondSquare` /
  `DiamondConditionTile` already exist (T2c); wire them into the repeat builder.
- xabesu-51-dimi831: `node-dispatch.ts#parseRepeatClose` never unescapes `\n`
  in the repeat-while condition (T3d's `unescapeLabelNewlines`).

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/{swimlane-*,walk-if-down,walk-if-with-links,walk-if-long-horizontal,walk-repeat,walk-repeat-backward,walk-while-backward,walk-fork-branches}.ts`, `layout/compress/shapes-of.ts`, `activity-geometry.types.ts`, `activity-renderer-swimlanes.ts`, `activity-renderer-bars.ts`, `{dispatch-support,parallel-dispatch,if-dispatch,list-backward-dispatch,node-dispatch,ast}.ts`, `tiles/{gtile-fork,gtile-while,gtile-repeat}.ts`, their tests, `tests/diagrams/activity/layout/compress/invariant.test.ts` (allowlist retirements only).
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
