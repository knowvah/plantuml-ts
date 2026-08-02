# Component Maps

Per-repo internal structure. plantuml-ts is shown in full; graphviz-ts
(the consumed layout engine) is shown at module granularity; the Java
upstream is summarized (reference-only, not built here).

## plantuml-ts

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Entry — src/index.ts" {
  [render / renderSync / renderAll] as R
}

package "Core — src/core/" {
  [preprocessor.ts] as PRE
  [block-extractor.ts] as BLK
  [dispatcher.ts (registry)] as DISP
  [theme.ts · themes-builtin.ts] as THEME
  [skinparam.ts · style-map-theme.ts] as SKIN
  [measurer.ts · measurer-width-table.data.ts] as MEAS
  [creole.ts (markup)] as CREOLE
  [descriptive-keywords.ts] as DESCKW
  [graph-layout.ts (+ .types)] as GL
  [svek-dot-emit.ts] as SVEK
  [svg.ts · svg-sanitize.ts] as SVG
  [latex.ts (KaTeX)] as LATEX
  [include-resolver.ts (+ -node)] as INC
  [core/common/*] as COMMON
}

package "Diagram plugins — src/diagrams/*" {
  [sequence] as SEQ
  [class] as CLS
  [state] as STA
  [description] as DESC
  [activity] as ACT
  [object] as OBJ
  [json] as JSON
  [yaml] as YAML
  [hcl] as HCL
  [dot] as DOT
  [board · chronology · files ·\npacketdiag · chart] as MISC
}

[diag] as diag
[graphviz-ts engines] as EXT

R --> PRE
PRE --> BLK
BLK --> DISP
R --> THEME
THEME --> SKIN
R --> INC
DISP --> diag
diag --> MEAS
diag --> CREOLE
diag --> SVG
diag --> LATEX
CLS --> GL
STA --> GL
DESC --> GL
ACT --> GL
JSON --> GL
OBJ --> GL
DOT --> GL
GL --> SVEK
DESC --> DESCKW
GL ==> EXT : graphviz-ts
DOT ==> EXT : parse()
@enduml
```

**Plugin contract** (`dispatcher.ts`): every plugin implements
`accepts(lines) → boolean`, `parse(source) → AST`,
`layoutSync(ast, theme, measurer) → Geo`, and `render(geo, theme) →
string`. All 15 current plugins expose `layoutSync` (so all are
`renderSync`-capable); the interface also permits async `layout` for a
future WASM/worker engine. Each plugin directory typically contains
`index.ts` (the plugin object), `parser.ts`/`ast.ts`, `layout.ts`, and
`renderer.ts`.

**Layout split:**
- *Own layout* — `sequence` (lifelines/messages), and the data-shape
  diagrams (`json`, `yaml`, `hcl`, `board`, `packetdiag`, `chart`,
  `files`, `chronology`) which compute geometry directly.
- *graphviz-ts layout* — graph-topology diagrams (`class`, `state`,
  `description`/deployment, `activity`, `object`, `dot`) route through
  `graph-layout.ts`.

## graphviz-ts

Faithful port of Graphviz 2.38's C modules, consumed by plantuml-ts.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Public — src/index.ts, src/api" {
  [renderSvg / tryRenderSvg] as RS
  [parse (DOT)] as PARSE
  [GvcContext] as CTX
}

package "Front end" {
  [parser/ (Peggy DOT grammar)] as PARSER
  [model/ (Graph/Node/Edge)] as MODEL
  [api/builder (GvGraphBuilder)] as BUILDER
}

package "Layout — src/layout (dotgen)" {
  [rank (network simplex)] as RANK
  [mincross (crossing min)] as MINCROSS
  [position (x/y coords)] as POS
  [splines / edge routing] as SPLINE
}

package "Support modules" {
  [cdt/ (splay, hash)] as CDT
  [rbtree/] as RB
  [vpsc/ · ortho/ · pathplan/] as VPSC
  [label/] as LABEL
  [common/ (arrows, color,\nhtmltable, textmeasure)] as COMMON
}

package "Back end" {
  [gvc/ (context, device, usershape)] as GVC
  [render/ · xdot/] as RENDER
}

[layout] as layout
[support] as support
[back] as back

RS --> PARSER
PARSER --> MODEL
MODEL --> layout
CTX --> GVC
BUILDER --> MODEL
layout --> RANK
RANK --> MINCROSS
MINCROSS --> POS
POS --> SPLINE
layout --> support
layout --> back
back --> RENDER
RENDER --> RS : SVG string
@enduml
```

Notable: **zero runtime dependencies**; text measurement is injectable
(`setTextMeasurer`) so it stays DOM-free, which is exactly how
plantuml-ts drives it (it injects its own deterministic measurer). The
DOT parser is generated from a Peggy grammar (`src/parser/dot.pegjs`).

## plantuml (upstream Java) — reference only

Not built in this workspace. Relevant packages under
`net.sourceforge.plantuml/` used as the porting spec:

- `sequencediagram/`, `classdiagram/`, `descdiagram/`,
  `componentdiagram/`, `activitydiagram3/` — parser + AST semantics.
- `command/` — the `Command*` classes that define per-keyword parsing.
- `klimt/` / `skin/` — rendering + skin parameter resolution.
- an embedded **Smetana** (Java transpile of Graphviz 2.38 C) — the
  same algorithm graphviz-ts ports, kept as a cross-check.

~3,656 `.java` files; treated as authoritative for both behavior and
engine/parser boundaries.
