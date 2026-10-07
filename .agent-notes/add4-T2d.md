# add4-T2d: small leaf families

Worktree `.claude/worktrees/add4-T2d`, branch `add4/T2d`, base `380f86bfb`. I used no Serena
tools and no `git stash`. `src/core/**` is untouched, so the all-engine survey did not apply.

## Commits
1. `a3b3e1158` fix(add4-T2d): exit a top-down sequence at its last child's out y
2. `e4ee85260` fix(add4-T2d): draw both switch diamonds as FtileDiamondInside hexagons
3. `96be06c43` fix(add4-T2d): let the diamond label inherit the activity FontColor
4. `d119e99ff` fix(add4-T2d): floor diamond label lines at the AtomText height of 10
   (this commit also carries the regenerated `docs/catalog.md` for the new export)
5. `e08bab9af` fix(add4-T2d): draw the EMPTY_DIAMOND rhombus below its north label
6. (this note) docs(add4-T2d): report

Before each commit: targeted vitest, `npm run typecheck` and eslint were green. The
`tests/unit/activity` + `tests/diagrams/activity` run ended at 117 files / 1866 tests, all
passing. After each commit the golden ratchet, harness-parity, compress invariant, style
census and swimlane census stayed green, and the pinned goldens stayed byte-equal. The only
red tests were the text-census equality pins from commit 3 on. Each of those movers equals
the pin's `jar` column (see Census movers).

## Java -> ours
- TOPDOWN-OUTY: the sequence's out y is now the last child's own out y plus that child's
  offset, not the sequence's bottom edge.
  - Java: `FtileGeometryMerger.java:49-50` (`geo2.getOutY() + geo1.getHeight()`) and
    `InstructionList.java:153-154`.
  - Ours: `tiles/gtile-top-down.ts#outY`, used for `getCoord(SOUTH_HOOK)`.
  - `SOUTH_BORDER` keeps `height`. Nothing in `src/` consumes it.
  - In `tests/diagrams/activity/tiles/gtile-top-down.test.ts`, the test
    "SOUTH_HOOK.y === height" now asserts the Java behaviour, with the quote. I added three
    more cases.
- SWITCH-GEOM merge hexagon: both switch diamonds now draw as the 7-point hexagon.
  - Java: `getDiamond1`/`getDiamond2` build `new FtileDiamondInside(...)`
    (`FtileFactoryDelegatorSwitch.java:147,159-160`). Its `drawU` always draws
    `Hexagon.asPolygon(shadowing, w, h)` (`FtileDiamondInside.java:89-90`,
    `Hexagon.java:65-74`), even over the 0x0 label and under any `ConditionStyle`.
  - Ours: `layout/walk-switch.ts#SWITCH_DIAMOND_SHAPE` (`diamondShape: 'inside'` on both
    nodes). `activity-renderer-shapes.ts` `'if-merge'` dispatches to `renderHexagonPolygon`
    when the node is `'inside'`.
  - This also fixed diamond1 under `conditionStyle InsideDiamond`. Before, it drew a 4-point
    square there, which the jar never does (fixture `switch-merge-inside`).
- KLIMT-FLOOR fill: a diamond label with no FontColor of its own now inherits the activity
  bucket's.
  - Java: `activityDiamond()` nests `SName.activity` (`StyleSignatureBasic.java:271-273`);
    `skinparam activityFontColor` maps there (`FromSkinparamToStyle.java:144`).
  - Ours: `activity-text-style.ts#activityFontColor` has a new diamond -> activity bucket tier.
  - Jar fixtures `skinparam-activity-fontcolor` and `style-activity-fontcolor` both render
    "cond?" in #F00.
  - Four existing unit tests pinned the opposite with no Java citation. They are in
    `tests/unit/activity/activity-style-defaults.test.ts` (2) and
    `tests/unit/activity/renderer-shapes.test.ts` (2). They now assert the jar's output.
- KLIMT-FLOOR y: a diamond label line under 10 pt no longer sits 2 px low.
  - Java: `AtomText.java:179-181` floors each stripe's height at 10, while the baseline stays
    at the raw `rect.height - descent` (`AtomText.java:213-215`). `FtileDiamondInside.java:94-96`
    centres the floored block.
  - Ours: new export `activity-renderer-shapes.ts#flooredFirstBaselineY`. It is used by
    `renderHexagonLabel` and by `activity-renderer-if-shapes.ts` (the diamond label and
    `renderHexagonMultilineLabel`, whose line advance is now floored too).
  - Jar fixture `diamond-small-font` confirms the 10 px advance on 2- and 3-line labels.
- CONDSTYLE-EMPTY (partial): the rhombus now sits at the bottom of its box, below the north
  label.
  - Java: `FtileDiamond#drawU` translates by `dy(suppY1)` and then draws the 24x24 rhombus
    (`FtileDiamond.java:87-89`). The box is `(24, 24+suppY1)` (`:108-110`).
  - Ours: `activity-renderer-if-shapes.ts#renderDiamond` now uses
    `cy = node.y + node.height - size`. Before, it centred the rhombus on the whole box.
  - A square node is unchanged.

## Rows before -> after (probe score; base Σ 8130, 85 rows)
| row | before | after | note |
|---|---|---|---|
| xolazi | 1 | 0 | TOPDOWN-OUTY |
| jageti | 1 | 0 | TOPDOWN-OUTY |
| cokoja | 2 | 0 | TOPDOWN-OUTY |
| dabulu | 1 | 0 | TOPDOWN-OUTY |
| jusama | 2 | 0 | TOPDOWN-OUTY |
| bizeti | 158 | 157 | TOPDOWN-OUTY |
| giteso | 3 | 0 | exit y (TOPDOWN-OUTY) 3->2, then hexagon 2->0 |
| mazoka | 20 | 19 | residual: DIAMOND-CREOLE-WIDTH (see Not done) |
| lipiki, cezabi, fitega, mukigo, rujixe | 1 each | 0 | hexagon |
| demibe, duvole, mojezi, nosape, pateca, rekuxa, sipibi, sojono, zucile | 1-2 | 0 | hexagon |
| momala 49->48, sokomu 47->46, ruzazu 3->2 | | | hexagon |
| zepima | 3 | 0 | FontColor |
| loxija | 4 | 0 | FontColor 4->2, floor 2->0 |
| xefalo | 289 | 289 | partial; mechanism isolated (see Not done) |
| vimena | 184 | 196 | riser, see below |
| zivocu | 90 | 96 | riser, see below |

## Probe Σ per commit
base 8130 -> c1 8121 -> c2 8118 -> c3 8113 -> c4 8111 -> c5 8111.

## Risers + mechanism (c2 only)
vimena rose 184 -> 196 and zivocu rose 90 -> 96.

- This is the D5 short-circuit. Before c2, the merge polygon's point count differed (5 vs 7),
  so `compareSvg` charged one `@points` unit for it.
- After c2 the counts match, so each coordinate is counted on its own. The merge's x is
  off by the pre-existing case-width residual: vimena merge x 288.134 vs jar 271.084, and
  zivocu 198.306 vs 190.469.
- That residual is SWITCH-NL plus raw `**bold**` label width (T1a). It is not this change.
- The element census did not move for any row at any commit.

## Census movers
Both are text census `fill` moves at c3. Each now equals the pin's `jar` column.

| row | pinned (ours) | now | jar |
|---|---|---|---|
| loxija | #F00 5, #000 4 | #F00 7, #000 2 | #F00 7, #000 2 |
| zepima | #F00 6, #000 5 | #F00 9, #000 2 | #F00 9, #000 2 |

No style or swimlane census moved. The element census showed no delta at any step.

## Not done + why
1. **CONDSTYLE-EMPTY xefalo, rest of the residual. The mechanism is isolated, but the fix is
   outside my write-set.** It has two sites:
   - (a) The in point of `tiles/gtile-if-with-links.ts:473` and `tiles/gtile-if-down.ts:410`
     is `diamond1Y`. Upstream it is `dim1.appendBottom(dimNude)`, whose inY is diamond1's own
     inY (= suppY1), followed by `.incInY(yDeltaNote)` (`FtileIfWithDiamonds.java:179-191`).
     Ours therefore ends the in-arrow at the north label's top and loses 11 px per
     north-labelled diamond, so every row drifts 9.056 px after compression.
   - (b) `tiles/gtile-if-down.ts:302` `stopY = (d1.h - stop.h)/2`. Upstream is
     `labelNorth + (d1.h - labelNorth - stop.h)/2` with `labelNorth = dimDiamond1.getInY()`
     (`FtileIfDown.java:648-657`).
   - Scratch result, reverted: (a) took xefalo 289 -> 227, and (a)+(b) took it to 217. There
     were 0 risers across the 85 rows.
   - The remaining residual is a 1 px y on `isPost?` and below. I did not isolate it.
   - Owner: the if-tile files, which are in no batch-2 write-set I was given. The
     orchestrator should assign them. The fix is 2 lines, plus a test.
2. **mazoka 19.** The `**[EOL]**` hexagon is 17.05 px too wide (122.175 vs 105.125). That is
   four `*` at 4.2625 each, measured as raw text. This is DIAMOND-CREOLE-WIDTH in
   `tiles/gtile-diamond-inside.ts#measureLabel`, which is not in my write-set.
3. **HEX-LABEL-SLOT pekefu (8).** Report only. The fix belongs in `compress/shapes-of.ts`
   (T2b).
4. A single-line *action* label below 10 pt still uses `centeredFirstBaselineY(cy, floored, 1)`,
   which puts the ascent on the floored height (`activity-renderer-shapes.ts`, the
   `renderAction` single-line branch). By the AtomText rule it should be the raw ascent. No
   probe row differs, because these labels go through the Sheet path. I did not verify this
   against the jar and did not change it.

## Observations
## Observation: if-tile in point ignores the diamond's own inY
- **Context**: CONDSTYLE-EMPTY xefalo.
- **Finding**: `GtileIfWithLinks`/`GtileIfDown` `NORTH_HOOK.y = diamond1Y`. Upstream it
  includes `diamond1.getInY()` (suppY1 for a north-labelled `FtileDiamond`). This only shows
  under `ConditionStyle diamond`, where the test text is a north label.
- **Impact**: every EMPTY_DIAMOND `if` row drifts 9.056 px per diamond. A 2-line fix measured
  289 -> 227 with 0 risers.
- **Confidence**: High
## Observation: unit tests pinned non-jar style cascades
- **Context**: KLIMT-FLOOR fill.
- **Finding**: four tests asserted that the activity FontColor must NOT reach the diamond, with
  no Java citation. The jar does colour it (fixtures in `tests/fixtures/activity/add4-T2d/`).
- **Impact**: a test that blocks a fix needs a jar render before anyone trusts it.
- **Confidence**: High
