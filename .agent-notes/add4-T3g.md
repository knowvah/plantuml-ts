# add4-T3g: D9, remaining activity text drawn through creole Sheets (branch add4/T3g)

## Commits (one caller per commit)

| commit | what |
|---|---|
| `2d39d9960` | edge labels -> `Display#create0` sheet; new `activity-text-sheet.ts` |
| `770a24a12` | hexagon own labels (single + multi-line) -> condition sheet; new `activity-text-sheet-diamond.ts` |
| `a4559af16` | branch/side labels (`if-label`) -> SIMPLE_LINE display sheet |
| merge `555721613` | merged feat at `53d01279d` (T3b), per orchestrator |
| `74c0b0217` | orchestrator item 1: `fontConfigForRun` uses `run.family` |
| `94dcc9af9` | orchestrator item 2 (core): `CreoleParser` passes its `creoleMode` to `buildStripeAtoms` |
| `d8f52291b` | test(core): latex font-name escape exercised via `renderNodeLabel` directly |
| `9e0c6799a` | catalog regen (re-regenerated again with this note) |
| `03ce9976a` | composite titles -> FtileGroup sheet |
| `fe1f15bee` | swimlane titles -> `Swimlanes#getTitle` sheet; `styleFontConfiguration` factored |
| `50e7d252f` | join bar labels -> SIMPLE_LINE display sheet |
| `176626608` | removed `renderDiamond`'s unreachable label draw (last legacy caller in if-shapes) |
| (this note) | report + catalog |

## Java -> ours

| Java | ours |
|---|---|
| `Display.java:637-701` create0/getCreole (padding = `skinParam.getPadding()`, `:697-699`) | `activity-text-sheet.ts#activityDisplayBlock`, skin `getPadding` = `theme.padding` |
| `Style.java:259-268` getFontConfiguration (+HyperLinkColor, `SkinParam.java:1057-1060`) | `activity-text-sheet.ts#styleFontConfiguration` / `activityTextFontConfiguration` |
| `FtileFactoryDelegator.java:103-112` create7(LEFT, SIMPLE_LINE); `Snake.java:225-231` draw at position | `renderer.ts#renderEdgeLabel` (top = layout baseline - size*ASCENT_FRACTION) |
| `ConditionalBuilder.java:240-247` tbTest (FULL, diamond align, SheetBlock1 w/ padding, SheetBlock2 + `Hexagon.asStencil`) | `activity-text-sheet-diamond.ts#diamondTestBlock` |
| `Hexagon.java:84-104` asStencil | `activity-text-sheet-diamond.ts#hexagonAsStencil` |
| `FtileDiamondInside.java:85-96` lx/ly + borderColor/stroke/bg | `#renderDiamondTestLabel`; used by `if-shapes#renderHexagonOwnLabel`, `#renderHexagonMultilineLabel` |
| `ConditionalBuilder.java:280-283` getLabelPositive (create0 SIMPLE_LINE) | `if-shapes#renderIfLabel` |
| `FtileGroup.java:104-108` title.create(LEFT, FULL); `USymbolFrame.java:154` (3,1) | `composite#drawCompositeTitle` |
| `Swimlanes.java:285-293` create9; `UGraphicCompressOnXorY.java:100-112` CenteredText pos | `swimlanes#renderSwimlaneTitles` (textWidth from the block) |
| `AbstractParallelFtilesBuilder.java:187-196` create7 SIMPLE_LINE; `FtileBlackBlock.java:110-111` | `bars#renderJoinBarLabel` |
| `StripeSimple.java:112-115` FULL vs OTHER commands; `CommandCreoleBuilder.java:85-86` | `core/.../CreoleParser.ts#buildTextStripes` passes `this.creoleMode` |
| `SvgGraphics.java:772-786` back-colour filter | `activity-text-sheet.ts#withBackColorFilters` re-keys the throwaway graphic's seeded `b00` id to `svg-defs.ts#backColorFilterDef` and inlines it (lifted by `extractFilterDefs`, as `core/svg.ts#text` did) |

## Probe Σ per commit (pre-merge baseline set, 13 rows; post-merge set, 230)

| after | Σ | movers |
|---|---|---|
| base `476a7904d` | 493 | |
| `2d39d9960` | 493 | none |
| `770a24a12` | 491 | vimena 196->195, zivocu 1->0 (`""GatewayID""` keeps `font-family="monospace"` through the Sheet) |
| `a4559af16` | 491 | none |
| merge | 230 (new baseline set) | |
| `74c0b0217`..`176626608` | 230 | none |

The 399 pinned goldens pass after every commit (ratchet + harness-parity). Element census (`activity-probe-elements`): no row changes at any commit.

## Rows outside the probe (render of all 451 cache + authored fixtures, before vs after each commit)

- `770a24a12` moved four labels from x.712 to x.713, i.e. to the jar's value. Upstream computes `node.x + (width - dimLabel.width)/2`, and the old `cx - w/2` association rounded differently: jisema, kijazo (pinned), T1a big-1line, T1b laneink-a.
- nudonu (jar-error row) now draws its hexagon creole table grid and bullet. The jar crashes on this row, so there is no oracle for it. Its x shifts because the layout sized the hexagon with `creoleTextLines`.
- `a4559af16`: zejuso's `is (=1)` heading label, y 224.556 -> 227.667 (jar 223.667, row score 2 -> 2). Mechanism: the block is the 15px heading's Sheet. `FtileDiamondInside` places the west label at `-dimWest.height + H/2` (`FtileDiamondInside.java:100`), but the layout sized it at 11px, which accounts for the 4px. This is a layout residual, not a renderer one.
- `94dcc9af9`: T3b switch-case-simple-line 110 -> 80. The rest is T3b's known `it.fails` layout residual. switch-case-creole-width 27 -> 0.
- `2d39d9960`: vimena text x 110.738 -> 110.737 (jar .738, score unchanged). Mechanism: Sea sums atom offsets from 0 and adds them once to the block origin (`Sea.java:59-65`, `Position.java:81-83`): `29.3375 + (38.56875 + 42.83125)` = 110.73749999999998. The old per-run path accumulated from the origin and gave 110.7375. The jar applies `ct()` per UText to the raw point, and this port does not replicate that partial-sum chain. Not fitted.

## Risers + mechanism

None in the probe. Element counts never move away from the jar.

## Census movers

None from my commits. The repin dry-run reports `lisade` (style + text) and `vimena` (style width 580 -> 546) as CHANGED. The style/text census tests fail on those three. They fail identically on the feat tip `53d01279d` alone (checked in a detached worktree), so they are T3b's and await the orchestrator re-pin.

## All-engine survey (rule 11, `94dcc9af9`)

- Before and after, all 28 engines.
- engdiff: 24 movers, all `timeout` -> verdict. The box hit load 70, and timed-out engines were re-run at load ~6.
- 0 conformant losses.

## Code deleted

- `renderDiamond`'s label draw (no producer supplies a label; proven per producer above).
- if-shapes' per-line multi-line hexagon loop, its `flooredFirstBaselineY` / `centeredLineX` / `floorActionLineHeight` / `drawActivityText` use.
- `renderIfLabel`'s manual padding + `textLines` path.
- renderer.ts' `core/svg.ts#text` back-colour branch and `activityFontColor` import.
- composite / swimlane / bar legacy draws.

## Remaining legacy in `activity-renderer-text.ts` (nothing deletable yet), with callers

- `drawActivityText`:
  - `activity-renderer-shapes.ts:156` `renderLabel` (sets `floorCoordinated`, link fields)
  - `activity-renderer-shapes.ts:192` multiline (sets `ruleLeft/ruleWidth/ruleStroke` via `actionRuleFields`, `floorCoordinated`)
  - `activity-renderer-action-code.ts:55` (`floorCoordinated`)
  - `activity-renderer-signal-shapes.ts:50` (`floorCoordinated`)
  - All four are T3e's. They keep alive every branch: `floorCoordinated`, the HR rule fallback, the `kind !== 'text'` literal draw, the table-row seam, and the JAR_DEFAULT/HYPERLINK colour sentinels.
- `drawActivityTextLines`: only `activity-renderer-shapes.ts:108` `textLines`, which no longer has any caller after `a4559af16`. Delete both together once T3e drops `textLines`.

## Not done + why (hunks for owners)

- **Layout measures labels as raw markup**, so the Sheet draws correctly relative to a mis-sized box. Fixtures: `tests/fixtures/activity/add4-T3g/{edge-label-creole,hexagon-labels,branch-labels,diamond-labels}`.
  - Sites:
    - `layout/compress/edge-label-anchor.ts#placeOnPoints`: `measureLineWidth` on raw `[[url]]`, giving canvas +77 in edge-label-creole
    - `tiles/gtile-diamond-inside.ts#measureCondition`: `creoleTextLines` misses `//italic//` and `""mono""`, and measures `<color>`/`[[url]]` raw
    - the side-label `measureLabel`: raw `**yes**`, and 11px height for a heading
    - repeat label width: `diamond-labels` +12.1
  - Fix: measure with the same blocks (`activityDisplayBlock(...).calculateDimension`, `diamondTestBlock`).
  - Owners: T3a/T3c (edge, canvas-origin-text-ink), whoever owns `gtile-diamond-inside.ts` / `walk-repeat`.
- **EMPTY_DIAMOND north test label**:
  - Upstream: `FtileDiamond.withNorth(tbTest)` (diamond font, FULL, Hexagon stencil).
  - Ours: walkers push it as a plain `'if-label'`, drawn arrow-font SIMPLE_LINE.
  - Fix: the node needs a role field (`activity-geometry.types.ts`) set in `walk-if-down.ts` / `walk-if-with-links.ts#pushDiamondLabel('north')`.
- **Parser** `dispatch-support.ts:329` `RE_ARROW_LABEL` lifts `<back:x>` AND `<color:x>` into `edge.color`, and the renderer re-emits it as `<back:x>`. Upstream `CommandArrow3.java:63-67` keeps both in the creole label, so a `-><color:red> x;` label is drawn with a red flood instead of red ink. Owner T3b.
- **Parser**: an arrow label's literal `\n` is not converted (`Display.getWithNewlines`, `CommandArrow3.java:110`). Owner T3b.
- `compress/shapes-of.ts` `if-label` slot uses the old unfloored baseline (`size * ASCENT_FRACTION`, advance = size), while the Sheet floors lines below 10px (`AtomText.java:179-181`). There is no output change in the corpus.
- `style.wrapWidth()` / `MaximumWidth` and Swimlanes `getWrap()` auto are not modelled (`LineBreakStrategy.NONE`), as before.
- `activity-text-sheet.ts#activitySkinSimple` duplicates T3e's private `activity-creole-sheet.ts#activitySkinSimple`. Fold it in once that file is free.
- Pre-existing, not mine:
  - `npm run typecheck` fails at `tests/diagrams/activity/layout/compress/invariant.test.ts:695` (`ALLOWED_HARD_OVERLAPS` typed `never[]`, from `7f1bc102a`).
  - `tests/unit` packaging tests (`stdlib-package*`, `sprite-package-files`) and `parity-dashboard` drift fail in this worktree with untouched inputs.

## Observation: the throwaway UGraphicSvg drops `<back:>` filter defs
- **Context**: migrating edge labels to a Sheet.
- **Finding**: `extractFlatContent(...).body` discards `<defs>`, and the throwaway graphic's `filterUid` is `'b0'` for every fragment, so ids collide (`b00`). `activity-creole-sheet.ts#drawActionTextBlock` (T3e) has the same gap for a `<back:>` action label.
- **Impact**: any Sheet draw on a throwaway graphic must re-key and inline filter defs (`withBackColorFilters`).
- **Confidence**: High (colored-arrow-label 14 -> 0 with the fix).
