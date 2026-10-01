# T3k — diamond own-label draw order (push-forward, journal row 42)

Agent: typescript-pro, worktree `add1-T3k` (from the head after T3h's merge).
Commit: `fix(activity): draw branch labels before the diamond's own label`.

## Context
T3f resolved row 31's contradiction: `Gtile.USE_GTILE = false`
(`gtile/Gtile.java:47`; `Swimlanes#drawU` `:237-244`) makes the `GtileIfHexagon`
path dead. The live path is `ConditionalBuilder` -> `FtileDiamondInside#drawU`
(`ftile/vertical/FtileDiamondInside.java:84-104`): hexagon polygon, north,
south, the diamond's OWN label, west, east. Our walkers push the diamond node
(polygon + own label baked into one `renderHexagon` call) BEFORE the south
label: `layout/walk-if-down.ts#pushDiamond1`, `layout/walk-repeat.ts
#pushRepeatCondition`, the equivalent in `layout/walk-while-branch.ts`. Find
every other diamond-with-labels emission site (`FtileDiamondInside2`, while
header, repeat condition) and apply the Java order. The own label must be
emitted separately from the polygon to sit between south and west — find the
cleanest seam (e.g. the hexagon node draws the polygon only and an own-label
node is pushed after north/south), keeping `renderHexagon`'s label geometry.

## Rows
`tamaxe-36-mono574`, `cagoze-40-tete366`, `lacuci-13-nogo718`,
`pedoco-30-mose082`, `rerovo-62-nazo755`, `rosizo-69-mera514`,
`vaxuta-95-cico162`, `vimako-25-mega336`, `nonusu-50-nute147`,
`secepo-00-febi326`.

## Write-set
`src/diagrams/activity/layout/{walk-if-down,walk-repeat,walk-while-branch,
walk-if-long-horizontal,diamond-labels}.ts`, `src/diagrams/activity/
{activity-renderer-shapes,activity-renderer-if-shapes}.ts`, their tests,
new tests.

## Acceptance
Each row's `text()` order diffs at the diamond go to 0; 0 unexplained
risers; 55 pins byte-equal.
