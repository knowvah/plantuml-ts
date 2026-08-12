# System Architecture

High-level architecture of plantuml-ts and its coupling to dot-engine
and the upstream reference. Communication is **in-process, synchronous
function calls** unless labeled otherwise — there are no network hops,
services, or databases in the runtime path.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Consumer (browser or Node)" {
  [Application code] as APP
}

package "plantuml-ts (this repo)" {
  [src/index.ts\nrender / renderSync / renderAll] as API
}

package "src/core/" {
  [preprocessor.ts\n!define / !ifdef / macros] as PRE
  [include-resolver.ts\n!include (async only)] as INC
  [block-extractor.ts\nsplit @start…@end + type detect] as BLK
  [theme.ts / skinparam.ts\nstyle-map-theme.ts] as THEME
  [dispatcher.ts\nplugin registry + accepts()] as DISP
  [measurer.ts\ndeterministic text width LUT] as MEAS
  [graph-layout.ts\ndot-engine adapter seam] as GL
  [svg.ts / svg-sanitize.ts\nSVG assembly + defs] as SVG
  [latex.ts → KaTeX] as LATEX
}

package "src/diagrams/* (15 plugins)" {
  [sequence] as SEQ
  [class] as CLS
  [state] as STA
  [description / deployment] as DESC
  [activity] as ACT
  [dot] as DOTP
  [object · json · yaml · hcl ·\nboard · chronology · files ·\npacketdiag · chart] as OTHER
}

package "Dependencies" {
  [dot-engine\n(pinned .tgz)\nDOT layout engines] as GVTS
  [katex 0.16] as KATEX
  [jsonc-parser] as JSONC
}

package "Upstream references (not shipped, not in-process)" {
  [plantuml (Java)\nparser/AST + render spec] as PUML
  [graphviz (C)\nalgorithm spec] as GVC
  [pdiff corpus\n5600 .puml fixtures] as PDIFF
}

[plugins] as plugins
[plantumlts] as plantumlts
[deps] as deps

APP --> API : render(source)
API --> PRE
PRE --> BLK
BLK --> DISP
PRE ..> INC : async path
API --> THEME
DISP --> plugins : resolve → parse → layoutSync → render
plugins --> MEAS
SEQ --> SVG : own layout
CLS --> GL
STA --> GL
DESC --> GL
ACT --> GL
DOTP --> GL
GL --> GVTS : serialize DOT graph\n+ read geometry snapshot
LATEX --> KATEX
DOTP ..> GVTS : parse DOT
plugins --> SVG
SVG --> API : SVG string
PUML ..> plugins : ports behavior/AST
GVC ..> GVTS : ports algorithms
PDIFF ..> plantumlts : work queue / test corpus
KATEX ..> deps : runtime
JSONC ..> OTHER : parses JSON/YAML diagrams
@enduml
```

## Communication model

| Edge | Kind | Protocol / mechanism |
|------|------|----------------------|
| Consumer → `render`/`renderSync` | sync (async wrapper for includes) | direct function call |
| core → diagram plugins | sync | `DiagramPlugin` interface (`accepts`/`parse`/`layoutSync`/`render`) |
| graph plugins → dot-engine | sync | `graph-layout.ts` serializes a `DotInputGraph` into a dot-engine builder, runs an engine, reads back a `LayoutSnapshot` |
| dot plugin → dot-engine | sync | `parse()` (Peggy DOT grammar) |
| latex → KaTeX | sync | `renderToString` |
| async path → `IncludeFetcher` | **async** | injected `fetch`-like callback (CSP/CORS aware); only reachable via `render`, never `renderSync` |

## Architectural invariants

- **No DOM, no canvas, no async in the core transform.** Text width is
  resolved by a deterministic lookup table (`measurer.ts`), which is why
  layout is reproducible and server-safe. dot-engine is consumed
  through the same DOM-free contract.
- **Single layout seam.** All graph-topology diagrams reach dot-engine
  through exactly one adapter (`graph-layout.ts`); no plugin talks to
  the engine directly except the `dot` plugin's parser.
- **Plugin dispatch is order-sensitive.** The registry tries `accepts()`
  most-specific-first (object → class → state → description → activity →
  sequence); a graceful error-SVG sentinel handles no-match.
- **`CONTAINER_KINDS` is mirrored** in `layout.ts` and `renderer.ts` and
  must stay in sync; childless containers are treated as leaf nodes.
- **Upstream architecture is authoritative.** Engine/parser boundaries
  mirror upstream PlantUML; structural divergence is treated as a bug to
  re-mirror, not patch around.
