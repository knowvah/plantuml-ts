# T1d — branch exit labels + switch labels (D1, added at T1b pass 2)

Agent: typescript-pro, worktree `add3-T1d`. Rules: [../common-rules.md](../common-rules.md). After T1c (shared conditional files).

## Task
1. `Branch#special` (`Branch.java:222-228`): a pending `nextLinkRenderer()` at
   elseif/else/endif/split-again/end-split/end-switch becomes the branch EXIT
   label. `tileNodes` must hand back a leftover pending label instead of
   dropping it; each compound reads it at its Java attachment point
   (T1a table 1 rows 2, 3, 4, 5, 27, 28, 32: `FtileIfLongHorizontal.java:377-378,458-459`,
   `FtileIfLongVertical.java:280-281,319-320`, `ParallelBuilderSplit.java:254,275`,
   `FtileSwitchWithManyLinks.java:274-275`). Each with labelAlign from its `withLabel` call.
2. Switch case labels (rows 30-33): set labelAlign per `FtileSwitchWithManyLinks.java`
   + `Branch.java#getTextBlockPositive`, retiring the `labelAlign !== undefined`
   legacy path in `renderer.ts`/`canvas-origin-text-ink.ts` for every site
   whose upstream draw is a Snake label. Name every mover (sojono-24-tufe806 moved
   274 -> 281 when ungated in T1b pass 1).
3. Authored oracle fixtures `tests/fixtures/activity/add3-T1d/` per site.

## Write-set
`layout/tile-layout*.ts`, `layout/conditional-builder*.ts`, `layout/walk-if-long-*.ts`,
`layout/walk-switch.ts`, `layout/walk-fork-branches.ts`, `layout/tile-layout-structural.ts`,
`renderer.ts`, `layout/canvas-origin-text-ink.ts`, their tests, fixtures.

## Acceptance
- Each wired site: label x/y + canvas = jar on its fixture; 224 pins byte-equal; 0 unexplained risers.
Observability: N/A. Rollback: Reversible.
