# add4-T2b — PARTITION family (+ warning emitters, + diamondBox)

Branch `add4/T2b`. Base `380f86bfb` (Σ 8130). `feat/activity-divergence-drive-4` was merged in twice on instruction: b40e29f2f (T2e) and the T2d round 2.

## Commits (probe Σ after each; 85 rows)
| sha | subject | Σ |
|---|---|---|
| efd7c059a | fix(activity): measure the partition title as creole | 8102 |
| 238af1760 | fix(activity): parse partition BACK1/BACK2 colour and stereotype | 8260 |
| f7e57fa68 | fix(activity): reserve the partition title's SpecialText slot | 7570 |
| b40e29f2f | merge feat/activity-divergence-drive-4 (T2e) | 3341 (re-pinned base) |
| c3724aa01 | feat(activity): warn on a bracket-less container and a legacy closer | 3294 |
| (merge) | merge feat/activity-divergence-drive-4 (T2d round 2) | 3071 |
| 9657f6680 | fix(activity): box the empty diamond at its drawn y for compression | 2854 |
| 110c7ddf0 | fix(activity): apply the Partition* skinparams to the group frame (CORE) | 2791 |
| f9085e7a3 | feat(activity): draw package/card/rectangle containers with their USymbol | 2707 |
| fa3f22747 | test(activity): pin the container USymbols against jar renders | 2707 |

## Java -> ours
- PART-TITLE-CREOLE: the frame title is a creole Display, `title.create(fc, LEFT, skinParam)` (`FtileGroup.java:104-108`).
  - Ported in `tiles/gtile-group.ts#frameTitleWidth` (via `creoleTextLines`). It is shared by `GtileGroup` (suppWidth, `:160-167`), `activity-renderer-composite.ts#compositeTitleWidth` (tab, `USymbolFrame.java:76-84`) and the compress adapter.
- PART-COLOR: `CommandPartition3.java:71-87` (regex: TYPE, BACK1, NAME `[%g][^%g]+[%g]|.*?`, BACK2, STEREO, BRACKET), `:143` (quote strip), `:145-147` (BACK1 else BACK2), `FtileGroup.java:101`.
  - `dispatch-support.ts#RE_GROUP_OPEN` (+`GROUP_COLORS` from `ColorParser.java:43-46`, `GROUP_QUOTE` from `Pattern2.java:59`).
  - `group-dispatch.ts#tryOpenGroup`.
  - The colour flows through `ast.ts ActivityGroup.backColor/stereotype` -> `tile-layout-structural.ts#groupOptions` -> `GtileGroup.backColor` -> `tile-coordinates-group.ts` (`color`) -> renderComposite fill.
- FRAME-TITLE-SLOT: `USymbolFrame.java:150-156` (plain UText if `widthFull - widthTitle < 25`, else SpecialText), `atmp/SpecialText.java:55-62` (1x1 UEmpty at `dx(dimTitle.width)`), `SlotFinder.java:87-92`.
  - Ported in new `layout/compress/shapes-of-frame.ts#frameTitleShape`. `frameTabShape` moved there from `shapes-of.ts`, which was at 500 lines.
- PARTITION-LINECOLOR / PARTITION-SKINPARAM (core): `FromSkinparamToStyle.java:131-133` maps `PartitionBorderColor`->LineColor, `PartitionBackgroundColor`->BackGroundColor, and `addConFont("Partition")`->FontColor/FontSize, all on `SName.composite`. `FtileGroup.java:89-91,99-102` reads them. There is no `PartitionBorderThickness` conversion, so it stays unknown and mabove draws at 1.5, as in the jar.
  - Core: `skinparam-key-handlers-table-c.ts` (4 handlers), `skinparam-accumulator.ts` (4 fields), `skinparam-theme-builder.ts` (GRAPH_OVERRIDE_FIELDS), `theme-graph-colors-c.ts` (`partitionBorder/Background/FontColor/FontSize`).
  - Activity: `activity-style-defaults.ts#activityFontSize` (a composite tier) and `activity-renderer-composite.ts#compositeStyle`.
- GROUP-USYMBOL: `CommandPartition3.java:89-106`.
  - package: `USymbolFolder.java:60-65,85-144,228`.
  - card: `USymbolCard.java:59-66,120-135`.
  - rectangle: `USymbolRectangle.java:65-71,104-134`. Its title alignment comes from `packageTitleAlignment`, CENTER by default (`AlignmentParam.java:44`).
  - New `activity-renderer-composite-symbols.ts`. `GtileGroupOptions.usymbol` -> `ActivityNodeGeo.usymbol` (`activity-geometry.types.ts`).
  - Compression: these shapes carry no ignore flag, and the title is plain text. That is `shapes-of-frame.ts#frameShapes`, which also now owns the USymbolFrame rect.
- Warnings (orchestrator item 1): `CommandPartition3.java:154-157` (TYPE as written, NAME unquoted) and `CommandCloseGroupLegacy3.java:75` (CMD = the whole anchored match). Both go through `group-dispatch.ts` -> `ctx.pragma.addWarning`.
- diamondBox (orchestrator item 2): `FtileDiamond.java:87-89` (`ug.apply(UTranslate.dy(suppY1))` before the rhombus) -> `layout/compress/shapes-of-boxes.ts#diamondBox`, `cy = y + h - size`.

## Rows before -> after
| row | before | after | note |
|---|---|---|---|
| somome-34-nori033 | 152 | 65 | element census now exact. Residual = canvas, see R1 |
| tetako-26-xeja109 | 34 | 0 | |
| kilavo-46-xumo547 | 19 | 0 | |
| zocifu-52-miga192 | 34 | 2 | residual = R2 (HyperlinkColor) |
| mudobi-07-biji996 | 64 | 0 | FTS plus the merged TOPDOWN-OUTY |
| dulusu-13-roka577 | 42 | 0 | |
| sifite-87-ziti434 | 18 | 0 | |
| popome-26-zufo950 | 4 | 0 | |
| zoxazu-64-vebi280 | 4 | 0 | |
| mabove-82-dozu233 | 53 | 0 | |
| tozecu-08-ride878 | 562 | 504 | banner exact (562->515), USymbols (->504). Residual = R3 |
| xefalo-73-sabi101 | 217 | 0 | diamondBox |
| side effects | | | cakeca 123->0, bizeti 157->0, xovigi 62->2 (its residual is two loop-label text x values, not partition) |

The all-engine survey (before = post-merge HEAD, after = 110c7ddf0) turned 4 activity rows conformant: dulusu, mabove, popome and zoxazu. There were 0 conformant losses. The one non-activity mover was `unknown lonosi-76-xoka469` (diverged -> structural-match). It is a switch fixture: unknown was surveyed before the T2d round-2 merge, so this is T2d's switch change, not the core edit.

## Risers (each in an intermediate commit only)
- efd7c059a, tetako 34->37: BACK1 was still in the title. Creole reads the leading `#` as a hash heading (`CreoleStripeSimpleParser.java:71`). 238af1760 closes it.
- 238af1760, xovigi 391->605: the Salmon frame now has the jar's title, but is 173.363 wide against the jar's 183.363, because X compression ate the 10 px title margin (no SpecialText slot yet). f7e57fa68 closes it (->331, then 2 after the merges).
- No riser at HEAD.

## Element census
- somome `line-2,path+3,polygon-1,rect+1` -> exact.
- tozecu `line+2,path+4,polygon+4,text-2` -> `line+5,polygon+5`.
  - The banner fixed text-2.
  - USymbol added the 3 jar-matching symbol lines and the package polygon. These had been hiding our extra note-edge lines and arrowheads; see R3.
  - Per-tag counts moved away only by unmasking. Every added element exists in the jar at the same place.

## Census movers (style/text/swimlane; all equal the pin's `jar` column unless marked)
- style:
  - bizeti 241x686 -> 243x687
  - cakeca 1322x921 -> 1343x922
  - dulusu w 100->121
  - kilavo w 103->99
  - tetako w 103->99
  - zocifu w 158->154
  - sifite h 226->227
  - xefalo h 935->936
  - mabove fontSize{14:1->0, 20:0->1}, 99x185 -> 107x192
  - somome strokeWidth{1.5:0->2}, rx{absent:4->3}, h 449->473 (= jar). Width 99 is not the jar's 119; see R1
  - tozecu fontSize{10:2}, strokeWidth{1.5:3}, rx, textCount 20, w 329 (= jar). **h 851->923 AWAY** (jar 708), see R3
- swimlane: cakeca dividerXs/titles/band/lanes/1343x922 (= jar); sifite h 227 (= jar).
- text:
  - mabove fill{#FF0:1}
  - somome inset{12.194:1}
  - tozecu fill/anchor/textCount 20, inset{7:1}
- ratchet, harness-parity and the compress invariant are green. The census pins need an orchestrator re-pin.

## Not done + why
- **R1, somome 65 (and tozecu's canvas): stopped, `layout/canvas-origin.ts` belongs to T2e.**
  - Mechanism: the jar's LimitFinder pads a UPolygon by `HACK_X_FOR_POLYGON = 10` on X (`LimitFinder.java:169-177`) and reads a ULine end exactly (`:179-182`). A URectangle stops 1 px short (`:184-188`).
  - `extendForNode` fudges every frame as a rect. So a package canvas is 20 px narrow, and a card canvas is 1 px narrow, because its full-width hline ends at the rect's far edge.
  - Sandboxed and reverted. In `extendForNode`, `const fx = node.usymbol === 'package' ? POLYGON_FUDGE_X : fudgeX(node.kind);` and `far = node.usymbol === 'card' ? 0 : fx.far` give somome 65->0, Σ 2707->2642, 0 risers, and all 4 `tests/fixtures/activity/add4-T2b/*` jar-exact.
  - `tests/diagrams/activity/group-usymbol-fixtures.test.ts` pins the current residual shape.
- **R2, zocifu 2:** `skinparam HyperlinkColor` -> root `HyperLinkColor` (`FromSkinparamToStyle.java:135`, `Style.java:265-267`) is unported. Link text draws #00F against the jar's #FFF. This is a core key that touches every engine's link colour, and it is read in `activity-text-style.ts` (T2d), so it is outside this write-set.
- **R3, tozecu 504:** a `floating note` after a group attaches into the group, not as a flow sibling (`InstructionList.java:190-196`, `InstructionGroup.java:125-131`). Ours stacks it after the group with extra edges, which accounts for +184 px height and the line/polygon excess. Owners: node-dispatch.ts / tile-layout-structural (COMPOSITE-NOTE family).
- Stereotype (`STEREO`) is parsed onto the AST but not applied to the style (`withTOBECHANGED(stereotype)`, `CommandPartition3.java:161-162`). No row exercises it.
- `addConFont`'s FontName/FontStyle for Partition are not converted. No fixture needs them.
- `docs/catalog.md` drift: there are new modules (`shapes-of-frame.ts`, `activity-renderer-composite-symbols.ts`). Run `npm run catalog` at merge.

## Out-of-write-set edits (all additive, one hunk each)
- `ast.ts`: `ActivityGroup.backColor/stereotype`.
- `layout/tile-layout-structural.ts`: `tileGroup` -> `groupOptions`, plus its stale doc.
- `activity-geometry.types.ts`: `ActivityNodeGeo.usymbol`, `CompositeUSymbol`.
- Core: `skinparam-accumulator.ts`, `skinparam-theme-builder.ts` (beyond the named key table / theme colour files).

## Observation: a polygon's canvas pad is X-only and fixed at 10 px
- **Context**: somome's package frame sat at x=25 in the jar but x=16 in ours. Its body matched.
- **Finding**: `LimitFinder.drawUPolygon` adds ±10 on X to every UPolygon (`LimitFinder.java:169-177`). A container drawn as a polygon (package/folder) therefore widens the canvas by 20 px. A URectangle is -1/-1, and a ULine end is exact.
- **Impact**: any new polygon-drawn node needs the polygon fudge in `canvas-origin.ts`; kind-based sets miss a frame whose symbol differs.
- **Confidence**: High (4 authored oracle fixtures, sandbox 0 diffs)

## Observation: creole reads a leading `#` in a title as a heading
- **Context**: tetako rose when the title was measured as creole before BACK1 was parsed.
- **Finding**: `#LightSkyBlue title1` lexes as a hash heading (`CreoleStripeSimpleParser.java:71`) and draws "LightSkyBlue title1".
- **Impact**: a parser that leaves a `#color` token in a label shows up as a creole width change, not as a colour.
- **Confidence**: High
