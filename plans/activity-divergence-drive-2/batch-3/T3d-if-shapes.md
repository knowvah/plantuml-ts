# T3d — if family + shape rendering

Agent: typescript-pro, worktree `add2-T3d`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: IFNL (`CommandIf2.java:151` getWithNewlines), MLJOIN (`CommandDecoratorMultine.java:63`), CSTYLE (wire theme.conditionStyle + GtileDiamondSquare via DiamondConditionTile; carapo/novata/perate; reluvi EMPTY_DIAMOND `FtileRepeat.java:156-159` — if it needs gtile-repeat.ts (T3b) re-slot), T2G zaloze (GtileIfDown hasTwoBranches=false), IFDS (`FtileIfDown.java:130-131`), vimako (empty-then -> FtileIfDown south label), I (hexagon slant hexagonHalfSize, `Hexagon.java:46,65-71`, also `renderHexagon`), D (7-point empty diamond, `FtileDiamondInside.java:89,106-110`), J/kafevi (diamond inherits activity style, `FtileFactoryDelegator.java:80`, `StyleSignatureBasic.java:271-273`), PAINT/dakesa (gradient Paint to actColors/renderAction), L (`FtileDiamondInside.java:101-102`). See .agent-notes/T2c-style-core.md for the type-boundary plan.

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`{if-dispatch,parser}.ts`, `layout/{conditional-builder,walk-if-down,walk-if-with-links,walk-if-long-horizontal,walk-if-long-vertical}.ts`, `tiles/{gtile-if-down,gtile-if-with-links,gtile-if-long-horizontal,gtile-if-long-vertical,gtile-diamond*}.ts`, `activity-renderer-{if-shapes,shapes,bars}.ts`, `activity-style-defaults*.ts`, their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
