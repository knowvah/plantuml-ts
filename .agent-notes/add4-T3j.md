# add4-T3j: snake-merge noise, label slots as drawn blocks, next-arrow style (branch add4/T3j)

## Commits

| sha | mechanism | probe Σ after |
|---|---|---|
| base `25274d3b1` | | 217 |
| `b64216e51` | while connector hooks resolved child-local first (snake-merge "not a H or V line") | 217 |
| `bfa01db2f` | elseif/switch hexagons: FULL side blocks + condition Sheet (T3h patch 1) | 217 |
| `295644229` | EMPTY_DIAMOND slots as drawn blocks, `sideMode` seam (T3h patch 2) | 217 |
| `239ec6d88` | sequential gap adds the in-label block height (T3h patch 3) | 217 |
| `92743c31a` | EMPTY_DIAMOND while test gets `ifLabelRole: 'test'` | 217 |
| `3b321c1d8` | INSIDE_DIAMOND slots as drawn blocks | 217 |
| `81870ad38` | merge of `feat/activity-divergence-drive-4` (brings in T3i; catalog regenerated) | 217 |
| `3701f8bee` | refactor: `buildWhileFrame` was back over 30 NLOC and the file over 500 lines after `b64216e51` | 217 |
| `e8308df37` | the next arrow is drawn in its CommandArrow3 COLOR/style | 217 |
| `d06d85027` | refactor: dead text-placement helpers deleted, stale comments fixed | 217 |

After every commit:
- the 406 pinned goldens are byte-equal (ratchet green);
- the full gate command (`tests/oracle/svg-conformance tests/diagrams/activity tests/unit/activity tests/architecture`) and `npm run typecheck` are green;
- eslint and prettier are clean on every touched file;
- lizard at the hook thresholds is clean;
- the probe shows 0 risers and 0 fallers.

## Java -> ours

| Java | ours |
|---|---|
| `Direction.java:110-130` `fromVector` (exact `==`, throws "Not a H or V line!"); `Worm.java:361-372` merge, no tolerance | `snake-merge-worm.ts#directionOf` unchanged (already faithful). Evidence: the jar itself throws "Not a H or V line!" on `vafupe-19-cima350` (a jar-error row). |
| `FtileWhile.java:179-186,228-232,621-641` (`getTranslate*().getTranslated(local point)`); `Worm.java:67-79` (the origin is added last, as `tr`) | `layout/walk-while-branch.ts#childHook`, `#buildWhileHookFields` |
| `FtileIfLongHorizontal.java:172-177,186`; `FtileSwitch.java:110-114,123` | `tiles/gtile-diamond-inside2.ts` constructor (`measureSide` FULL, `measureCondition`) |
| `ConditionalBuilder.java:240-247,262-267,280-283`; `FtileDiamond.java:87,110` | `tiles/gtile-diamond-empty.ts` constructor + `sideMode` |
| `ConditionalBuilder.java:267-273`; `FtileDiamondSquare.java:86,115` | `tiles/gtile-diamond-square.ts` constructor + `sideMode` |
| `FtileFactoryDelegatorAssembly.java:58-62`; `FtileFactoryDelegator.java:103-112` (create7 SIMPLE_LINE) | `tiles/gtile-top-down.ts#sequentialGap` |
| `FtileWhile.java:124-126,137-139` (`withNorth(testTb)`, fcTest) | `layout/walk-while-branch.ts#markEmptyDiamondTest` |
| `CommandArrow3.java:92,96-110`; `ActivityDiagram3.java:470-476` | `layout/tile-layout-inlabel.ts#consumeArrowLabel` (style-only arrows are kept), `#applyPendingLabelToLastEdge` |
| `HtmlColorAndStyle.java:66,86-106`; `LinkStyle.java:98-147`; `Worm.java:119-171`; `Snake.java:189-196` | `renderer.ts#edgeLook`, `#defaultEdgeLook`, `#linkStroke`, `#colorTokenHex`, `SNAKE_STROKE_VALUE`; `renderEdge` (hidden: label only) |

## Rows / fixtures (before -> after)

There are no probe-row movers: every pinned row equals its pin. Across all 650 inputs (451 corpus rows plus every fixture under `tests/fixtures/activity/**`), hashed at every commit, no corpus SVG moved. Only these fixtures moved:

- add4-T3g/hexagon-labels: 92 -> 0 (`bfa01db2f`)
- add4-T3h/elseif-creole: 90 -> 0 (`bfa01db2f`)
- add4-T3j/empty-diamond-padding (authored): 62 -> 0 (`295644229`)
- add4-T3j/empty-diamond-blocks (authored): 68 -> 67 (`295644229`; residual below)
- add4-T3h/side-labels-padding: 17 -> 0 (`239ec6d88`)
- add4-T3h/side-labels-small-font: 17 -> 19 (`239ec6d88`; the one riser, below)
- add4-T3h/empty-diamond-north: 52 -> 0 (`92743c31a`)
- add4-T3j/inside-diamond-blocks (authored): 124 -> 0 (`3b321c1d8`)
- add4-T3i arrow-style-bold 1 -> 0, arrow-style-colored 3 -> 0, arrow-style-colored-label 3 -> 0, arrow-long-multiline 3 -> 0 (`e8308df37`)
- add4-T3j/arrow-style-dashed and arrow-style-headcolor (authored): 0
- add4-T3j/arrow-style-hidden (authored): 12, residual below

Two other fixtures score above 0: T1p-e/switch-cross-swimlane (42) and T1p-f/switch-big-diamond (42). Both were already at those scores and never moved.

## Risers + mechanism

- **side-labels-small-font 17 -> 19 at `239ec6d88`.**
  - Patch 3 shrinks the gap to the 8pt block.
  - `tile-layout-inlabel.ts#inLabelReservation` still boxes the label at the fixed `ARROW_LABEL_LAYOUT_FONT_SIZE = 11`, which is now taller than the gap, so compression is blocked.
  - Proven: dropping the reservation takes the fixture to 0, and no other input of the 650 moves.
  - It cannot simply be deleted. The lane-tagged reservation is also the lane-width ink (`swimlane-reservation-lane.ts#laneReservationItems`), and add4-T2f/lane-res-inlabel goes red without it (lane b is 101.6 px narrower).
  - See Not done 1.

## Census movers

- Style, text and swimlane census tests are green throughout.
- No corpus SVG moved, so there are no census movers.
- Per-tag element counts of the authored fixtures equal the jar's, including arrow-style-hidden: its line and head are dropped, as the jar drops them.

## Code deleted

- In `activity-text-placement.ts`: `activityTextLineX`, `centeredLineX`, `boxLineX`, `ActivityTextOpts`, `isTableRowLine` and `tableRowCellsOf`, plus their unit tests. The one `centeredLineX` expectation helper in `renderer-shapes.test.ts` is now inlined.
- In `gtile-diamond-inside2.ts`, `-empty.ts` and `-square.ts`: the raw `measureLabel` copies and their `ATOM_TEXT_MIN_HEIGHT`.
- In `renderer.ts#renderEdgeLabel`: the `<back:${edge.color}>` label re-wrap. That is the dead `ActivityArrowLabel.color` consumer; `edge.color` is now the COLOR group.
- In `consumeArrowLabel`: the read of `node.color`.
- Stale comments naming `activity-renderer-text.ts` in `activity-creole-sheet.ts` and `activity-text-placement.ts`. The core comments are left alone, as instructed.

## Not done + why

1. **The in-label reservation is still fixed at 11pt and placed using the raw width** (`tile-layout-inlabel.ts:116-140`). This is task 3's second half.
   - Using `activityFontSize(theme,'arrow')` and `edgeLabelBlockSize` needs a `Theme`, but `applyInLabel` only receives `Out` and the walkers carry no theme.
   - Minimal seam: add `theme` to `Out` in `layout/tile-coordinates.ts`, set at `layout/assign-coordinates-full.ts`. Then mirror `canvas-origin-text-ink.ts#extendForEdgeLabelText` for the box. Both files are outside the write-set.
   - Expected result: side-labels-small-font 19 -> 0.
   - `ARROW_LABEL_LAYOUT_FONT_SIZE` (`activity-layout-constants.ts:63`) and its doc would then become dead (the owner's file).
2. **While and repeat side slots are still SIMPLE_LINE.** Upstream builds them FULL (`FtileWhile.java:123,127-128`, `FtileRepeat.java:130-131`).
   - The callers at `tile-layout.ts:236,238,341,343` should pass `CreoleMode.FULL` to the new `sideMode` parameter.
   - Widths and heights only differ for FULL-only markup (headings, lists, tables).
3. **The fcArrow test quirks are not mirrored.**
   - `FtileIfLongVertical.java:144-146` (vertical elseif tbTest) and `FtileRepeat.java:124-129` (INSIDE_DIAMOND repeat tbTest) build the condition with **fcArrow**.
   - Ours sizes and draws them at the diamond font.
   - Mirroring needs an arrow-font role on the `'if-own-label'` draw (`activity-renderer-if-shapes.ts` and `activity-geometry.types.ts`). Sizing alone would split the box from the ink.
   - Equal under the default skin (both 11pt, `plantuml.skin:370,373`).
4. **Residual on empty-diamond-blocks (67).**
   - A heading stripe in an EMPTY_DIAMOND north test compresses 0.889 px too far. That is exactly (15 - 11) / 4.5, the heading's extra descent.
   - Cause: `compress/shapes-of.ts#ifLabelShape` derives stripe baselines from the base font (`anchor.dy`, `floorActionLineHeight(fontSize)`, `bounder.getDimension(lines[0], fontSize)`). This is T3h note 9's class; owner `compress/`.
   - Evidence: before compression, if-split.y = 70; ours compresses to 45.944 and the jar to 46.833. The same text matches the jar in an action box and in a hexagon.
5. **Residual on arrow-style-hidden (12).**
   - `Worm.java:123-124` returns before drawing a hidden worm, so the jar's SlotFinder sees no arrowhead.
   - `compress/shapes-of.ts#shapesForEdge` still adds `terminalArrowhead`, so the gap compresses 8.444 px less. Owner `compress/`.
6. **Rainbow (`-[#red;#blue]->`):** only the first colour is drawn. `Snake#drawRainbow` and `WormMutation` (`Snake.java:200-224`) are not ported; that is a separable port.
7. **Remaining COLOR-group gaps:**
   - A non-colour token (e.g. `plain`) is ignored, where upstream throws `NoSuchColorException`.
   - The emphasize arrowhead of a dashed or dotted worm gets the width but no dasharray.
8. **The `ActivityArrowLabel.color` AST field is left in `ast.ts`.**
   - `tests/unit/activity/parser.test.ts:787` and `ast.ts:60-64`'s doc still name it.
   - Nothing produces or reads it now, and `ast.ts` is outside my write-set. Owner: delete the field, that assertion, and `ast.ts:56-58`'s "not yet drawn" doc.
9. **Same ULP grouping in `walk-if-down.ts:196` `connectionIn`.**
   - It produces `(168.97500000000002,254)->(168.975,278)` on xovigi under patch 1. It is harmless today (nothing merges into it), but it has the same mechanism as commit 1.
   - Owner: walk-if-down. `tile-coordinates.ts#pushTopDownSiblingEdge` already groups child-local first.
10. **Fixture-path caveat for prior agents.** `tests/fixtures/activity/*/*.puml` misses 131 nested fixtures (e.g. `add4-T2f/lane-res-inlabel/in.puml`). Glob `**` when hashing for movers.

## Observation: the compress invariant no longer sees pinned rows
- **Context**: reproducing T3h's snake-merge throw on xovigi.
- **Finding**: `tests/diagrams/activity/layout/compress/invariant.test.ts` filters `status === 'baseline'`. xovigi is now `pinned`, so the "no throw" gate passed with patch 1 applied even though the layout throws for xovigi.
- **Impact**: the invariant guards fewer rows as rows get pinned. A throw on a pinned row only surfaces through the ratchet, and only if the render path throws.
- **Confidence**: High

## Observation: the jar throws "Not a H or V line!" itself
- **Context**: deciding whether snake-merge needs a tolerance.
- **Finding**: `vafupe-19-cima350` (a jar-error row) throws the same `Direction.fromVector` exception in the jar (`oracle-render.sh` output). Upstream has no tolerance, so ULP noise must be fixed where the arithmetic groups its terms.
- **Impact**: never add an epsilon to `snake-merge-worm.ts#directionOf`. Mirror upstream's local-first translate grouping instead.
- **Confidence**: High

## Observation: the in-label reservation is also lane-width ink
- **Context**: trying to delete `inLabelReservation` as redundant with `edgeLabelShape`.
- **Finding**: compression already sees the label (`edgeLabelShape`), but `laneReservationItems` feeds lane widths from lane-tagged reservations. Without it, `lane-res-inlabel` loses 101.6 px of lane width.
- **Impact**: fix the reservation's font and width; do not delete it.
- **Confidence**: High

# Follow-up round (write-set widened to src/diagrams/activity/**)

## Commits
| sha | mechanism | probe Σ |
|---|---|---|
| `37b7e9b39` | `Out.theme`; in-label reservation = drawn create7 block at the arrow font (mirrors `canvas-origin-text-ink#extendForEdgeLabelText`); `ARROW_LABEL_LAYOUT_FONT_SIZE`, `snakeLabelLineWidth` deleted | 217 |
| `a1b6dd1cd` | while/repeat condition tiles get `sideMode` FULL (`FtileWhile.java:123,127-128`, `FtileRepeat.java:130-131`); new `ifLabelRole: 'full'` draws the same block (while/repeat via `diamond-labels.ts`, elseif hexagon slots) | 217 |
| `5fc5b6070` | `compress/shapes-of.ts#ifLabelShape` = LimitFinder text extent of the drawn block (per-UText font, `SlotFinder.java:127-135`) | 217 |
| `892e08e8a` | hidden worm adds no terminal/emphasize slot (`Worm.java:123-124`); shared `layout/edge-link-style.ts` | 217 |
| `6182f059e` | `ActivityArrowLabel.color` deleted (+ two parser assertions now on `style`) | 217 |
| `5bad88bab` | compress invariant population = baseline + pinned (412 rows, was 6); 6 hard + 9 soft pairs re-pinned with dumped evidence | 217 |

## Fixtures before -> after
side-labels-small-font 19 -> 0; while-full-labels-diamond (authored) 107 -> 0; while-full-labels (authored) 198 -> 82 -> 0; empty-diamond-blocks 67 -> 0; arrow-style-hidden 12 -> 0. All 650 inputs hashed per commit: no corpus SVG moved; no riser.

## Not done
- Item 6 (`walk-if-down.ts` local-first hooks): same mechanism, patch at `.agent-notes/add4-T3j-walk-if-down-local-first.patch`, NOT committed. It removes the xovigi/58.65/119.009 noise, but moves (1) navene-45-cozo466's swimlane census by ULP (190.51875000000004 -> ...07; the equality pin is unrounded, jar column 190.519 equal either way) and (2) livigo-47-negi605 / nusajo-97-bemo713 header/footer `<text x>` 100.15 -> 100.14999999999999 (still conformant; the text x is emitted unrounded by the header/footer writer, a src/core formatting gap). Landing it needs an orchestrator census re-pin. One row keeps a 1-ULP connectionIn/Out (64.390625) -- intrinsic `(L - a) + a` vs `(L - b) + b`.
- Rainbow arrows (`Snake#drawRainbow`), fcArrow tbTest quirks (`FtileIfLongVertical.java:144-146`, INSIDE_DIAMOND repeat), dashed emphasize-head dasharray, non-colour COLOR tokens (upstream throws): still open.
- `while (...) is (a\nb)` labels: the parser leaves `\n` literal (jar converts) -- found while authoring; not fixed.
