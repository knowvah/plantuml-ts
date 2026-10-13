# wep-T4a: wbs plugin and wiring

## Observation: the chrome legend ignores the diagram's own style name
- **Context**: wbs probe `tests/fixtures/wbs/legend.puml`, corpus `wbs/xakubu-65-cumo769`, `wbs/fipina-75-bago028`.
- **Finding**: `EntityImageLegend.create` (activitydiagram3/ftile/EntityImageLegend.java:49-51) merges `root, root, document, <diagramType.getStyleName()>, legend`, so the skin's top-level `wbsDiagram { Padding 10; Margin 15; RoundCorner 0; LineThickness 1.5; FontSize 12 }` (plantuml.skin:350-356) reaches the WBS legend (jar: no rx, stroke 1.5, font 12). `src/core/annotations/style.ts#resolveAnnotationStyles` starts every element from diagram-agnostic `BASE_DEFAULTS` (legend rx 7.5, stroke 1, font 14). Title/caption/header/footer use `root, document, <element>` (DiagramChromeFactory.java:368-425) and are unaffected.
- **Impact**: any engine whose skin block declares top-level properties (wbsDiagram today) draws a wrong legend; mindmap/class skin blocks declare none at top level.
- **Confidence**: High

## Observation: a gradient document background needs `backgroundGradient` on the fragment
- **Context**: probe `tests/fixtures/wbs/gradient-background.puml` (`wbsDiagram { BackgroundColor red/blue }`).
- **Finding**: `SvgGraphics.java:178-183` leaves `backcolorString` null for an `HColorGradient`, so the root carries no `background:`. `assembleDocumentShell` omits it only when `RenderFragment.backgroundGradient` is set (`document-shell.ts#hasBackgroundStyle`); the wbs plugin now sets it. `src/diagrams/salt/index.ts#drawFragment` and `src/diagrams/mindmap/index.ts#drawFragment` drop the gradient instead (root gets `background:#FFFFFF`); not probed for those engines.
- **Impact**: salt/mindmap with a gradient root/document background diverge by one root attribute.
- **Confidence**: High (wbs); Medium (salt/mindmap reach)

## Observation: refusal-coverage misreads a short-source jar error page as "rendered"
- **Context**: `refusal-coverage.test.ts` red on `wbs/tojixi-05-lusu056`, `wbs/zecavo-98-kini554` once the wbs plugin errors there (D8 requires it).
- **Finding**: `isJarErrorPage(readHead(...))` scans `HEAD_BYTES = 4096` (refusal-coverage.test.ts:142, :301); for a 2-line source `PSystemError` prepends the welcome block and the `PlantUML version` banner sits at byte 5363, so the jar error page (stock record `oracle/goldens/stock-error-pages.json:447,459`, "only accepts one root", line 3) is classified `jarRendered: true`.
- **Impact**: any short-source jar error row reads as a refusal defect; the baseline rows need the orchestrator's re-pin (or the window widened).
- **Confidence**: High

## Observation: the abel-to-UText FontConfiguration bridge drops the hyperlink fields
- **Context**: `wbs/facibu-72-dako171`, `wbs/keloxe-59-zalu422` (`wbsDiagram { hyperlinkColor Red; hyperlinkUnderlineThickness 0|2 }`).
- **Finding**: `Style#getFontConfiguration` builds `hyperlinkColor`/`hyperlinkUnderlineStroke` (Style.java:265-267; port `abel/FontConfiguration.ts:43-44`), but `klimt/font/FontConfigurationBridge.ts:36-50` never copies them onto the UText configuration whose `hyperlinkColor?`/`hyperlinkUnderlineStroke?` `CommandCreoleUrl.ts:129-140` reads, so links stay `#0000FF` + underline. Thickness 0 also needs `DriverTextSvg.java:134-135`'s `getUnderlineStroke().getThickness() > 0`, which `driver-text-svg.ts:30-35` assumes true.
- **Confidence**: High

## Observation: oracle-render.sh resolves a relative out-dir against the input and stops at the first error
- **Context**: rendering a batch of probes.
- **Finding**: with a relative `<out-dir>`, the jar wrote into `<input dir>/<out-dir>` (nested `tests/fixtures/wbs/tests/fixtures/wbs/`); one erroring source exits 1 and the remaining files in the same call are not rendered. Pass an absolute out-dir and one file per call.
- **Confidence**: High
