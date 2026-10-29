# Components

Per-repo internal structure. Each diagram is capped near 15 nodes; where a
repo has more modules than that, the diagram shows the layers and the
table below it names the modules. For *does a module for X exist* in
plantuml-ts, `docs/catalog.md` (generated, drift-gated) is the authority —
2,032 modules, 7,036 exported names as of this writing.

## plantuml-ts

```plantuml
@startuml
title plantuml-ts — internal pipeline and seams
skinparam componentStyle rectangle

package "src/index.ts" {
  component "renderSync / renderPagesSync\nrender / renderPages / renderAll" as API
}

package "src/core — front" {
  component "BlockUmlBuilder\n(split @start/@end before preprocessing)" as BUB
  component "preprocessor + tim/\n(TIM interpreter, IncludeStore, StdlibStore)" as TIM
  component "block-extractor\n(type the block: keyword or 20-line probe)" as BX
  component "dispatcher\n(DiagramRegistry, PSystemBuilder order)" as DISP
}

package "src/diagrams — 24 plugins" {
  component "graph family\nclass · description · state\njson · yaml · hcl · dot" as GRAPH
  component "own-layout family\nsequence · activity · gantt · mindmap\nwbs · salt · files · board · chart\npacketdiag · chronology · eggs …" as OWN
}

package "src/core — layout seams" {
  component "graph-layout.ts\n(build DOT → dot-engine → read svek/geometry)" as GL
  component "elk/\nElkBackend · layout-services · load-elk" as ELK
}

package "src/core — back" {
  component "build-theme · skin · style\nmeasurer (Formula/WidthTable/Canvas/Jar)" as THEME
  component "annotations/ chrome\n(title, header/footer, legend, caption)" as CHROME
  component "assemble-svg.ts\nTextBlockExporter · svg.ts" as ASM
  component "error/\nerror-diagrams (jar-identical error pages)" as ERR
}

API --> BUB : source
BUB --> TIM : per-block lines
TIM --> BX : preprocessed lines
BX --> DISP : UmlSource + DiagramType
DISP --> GRAPH : parse() first-accept
DISP --> OWN : parse() first-accept
API --> THEME : buildTheme · resolveMeasurer
GRAPH --> GL : layoutSync → layoutGraph()
GRAPH --> ELK : requiresElk(ast)\n(class, description)
OWN --> ASM : layoutSync → render\n(sequence: getNbPages/renderPage)
GL --> ASM : geometry → render
ELK --> ASM : geometry → render
ASM --> CHROME : per-page fragment
CHROME --> API : assembleSvg(fragment, seed)
API --> ERR : any failure →\nerror SVG, never throws
@enduml
```

### Module map

| Area | Modules (representative) | Role |
|------|--------------------------|------|
| Public API | `src/index.ts`, `src/registered-plugins.ts`, `src/image-providers/*` | render functions, option/error types, plugin registration in upstream factory order, network/browser image providers |
| Block stage | `core/BlockUmlBuilder.ts`, `core/preprocessor.ts`, `core/tim/*` (`IncludeStore`, `StdlibStore`, `StdlibRegistry`, `StdlibRemote`), `core/include-resolver*.ts`, `core/security/*` | document → blocks → preprocessed lines; `!include`/stdlib resolution; `SecurityProfile`, `SURL`, URL allowlist |
| Typing + dispatch | `core/block-extractor.ts`, `core/dispatcher.ts`, `core/dispatcher-types.ts` (`SyncPlugin`/`AsyncPlugin`) | diagram type from `@start<type>` or probe; ordered `parse()` attempts, `DiagramRefusal` |
| Theme/style/skin | `core/build-theme.ts`, `core/skin-command.ts`, `core/style/*`, `core/skinparam*`, `core/klimt/*` (sprites, fonts, colours) | upstream `StyleBuilder`/`SkinParam` semantics; klimt = upstream's drawing primitives |
| Text | `core/measurer*.ts` (`FormulaMeasurer`, `WidthTableMeasurer`, `CanvasMeasurer`, `JarMeasurer`, `DeterministicMeasurer`), `core/creole*.ts`, `core/code/*`, `core/abel/*` | string widths (the oracle seam), creole markup → atoms → SVG, `<code>`, `<latex>` via KaTeX |
| Graph layout | `core/graph-layout*.ts` (build-edges/-cluster/-portcluster/-borderpoint/-kermor/-svek-read), `core/dot-splines.ts`, `core/edge-label-box*.ts`, `core/cucadiagram/*`, `core/atmp/*` | port of `CucaDiagram`/`svek`: DOT text in, `svek-N.dot`-shaped geometry out; `Kermor` port clusters |
| ELK | `core/elk/elk-backend.ts`, `elkjs-backend.ts`, `elkjs-options.ts`, `layout-services.ts`, `load-elk.ts` | upstream `CucaDiagramFileMakerElk`; option ids pinned to `knowvah/elk` `.melk` |
| Chrome + assembly | `core/annotations/*`, `core/assemble-svg*.ts`, `core/TextBlockExporter.ts`, `core/svg.ts`, `core/document-margin.ts` | title/legend/header/footer/caption placement, `<defs>` arrowheads, root `<svg>` attributes, deterministic ids from `seedOfUmlSource` |
| Errors | `core/error/*` | jar-identical error pages (`PSystemError`), with our own version string by ruling |
| Plugins | `diagrams/<name>/{index,ast,parser*,layout*,renderer*}.ts` | one directory per upstream factory; see table in [inventory.md](inventory.md) |
| Seams (all injected via `RenderOptions`) | `measurer`, `includeStore`/`fetcher`, `stdlibRegistry`, `assetStore`, `imageProvider`, `securityProfile`, `elk`, internal `clock` | everything non-deterministic or I/O-shaped enters here; `src/` has no Node built-ins |

### Plugin → engine table

| Engine | Plugins | Entry |
|--------|---------|-------|
| dot-engine (real-Graphviz paths; DOT parity gated) | class, description (component/deployment/usecase/object), state | `layoutGraph()` in `core/graph-layout.ts` |
| dot-engine as Smetana replacement (no DOT gate) | json, yaml, hcl | shared `layoutJson()` in `diagrams/json/layout.ts` |
| dot-engine direct | dot (`@startdot`) | `renderSvg(dotContent, 'dot')` in `diagrams/dot/layout.ts` |
| ELK (elkjs) on `!pragma layout elk` | class, description | `layoutClassElk` / `layoutDescriptionElk` |
| own layout | sequence (multi-page via `newpage`), activity (tile layout), gantt, mindmap (Finger), wbs, salt, files, board, chart, packetdiag, chronology, dedication, donors, eggs, emoji, openiconic, version, archimate-sprite list | each plugin's `layoutSync` |

## dot-engine

```plantuml
@startuml
title dot-engine — Graphviz port, one bundle per export subpath
skinparam componentStyle rectangle

component "parser/\npeggy DOT grammar (lib/cgraph/grammar.y)" as PARSER
component "model/\nGraph · Node · Edge · geometry\n(lib/cgraph, types.h)" as MODEL
component "api/  (./api)\ncreateGraph · addEdge · getLayout" as APISUB
component "gvc/\nGvcContext · engine registry · device render" as GVC
component "layout/\ndot · neato · fdp · sfdp · circo\ntwopi · osage · patchwork · pack" as LAYOUT
component "ortho/ · pathplan/ · vpsc/\nlabel/ · xdot/ · cdt/ · rbtree/" as SUPPORT
component "common/\nHTML labels · text measure · arith" as COMMON
component "render/  (./render)\nsvg · dot · xdot · json · plain · imap\ngetDrawOps" as RENDER
component "index.ts  (.)\nrenderSvg · tryRenderSvg · parse\nsetTextMeasurer · setImageResolver" as ROOT

ROOT --> PARSER : DOT text
PARSER --> MODEL : graph
APISUB --> MODEL : programmatic build
MODEL --> GVC : gvLayout(engine)
GVC --> LAYOUT : dispatch by engine name
LAYOUT --> SUPPORT : splines, routing,\noverlap removal, xlabels
LAYOUT --> COMMON : label sizes via\ninjected text measurer
GVC --> RENDER : laid-out graph
RENDER --> ROOT : SVG string
APISUB --> RENDER : getLayout() geometry\nafter render()
@enduml
```

plantuml-ts touches three exports: `createGraph` (`./api`) to build the
graph without emitting DOT text for parsing, `render(g, 'svg', {engine})`
(`./render`) to run layout, and `getLayout(g, {yAxis})` (`./api`) to read
node/edge/cluster geometry in svek's coordinate convention. `@startdot`
uses `renderSvg` from the root bundle. The text measurer is injected once
by `core/dot-engine-measurer.ts` so label sizes match plantuml-ts's own.

## plantuml-plugins

```plantuml
@startuml
title plantuml-plugins — adapters around one core
skinparam componentStyle rectangle

component "@knowvah/plantuml-ts\n(link: ../plantuml-ts)" as PTS
component "@knowvah/plantuml-stdlib\n(link: ../plantuml-ts/packages/stdlib)" as STD

package "packages/core" {
  component "render.ts (Node)\nrenderPlantUmlSvg · renderPlantUmlHtml\nrenderInProcess · renderInChild(timeout)" as NODE
  component "browser.ts\nrenderDiagram(source, {theme, includeStore})" as BROW
  component "element.ts\n<plantuml-diagram>" as WC
}

component "packages/markdown-it\npreloadPlantUml (async cache)\n+ sync fence rule" as MDI
component "packages/eleventy" as ELEV
component "packages/vitepress" as VP
component "packages/docusaurus\n(remark/MDX plugin)" as DOCU
component "packages/react\n<PlantUmlDiagram>" as REACT
component "packages/vscode\nextension · render-service worker\nMarkdown preview" as VSC
component "packages/jetbrains\nesbuild IIFE + Gradle/Kotlin plugin" as JB

NODE --> PTS : renderAll(src, {theme,\nstdlibRegistry, fetcher})
NODE --> STD : eager bundles\n(c4, archimate, cloudinsight,\ncloudogu, bootstrap)
BROW --> PTS : renderSync(src,\n{theme, includeStore})
WC --> BROW : renderDiagram
MDI --> NODE : renderPlantUmlHtml
ELEV --> MDI : markdown-it plugin
VP --> MDI : markdown-it plugin
DOCU --> NODE : renderPlantUmlSvg
REACT --> BROW : renderDiagram in useMemo
VSC --> MDI : Markdown preview
VSC --> BROW : .puml preview\n(worker_threads, timeout)
JB --> BROW : bundled IIFE
@enduml
```

## plantuml-grammar

```plantuml
@startuml
title plantuml-grammar — from the jar's command classes to editor grammars
skinparam componentStyle rectangle

component "pinned PlantUML jar\n(plantuml-ts/oracle/dist/stock)" as JAR
component "tools/extract\nExtract.java (javac vs jar)" as EXTRACT
component "extracted/*.json\nraw command regex trees" as RAW
component "tools/translate\nJava regex → Python/JS regex" as TRANS
component "model/ (hand-written)\n+ model/generated/*.yaml\nschema.json" as MODEL
component "tools/interp\nPython interpreter of the model" as INTERP
component "tools/validate · tools/oracle\njar vs interpreter vs TS engine\n(3 corpora, goldens)" as VAL
component "tools/emit" as EMIT
component "dist/plantuml.tmLanguage.json" as TM
component "dist/plantuml.engine.json" as ENG
component "packages/engine\n@knowvah/plantuml-grammar (TS)" as PKG

JAR --> EXTRACT : classpath
EXTRACT --> RAW : dumps
RAW --> TRANS : translate
TRANS --> MODEL : generated yaml
MODEL --> INTERP : load + validate
INTERP --> VAL : parity vs jar
MODEL --> EMIT : emit
EMIT --> TM : TextMate
EMIT --> ENG : engine format 1
ENG --> PKG : bundled data
PKG --> VAL : TS engine parity
@enduml
```

## ELK lineage: elk → elkjs → elk-engine

```plantuml
@startuml
title ELK lineage as seen from plantuml-ts
skinparam componentStyle rectangle

component "knowvah/elk\nEclipse ELK Java mirror @ 8aaa3c14\n(0.13.0-SNAPSHOT, JavaSE-17)" as ELKJ
component "org.eclipse.elk.alg.layered\nLayered.melk → option ids\norg.eclipse.elk.layered.*" as MELK
component "elkjs 0.12.0 (npm)\nJava→JS transpile (kieler/elkjs)" as ELKJS
component "elk-engine (knowvah)\nsrc/core · src/graph\nsrc/alg/common · src/alg/layered\n+ java/guava/gson/emf/xtext shims" as ELKE
component "plantuml-ts core/elk/\nelkjs-options.ts (contract suite)\nelkjs-backend.ts · load-elk.ts" as PTSELK

ELKJ --> MELK : contains
ELKJ ..> ELKJS : transpiled upstream\n(not by knowvah)
ELKJ ..> ELKE : ported file-by-file;\noracle built from Java
MELK ..> PTSELK : option ids pinned\nagainst plugins/ paths
PTSELK --> ELKJS : only importer,\nlazy loadElk()
ELKE ..> PTSELK : no relationship today\n(export {} ; not a dependency)
@enduml
```

## common (`@knowvah/theme`)

Single package, no diagram needed. Exports: `.`/`./react`
(`ThemeProvider`, `useTheme`, icons), `./css` (tokens keyed on
`data-color-mode`/`data-contrast`), `./vitepress` (a hand-copied
restatement mapping the palette onto `--vp-*`), `./assets/*` (logos).
plantuml-ts's docs-site imports `@knowvah/theme/vitepress` and copies the
logo via `docs-site/copy-brand-assets.mjs`.
