# Data Flows

Four flows: the synchronous library render (the hot path every host uses),
the asynchronous render that adds includes, stdlib, remote images and ELK,
the plantuml-plugins build-time path (the most common real-world caller),
and the oracle loop that defines "correct" for this project. File:line
references are to `main` at `d0d37ec18`.

## 1. `renderSync(source)` — the synchronous pipeline

```plantuml
@startuml
title renderSync — one @startuml block, class diagram, dot-engine layout
autonumber
participant "Host" as H
participant "index.ts\nrenderSync → renderPagesSync" as IDX
participant "BlockUmlBuilder\n+ preprocessor/TIM" as BUB
participant "block-extractor" as BX
participant "DiagramRegistry\n(dispatcher.ts)" as REG
participant "classPlugin\n(diagrams/class)" as PL
participant "graph-layout.ts" as GL
participant "@knowvah/dot-engine" as DOT
participant "assemble-svg\n+ annotations" as ASM

H -> IDX : renderSync(source, options)
IDX -> IDX : guard: "!include" without includeStore → error SVG
IDX -> BUB : buildBlockUmls(source)
BUB -> BUB : rawBlocksOf → per block preprocessLinesOrError\n(TIM: !define/!if/!include via IncludeStore)
BUB -> BX : finalizeBlock(lines)
BX --> IDX : BlockUml {type, UmlSource} (or preprocessor error)
IDX -> IDX : prepareBlock: inlineRemoteImageLines(assetStore), skinCutOf
IDX -> REG : resolve(source, options, cut)
loop plugins in PSystemBuilder order
  REG -> PL : parse(source)
  PL --> REG : AST | DiagramRefusal
end
REG --> IDX : Resolution {plugin, ast}
IDX -> IDX : buildTheme(ast, options) · resolveMeasurer(options, plugin)
IDX -> PL : layoutSync(ast, theme, measurer, layoutServicesSync)
PL -> GL : layoutGraph(nodes, edges, clusters, …)
GL -> DOT : createGraph({directed}) + attributes mirroring svek
GL -> DOT : render(graph, 'svg', {engine})
GL -> DOT : getLayout(graph, {yAxis})
DOT --> GL : LayoutSnapshot (nodes, edges, clusters, bounds)
GL --> PL : svek-shaped geometry (splines, label boxes)
PL --> IDX : ClassGeometry
IDX -> PL : render(geo, theme, measurer)
PL --> IDX : RenderFragment (body SVG + size)
IDX -> ASM : applyAnnotationChrome(fragment)\n(title, legend, header/footer, caption)
ASM -> ASM : assembleSvg(chromed, seedOfUmlSource)\n→ root <svg>, <defs>, deterministic ids
ASM --> IDX : SVG string
IDX --> H : SVG string (never throws; failures → errorSvg)
@enduml
```

Notes:
- The split into blocks happens **before** preprocessing
  (`BlockUmlBuilder.ts:133`), mirroring upstream `BlockUmlBuilder`; this is
  why a `!define` in one block cannot leak into the next.
- `resolveMeasurer` (`core/render-options.ts`) picks `jarMeasurer` for
  description diagrams and the Formula/Canvas fallback otherwise; tests and
  the oracle harness inject `DeterministicMeasurer`, which is why every
  text-derived number in a golden measures the port rather than a font.
- Sequence differs only inside the plugin: `getNbPages`/`renderPage`
  (`diagrams/sequence/index.ts:70-74`) yield one fragment per `newpage`,
  and `renderPagesSync` returns one SVG per page.
- Any exception at any step is caught at `index.ts:384` and turned into the
  jar-identical error page via `core/error/error-diagrams.ts`.

## 2. `render(source)` — async: includes, stdlib, remote images, ELK

```plantuml
@startuml
title render / renderAll — the async additions around the same core
autonumber
participant "Host" as H
participant "index.ts\nrender → renderBlockPages" as IDX
participant "include-resolver\nprepareIncludeStore" as INC
participant "SecurityProfile\n+ fetcher (injected)" as SEC
participant "StdlibRegistry\n(BundleData chunks)" as STD
participant "remote-image-prefetch\n+ imageProvider (injected)" as IMG
participant "elk/layout-services\nloadElk" as ELK
participant "elkjs 0.12.0" as ELKJS
participant "descriptionPlugin" as PL

H -> IDX : await render(source, {fetcher, stdlibRegistry,\nimageProvider, securityProfile})
IDX -> INC : prepareIncludeStore(source, options)
INC -> INC : scan !include / !includeurl / <stdlib> paths
alt stdlib path (e.g. <C4/C4_Container>)
  INC -> STD : load chunk lazily
  STD --> INC : lines (or StdlibNotBundledError)
else URL
  INC -> SEC : check(url) per profile (LEGACY / INTERNET / ALLOWLIST…)
  SEC -> SEC : fetcher(url) with timeout
  SEC --> INC : text | CspIncludeError / CorsIncludeError
end
INC --> IDX : IncludeStore (sync-readable)
IDX -> IMG : withRemoteImages(lines, options)
IMG -> IMG : imageProvider.fetch(url) → data URI
IMG --> IDX : lines with inlined <img>
IDX -> IDX : buildBlockUmls → prepareBlock → resolve → AST\n(identical to renderSync, now with includes satisfied)
IDX -> ELK : layoutServices(plugin, ast, options)
alt plugin.requiresElk(ast)  («!pragma layout elk»)
  ELK -> ELK : loadElk() — dynamic import('elkjs/lib/elk-worker.min.js')
  ELK --> IDX : {elk: ElkBackend}
else
  ELK --> IDX : {} (no ELK loaded)
end
IDX -> PL : layoutSync(ast, theme, measurer, services)
PL -> ELKJS : elk.layout(graph with pinned option ids)
ELKJS --> PL : ELK JSON geometry
PL --> IDX : geometry
IDX -> IDX : render → chrome → assembleSvg (as in flow 1)
IDX --> H : SVG string(s)
@enduml
```

Notes:
- `renderSync` cannot fetch: with an unsatisfied `!include` it returns an
  error SVG (`index.ts:360-366`); hosts pre-fill an `includeStore`
  (`prepareIncludeStore` is exported for exactly this).
- `renderAll` isolates includes per `@startuml` block
  (`index.ts:446-470`); `renderPages` keeps them shared.
- ELK in the sync path requires the host to pass `options.elk` (an
  already-loaded `ElkBackend`); otherwise `layoutServicesSync` throws
  `ELK_RENDER_SYNC_UNSUPPORTED`.

## 3. plantuml-plugins — build-time fence render (VitePress / Eleventy)

```plantuml
@startuml
title Static-site build — markdown-it fence to inline SVG
autonumber
participant "VitePress / Eleventy\nbuild" as SSG
participant "markdown-it\n@knowvah/plantuml-markdown-it" as MDI
participant "core/render.ts\n(@knowvah/plantuml-core)" as CORE
participant "child process\n(renderInChild, optional)" as CHILD
participant "@knowvah/plantuml-ts\nrenderAll" as PTS
participant "@knowvah/plantuml-stdlib\n(eager bundles)" as STD
participant "filesystem\n(fetcher by basePath)" as FS

SSG -> MDI : preloadPlantUml(markdownSources)
MDI -> MDI : find ```plantuml | puml | uml fences
loop each fence
  MDI -> CORE : renderPlantUmlHtml(source, {theme, basePath, timeout})
  CORE -> CORE : ensureStartDirective · include pre-flight
  alt timeout set
    CORE -> CHILD : spawn, import PU_ENGINE
    CHILD -> PTS : renderAll(source, {theme, stdlibRegistry, fetcher})
  else in-process
    CORE -> PTS : renderAll(source, {theme, stdlibRegistry, fetcher})
  end
  PTS -> STD : chunk for <C4/…>, <archimate/…> …
  PTS -> FS : fetcher(relative !include)
  PTS --> CORE : SVG per @startuml block
  CORE -> CORE : svgProblem() · toInlineSvg() · wrap <div class=wrapper>
  CORE --> MDI : HTML (or error panel / throw per onError)
  MDI -> MDI : cache[source] = html
end
SSG -> MDI : render(markdown)  — synchronous
MDI -> MDI : fence rule reads cache; miss → client component
MDI --> SSG : HTML with inline SVG, zero client JS
@enduml
```

Notes:
- The two-phase shape (async preload, sync emit) exists because
  markdown-it's fence rule is synchronous while stdlib chunks load lazily.
- The browser path (`core/browser.ts` → `renderSync`) used by React, the
  web component, the VS Code `.puml` preview and JetBrains has **no**
  stdlib registry; unresolved `!include` becomes an error panel. The VS
  Code preview runs it in a `worker_threads` worker so the configured
  timeout can kill a runaway render.

## 4. The oracle loop — how fidelity is established

```plantuml
@startuml
title Oracle loop — a fixture from corpus to pinned golden
autonumber
participant "Developer / agent" as DEV
participant "scripts/oracle-render.sh" as ORS
participant "patched upstream jar\n(oracle/dist, -DPLANTUML_DETERMINISTIC_TEXT)" as JAR
participant "real `dot`\n(graphviz 16.1)" as GV
participant "tests/oracle\nsvg-conformance ratchets" as TO
participant "plantuml-ts\nrenderSync + DeterministicMeasurer" as PTS
participant "svg:survey /\nparity:dashboard" as SURVEY
participant "docs-site parity page" as DOCS

DEV -> ORS : oracle-render.sh <out> fixture.puml
ORS -> JAR : java -jar … -tsvg (deterministic text)
JAR -> GV : dot -Tsvg (upstream shells out)
GV --> JAR : laid-out SVG
JAR --> ORS : fixture.svg + svek-N.dot (patched emit)
ORS --> DEV : goldens under tests/oracle/…
DEV -> TO : vitest run tests/oracle
TO -> PTS : renderSync(fixture, {measurer: Deterministic})
PTS --> TO : our SVG (+ captured DOT via setLayoutInputObserver)
TO -> GV : dot -Tdot svek-N.dot (blame: dot-engine vs our DOT)
TO -> TO : compareSvg(ours, golden) → weightedScore;\nDOT parity; pinned baseline ratchet
TO --> DEV : pass | rise (diff attribute + fixture, never why)
DEV -> DEV : open the Java method; port; re-run
DEV -> SURVEY : npm run svg:survey -- <type> --out …
SURVEY --> DOCS : parity-<type>.json → published counts
@enduml
```

Notes:
- `scripts/oracle-render.sh` exists because a hand-typed `java -jar`
  without `-DPLANTUML_DETERMINISTIC_TEXT=true` measures the JVM font stack,
  not the port (`CLAUDE.md`).
- The ratchet's score is anti-monotone under element growth and blind to
  magnitude (see the project memory notes); a correct fix can raise it,
  so exit bars are written as "zero *unexplained* rises".
- Where upstream uses Smetana (json/yaml/hcl), no `svek-N.dot` exists and
  the DOT-parity branch is skipped by design.
