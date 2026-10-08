# add4-T3h: D9 finish (no legacy text drawer), labels measured as drawn (branch add4/T3h)

## Commits

| sha | mechanism | probe Σ after |
|---|---|---|
| base `2893cba30` | | 221 (8 rows) |
| `a27501d6b` | refactor: delete the legacy per-run text drawer (`activity-renderer-text.ts` and its last callers) | 221 |
| `7826cb0f4` | edge labels sized with the drawn `create7` SIMPLE_LINE block (placement, canvas ink, compress slot) | 221 |
| `f2e722256` | EMPTY_DIAMOND repeat `tbTest` width = the FULL arrow-font creole block | 221 |
| `92360df05` | hexagon condition + side labels sized as the drawn blocks; long-vertical inlabel width = FULL block | 217 |
| `1e3113f25` | if-label compress slot + canvas Y ink: drawn block width, padding, stripe floor; add4-T3h fixtures | 217 |
| `dee6acdee` | `ifLabelRole: 'test'`: the EMPTY_DIAMOND north test is drawn and measured as the condition Sheet | 217 |
| `db3550c5b` | if-label canvas X ink from the drawn block, not `node.width` | 217 |
| `fe301d409` | hexagon own-label compress slots from the drawn condition Sheet; dead helpers deleted | 217 |
| (this note + 3 patches) | | |

The 404 pinned goldens are byte-equal after every commit. Also green after every commit: ratchet, harness-parity, compress invariant, style/text/swimlane census, all of `tests/unit/activity` and `tests/diagrams/activity`, `npm run typecheck`, and eslint + prettier on every touched file.

## Java -> ours

| Java | ours |
|---|---|
| `ConditionalBuilder.java:240-247` tbTest; `FtileDiamondInside.java:85-96` | `activity-text-sheet-diamond.ts#diamondTestBlock` / `#renderDiamondTestLabel` (T3g). `renderHexagon`, `renderHexagonLabel` and `renderLabel` were removed; renderNode never reached them. |
| `Snake.java:238,247` (`textBlock.calculateDimension`); `FtileFactoryDelegator.java:103-112` | `compress/edge-label-anchor.ts#edgeLabelBlockSize`, `#placeOnPoints` |
| `LimitFinder.java:216-224`, `SheetBlock1.java:194-197,209-210` | `canvas-origin-text-ink.ts#extendForEdgeLabelText`, `#extendForIfLabelText`; `compress/shapes-of.ts#edgeLabelShape`, `#ifLabelShape` |
| `FtileRepeat.java:124-128,706`; `Display.java:614-617` (`create` = `create7(FULL)`) | `tiles/gtile-repeat.ts#repeatTbTestWidth` |
| `FtileDiamondInside.java:84-125` (reads `label` and each side's `calculateDimension`); `ConditionalBuilder.java:280-283` | `tiles/gtile-diamond-inside.ts#measureCondition` / `#measureSide` (exported) |
| `FtileIfLongVertical.java:154-157` | `layout/conditional-builder-long.ts#measureVerticalInlabel` (FULL block) |
| `ConditionalBuilder.java:262-267` `FtileDiamond.withNorth(tbTest)`; `FtileDiamond.java:87-91` (no colour applied to the north draw) | `activity-geometry.types.ts#ifLabelRole`; `walk-if-down.ts` / `walk-if-with-links.ts#testLabelRole`; `activity-text-sheet-diamond.ts#ifLabelBlock` / `#ifLabelFontSize`; `if-shapes#renderIfLabel`; `compress-geometry.ts#transformIfLabel` |
| `AtomText.java:179-181` (stripe floor 10) | `floorActionLineHeight` advance in the if-label slot and ink |
| `SlotFinder.java:127-135`; `SheetBlock1.java:155-172` (getCoef) | `compress/shapes-of-hexagon-label.ts#ifOwnLabelShapes` (drawn Sheet dims) |

## Rows / fixtures (before -> after)

### Probe rows
- xovigi-85-rufa987: 2 -> 0
- zejuso-92-kexo870: 2 -> 0 (the `=1` heading west label, 15 px stripe)

The other 6 probe rows are unchanged and equal their pins.

### T3g fixtures
- edge-label-creole: 2 -> 0
- diamond-labels: 10 -> 0
- branch-labels: 69 -> 0
- hexagon-labels: 92 -> 92 (residual below; 0 with patch 1)
- hexagon-labels-center and composite-titles: 0 (unchanged)

### Authored `tests/fixtures/activity/add4-T3h/` (oracles from `scripts/oracle-render.sh`)
- empty-diamond-north-if: 2 (authored after `dee6acdee`) -> 0 at `db3550c5b`, pinned
- vertical-inlabel: 0, pinned
- empty-diamond-north: 126 -> 52 (the rest is the while header, below)
- elseif-creole: 90 (0 with patch 1)
- side-labels-padding: 17 (0 with patch 3)
- side-labels-small-font: 17 (0 with patches 3 + 4)

### Renders outside the probe
Across the 451 cache rows plus every authored fixture, the only corpus SVGs that moved are xovigi and zejuso (both to 0), and nudonu. nudonu is a jar-error row with no oracle: its hexagon is now sized by the same Sheet that draws its creole table.

## Risers + mechanism

None, in the probe or in any authored or corpus fixture score.

## Census movers

- Style, text and swimlane census tests are green at every commit.
- The repin dry-run reports 2 changes. These are expected to be the diff-baseline lowers for xovigi and zejuso (pin 2, now 0); the orchestrator re-pins.
- Element counts never move. I checked the per-tag counts of every moved SVG; activity-probe-elements has 7 exact rows plus jucidi's existing extra line.

## Code deleted

- `src/diagrams/activity/activity-renderer-text.ts`, the whole module: `drawActivityText`, `drawActivityTextLines`, `floorCoordinated`, `ruleLeft`/`ruleWidth`/`ruleStroke`, the `kind !== 'text'` literal draw, the table-row seam, and the JAR_DEFAULT/HYPERLINK sentinels.
- From `activity-renderer-shapes.ts`: `renderLabel`, `textLines`, `renderHexagon`, `renderHexagonLabel` and `flooredFirstBaselineY`.
- From `activity-renderer-if-shapes.ts`: `renderHexagonMultilineLabel` and `diamondLineWidth`.
- From `tiles/gtile-diamond-inside.ts`: `measureLabel`, `withGlobalPadding`, `padSide` and `ATOM_TEXT_MIN_HEIGHT`.
- Tests that only exercised deleted code:
  - `tests/unit/activity/T3e-activity-renderer-text-creole.test.ts`
  - `tests/unit/activity/activity-renderer-text-family.test.ts`
  - the `drawActivityText` describe block in `add4-T3gates-sheet-labels.test.ts`
  - the `renderLabel` cases in `renderer-shapes.test.ts`, which now uses a local `renderHexagonPolygon + renderHexagonOwnLabel` helper
  - the `flooredFirstBaselineY` and `diamondLineWidth` unit cases. Their fixture tests are kept.

## What is left of the legacy path

No legacy text drawer is left in `src/diagrams/activity`. Every label draws through `drawActivityTextBlock` (Sheet) or `activity-creole-sheet.ts`.

Code now unreferenced outside my write-set (owner deletes):
- In `activity-text-placement.ts`: `activityTextLineX`, `centeredLineX`, `isTableRowLine`, `tableRowCellsOf` and `ActivityTextOpts` are referenced only by that file and its test.
- Stale comments name `activity-renderer-text.ts` in:
  - `src/core/theme-root-fields.ts:23` (core; left alone to avoid a rule-11 survey for a comment)
  - `src/core/svek/image/creole-text-lines.ts:143`
  - `activity-creole-sheet.ts:71,242`
  - `activity-text-placement.ts:107,136`

## Not done + why (hunks outside my write-set; patches in `.agent-notes/`)

1. **`tiles/gtile-diamond-inside2.ts`** (elseif / long-vertical / switch hexagons). Patch: `.agent-notes/add4-T3h-diamond-inside2.patch`.
   - The tile measures raw markup. Upstream:
     - side slots are `create(fcArrow, LEFT)` FULL blocks (`FtileIfLongHorizontal.java:172-173,186`, `FtileSwitch.java:110-111,123`);
     - the condition is a `create0(fcTest, ..., FULL)` Sheet (`:175-177`).
   - Effect measured: hexagon-labels 92 -> 0 and elseif-creole 90 -> 0, with no corpus SVG moving.
   - **Blocker:** the patch makes the compress invariant's "no throw" case fail on xovigi: `snake-merge: not a horizontal or vertical line (168.97500000000002,369)->(168.975,404)`. That is float noise from the resolved bold `**yes**` width; the production render does not throw.
   - The owner must fix snake-merge's exact-equality check at its origin before landing the patch.
   - Also: `FtileIfLongVertical.java:142-143` builds tbTest with `fcArrow`, not `fcTest`. That quirk needs mirroring.
2. **`tiles/gtile-diamond-empty.ts`**. Patch: `.agent-notes/add4-T3h-diamond-empty.patch`.
   - North is measured raw at the diamond size, and south/west/east raw at the arrow size. They should be the condition Sheet and SIMPLE_LINE blocks.
   - With the patch, gates are green and no fixture moves. It matters only for padding, headings or tables in an EMPTY_DIAMOND label.
3. **`tiles/gtile-top-down.ts:20` `sequentialGap`**. Patch: `.agent-notes/add4-T3h-top-down-gap.patch`.
   - Upstream adds `textBlock.calculateDimension().getHeight()` (`FtileFactoryDelegatorAssembly.java:58-62`), which includes padding and the 10 px floor. Ours adds the raw `getDimension` height.
   - With the patch: side-labels-padding 17 -> 0, gates green, no corpus SVG moves.
4. **`layout/tile-layout-inlabel.ts#inLabelReservation`** (line 124-125).
   - It uses the fixed `ARROW_LABEL_LAYOUT_FONT_SIZE = 11`, not `activityFontSize(theme, 'arrow')`. It also places the box with the raw-markup width; it should use `edgeLabelBlockSize`.
   - Evidence: setting the constant to 8, temporarily and reverted, together with patch 3 took side-labels-small-font 17 -> 0. Under patch 3 alone it reads 19.
5. **`layout/walk-while-branch.ts`** (while header, EMPTY_DIAMOND).
   - The north test (`FtileWhile.java:136-138`, `withNorth(testTb)`: a `test.create(fcTest, ...)` FULL block) is still pushed as an arrow-font if-label. Fix: set `ifLabelRole: 'test'`.
   - That is empty-diamond-north's residual 52: wrong font/colour on `more?`, the canvas 37 px too wide, and a 0.667 y offset below the while.
6. **`tiles/gtile-diamond-square.ts`** (INSIDE_DIAMOND). The same raw `measureLabel` as patch 2. No fixture was authored for it; the same hunk shape as patch 1 applies.
7. **Repeat east label draw.** A repeat's EMPTY_DIAMOND east tbTest is drawn as a SIMPLE_LINE arrow if-label, while upstream uses `create` (FULL). Widths match (fixed by `f2e722256`); only FULL-only markup would differ. Owner: `walk-repeat.ts`.
8. **Jar crash in authoring.** The jar crashes ("IllegalArgumentException start=end") on `//italic//` in an if-label with `skinparam padding 4`, and on italic/mono in an elseif inlabel. The fixtures avoid those combinations.
9. **Approximation in `ifOwnLabelShapes`.** The baseline inside a stripe uses `size * ASCENT_FRACTION` of the base font. A stripe with a larger atom (a heading) would place its UText lower. No fixture exercises this.

## Observation: snake-merge exact equality breaks on resolved creole widths
- **Context**: measuring `gtile-diamond-inside2.ts` with the drawn block (patch 1).
- **Finding**: the invariant harness throws `snake-merge: not a horizontal or vertical line (168.97500000000002,369)->(168.975,404)` on xovigi. A bold width (18.35625) summed in a different order leaves a 2e-14 x mismatch, and snake-merge treats it as a diagonal. The production render of the same row does not throw.
- **Impact**: any change that replaces raw widths with resolved creole widths can trip snake-merge. Fix the merge's exact-equality check, not the widths.
- **Confidence**: High (reproduced by applying the patch; reverted).

## Observation: the jar crashes on italic in some activity label slots
- **Context**: authoring add4-T3h fixtures.
- **Finding**: the deterministic jar throws "IllegalArgumentException start=X end=X" for `//italic//` in a branch label under `skinparam padding 4`, and for `(**in** //label//)` or `""mono""` inlabels under `!pragma useVerticalIf on`. Plain and bold labels render fine.
- **Impact**: author such fixtures without italic/mono in those slots, or there is no oracle.
- **Confidence**: High
