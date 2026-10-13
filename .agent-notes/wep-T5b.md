# wep-T5b: the legend's style name

## Observation: the legend style is resolved at the draw site, per diagram type
- **Context**: threading `getDiagramType().getStyleName()` into the legend (EntityImageLegend.java:49-51) without touching `src/index.ts`.
- **Finding**: `resolveAnnotationStyles` now returns `ResolvedAnnotationStyles` = the six agnostic styles + `legendFor(diagramType)`; `chrome.ts#applyChromeSlots` calls `styles.legendFor?.(fragment.diagramType) ?? styles.legend`. Every producer and every conformance harness (`render-fixture-*.ts`) that builds styles with `resolveAnnotationStyles` gets it with no call-site change. `getStyleName` (DiagramType.java:234-296) lives in `annotations/style.ts` until `core/DiagramType` is ported.
- **Impact**: a producer that sets no `RenderFragment.diagramType` keeps the old agnostic legend (every `*.legend` selector applied); set `diagramType` to get the faithful one.
- **Confidence**: High

## Observation: the skin layer is derived from the embedded skin, not transcribed
- **Context**: `BASE_DEFAULTS` transcribes `root{}` + `document{legend{}}` only.
- **Finding**: `skinLegendDeclarations` merges `of(root, root, document, <styleName>, legend)` and `of(root, root, document, legend)` over `loadSkin('plantuml.skin')`; properties whose winning value has a different priority (declaration counter, StyleParser.java:137) are the style name's contribution (wbsDiagram 5, timingDiagram 4, yaml/json 2 for plantuml.skin). `skin <name>` documents still get plantuml.skin here (pre-existing: BASE_DEFAULTS ignores `skin` too).
- **Confidence**: High

## Observation: two jar behaviours the port's legend still misses (no corpus row)
- **Context**: T5b probes `plans/wbs-engine-port/measurements/T5b/probes/`.
- **Finding**: (a) `TextBlockBordered.java:123-124` draws no fill when the legend background equals `ug.getDefaultBackground()`; with `mindmapDiagram { BackgroundColor pink }` the jar's legend is `fill="none"`, ours pink — `AnnotationBoxStyle.documentBackground` comes from `theme.colors.background`, not the diagram's `calculateBackColor` (`root, document, <styleName>`). (b) The user `<style>` order between a bare `legend {}` and `<styleName> {}` follows the StyleMap's fixed steps (root, document, legend, document.legend, then map order), not the per-property declaration counter: `wbsDiagram {FontSize 20} legend {FontSize 9}` draws 20 where the jar draws 9 (probe `wbs-style-then-legend`, 19 diffs); the reverse order matches (`wbs-legend-then-style`, 0).
- **Confidence**: High (both jar-probed)
