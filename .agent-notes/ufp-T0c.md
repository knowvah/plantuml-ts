# ufp-T0c — core bases + single-line plugin helper

## Observation: GraphicStrings now exists twice
- **Context**: porting `PlainStringsDiagram#getTextBlock` (= `GraphicStrings.createBlackOnWhite(strings, image, imagePosition)`, PlainStringsDiagram.java:59-62); stop 10 raised, then the orchestrator extended the write-set (push-forward).
- **Finding**: `src/core/klimt/shape/GraphicStrings.ts` is the klimt port (with `klimt/sprite/SpriteContainerEmpty.ts` and `klimt/geom/GraphicPosition.ts`, which it needs). `src/core/error/graphic-strings.ts#blackOnWhite` is the older `ErrorBlock` (string-sink) model the error/Welcome pages still use; it was left untouched (no refactor while porting).
- **Impact**: the Welcome page is now drawable both ways. Through `PlainStringsDiagram` it is byte-identical to the jar (`<?plantuml-src?>` aside). The error-page path still renders it with the error measurer: 533px vs the jar's 532px. That makes it a candidate for a later consolidation.
- **Confidence**: High

## Observation: the license page needs a `<qrcode:...>` creole atom
- **Context**: pinning `GraphicStrings` against the jar `license` probe.
- **Finding**: `License.java:145-146` adds `\t<qrcode:https://plantuml.com/patreon>\t\t<qrcode:...lp>\t\t<qrcode:...paypal>`, drawn as three 99x99 `<image>`s. The port has no qrcode atom. Without that line the other 61 texts match the jar's x/y/textLength exactly, with every y after the qrcode line 99px higher than the jar's. The jar canvas height is 834 = (int)(61*12 + 10 + 91 + 1): the qrcode line MEASURES 91 but the following text is drawn 99 lower. The cause of that 8px difference was not investigated.
- **Impact**: T1f (license) needs the qrcode atom ported.
- **Confidence**: High (measured)

## Observation: SpriteContainerEmpty has no internal-sprite channel from GraphicStrings
- **Context**: porting `GraphicStrings#getTextBlock` (`new SpriteContainerEmpty()`, java:150).
- **Finding**: `SpriteContainerEmpty#getSprite` is `SpriteImage.fromInternal`; the port takes an optional `InternalSpriteStore`, but `GraphicStrings` constructs it with none (upstream has no parameter there).
- **Impact**: `<$archimate/...>` inside GraphicStrings lines (the archimate listing, T1d) resolves to nothing until a store is threaded through.
- **Confidence**: High

## Observation: a diagramType-less RenderFragment does not get the jar's root
- **Context**: choosing what a non-titled `UgDiagram` export returns.
- **Finding**: `core/assemble-svg.ts#assembleDocument` routes a fragment with no `diagramType` through `svg.ts#svgRoot` (no `style`, arrow-marker `<defs>`, background `<rect>`), not `document-shell.ts#assembleDocumentShell`. The jar's non-titled pages (license, welcome) carry the shell root with NO `data-diagram-type`.
- **Impact**: non-titled `UgDiagram`s return `CompleteSvg` (the klimt document from `UgDiagram#exportDiagram`), as the description engine's annotation-free path does.
- **Confidence**: High

## Observation: upstream's null from createSystem never owns the error page
- **Context**: `PSystemSingleLineFactory.createSystem` returns `null` for a source that is not exactly 3 lines (java:75-76).
- **Finding**: `PSystemBuilder` adds the `null` to its error list and `PSystemErrorUtils#merge` skips it (`if (system == null) continue;`, PSystemErrorUtils.java:120-121). The port's registry only merges `ParseRefusal`s; a score-0 refusal from a plugin registered before `sequencePlugin` (PSystemColorsFactory, D2) would win ties against sequence's score-0 refusals. The helper's gate refusal carries `commandScore: -Infinity`.
- **Impact**: the same mapping question applies to every existing `'incomplete'` refusal (upstream `null`, `sys.isIncomplete()`), which the port scores 0 — not investigated here.
- **Confidence**: High

## Observation: refusal `consumed` scales differ between engines
- **Context**: probing `@startuml\nfoo\n@enduml` through each registered plugin's `parse`.
- **Finding**: sequence refuses with `line 0, consumed 0` (interior index, `sequence/parser.ts:266`); class with `line 1, consumed 1` (document index); dot uses the document index too. Upstream both are `trace.size() == 2` (score 20) and the first registered wins.
- **Impact**: merge order among `@startuml` candidates can differ from upstream where sequence and another engine tie upstream. The single-line helper uses the document scale (`trace.size() - 1`).
- **Confidence**: High (measured; error-page consequences not surveyed)

## Observation: the single line reaches executeLine untrimmed
- **Context**: T0c acceptance says "executeLine receives the trimmed line".
- **Finding**: Java passes `s.getString()` (PSystemSingleLineFactory.java:95). Jar probes: `   license`, `\tcharlie`, `charlie  ` are `Syntax Error?` pages; `license   ` renders (its own `\s*$` pattern). The port's `seedSourceLines` keep the whitespace too.
- **Impact**: each batch-1 factory must apply its own upstream pattern to the raw line.
- **Confidence**: High

## Observation: SvgGraphics' canvas never drops below 10x10
- **Context**: UgDiagram export tests with a 10x10 block.
- **Finding**: the canvas seeds `maxX = maxY = 10` and `ensureVisible` only grows past it, so a 10x10 block exports at 10px (not `(int)(10 + 1)`), while 20x20 exports at 21px.
- **Impact**: pick test sizes above 10 when asserting the `+1` truncation.
- **Confidence**: High

## Observation: removeInitialNoise / documentLineOf now exist twice
- **Context**: the gate needs `UmlSource#removeInitialNoise` and a document-line mapping.
- **Finding**: `diagrams/dot/parser.ts` holds private copies; core cannot import from a diagram (layering rule 1), so `core/command/PSystemSingleLineFactory.ts` carries its own.
- **Impact**: a later task can move both to a core `UmlSource` module and have dot import it.
- **Confidence**: High
