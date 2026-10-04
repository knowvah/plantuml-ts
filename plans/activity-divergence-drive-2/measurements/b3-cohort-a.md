# b3 cohort A — next mechanism per row (73 rows, Σws 334)

Measured at HEAD `78b09f3e9` (feat/activity-divergence-drive-2). The scratch
`b3a-diffs.mts` reproduced every row's `ws` exactly (live == listed for all 73).
Family C was verified numerically: the scratch `b3a-emph.mts` rebuilt our Y
`CompressionTransform` from `shapesOf(compress:false geometry)` +
`collectSlots(...,'y').reverse().smaller(5)`. For every emphasized segment, `ct(pre-compression midpoint) - geometric midpoint`
equals the jar's arrowhead offset to the 0.001 px on all 39 arrows in 32 rows.
Family A was verified on all 30 affected jar SVGs: `height == floor(max divider
y2 + 20) + 1` (i.e. divider bottom − ink top 15 + 35, floored, +1).

## Families (keys used in the table)

| key | mechanism | Java (file:line) |
|---|---|---|
| A | Lane-divider `ULine.vline(height)` is ink the jar's `LimitFinder` sees (drawULine exact). Our `computeCanvasOrigin` scans lanes X-only (`extendForSwimlane`) and the divider reservation is `UEmpty(...,1)`. The bottom ink therefore stops at the last node's fudged far edge (rect −1), which is 1 px short. | `LaneDivider.java:97` (`draw(ULine.vline(height))`), height = `dimensionFull.getHeight() + titleHeightTranslate.getDy()` `Swimlanes.java:422-423` |
| B | Every activity `ULine` passes through `UGraphicCompressOnXorY`, whose private `drawLine` swaps endpoints when `y1 > y2`. Our `renderEdgeSegments` emits upward segments unswapped. `orderedLine` in `activity-renderer-terminals.ts:114` already ports this, but only for the end-cross. | `UGraphicCompressOnXorY.java:142-146`; wrappers `ActivityDiagram3.java:209-210` |
| C | The emphasize arrow is drawn at the UNCOMPRESSED segment midpoint, and only its anchor goes through `ct()`. Jar tip = `ct(mid_pre)`; ours = midpoint of the compressed endpoints. | `Worm.java:178-181` (`UTranslate((x2-x1)/2,(y2-y1)/2)).draw(arrows.asTo(direction))`), `UGraphicCompressOnXorY.java:118` (`getUg().apply(getTranslate(x, y)).draw(shape)` → `ct(y)` of the anchor only) |
| D | An empty-label `if`/`elseif` is still `FtileDiamondInside`/`FtileDiamondInside2` (24×24), drawn with the 7-point `asPolygon(shadowing,w,h)`, duplicate vertices included. We switch to the 5-point `renderDiamond` when the label is `''`. | `FtileDiamondInside.java:89`, `:106-110` (24×24 for empty label); `FtileDiamondInside2.java:84`; `Hexagon.java:65-75`; `ConditionalBuilder.java:250-256` (INSIDE_HEXAGON default) |
| E | Title/header/footer x is aligned against the UN-floored inner dimension (double). `preChromeDims` subtracts from the FLOORED `totalWidth`, so the ink span's fraction is lost: right-aligned header loses the full fraction, centred items lose half. livigo: 0.275 / 0.1375 / 0.1375 (2:1:1) confirms it. This is the documented KNOWN LIMITATION at `renderer.ts:287`. | `svek/DecorateEntityImage.java:103-116,144-150` (`getTextX(dimText, dimTotal, h)`) |
| F | `skinparam hyperlinkUnderline false` / `svgLinkTarget` are not modelled. | `SkinParam.java:1057-1061` (`useUnderlineForHyperlink`), `:1081-1083` (`getSvgLinkTarget`, default `_top`) |
| G | `skinparam preserveAspectRatio` is not modelled. | `SkinParam.java:1086-1088`; `SvgGraphics.java:815` |
| H | The numbered-list header atom (`ListNumberAtom`) omits `AtomText`'s 10 px height floor. At FontSize 8, `Sea.doAlign` (`-height + altitude`) drops "1."/"2." 2 px (= 10−8) below the sibling URL text atoms. | `klimt/creole/legacy/AtomText.java:179-181`; `klimt/creole/Sea.java:72-79` |
| I | Hexagon side dent uses `h/2`; upstream uses the constant `hexagonHalfSize = 12`. These are equal only when h = 24; DiamondFontSize 40 gives h = 40. | `Hexagon.java:46,65-71` |
| J | Diamond fill/border do not inherit `activity { BackgroundColor/BorderColor }`. Diamond's signature nests under `activity`, and `plantuml.skin:369-371`'s `diamond {}` sets only FontSize. | `FromSkinparamToStyle.java:141,143`; `StyleSignatureBasic.java:271-273` |
| K | `skinparam activity { FontName }` is not applied: no `font-family` on activity/diamond text. | `FromSkinparamToStyle.java:144` (`addConFont("activity", SName.activity)`), inherited by diamond (`StyleSignatureBasic.java:271-273`) |
| L | Diamond side-label height lacks `AtomText`'s 10 px floor. East label y = `-dimEast.h + h/2`; at ArrowFontSize 7, ours sits 3 px (= 10−7) low. Verified: jar 140.444 = 145 − 10 + 5.444. | `FtileDiamondInside.java:101-102`; `AtomText.java:179-181` |
| M | Swimlane title band: `.apply(color.bg()).apply(color)` gives stroke = background color (default 1 px). We emit `stroke="none"`. | `Swimlanes.java:357-366` |
| N | `end fork {label}` is parsed and dropped. Upstream draws it at `width + 5` and widens the bar tile by `labelW + 5`. | `CommandForkEnd3.java:78`; `ParallelBuilderFork.java:115`; `FtileBlackBlock.java:84-92,111-112` |
| O | `\|#color\|lane\|` color is parsed and dropped (`RE_SWIMLANE`). Upstream draws a per-lane background `URectangle` (actualWidth + x2 + x1 by full height). | `Swimlanes.java:332-340` |
| P | `split-bar`/`split-join-bar` contributes `y + 1.5` to our ink scan (NO_FUDGE box). Upstream it is a `ULine.hline`, so ink Y = the line's y exactly. | `FtileThinSplit.java:88,95`; `LimitFinder` drawULine (exact) |
| Q | The `if-label` text node contributes its box bottom (baseline + descent) to our ink scan. Upstream `LimitFinder.drawText` far corner = baseline + 1.5. xekame: 488.06 vs 487.11 crosses an integer. | `klimt/drawing/LimitFinder.java:217-224` |
| S | A split whose branches all end (`hasOut()==false`) is wrapped `FtileKilled` with NO bottom `FtileThinSplit`. Our `GtileFork.bottomBandHeight` always adds the 1.5 band, so lane dividers run 1.5 long (97 vs 95.5). | `ParallelBuilderSplit.java:139-140` |
| U | mechanism unknown (see lapura row) | — |

## (1) Per-row table

| slug | ws | diff summary (path: ours vs jar) | family | mechanism (Java file:line) | owning files |
|---|---|---|---|---|---|
| gitoke-38-beme495 | 1 | title text/@x 1832.03 vs 1832.47 | E | DecorateEntityImage.java:144-150 | src/diagrams/activity/renderer.ts (preChromeDims), layout/canvas-origin.ts + assign-coordinates-full.ts (expose un-floored span) |
| pekuxe-00-bovi270 | 1 | a/text/@text-decoration underline vs "" | F | SkinParam.java:1057-1061 | src/core/theme.ts, skinparam key handler table, core creole CommandCreoleUrl.ts, activity-renderer-shapes.ts#renderAction / activity-renderer-text.ts |
| setecu-78-cuko533 | 1 | svg/@preserveAspectRatio none vs "xMinYMid slice" | G | SkinParam.java:1086-1088; SvgGraphics.java:815 | src/core/theme.ts, skinparam handler, svg root (src/core/svg.ts / klimt/document-shell.ts) |
| begivo-34-sicu289 | 2 | svg/@height+viewBox 276 vs 277 | A | LaneDivider.java:97; Swimlanes.java:422-423 | src/diagrams/activity/layout/canvas-origin.ts |
| biguku-39-voxu233 | 2 | line[3] y1/y2 163→67 vs 67→163 | B | UGraphicCompressOnXorY.java:142-146 | src/diagrams/activity/renderer.ts#renderEdgeSegments |
| bixefi-77-moki051 | 2 | height 144 vs 145 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| caburo-70-buki284 | 2 | height 452 vs 453 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| cufega-65-beji958 | 2 | line[7] 371→171 vs 171→371 | B | UGraphicCompressOnXorY.java:142-146 | renderer.ts |
| dupopo-44-deto131 | 2 | height 352 vs 353 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| firibi-00-puki721 | 2 | height 467 vs 468 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| fomapa-90-bore251 | 2 | height 229 vs 228 (no lanes; bottom ink = split-join hline y=207) | P | FtileThinSplit.java:88,95 | layout/canvas-origin.ts (fudgeY for split-bar kinds) |
| gaxezi-48-zesa921 | 2 | a/@target _top vs _self; text-decoration underline vs "" | F | SkinParam.java:1057-1061,1081-1083 | as pekuxe + src/core/svg.ts#linkWrap |
| gugala-11-suce270 | 2 | height 385 vs 386 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| jakuco-69-dari135 | 2 | height 236 vs 237 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| letare-59-gore448 | 2 | legend list number text[2]/[3] y 144.222/154.222 vs 142.222/152.222 | H | AtomText.java:179-181; Sea.java:72-79 | src/core/klimt/creole/legacy/AtomTextUtils.ts (ListNumberAtom.calculateDimension) |
| misiji-27-buje656 | 2 | height 278 vs 279 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| ninago-40-dalo726 | 2 | height 184 vs 185 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| nisexe-68-vabu320 | 2 | a/@target _top vs foo; underline vs "" | F | SkinParam.java:1057-1061,1081-1083 | as gaxezi |
| noxasi-06-nejo322 | 2 | height 397 vs 398 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| pakema-21-xema183 | 2 | height 184 vs 185 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| patagi-39-jone354 | 2 | height 224 vs 225 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| povoju-50-raxi136 | 2 | height 236 vs 237 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| raruzu-62-giro837 | 2 | height 440 vs 441 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| sikino-19-vuca111 | 2 | height 135 vs 136 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| sofoje-37-tila554 | 2 | polygon[1],[2] 5-pt rhombus vs 7-pt (duplicated vertices) | D | FtileDiamondInside.java:89,106-110; FtileDiamondInside2.java:84; Hexagon.java:65-75 | src/diagrams/activity/activity-renderer-shapes.ts:466-468 ('if-split' empty-label branch) |
| sucice-41-pebi088 | 2 | height 440 vs 441 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| tefuga-86-xefe850 | 2 | height 184 vs 185 | A | LaneDivider.java:97 | layout/canvas-origin.ts |
| ziboco-73-kazu841 | 2 | line[3] 163→67 vs 67→163 | B | UGraphicCompressOnXorY.java:142-146 | renderer.ts |
| biredi-08-bama025 | 3 | polygon[1],[3],[4] 5-pt vs 7-pt | D | as sofoje | activity-renderer-shapes.ts |
| livigo-47-negi605 | 3 | header/title/footer text/@x −0.275/−0.1375/−0.1375 | E | DecorateEntityImage.java:144-150 | renderer.ts, canvas-origin.ts, assign-coordinates-full.ts |
| nusajo-97-bemo713 | 3 | same as livigo | E | as livigo | as livigo |
| becanu-19-diti597 | 4 | height 366 vs 367; line[9] 188.5→92.5 vs reversed | A+B | LaneDivider.java:97; UGraphicCompressOnXorY.java:142-146 | canvas-origin.ts; renderer.ts |
| cagoze-40-tete366 | 4 | polygon[4] y −2 (emph down; ct(mid)−mid = +2.000) | C | Worm.java:178-181; UGraphicCompressOnXorY.java:118 | layout/compress/compress-geometry.ts#transformEdge, activity-geometry.types.ts (carry ct(mid_pre)), renderer.ts#renderEdgeSegments, canvas-origin.ts#arrowheadTips |
| jamana-83-gige126 | 4 | polygon[7] y −2 (pred +2.000) | C | as cagoze | as cagoze |
| lacuci-13-nogo718 | 4 | polygon[5] y −2 (pred +2) | C | as cagoze | as cagoze |
| megara-21-rumi574 | 4 | height 366 vs 367; line[7] 292.5→92.5 reversed | A+B | as becanu | as becanu |
| pedoco-30-mose082 | 4 | polygon[5] y −2 (pred +2) | C | as cagoze | as cagoze |
| pujozo-36-nino158 | 4 | polygon[5] y −6.75 (pred +6.750) | C | as cagoze | as cagoze |
| rerovo-62-nazo755 | 4 | polygon[4] y −2 (pred +2) | C | as cagoze | as cagoze |
| rosizo-69-mera514 | 4 | polygon[7] y −2 (pred +2) | C | as cagoze | as cagoze |
| secepo-00-febi326 | 4 | polygon[6] y −4.5 (pred +4.500) | C | as cagoze | as cagoze |
| tamaxe-36-mono574 | 4 | polygon[9] y −2 (pred +2) | C | as cagoze | as cagoze |
| vidada-17-xuse810 | 4 | height 440 vs 441; title band rect stroke none vs #EEE, stroke-width "" vs 1 | A+M | LaneDivider.java:97; Swimlanes.java:357-366 | canvas-origin.ts; activity-renderer-swimlanes.ts:41 |
| vivate-04-guso306 | 4 | polygon[12] y −19.555 (pred +19.556) | C | as cagoze | as cagoze |
| xarumo-26-zinu467 | 4 | polygon[3] y −2 (pred +2) | C | as cagoze | as cagoze |
| bazize-75-dedo568 | 5 | title x −0.12; polygon[8] y −6.75 (pred +6.750) | E+C | DecorateEntityImage.java:144-150; Worm.java:178-181 | renderer.ts etc. (E); compress-geometry.ts etc. (C) |
| ribapo-84-xudu593 | 5 | polygon[6] y +3.75 (emph up, pred −3.750); line[5] 274.5→119 reversed | C+B | Worm.java:178-181; UGraphicCompressOnXorY.java:118,142-146 | compress-geometry.ts/renderer.ts |
| sopape-11-laxo488 | 5 | height 95 vs 116; 3 divider y2 97 vs 95.5 | A+S | LaneDivider.java:97; ParallelBuilderSplit.java:139-140 | canvas-origin.ts; src/diagrams/activity/tiles/gtile-split.ts (override bottomBandHeight → 0 when no branch hasPointOut). Both needed: A alone gives 118. |
| bideta-97-cezo697 | 6 | height 264 vs 265; polygon[3] y −2 (pred +2) | A+C | as above | canvas-origin.ts; compress-geometry.ts/renderer.ts |
| gacaja-15-keko600 | 6 | polygon[20] y −9.5 (up, pred +9.500); line[27] reversed | C+B | as ribapo | as ribapo |
| gelono-70-zuce760 | 6 | polygon[11] y −16.5 (pred +16.500); line[9] reversed | C+B | as ribapo | as ribapo |
| guceja-66-tola192 | 6 | polygon[5] y +3.75 (pred −3.750); line[4] reversed | C+B | as ribapo | as ribapo |
| kudedo-31-pafi082 | 6 | polygon[6] y +2.75 (pred −2.750); line[11] reversed | C+B | as ribapo | as ribapo |
| movexa-27-rexe388 | 6 | height 264 vs 265; polygon[3] y −2 (pred +2) | A+C | as bideta | as bideta |
| kafevi-44-tesu096 | 7 | hexagon polygon[1] fill #F1F1F1 vs #ADD8E6, stroke #181818 vs #00008B; 5 points dent 20 vs 12 (45/380.25 vs 37/388.25) | J+I | FromSkinparamToStyle.java:141,143 + StyleSignatureBasic.java:271-273; Hexagon.java:46,65-71 | activity-renderer-shapes.ts:189-190 (actColors fallbacks → act.background/border); activity-renderer-if-shapes.ts:163 (+ activity-renderer-shapes.ts:285 renderHexagon, same h/2) |
| bumaca-51-kece901 | 8 | height 322 vs 323; polygon[3] y +3.75 (pred −3.750); line[5] reversed | A+C+B | as above | canvas-origin.ts; compress-geometry.ts/renderer.ts |
| felega-00-saxi785 | 8 | height 300 vs 301; polygon[3] y +8 (pred −8.000); line[6] reversed | A+C+B | as above | as bumaca |
| fivone-96-nalo453 | 8 | polygon[15] y +5.5 (pred −5.500), polygon[21] y +3.5 (pred −3.500) | C | as cagoze | as cagoze |
| getene-72-dido571 | 8 | height 324 vs 325; polygon[4] y +15 (pred −15.000); line[8] reversed | A+C+B | as above | as bumaca |
| givanu-33-kire967 | 8 | height 426 vs 427; polygon[9] y +3.75 (pred −3.750); line[13] reversed | A+C+B | as above | as bumaca |
| kasadu-53-tuki533 | 8 | height 320 vs 321; polygon[8] y +3.75 (pred −3.750); line[14] reversed | A+C+B | as above | as bumaca |
| mafete-03-rapa918 | 8 | height 332 vs 333; polygon[6] y +2.75 (pred −2.750); line[11] reversed | A+C+B | as above | as bumaca |
| pucinu-80-nopo009 | 8 | polygon[7] y −2 (pred +2), polygon[12] y +5.5 (pred −5.500) | C | as cagoze | as cagoze |
| vebala-15-tade547 | 8 | polygon[23] y +16.75 (pred −16.750), polygon[28] y +8.75 (pred −8.750) | C | as cagoze | as cagoze |
| xekame-27-geba281 | 8 | height 509 vs 508 (no lanes; bottom ink = repeat "value2" label); line[3],[8],[15] reversed | Q+B | LimitFinder.java:217-224; UGraphicCompressOnXorY.java:142-146 | canvas-origin.ts (if-label ink → baseline+1.5 / baseline−h+1.5); renderer.ts |
| dozaxu-98-xetu961 | 9 | text[1],[2],[4] font-family "" vs Verdana; hexagon 5 points dent 20 vs 12; "YES" text[5] y 143.444 vs 140.444 | K+I+L | FromSkinparamToStyle.java:144; Hexagon.java:46,65-71; FtileDiamondInside.java:101-102 + AtomText.java:179-181 | theme.ts + skinparam handler (activity font family), activity-renderer-shapes.ts:135,155, activity-renderer-if-shapes.ts:128-144,163; tiles/gtile-diamond-inside.ts#measureLabel (+ inside2/square copies) |
| zafoxu-20-xofe568 | 9 | width 261 vs 284; g[1] childCount 21 vs 22 (missing `{or}` text right of join bar) | N | CommandForkEnd3.java:78; ParallelBuilderFork.java:115; FtileBlackBlock.java:84-92,111-112 | parallel-dispatch.ts (keep label), ast.ts, tiles/gtile-fork.ts (width + labelW + 5), fork walker, activity-renderer-bars.ts |
| cejupe-34-muti621 | 10 | height 330 vs 331; childCount 41 vs 42 (missing lane-2 background rect x=137.975 w=98.2 h=293, #AntiqueWhite) | A+O | LaneDivider.java:97; Swimlanes.java:332-340 | canvas-origin.ts; dispatch-support.ts RE_SWIMLANE (capture color), ast/parser lane color, SwimlaneGeo, activity-renderer-swimlanes.ts |
| cixave-47-milo698 | 10 | polygon[7] y −20.25 (pred +20.250), polygon[10] y −20.25 (up, pred +20.250); line[12] reversed | C+B | as ribapo | as ribapo |
| dacuga-41-popo038 | 10 | polygon[6],[10] y −3.5 (pred +3.500 both); line[12] reversed | C+B | as ribapo | as ribapo |
| dixiku-28-guzo497 | 10 | polygon[6],[9] y −3 (pred +3.000 both); line[11] reversed | C+B | as ribapo | as ribapo |
| foludi-80-gilo247 | 10 | polygon[2],[4] y −4.75 (pred +4.750 both); line[3] reversed | C+B | as ribapo | as ribapo |
| lapura-36-kavu144 | 10 | width 288 vs 297; fork/join bar width 244.1 vs 260.1; empty 3rd-branch line x 253.1 vs 262.1, its arrowhead +9 | U | mechanism unknown | likely layout/compress/shapes-of.ts / slot-finder.ts or the empty-branch tile (tiles/gtile-fork.ts). See note below. |

**lapura: mechanism unknown.** Ruled out:
- The uncompressed tile is not the cause. `GtileFork` w=276.1 with offsets [14,156.05,262.1] equals `AbstractParallelFtilesBuilder.java:129-132` (14 px margins), and the jar's total matches it before compression.
- `SlotFinder.drawPolygon` (`SlotFinder.java:145-152`) adds no X pad, so the arrowhead does not hold the band open.
- `FtileMarged`/`addHorizontalMargin` (`FtileUtils.java:72-77`) draws no `UEmpty`. Only `LaneDivider`/`FtileWhile`/`FtileIfDown` draw one.

What is measured: our ON_X pass removes 32 px around the empty branch (248.1–276.1), the jar's only 16. Next instrument: dump our X `collectSlots` for lapura, and find which jar draw call keeps 248.1–276.1 occupied (the empty branch's own Ftile class and its `drawU`).

## (2) Family summary

| family | rows | Σws | owning files | est. effort |
|---|---|---|---|---|
| C emphasize arrow at ct(pre-compression midpoint) | 32 | 155 | layout/compress/compress-geometry.ts, activity-geometry.types.ts, renderer.ts#renderEdgeSegments, layout/canvas-origin.ts#arrowheadTips | M |
| A lane-divider vline missing from ink scan (height −1) | 30 | 60 | layout/canvas-origin.ts | S |
| B upward line endpoints not swapped | 21 | 46 | renderer.ts#renderEdgeSegments (reuse orderedLine) | S |
| I hexagon dent h/2 vs hexagonHalfSize 12 | 2 | 10 | activity-renderer-if-shapes.ts:163, activity-renderer-shapes.ts:285 | S |
| U lapura (mechanism unknown) | 1 | 10 | layout/compress/* or tiles/gtile-fork.ts (unconfirmed) | M |
| N `end fork {label}` dropped | 1 | 9 | parallel-dispatch.ts, ast.ts, tiles/gtile-fork.ts, fork walker, activity-renderer-bars.ts | M |
| E chrome x from floored canvas dims | 4 | 8 | renderer.ts#preChromeDims, canvas-origin.ts, assign-coordinates-full.ts | S-M |
| O swimlane `\|#color\|` background dropped | 1 | 8 | dispatch-support.ts, parser/ast, activity-geometry.types.ts, activity-renderer-swimlanes.ts | M |
| D empty-label if drawn as 5-pt rhombus | 2 | 5 | activity-renderer-shapes.ts:466-468 | S |
| F hyperlinkUnderline / svgLinkTarget | 3 | 5 | core theme.ts + skinparam handler, CommandCreoleUrl.ts, core/svg.ts#linkWrap, activity-renderer-shapes.ts/-text.ts | M |
| K activity FontName (font-family) | 1 | 3 | theme.ts + skinparam handler, activity-renderer-shapes.ts, activity-renderer-if-shapes.ts | M |
| S killed split keeps bottom 1.5 band | 1 | 3 | tiles/gtile-split.ts | S |
| H list-number atom lacks 10 px floor | 1 | 2 | core/klimt/creole/legacy/AtomTextUtils.ts | S |
| J diamond colors don't inherit activity style | 1 | 2 | activity-renderer-shapes.ts:189-190 | S |
| M title band stroke = background color | 1 | 2 | activity-renderer-swimlanes.ts:41 | S |
| P split hline thickness counted as ink | 1 | 2 | layout/canvas-origin.ts | S |
| Q if-label ink uses box bottom, not drawText | 1 | 2 | layout/canvas-origin.ts | S |
| G preserveAspectRatio skinparam | 1 | 1 | theme.ts + skinparam handler, svg root | S |
| L diamond side-label height lacks 10 px floor | 1 | 1 | tiles/gtile-diamond-inside.ts (+ inside2/square) | S |

Rows are counted once per family they contain; Σws sums to 334 (= cohort
total). Rows with "mechanism unknown": 1 (lapura-36-kavu144, ws 10).
