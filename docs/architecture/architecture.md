# System Architecture

Two views: the **runtime** graph (what executes when a diagram is rendered,
and from where) and the **reference/oracle** graph (what each port is
measured against). They are split because the first is shipped and the
second is a development concern, and mixing them hides which arrows carry
bytes at runtime.

## Runtime view

```plantuml
@startuml
title Runtime dependencies — what runs when a PlantUML string is rendered
skinparam componentStyle rectangle

package "Host (one of)" {
  component "Browser app /\nReact / <plantuml-diagram>" as BROWSER
  component "Static-site build\n(VitePress, Eleventy, Docusaurus)" as SSG
  component "Editor\n(VS Code worker, JetBrains JCEF)" as IDE
}

component "plantuml-plugins/core\nrender.ts (Node) · browser.ts" as CORE

package "@knowvah/plantuml-ts" {
  component "index.ts\nrenderSync · render · renderAll" as API
  component "core/\nBlockUmlBuilder · TIM preprocessor\nblock-extractor · dispatcher" as FRONT
  component "diagrams/*\n24 plugins (parse · layoutSync · render)" as PLUGINS
  component "core/graph-layout.ts\n(dot-engine seam)" as GL
  component "core/elk/\nElkBackend · load-elk" as ELKB
  component "core/assemble-svg.ts\n+ annotations chrome" as ASM
}

component "@knowvah/dot-engine 2.4.0\ncreateGraph · render · getLayout · renderSvg" as DOT
component "elkjs 0.12.0\n(lazy dynamic import)" as ELKJS
component "@knowvah/plantuml-stdlib*\n(BundleData chunks)" as STDLIB
component "katex · pako · @xmldom/xmldom" as LIBS

BROWSER --> CORE : renderDiagram()
SSG --> CORE : markdown-it fence\n(pre-rendered cache)
IDE --> CORE : renderDiagram()\nin worker / IIFE
CORE --> API : renderAll (Node)\nrenderSync (browser)
CORE --> STDLIB : eager stdlibRegistry\n(Node path only)

API --> FRONT : blocks → AST
FRONT --> PLUGINS : first plugin whose\nparse() accepts
PLUGINS --> GL : graph-shaped diagrams\n(class, description, state,\njson/yaml/hcl, @startdot)
PLUGINS --> ELKB : requiresElk(ast)\n(class, description only)
GL --> DOT : DOT build + layout
ELKB --> ELKJS : loadElk() on demand
PLUGINS --> ASM : RenderFragment per page
ASM --> API : SVG string
API --> STDLIB : includeStore /\nstdlibRegistry option
PLUGINS ..> LIBS : <latex> (katex),\nsprites/<img> (xmldom),\ndeflate (pako)
@enduml
```

Communication is entirely **in-process and synchronous** except where a
host opts into the async API: `render`/`renderAll` await an injected
`fetcher` (for `!include` URLs and stdlib chunks, filtered by
`SecurityProfile`), an `imageProvider` (for remote `<img>`), and the lazy
`loadElk()`. There are no network calls plantuml-ts makes on its own, no
databases, and no queues anywhere in the system. The only inter-process
hop is plantuml-plugins' optional `renderInChild` (a Node child process
used to enforce a render timeout at build time) and the VS Code
`worker_threads` worker.

### Boundaries enforced by tests, not convention

| Boundary | Enforced by |
|----------|-------------|
| `src/core/` never imports `src/diagrams/`; diagrams never import each other | `tests/architecture/layering.test.ts` |
| only `core/elk/load-elk.ts` imports `elkjs` | `tests/unit/elk/elk-import-boundary.test.ts` |
| `docs/catalog.md` matches the exported surface of `src/` | `tests/architecture/catalog.test.ts` (`npm run catalog:check`) |
| no Node built-ins / `process.env` / `Date.now()` in `src/` | lint + `tests/architecture/*` seam rules |
| workspace packages' peer range tracks the library version | `tests/architecture/packages-peer-range.test.ts` |

## Reference and oracle view

```plantuml
@startuml
title Reference graph — what each port is measured against (development only)
skinparam componentStyle rectangle

component "plantuml (Java)\n~/git/plantuml · 1.2026.8beta1" as JAVA
component "patched oracle jar\noracle/dist/* (emits svek-N.dot + SVG,\nPLANTUML_DETERMINISTIC_TEXT)" as JAR
component "pdiff corpus\n~/git/pdiff (5,600+ .puml)" as PDIFF
component "graphviz C\n~/git/graphviz/lib/dotgen" as GVC
component "real `dot` 16.1\n(on PATH)" as GVBIN
component "elk (Java mirror)\nknowvah/elk @ 8aaa3c14" as ELKJ

component "plantuml-ts\ntests/oracle · tests/conformance" as PTS
component "dot-engine\ntest/corpus survey" as DOT
component "elk-engine\ntools/oracle · test/golden" as ELKE
component "plantuml-grammar\ntools/extract · tools/validate" as GRAM

JAVA ..> JAR : patched build
JAVA ..> PTS : read the method\nbefore porting (@see)
JAR --> PTS : SVG + DOT goldens\n(scripts/oracle-render.sh)
PDIFF --> PTS : classified fixtures\n(tests/corpus, gitignored)
GVBIN --> PTS : DOT-parity gate\n(dot -Tdot on svek-N.dot)
GVC ..> DOT : line-by-line port
GVBIN --> DOT : ±0.01 numeric oracle
ELKJ ..> ELKE : ported source
ELKJ --> ELKE : oracle built from Java\n(tools/oracle/build.sh)
ELKJ ..> PTS : .melk option ids\npinned by contract suite
JAR --> GRAM : Extract.java dumps\ncommand regex trees
PDIFF --> GRAM : parity corpus
GRAM ..> PTS : no code dependency\n(reads its oracle jar)
@enduml
```

Two rules from `CLAUDE.md` shape this graph: *the Java is the spec* (every
ported symbol carries a `@see` to its origin; a divergence exists only
where a library forces it and is named in `DIVERGENCES.md`), and *one
layout engine* (dot-engine replaces Smetana wherever upstream would use it;
geometry deltas on those paths are recorded, not chased). Where upstream
shells out to real Graphviz, the jar's `svek-N.dot` **is** a target, and
`tests/oracle` gates DOT parity; where upstream uses Smetana (json, yaml,
hcl, `@startgit`), no `.dot` is emitted and only readability is gated.

## Deployment

There is no deployed service. Artifacts are:

| Artifact | Built by | Published to |
|----------|----------|--------------|
| `@knowvah/plantuml-ts` (`dist/plantuml-ts.{js,cjs}` + `image-providers`) | `npm run build` (Vite lib) | npmjs (manual, `RELEASING.md`; not yet published) |
| `@knowvah/plantuml-stdlib*`, `-sprites-archimate`, `-emoji`, `-all` | `npm run build:stdlib` | npmjs (manual) |
| `@knowvah/dot-engine` | esbuild + `tsc` declarations | npmjs via semantic-release; mirrored to GitHub Packages |
| `@knowvah/theme` | tsup | GitHub Packages on `theme/v*` tags |
| `@knowvah/plantuml-grammar` | `tools.emit.build` + TS build | npmjs via semantic-release; mirrored to GitHub Packages |
| plantuml.knowvah.com | VitePress (`docs.yml`) | GitHub Pages |
| plantuml-plugins packages, VS Code and JetBrains plugins | tsup / esbuild / Gradle | not published (no CI) |
