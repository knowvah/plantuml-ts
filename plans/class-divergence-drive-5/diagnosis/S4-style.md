# cdd5 T9 — shard S4 diagnosis

49 S4 rows: 3 pre-settled (ACCEPTED), 46 diagnosed, 0 unknown. Tool output:
`plans/class-divergence-drive/measurements/out/unknown__<slug>.{ours,jar}.svg`.
"Instrumented" means the scratch copy of `src/` (session scratchpad, never
committed) was patched at the named port line and render-diff was re-run. The
result is stated in each row.

| family | rows | Java file:line | port file:line | size | write-set |
|---|---|---|---|---|---|
| empty-diagram-simple-empty-body | 25 (+cimono) | `svek/GraphvizImageBuilder.java:211-212`, `:169-171` | `src/diagrams/class/layout.ts:214` | S | `src/diagrams/class/layout.ts` |
| chrome-atomtext-min-height | 1 (cimono, compound) | `klimt/creole/legacy/AtomText.java:179-181` | `src/core/annotations/blocks-creole.ts:165` | S | `src/core/annotations/blocks-creole.ts` |
| degenerate-text-ensurevisible | 2 | `klimt/drawing/svg/SvgGraphics.java:757-758`, `:128-135` | `src/diagrams/class/class-geo-builders.ts:418-445` | S | `src/diagrams/class/class-geo-builders.ts` |
| descriptive-leaf-ink-fallthrough | 2 | `klimt/drawing/LimitFinder.java:164-166,184-188`; `svek/GeneralImageBuilder.java:160-167` | `src/diagrams/class/class-layout-description-leaf-ink.ts:30-34` → `class-ink-box.ts:273` | S | `src/diagrams/class/class-layout-description-leaf-ink.ts`, `src/diagrams/class/class-ink-box.ts` |
| folder-label-heading-height | 1 (cepedu, secondary) | `klimt/creole/legacy/StripeSimple.java:199-202` | `src/core/svek/image/leaf-sizing-folder.ts:108` | S | `src/core/svek/image/leaf-sizing-folder.ts` |
| sprite-badge-headerlayout-offset | 2 | `svek/HeaderLayout.java:93-100`; `svek/image/EntityImageClassHeader.java:159` | `src/diagrams/class/renderer-classifier-badge-tag.ts:166-177` | S | `src/diagrams/class/renderer-classifier-badge-tag.ts` (+ header geo field) |
| enhanced-body-icon-block-height | 1 | `klimt/geom/PlacementStrategyVisibility.java:62-67` | `src/diagrams/class/class-body-enhanced-layout.ts:270` | S | `src/diagrams/class/class-body-enhanced-layout.ts` |
| mainframe-svek-unnormalized | 3 | `core/DiagramChromeFactory.java:278-337`; `klimt/shape/BigFrame.java:80-90`; `svek/SvekResult.java:130-135` | `src/core/klimt/shape/big-frame.ts:167,173`; `src/core/annotations/chrome.ts:256-305` | L | `src/core/klimt/shape/big-frame.ts`, `src/core/annotations/chrome.ts`, `src/diagrams/class/layout-ink-extent.ts`, `src/index.ts` |
| cluster-style-signature-unmerged | 4 | `svek/Cluster.java:286-296,316-320`; `style/FromSkinparamToStyle.java:128` | `src/diagrams/class/renderer.ts:101`; `src/diagrams/class/class-package-style.ts:114-115` | M | `src/diagrams/class/renderer.ts`, `src/diagrams/class/class-package-style.ts`, `src/diagrams/class/class-namespace-usymbol-shape.ts` |
| group-linestyle-dropped | 2 (+fepiko) | `svek/Cluster.java:402-407`; `style/Style.java:299-320` | `src/diagrams/class/class-namespace-usymbol-shape.ts:202` | M | `src/diagrams/class/class-namespace-usymbol-shape.ts`, `src/diagrams/class/renderer-usymbol-entity.ts` |
| collapsed-group-leaf-stereo-dropped | 4 (secondary) | `svek/image/EntityImageEmptyPackage.java:126-137` | not yet located (render side; layout carries it: `class-namespace.ts:106`) | M | render path of collapsed group leaves (instrument next) |
| multiline-usecase-kind | 1 | `descdiagram/command/CommandCreateElementMultilines.java:175-180` | `src/diagrams/class/class-multiline-element.ts:182-183,212-213` | S | `src/diagrams/class/class-multiline-element.ts` |
| desc-separator-thickness-cleararea | 1 | `cucadiagram/BodyEnhancedAbstract.java:121-123`; `klimt/shape/UHorizontalLine.java:164-166`; `decoration/symbol/USymbolDatabase.java:103-112` | `src/core/svek/image/EntityImageDescriptionTextBlock.ts:134,310`; `src/core/klimt/shape/UHorizontalLine.ts:120-133` | M | `src/core/svek/image/EntityImageDescriptionTextBlock.ts`, `src/core/klimt/shape/UHorizontalLine.ts` |
| note-titled-separator-unbuilt | 1 (nuveji, secondary) | `klimt/shape/TextBlockLineBefore.java:92-93` | `src/diagrams/class/note-layout-measure-rows.ts:62-76` | M | `src/diagrams/class/note-layout-measure*.ts`, class note renderer |
| embedded-block-skinparam-leak | 1 | `cucadiagram/BodyEnhanced2.java:91-94` (the `{{`…`}}` lines stay in the element's display; `skinparam` is never dispatched) | `src/core/preprocessor-collector.ts:147-166` | S | `src/core/preprocessor-collector.ts` |
| desc-label-embed-unported | 1 (rozugu, secondary) | `cucadiagram/BodyEnhanced2.java:91-94` + `EmbeddedDiagram` | `src/core/svek/image/EntityImageDescriptionDelegates.ts:124` | L | `src/core/svek/image/EntityImageDescriptionDelegates.ts`, class renderer registration |
| reversecolor-mapper-unported | 1 | `TitledDiagram.java:301-312`; `klimt/color/ColorMapper.java:74` | `src/core/theme.ts:91-98` (only `monochrome` modelled) | M | `src/core/theme.ts`, skinparam handler, `src/diagrams/class/class-monochrome.ts` |

## Pre-settled (ACCEPTED, in force; not diagnosed)

- class/gadufu-56-votu808: embedded `{{ }}` payload bytes (D9)
- class/nugecu-04-tona107: dot-engine known divergence A3 (cdd4 D6)
- class/xadado-92-lazo250: embedded `{{ }}` payload bytes (D9)

## Family notes

**empty-diagram-simple-empty-body.** Java: `if (dotData.isDegeneratedWithFewEntities(0)) return new EntityImageSimpleEmpty(...)` (GraphvizImageBuilder.java:211-212), and `calculateDimension` returns `new XDimension2D(10, 10)` (:169-171). The port returns `{ totalWidth: 0, totalHeight: 0, ... }` (layout.ts:214) with no `rawWidth`/`rawHeight`, so `index.ts:241` skips the document margin and chrome composes against a 0x0 body. Upstream composes against 10x10: with no chrome, the canvas is 10+5 → `floor(15+1)` = 16x16; with a title or legend, the height grows by 10+5+1 = 16 and the width by 6. Instrumented: returning `{totalWidth:16,totalHeight:16,rawWidth:10,rawHeight:10}` takes all 25 rows to 0 structural / 0 numeric and moves no other S4 row. That leaves cimono at its separate Δ2.

**mainframe-svek-unnormalized.** Jar controlled experiment (oracle-render.sh, scratch): with `mainframe M`, `a -- b` draws class `a` at body-local (1, 8). Without the mainframe it draws at (7, 7). With the mainframe, the single-class (degenerate, non-SvekResult) diagram still draws at (7, 7). Here is why. `SvekResult.calculateDimension` is the only caller of `clusterManager.moveDelta(6 - minX, 6 - minY)` (SvekResult.java:131-134). Under a mainframe nothing calls it: `BigFrame` sizes from `TextBlockUtils.getMinMax(original)` (BigFrame.java:80-81, 88-89), which is a LimitFinder draw. `decorateWithFrame` translates only by `computeDelta` (−minX when negative, DiagramChromeFactory.java:332-336). So the body keeps raw svek coordinates, and the frame is sized from raw ink maxX/maxY rather than from calculateDimension+15. The port always applies the ink shift at layout time. `big-frame.ts:167` then sizes from `originalDim.width + 12`, and `:173` places the original at `padding.left`. Result: +6 x, −1 y on every body element, and the frame is +8 high (rivino/soseka) or +15 wide (miveni).

## Rows

### unknown/basoto-36-resu245 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[2]/rect[1]/@y` (legend box), ours=50.2308 jar=60.231 (then svg @height 103/119)
- Java: `svek/GraphvizImageBuilder.java:211-212` — "if (dotData.isDegeneratedWithFewEntities(0)) return new EntityImageSimpleEmpty(dotData.getSkinParam().getBackgroundColor());"
- port: `src/diagrams/class/layout.ts:214` — "return { totalWidth: 0, totalHeight: 0, leaves: [], edges: [], namespaces: [] };"
- mechanism: A class diagram with no entities (only title/footer/legend) gets a 0x0 body in the port. Upstream uses a 10x10 `EntityImageSimpleEmpty`. Chrome stacks below a 10px-tall body, and the document margin plus the ensureVisible +1 apply.
- confidence: HIGH (instrumented: 0/0 after the 10x10 body)

### unknown/bikavu-22-rago633 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=53 jar=69 (@width 135/141)
- Java / port / mechanism: as basoto (title-only diagram).
- confidence: HIGH (instrumented)

### unknown/bogide-54-buco992 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/cenucu-07-mepi600 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y` (legend), ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only, `!pragma svgparser sax` is inert here).
- confidence: HIGH (instrumented)

### unknown/cepedu-19-namu934 — descriptive-leaf-ink-fallthrough (+ folder-label-heading-height)
- first diff: `svg/g[1]/g[1]/path[1]/@d[0]`, ours=9.5 jar=8.5 (every element +1 x; then foo1 y −1, foo2 y +1, height 73/76)
- Java: `klimt/drawing/LimitFinder.java:164-166` — "addPoint(x + shape.getMinX(), y + shape.getMinY()); addPoint(x + shape.getMaxX(), y + shape.getMaxY());" (the `package X [..]` leaf is `EntityImageDescription`+`USymbolFolder`, GeneralImageBuilder.java:160-167, and draws a `UPath`). Also `klimt/creole/legacy/StripeSimple.java:199-202` — "case 0: return fontConfiguration.bigger(4).bold();"
- port: `src/diagrams/class/class-layout-description-leaf-ink.ts:30-34` — the `DESCRIPTION_LEAF_INK_SYMBOLS` allowlist is `'component','database','node'` only, so a descriptive `package`/`rectangle` leaf reaches `class-ink-box.ts:273` "addClassifierBoxInk(box, c);" (the EntityImageClass rect+UEmpty rule, x−1/y−1). Also `src/core/svek/image/leaf-sizing-folder.ts:108` — "textBlockHeight(text, lineH) + atomHeightBonus(...)", where every line is billed at the base 14px, so the `= Creole heading` line (18px) is under-measured by 4.
- mechanism: (1) The ink walk uses the class-box rule for a leaf that `renderer-usymbol-entity.ts:236-252` really draws through `EntityImageDescription`. The UPath's exact min corner is replaced by x−1/y−1, which shifts the whole diagram +1,+1. The allowlist's own doc comment says rectangle/package render elsewhere, which is now false. (2) The folder label block height ignores creole heading sizes. foo2 is laid out 51 tall instead of the jar's DOT 55 (`svek-1.dot`: 0.763889in), which moves foo1's rank centring by 2.
- confidence: HIGH (instrumented: addPlainInk for descriptive package → 18 numeric left; +4 heading height → pass=true)

### unknown/cevoti-40-jeco305 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[2]/path[1]/@stroke` (PackageWithThing2 cluster folder), ours=#000 jar=#F00
- Java: `svek/Cluster.java:291` — "return StyleSignatureBasic.of(SName.root, SName.element, diagramStyleName, SName.group, symbol.getSNames());" and `:320` — "borderColor = style.value(PName.LineColor).asColor(...)"
- port: `src/diagrams/class/class-package-style.ts:114-115` — "return byStereo(packageBucket(theme)?.borderByStereo, tags) ?? theme.colors.graph.packageBorder ?? fallback;"
- mechanism: The cluster border is read from the per-key `packageBorder` bucket (skinparam `packageBorderColor`) plus the stereo bucket. The port never merges Cluster's style signature, so `<style> package, rectangle { LineColor red }` does not reach the folder outline, which falls back to the #000 default. The same unmerged resolution drops the nested `stereotype { FontColor blue }` on the cluster stereo (text[2] #008000 vs #00F). Separately, the collapsed-empty `EmptyPackage1`/`EmptyRectangle3` leaves lose their `«something»` stereo line at render: g[6]/g[7] childCount 3/2 vs 4/3, even though the DOT sizes match (dotEqual).
- confidence: MEDIUM (read, not instrumented)

### unknown/cimono-94-ximu187 — empty-diagram-simple-empty-body + chrome-atomtext-min-height
- first diff: `svg/g[1]/g[1]/rect[1]/@height` (legend), ours=18 jar=20; then rect @y 12/22
- Java: `klimt/creole/legacy/AtomText.java:179-181` — "double h = rect.getHeight(); if (h < 10) h = 10;" (jar probe: `<size:4>` and `<size:8>` legends both give rect height 20, `<size:12>` gives 22, `<size:20>` gives 30)
- port: `src/core/annotations/blocks-creole.ts:165` — "const height = stringBounder.calculateDimension(font, atom.text).getHeight();"
- mechanism: A chrome text atom smaller than 10px is not floored to 10 the way `AtomText.calculateDimensionSlow` floors it, so an 8px legend line is 2px short. The y offset is the empty-body family.
- confidence: HIGH (instrumented: floor to 10 in the scratch copy → pass=true, on top of the empty-body patch)

### unknown/fepiko-26-vobi566 — cluster-style-signature-unmerged (+ group-linestyle-dropped, collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[1]/rect[1]/@stroke` (r1 cluster), ours=#181818 jar=#008000
- Java: `svek/Cluster.java:386-391` — "getDefaultStyleDefinition(...).withTOBECHANGED(group.getStereotype()).getMergedStyle(...)", then `:320` for LineColor and `:402-407` "return style.getStroke();"
- port: `src/diagrams/class/renderer.ts:101` — "borderColor: theme.colors.border," (a USymbol cluster ignores every group/rectangle/stereotype style); `class-namespace-usymbol-shape.ts:202` — "UStroke.withThickness(GROUP_STROKE_WIDTH * scaleK),"
- mechanism: `skinparam rectangle<<boundary>> { BorderColor; FontColor; BorderStyle dashed }` becomes a stereotype-scoped `rectangle` style that upstream merges into the cluster signature. The port paints USymbol clusters from `theme.colors.border` with a thickness-only stroke, so colour, font colour and dash are all lost. The collapsed `r2` leaf also drops its `«boundary»` line and draws at 37.938x34 inside a 95.938x48 DOT box.
- confidence: MEDIUM (read, not instrumented)

### unknown/gasevo-58-ciso782 — descriptive-leaf-ink-fallthrough
- first diff: `svg/@height`, ours=183 jar=182 (every drawn element identical)
- Java: `klimt/drawing/LimitFinder.java:184-188` — "addPoint(x - 1, y - 1); addPoint(x + shape.getWidth() - 1 + ..., y + shape.getHeight() - 1 + ...);" (`rectangle func2 [..]` → `EntityImageDescription`/`USymbolRectangle` URectangle)
- port: `src/diagrams/class/class-layout-description-leaf-ink.ts:30-34` (allowlist lacks `rectangle`) → `class-ink-box.ts:273` → `class-ink-shapes.ts:104-106` "addPoint(box, Math.max(c.x + c.width - 1, bodyMaxX), Math.max(c.y + c.height - 1, bodyMaxY));" with bodyMaxY = y+h (the UEmpty corner)
- mechanism: The bottom-most leaf is a descriptive `rectangle`. The port bounds it with the EntityImageClass UEmpty corner (y+h) instead of the URectangle ink corner (y+h−1), so the SvekResult ink height is 162 instead of 161.
- confidence: HIGH (instrumented: logged ink box maxY=128 for func2 at y=94 h=34; adding `'rectangle'` to the allowlist → pass=true)

### unknown/gemigi-37-safi979 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/gigoru-88-naze087 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[3]/rect[1]/@stroke` (RectangleWithThing4 cluster), ours=#181818 jar=#F00
- Java: `style/FromSkinparamToStyle.java:128` — "addConvert(\"packageBorderColor\", PName.LineColor, SName.group);" plus `svek/Cluster.java:291` (every USymbol cluster signature contains `SName.group`)
- port: `src/diagrams/class/renderer.ts:101` — "borderColor: theme.colors.border,"
- mechanism: `skinparam packageBorderColor` is a `group`-level LineColor upstream, so it paints the rectangle cluster too. The port applies it only on the folder path (`packageBorder`), and the rectangle cluster keeps `theme.colors.border`. The same row's EmptyPackage1 leaf stroke (#181818 vs #F00) and the dropped `«something1»`/`«something3»` on the collapsed leaves follow the same pattern.
- confidence: MEDIUM (read, not instrumented)

### unknown/guxico-27-bofu708 — cluster-style-signature-unmerged (+ collapsed-group-leaf-stereo-dropped)
- first diff: `svg/g[1]/g[1]/path[1]/@stroke` (PackageWithThing cluster), ours=#000 jar=#F00
- Java: `svek/Cluster.java:320` — "borderColor = style.value(PName.LineColor).asColor(skinParam.getIHtmlColorSet());"
- port: `src/diagrams/class/class-package-style.ts:114-115` (see cevoti)
- mechanism: As cevoti. `<style> package { LineColor red; stereotype { FontColor blue } }` never reaches the cluster outline or the cluster stereo. The rectangle cluster correctly stays #181818 in both, which is consistent with the style being scoped to `package`.
- confidence: MEDIUM (read, not instrumented)

### unknown/jadamo-76-xabi141 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only; the missing font is inert under the width table).
- confidence: HIGH (instrumented)

### unknown/jajebe-95-jomo899 — sprite-badge-headerlayout-offset
- first diff: `svg/g[1]/g[2]/image[1]/@x` (Foo's `<<($disk16,red)>>` badge), ours=11 jar=39.781
- Java: `svek/HeaderLayout.java:93-100` — "final double h2 = Math.min(circleDim.getWidth() / 4, suppWith * 0.1); final double h1 = (suppWith - h2) / 2; ... final double xCircle = h1; final double yCircle = (height - circleDim.getHeight()) / 2;" and `EntityImageClassHeader.java:159` "withMargin(getCircledCharacter(...), 4, 0, 5, 5)"
- port: `src/diagrams/class/renderer-classifier-badge-tag.ts:171-177` — "return image(geo.x + BADGE_LEFT_MARGIN * k, geo.y + BADGE_SPRITE_TOP_MARGIN * k, ...)"
- mechanism: The sprite badge is pinned at the box's (4,5) corner. Upstream offsets the whole circled-character block by HeaderLayout's `xCircle = h1` (spare header width) and `yCircle`. Foo's wide body gives h1 = 28.781. Foo2 (h1=0, yCircle=0) matches by coincidence, as did the rotisi-30 fixture cited in the port comment.
- confidence: HIGH (reproduced arithmetically against tivezu: h1=1.4755, yCircle=2 → x=12.4755, y=14 exact)

### unknown/kumuti-42-tace851 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y` (legend), ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/lavoke-68-lezi492 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=0 jar=16 (@width 0/16)
- Java / port / mechanism: as basoto. No chrome at all: 10x10 + margin 5 → `floor(15+1)` = 16x16.
- confidence: HIGH (instrumented)

### unknown/liboma-63-gamu743 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/lijota-92-sove350 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/lirumo-81-jega996 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/locoge-06-luki835 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[2]/rect[1]/@y` (legend), ours=50.2308 jar=60.231
- Java / port / mechanism: as basoto (title+footer+legend).
- confidence: HIGH (instrumented)

### unknown/miveni-64-rexo238 — mainframe-svek-unnormalized
- first diff: `svg/g[1]/rect[1]/@height` (BigFrame), ours=212 jar=204; @width 350.35/335.35; then `g[1]/g[1]/rect[1]/@x` 153.28/147.28
- Java: `klimt/shape/BigFrame.java:81` — "final double ww = originalMinMax.getMinX() >= 0 ? originalMinMax.getMaxX() : originalMinMax.getWidth();" (:89 likewise `hh`); `svek/SvekResult.java:131-134` — "if (minMax == null) { minMax = TextBlockUtils.getMinMax(this, stringBounder, false); clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY()); }"
- port: `src/core/klimt/shape/big-frame.ts:167` — "const width = padding.left + Math.max(originalDim.width + 12, dimTitle.width + 10) + padding.right;" and `:173` "originalX: padding.left,"
- mechanism: See the family note. Under a mainframe, SvekResult's moveDelta never runs, so the body keeps raw svek coordinates and BigFrame sizes from raw ink max. The port frames an already ink-normalized, margin-dimensioned class fragment.
- confidence: HIGH for the upstream mechanism (jar controlled experiment m0/m1/m2/m3); MEDIUM for the exact port arithmetic (not instrumented)

### unknown/nilimi-64-xeco438 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/nulevu-49-bovi390 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=117 jar=133
- Java / port / mechanism: as basoto (title-only, SVG sprite).
- confidence: HIGH (instrumented)

### unknown/nuveji-19-jabi587 — desc-separator-thickness-cleararea (+ note-titled-separator-unbuilt)
- first diff: `svg/g[1]/g[1]/path[6]/@stroke-width` (DB1 `____` separator), ours=1 jar=0.5; then g[1]/g[1] childCount 13/14 (missing title clear-area `<rect>` for `..My title..`)
- Java: `cucadiagram/BodyEnhancedAbstract.java:121-123` — "final protected double getDefaultThickness() { return style.value(PName.LineThickness).asDouble(); }" feeding `UHorizontalLine.java:183-184` "return UStroke.withThickness(defaultThickness);" for `_`; `decoration/symbol/USymbolDatabase.java:111` — "line.drawTitleInternal(ug, 0, endingX, 0, true);" → `UHorizontalLine.java:164-166` "if (clearArea) { ug.apply(getStroke()).draw(URectangle.build(dimTitle)); }"
- port: `src/core/svek/image/EntityImageDescriptionTextBlock.ts:134` — "const SEPARATOR_DEFAULT_THICKNESS = 1;" (used at :310); `src/core/klimt/shape/UHorizontalLine.ts:128-132` — "`clearArea` ... is dropped: no caller in this port ever passes `true`" (false: `USymbolDatabase.ts:166` and `USymbolNode.ts:98` pass true)
- mechanism: The description body's separators take CreoleHorizontalLine's fixed thickness 1 instead of BodyEnhanced2's element LineThickness (0.5 for a database), so `____` draws 1. The titled-separator clear-area rectangle is never drawn. Secondary: the note's `==Title==`/`--Another title--` lines reserve height but draw nothing (note-layout-measure-rows.ts:62-76 names them an unbuilt, "zero corpus reach" remainder, which this row disproves). g[2] childCount is 4 vs 12.
- confidence: HIGH (read; the 0.5 matches `database` LineThickness exactly and the port comment states the drop)

### unknown/palida-11-pexu992 — group-linestyle-dropped
- first diff: `svg/g[1]/g[1]/rect[1]/@stroke-dasharray` (r1 cluster), ours=(none) jar=7,7; same on the collapsed r2 leaf
- Java: `svek/Cluster.java:402-407` — "if (colors.getSpecificLineStroke() != null) return colors.getSpecificLineStroke(); return style.getStroke();" and `style/Style.java:299-300` — "return getStroke(PName.LineThickness, PName.LineStyle);"
- port: `src/diagrams/class/class-namespace-usymbol-shape.ts:202` — "UStroke.withThickness(GROUP_STROKE_WIDTH * scaleK),"
- mechanism: `<style> rectangle { LineStyle 7-7 }` is part of the merged cluster and leaf style upstream. The port builds a thickness-only stroke for USymbol clusters. The descriptive leaf's stroke reads only per-declaration `#line.dashed` (`renderer-classifier-colors.ts:436-438`), so the dash never appears.
- confidence: MEDIUM (read, not instrumented)

### unknown/pefigi-94-raxa740 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/pupoko-23-xubo613 — multiline-usecase-kind
- first diff: `svg/g[1]/g[1]/ellipse[1]/@stroke-width`, ours=(none) jar=0.5; text is one unsplit `za\n--zb` node with `text-anchor=middle`, where the jar draws 2 lines
- Java: `descdiagram/command/CommandCreateElementMultilines.java:175-177` — "if (symbol.equalsIgnoreCase(\"usecase\")) { type = LeafType.USECASE; usymbol = USymbols.USECASE;"
- port: `src/diagrams/class/class-multiline-element.ts:212-213` — "const classifier = ensureClassifier(state, code, 'descriptive', code); classifier.usymbol = usymbol;"
- mechanism: The multi-line quoted `usecase CP as "za\n --zb"` becomes a `descriptive` leaf with usymbol `usecase` instead of a `usecase` leaf. `usesClassUSymbolEntity` (renderer-usymbol-entity.ts:236) does not route `descriptive`+`usecase`, so it falls to the legacy `renderUSymbolIcon` path (renderer.ts:61-66).
- confidence: HIGH (instrumented: logged `CP descriptive usecase` at the renderer dispatch)

### unknown/ragudu-37-poxi589 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/rinidi-95-neko205 — enhanced-body-icon-block-height
- first diff: `svg/g[1]/g[2]/g[2]/ellipse[1]/@cy` (SingletonImpl `<size:30>instance` icon), ours=73.5 jar=81.5
- Java: `klimt/geom/PlacementStrategyVisibility.java:67` — "result.put(ent1.getKey(), new XPoint2D(0, 2 + y + (maxHeight12 - height1) / 2));"
- port: `src/diagrams/class/class-body-enhanced-layout.ts:270` — "...(m.visibilityExplicit === true ? { visibilityIcon: m.visibility, visibilityIsField: !isMethodMember(m) } : {})," (no `visibilityBlockHeight`/`visibilityBlockTopDy`), so `renderer-classifier-rows.ts:116` "const blockHeight = row.visibilityBlockHeight ?? fontSize;" centres on 14
- mechanism: The enhanced-body (`__`-separated) row builder omits the member block height and top that the classic builder sets (class-member-rows.ts:233-238). The icon is centred on the 14px font instead of the 30px row: (30−14)/2 = 8.
- confidence: HIGH (instrumented: logged rows lack the fields; adding them → pass=true)

### unknown/rirelu-80-tagi213 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=35 jar=51
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/rivino-95-midu088 — mainframe-svek-unnormalized
- first diff: `svg/g[1]/rect[1]/@height`, ours=212 jar=204; then `g[1]/g[1]/rect[1]/@x` 17/11, @y 42/43
- Java / port / mechanism: as miveni (mainframe + `a -- b`, no other chrome).
- confidence: HIGH (jar experiment m1 is this row's body minus its title text)

### unknown/rozugu-82-pera583 — embedded-block-skinparam-leak (+ desc-label-embed-unported)
- first diff: `svg/@background`, ours=#Transparent jar=#FFFFFF; plus an extra background `<rect>` (g[1] childCount 3/2); A's embed `<image>` missing (g[1]/g[1] childCount 1/2)
- Java: `cucadiagram/BodyEnhanced2.java:91-94` — "final String type = EmbeddedDiagram.getEmbeddedType(s); if (type != null) { display = display.add(s); display = addOneSingleLineManageEmbedded2(it, display);" (the `{{`…`}}` lines are the element's display, consumed by the multi-line command; `skinparam` inside is never dispatched to the outer diagram)
- port: `src/core/preprocessor-collector.ts:147-166` — "accept(line ...) { ... return this.openSkinparam(trimmed); }", which is blind to `{{ }}` nesting
- mechanism: The preprocessor's skinparam collector consumes every `skinparam` line in the block, including one nested inside an embedded `{{ }}` diagram. The embedded `BackgroundColor #Transparent` therefore becomes the outer diagram's background, and the line is removed from the embed. Secondary: the embed itself is unported for description labels (`EntityImageDescriptionDelegates.ts:124` throws "embedded diagrams ({{ ... }}) inside a description label are not supported"), so no `<image>` is drawn and the canvas is not stretched to 136.
- confidence: HIGH (instrumented: same markup without the nested skinparam → background #FFFFFF; the renderer's thrown error was captured)

### unknown/rufala-47-nosa835 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/rupigu-89-xabo757 — degenerate-text-ensurevisible
- first diff: `svg/@height`, ours=38 jar=44 (all drawn elements identical)
- Java: `klimt/drawing/svg/SvgGraphics.java:757-758` — "ensureVisible(x, y); ensureVisible(x + textLength, y);" with `:129-133` "if (y > maxY) maxY = (int) (y + 1);"
- port: `src/diagrams/class/class-geo-builders.ts:442-443` — "totalWidth: Math.max(totalDims.width, Math.floor(embedRight) + 1), totalHeight: Math.max(totalDims.height, Math.floor(embedBottom) + 1),"
- mechanism: The degenerate single-leaf canvas folds in only drawn embeds' extents. It misses SvgGraphics' ensureVisible on the circle's label, which is drawn BELOW the 18x18 box at baseline 43.889 → `(int)(43.889+1)` = 44.
- confidence: HIGH (arithmetic reproduces 44 exactly from the drawn `<text>`)

### unknown/sofobo-48-meme531 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=42 jar=58
- Java / port / mechanism: as basoto (title-only).
- confidence: HIGH (instrumented)

### unknown/soseka-43-riru110 — mainframe-svek-unnormalized
- first diff: `svg/g[1]/rect[1]/@height`, ours=212 jar=204; then `g[1]/g[3]/rect[1]/@x` 17/11
- Java / port / mechanism: as miveni (mainframe plus title/header/footer/caption/legend, which stack outside the frame).
- confidence: HIGH (upstream, jar experiment) / MEDIUM (port arithmetic)

### unknown/sprite-SVG-fill-management-0 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[2]/rect[1]/@y`, ours=50.2308 jar=60.231
- Java / port / mechanism: as basoto (same markup).
- confidence: HIGH (instrumented)

### unknown/sprite-SVG-fill-management-1 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[2]/rect[1]/@y`, ours=50.2308 jar=60.231
- Java / port / mechanism: as basoto.
- confidence: HIGH (instrumented)

### unknown/sprite-SVG-fill-management-4 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

### unknown/sufura-56-muke185 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=0 jar=16
- Java / port / mechanism: as lavoke (no entities, no chrome; `!log` lines inert).
- confidence: HIGH (instrumented)

### unknown/tenava-30-cele768 — empty-diagram-simple-empty-body
- first diff: `svg/@height`, ours=0 jar=16
- Java / port / mechanism: as lavoke (skinparam only).
- confidence: HIGH (instrumented)

### unknown/tivezu-91-bevu722 — sprite-badge-headerlayout-offset
- first diff: `svg/g[1]/g[1]/image[1]/@x`, ours=11 jar=12.475 (@y 12/14)
- Java / port / mechanism: as jajebe. circleDim = (28+4, 10+10) = (32, 20). The header is 24 tall (name 14 + 10) → yCircle = 2. suppWith = 65.429 − 32 − 30.15 = 3.279, h2 = 0.3279, h1 = 1.4755 → x = 7 + 1.4755 + 4.
- confidence: HIGH (arithmetic exact)

### unknown/tozizu-96-voka262 — reversecolor-mapper-unported
- first diff: `svg/@background`, ours=#FFFFFF jar=#010101; then every fill/stroke (#111/#E7E7E7/#FEFFFF/#040401) and the extra background `<rect>` (g[1] childCount 2/3)
- Java: `TitledDiagram.java:301-306` — "final String reversecolor = getSkinParam().getValue(\"reversecolor\"); ... if (\"dark\".equalsIgnoreCase(reversecolor)) return ColorMapper.LIGTHNESS_INVERSE;" (then `ColorOrder` reversal, :308-312)
- port: `src/core/theme.ts:91-98` — "`skinparam monochrome true|reverse` ... monochrome?: 'true' | 'reverse';", which is the only muted-mapper branch modelled. `reversecolor` has no handler anywhere in `src/`.
- mechanism: `skinparam reversecolor dark` (and `reversecolor <ColorOrder>`) selects a whole-diagram ColorMapper upstream. The port never reads the key, so every colour stays in the un-mapped palette.
- confidence: HIGH (read; grep proves no `reversecolor` consumer)

### unknown/vabobu-24-temi990 — degenerate-text-ensurevisible
- first diff: `svg/@height`, ours=38 jar=44 (@width 38/41)
- Java / port / mechanism: as rupigu. The label `my label` also overhangs to the right: x = −8.15 + 48.3 = 40.15 → `(int)(40.15+1)` = 41.
- confidence: HIGH (arithmetic exact)

### unknown/zivilu-35-leja732 — group-linestyle-dropped
- first diff: `svg/g[1]/g[1]/rect[1]/@stroke-dasharray`, ours=(none) jar=7,7 (and on r2)
- Java / port / mechanism: as palida, via `skinparam rectangle { BorderStyle dashed }`, which is converted to the rectangle style's LineStyle.
- confidence: MEDIUM (read, not instrumented)

### unknown/zovojo-65-gocu245 — empty-diagram-simple-empty-body
- first diff: `svg/g[1]/g[1]/rect[1]/@y`, ours=12 jar=22
- Java / port / mechanism: as basoto (legend-only).
- confidence: HIGH (instrumented)

## Ruled out
- Real-`dot`/dot-engine: every S4 row is `dotEqual: True`, and no row's first diff is an edge or node-position delta that the DOT could explain. No `dot -Tdot` run was needed.
- Measurer/deterministic-text: the jar probe `c1.puml` (the cimono legend, via `scripts/oracle-render.sh`) reproduces the cached oracle's rect (height 20) and text (y 33.222, textLength 107.7) exactly. On these rows the text widths and baselines agree between ours and the jar.
- Accept-candidate: no S4 row is an upstream crash, ELK or raster payload. rozugu's embed is a missing drawing, not payload bytes, so it is not D9.
