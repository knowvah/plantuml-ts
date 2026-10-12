# sep-T4a: salt plugin and wiring

## Observation: the export margin is the style's `Margin` before `getDefaultMargins()`
- **Context**: `salt/ributi-22-dogi775` (`<style> root { Margin 10 }`) measured Δ5/Δ10 everywhere with `same(5)`.
- **Finding**: `TextBlockExporter.Builder#styled` → `calculateMargin` (`core/TextBlockExporter.java:510-516`) takes the merged `{root, document}` style's `Margin` when it has one; `getDefaultMargins()` is only the fallback. The salt plugin reads it from the real style builder (`buildMindmapStyleBuilder`); ributi went to 0 diffs. The mindmap plugin (`src/diagrams/mindmap/index.ts`) still calls `diagram.getDefaultMargins()` directly; not measured for mindmap.
- **Impact**: any `TitledDiagram` export that hard-codes its default margin diverges on a `root`/`document` `Margin` style.
- **Confidence**: High (salt); Low (whether a mindmap row exercises it)

## Observation: SALT chrome needs a margin the shared chrome step does not know
- **Context**: `mejeki-64-buvo994` (title/caption/legend/header/footer), `vuxibo-96-tago783` (caption), probe `tests/fixtures/salt/{common-commands,mainframe}.puml`.
- **Finding**: `core/annotations/chrome-export.ts#applyExportedChrome` re-applies a fragment's margin only for the diagram types in `core/document-margin.ts#DOCUMENT_MARGIN_BY_DIAGRAM_TYPE`; `assemble-svg.ts#finalizeShellFragment` runs `finalizeTitledDiagramFragment` (margin `TITLED_DIAGRAM_MARGIN = 10`, scale) for `MINDMAP` only. A temporary `SALT: same(5)` table entry took mejeki and vuxibo to 0 diffs (reverted: outside T4a's write-set). Chrome + `scale` (probe common-commands) stays wrong even then: the class/sequence margin path never scales.
- **Impact**: the 2 chrome rows (Δ5 positions, Δ11 canvas) and any salt `mainframe`/`scale`+title close only with a core change in `document-margin.ts` (no scale) or `assemble-svg.ts` + `TextBlockExporter.ts` (mindmap path, with scale).
- **Confidence**: High

## Observation: `@startuml` + `salt` never reaches the salt factory
- **Context**: `CommandAnything.java:70` (`salt` as the first data line ⇒ "This is not needed anymore.").
- **Finding**: `DiagramType.java:198-200` gives `@startuml` ten candidate types, none SALT, so the error is reachable only as `@startsalt` + `salt` (probe `tests/fixtures/salt/salt-first-line.svg`: jar error page, line 2, "(Assumed diagram type: salt)").
- **Impact**: briefs that say "a first line `salt` inside `@startuml`" describe a path the jar does not have.
- **Confidence**: High

## Observation: empty salt data is IndexOutOfBounds, not the IAE
- **Context**: `PSystemSalt#createElement` on no data lines.
- **Finding**: `ElementFactoryPyramid#ready` (java:96) peeks token 0 of an empty `DataSourceImpl` (`data.get(i + nb)`, java:116-118) before any factory can decline, so the `IllegalArgumentException` (java:215) needs at least one token.
- **Confidence**: High

## Observation: dark mode cannot reach element colours through klimt
- **Context**: probe `tests/fixtures/salt/skinparam-mode-dark.puml`.
- **Finding**: the port's `UGraphic` carries no `ColorMapper` and `Fore`/`Back` take `Paint` strings, so `HColorSimple#withDark` partners (`AbstractElement#getBlack` = BLACK.withDark(WHITE)) are lost at `asPaint()`. The background keeps its partner only because the plugin maps the `HColor` itself (`ColorMapper.DARK_MODE.fromColorSimple`), not `mapPaint` of its string (which re-creates the colour without a partner). 7 drawn-colour diffs remain.
- **Impact**: `skinparam mode dark` element colours need a klimt ColorMapper seam (stop 10), not a salt fix.
- **Confidence**: High

## Observation: a whole-fragment hex mapper double-maps a painted background
- **Context**: probe `reversecolor-dark` (jar bg #010101 rect + root style).
- **Finding**: `SvgGraphics` paints a non-white background as the first `<rect>`; running `fragment-color-mapper.ts#applyColorMapperToFragment` over the body maps that already-mapped rect again (#010101 → #FEFEFE). The salt plugin draws without the background, maps, then prepends an empty klimt document's background paint.
- **Impact**: class/activity use the same post-process; a monochrome-reverse or reversecolor diagram with a coloured background there would double-map.
- **Confidence**: High (salt); Medium (class/activity reach)

## Observation: creole `<space:N>` is unported
- **Context**: `salt/neguge-98-cilu043`, the one salt row still diverged.
- **Finding**: `CommandCreoleSpace` (`klimt/creole/command/CommandCreoleSpace.java`, registered `CommandCreoleBuilder.java:115`) has no port in `src/core/klimt/creole/legacy/CommandCreoleBuilder.ts`, so `<space:20>` draws as literal text (4 extra texts, widths +42.75 per cell). Only cached row with `<space:` in the whole corpus.
- **Impact**: a klimt/creole gap (stop 10), not salt.
- **Confidence**: High

## Observation: whole-corpus render hashes in about 2 minutes
- **Context**: acceptance "non-salt bytes unchanged".
- **Finding**: driving `scripts/svg-parity-workers.ts#runPersistentPool` with the survey's `--render-many` worker over all 4903 `test-results/dot-cache/*/*` dirs and sha256-ing each SVG took ~2 min at concurrency 4. Before/after maps: `plans/salt-engine-port/measurements/T4a/hash-{before,after}.json`. Edit no `src` file the workers import while it runs (a respawned worker loads the new code).
- **Confidence**: High
