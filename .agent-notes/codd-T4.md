# codd-T4 -- canvas, margins, dpi

## Observation: DotData#isDegeneratedWithFewEntities counts removed entities
- **Context**: cenoja/gogosu/sobobi/sodoza were 1px short each way.
- **Finding**: `dot/DotData.java:69-71` counts groups, links and leaves before `remove`; the renderer re-derived the predicate from surviving geometry. Fixed by `geo.degenerate` (set by `degenerateSingleLeaf`).
- **Impact**: any predicate the jar evaluates on the raw entity list must be flagged by the layout, not recomputed from geometry.
- **Confidence**: High (jar probes of `component foo2` 87x64 vs the same plus a removed sibling 88x65).

## Observation: description ignored the exporter margin and the chrome-time scale
- **Finding**: `TextBlockExporter.java:510-516` (style Margin) and `:159-177,204-208` (scale/dpi over the chrome-composed block). `Theme.diagramMargin` already existed; description now reads it. Chromed geometry renders at factor 1 and `assemble-svg.ts#finalizeDescriptionFragment` scales (activity's scaler).
- **Impact**: usecase/unknown/c4 rows moved too (survey: +5 component, +2 unknown, +1 usecase conformant, zero losses).
- **Confidence**: High.

## Observation: edge labels are drawn at the engine centre, raw text
- **Finding**: `core/svek/SvekEdge.ts:294-297` draws `UText.build(text)` at `lp + 7`, no creole, no top-left conversion. Jar: table `w=(int)(textW+2)` (`SvekEdge.java:504-508`), drawn at table min corner (`:744-746,951-954`). Measured: jar x = ours - floor(textW+2)/2 + ... see T4-report. Explains canvas/text diffs of fogexa, figika, radiga, zodare, rekisu, revusu, nevuzi and the g[5..8] label diffs of bamami/bobixe/pugodi/rufopi.
- **Impact**: T7's main fix; not done in T4 (core/svek is outside its write-set).
- **Confidence**: High for the mechanism, Medium for the exact constants.

## Observation: two sizer gaps proven by local experiment (reverted)
- degenerate `layout.ts:406` omits fontSize/stereotypeFontSize/lineThickness/wrapWidth/guillemet (kuciku, mavicu pass with them).
- `core/svek/image/leaf-sizing.ts` `<latex>` box guard: removing it makes kezodo/vimulo conformant and gevozu/sunuju 164 -> 68, sapofa unchanged.
- **Confidence**: High (render-diff before/after).
