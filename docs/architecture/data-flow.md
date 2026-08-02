# Data Flows

Sequence diagrams for the most important flows, derived from
`src/index.ts` and `src/core/`. All steps are in-process synchronous
calls except where an `async`/`await` boundary is drawn explicitly.

## 1. `renderSync` of a graph-topology diagram (the graphviz-ts seam)

The critical path: a class/state/description/dot diagram that borrows
graphviz-ts for layout. This is the flow where most accumulated fidelity
lives.

```plantuml
@startuml
autonumber
participant "Consumer" as App
participant "index.ts renderSync" as API
participant "preprocessor" as Pre
participant "block-extractor" as Blk
participant "dispatcher registry" as Reg
participant "diagram plugin (e.g. class)" as Plg
participant "graph-layout.ts" as GL
participant "graphviz-ts" as GV
participant "plugin.render + svg.ts" as Ren
App -> API : renderSync(source, options)
API -> API : reject if source has !include
API -> Pre : preprocess(source)
Pre --> API : {lines, theme hint}
API -> API : buildTheme() + getDefaultMeasurer()
API -> Blk : extractBlocks(lines)
Blk --> API : UmlSource (type detected)
API -> Reg : resolve(block)
Reg -> Plg : accepts(lines) most-specific-first
Reg --> API : matched plugin
API -> Plg : parse(source) → AST
API -> Plg : layoutSync(ast, theme, measurer)
Plg -> GL : layout DotInputGraph
GL -> GL : serialize nodes/edges/clusters,\nmeasure labels via LUT
GL -> GV : renderSvg / run engine
GV --> GL : LayoutSnapshot (coords, splines)
GL -> GL : map centres→top-left, shift to origin,\ncompute canvas size
GL --> Plg : positioned geometry
Plg --> API : Geo
API -> Ren : render(geo, theme)
Ren --> API : SVG string (with arrowhead defs)
API --> App : svg…/svg
note over API,App : any throw → errorSvg(message) is returned, never propagated
@enduml
```

## 2. `render` (async) with `!include` resolution

The only flow that touches the outside world. `renderSync` explicitly
rejects `!include`; the async `render` resolves includes first, then
runs the identical pipeline. A plugin without `layoutSync` (a future
WASM/worker engine) is `await`ed here.

```plantuml
@startuml
' NOTE: mermaid grouping flattened -- alt/opt/loop/group render the whole
' diagram EMPTY in plantuml-ts today (.agent-notes/plantuml-sequence-group-empty.md).
' Original nesting: loop each !include URL ; alt CSP connect-src violation ; else CORS failure ; else ok ; alt plugin has layoutSync ; else async plugin
autonumber
participant "Consumer" as App
participant "index.ts render (async)" as API
participant "include-resolver" as Inc
participant "injected IncludeFetcher" as Fetch
participant "preprocess → extract → dispatch → parse" as Pipe
participant "diagram plugin" as Plg
App -> API : await render(source, {fetcher})
API -> Inc : await resolveIncludes(source, fetcher)
Inc -> Fetch : fetch(url)
note over Inc : LOOP: each !include URL
Fetch --> Inc : throw CspIncludeError
note over Fetch : ALT: CSP connect-src violation
Fetch --> Inc : throw CorsIncludeError
note over Fetch : ELSE: CORS failure
Fetch --> Inc : included text
note over Fetch : ELSE: ok
Inc --> API : fully-resolved source
API -> Pipe : same pipeline as renderSync
Pipe -> Plg : parse → layout
API -> Plg : layoutSync(...)
note over API : ALT: plugin has layoutSync
API -> Plg : await layout(...)
note over API : ELSE: async plugin
Plg --> API : Geo
API --> App : PromiseSVG string
note over API,App : errors (including include errors) → errorSvg
@enduml
```

## 3. `renderSync` of a self-laying-out diagram (sequence)

Contrast case: no graphviz-ts. Sequence (and the data-shape diagrams)
compute geometry directly from the AST, so the pipeline is shorter and
never crosses the layout seam.

```plantuml
@startuml
autonumber
participant "Consumer" as App
participant "index.ts renderSync" as API
participant "sequence plugin" as Plg
participant "measurer (width LUT)" as Meas
participant "sequence renderer + svg.ts" as Ren
App -> API : renderSync('@startuml … @enduml')
API -> API : preprocess + buildTheme + extractBlocks
API -> Plg : accepts() → parse(source) → AST\n(participants, messages)
API -> Plg : layoutSync(ast, theme, measurer)
Plg -> Meas : measure participant/message text
Meas --> Plg : deterministic widths
Plg -> Plg : place lifelines, arrows, activations
Plg --> API : geometry
API -> Ren : render(geo, theme)
Ren --> API : SVG string
API --> App : svg…/svg
@enduml
```

## Why these three

- **Flow 1** exercises the single most complex and highest-value seam
  (graphviz-ts integration) and the full plugin contract.
- **Flow 2** is the only async/effectful path and the only place the
  library reaches outside the process — the security-relevant boundary
  (CSP/CORS-aware fetch injection).
- **Flow 3** shows the self-contained layout path, confirming graphviz-ts
  is a per-diagram-type dependency, not a global one.
