# Repository Inventory

GitHub org: **`knowvah`** (detected via `gh repo view`, 2026-10-29). Of the 15
repos in the org, six are directly related to `plantuml-ts` by dependency,
consumption, or shared-upstream relationship and were analyzed alongside
it; the upstream Java PlantUML (outside the org) is listed last as the
reference implementation. Repos in the org that were **not** analyzed and
why: `dot-plugins`, `dot-atlassian` (consumers of `dot-engine`, pattern
templates for this repo's docs workflow — no code dependency either way),
`docs` (Docusaurus site for `audience-insights`/`certprep`), `trailmix`,
`study-tool`, `audience-insights`, `corporate-site`, `defcon-badge`
(unrelated products).

| Repo | Language | Runtime | Framework | Database | Key Deps | Entry | Notes |
|------|----------|---------|-----------|----------|----------|-------|-------|
| plantuml-ts (`@knowvah/plantuml-ts` 0.2.0) | TypeScript 6.0.3 (ESM, ES2022) | Node ≥26; browser-safe library | Vite 8 lib build, Vitest 5, VitePress 1 (docs) | — | `@knowvah/dot-engine` 2.4.0, `elkjs` 0.12.0, `katex` 0.19, `pako` 3, `@xmldom/xmldom` 0.9.12 | `src/index.ts` → `dist/plantuml-ts.{js,cjs}` (`renderSync`/`render`/`renderAll`) | Java PlantUML port to SVG strings; 24 diagram plugins; 7 workspace asset packages |
| dot-engine (`@knowvah/dot-engine`) | TypeScript (ESM) | Node ≥22 / browser | esbuild bundle, peggy DOT parser, Vitest 4 | — | none at runtime; optional peer `canvas` | `src/index.ts` (`renderSvg`); subpaths `./api`, `./render` | Line-by-line Graphviz port, EPL-2.0; latest tag v2.7.1 |
| plantuml-plugins (private) | TypeScript 5.9 (+ Kotlin for JetBrains) | Node ≥22; VS Code host; JCEF | pnpm workspace, tsup/esbuild; hosts markdown-it, Eleventy, VitePress, Docusaurus, React, VS Code, JetBrains | — | `@knowvah/plantuml-ts`, `@knowvah/plantuml-stdlib` (both `link:` to sibling), markdown-it, react | `packages/core/src/index.ts` | Render adapters for plantuml-ts; nothing published; no CI |
| common (private) | TypeScript, CSS | Node 22 (CI); browser | tsup, Vitest 5; React peer ≥18 | — | `@heroicons/react` | `packages/theme/package.json` exports | Single package `@knowvah/theme` 0.3.0 on GitHub Packages; design tokens + VitePress CSS + logos |
| plantuml-grammar | Python (tooling) + Java (extractor) + TypeScript (engine) | Python ≥3.11 (CI 3.13), Node ≥26, Java 21 | uv/pytest; npm workspaces + Vitest 5; semantic-release | — | pyyaml, jsonschema, regex; vscode-textmate/oniguruma | `python -m tools.emit.build`; npm `@knowvah/plantuml-grammar` (`packages/engine`) | Command model extracted from the PlantUML jar → TextMate grammar + TS engine |
| elk-engine (checkout dir `elk-ts`) | TypeScript 7.0.2 (native compiler) | Node ≥22 (volta 26.3.1); browser-safe | esbuild, Vitest 5; VitePress docs | — | none at runtime | `src/index.ts` (currently `export {}`) | Pre-alpha EPL-2.0 pure-TS port of Eclipse ELK; 862 source files, 574 tests, no public API yet |
| elk (knowvah mirror) | Java (+ Xtend/Xtext `.melk`) | JVM 17 | Eclipse OSGi plugins, Maven Tycho 4.0.12 | — | Guava, Xtext, EMF | `plugins/org.eclipse.elk.alg.layered/.../LayeredLayoutProvider.java` | Pristine mirror of eclipse-elk/elk master (2026-08-05, ELK 0.13.0-SNAPSHOT); one unmerged local fix branch |
| plantuml (upstream, **outside org**: `sseely/plantuml`) | Java | JVM (Gradle) | Gradle, TeaVM | — | upstream Java libs | `net.sourceforge.plantuml.Run` | Canonical spec at `~/git/plantuml`, 1.2026.8beta1, 3,269 `.java` files; consulted, not built |

`—` means not applicable. No repo in this set uses a database; every
runtime component is an in-memory text → SVG transform or a build-time
tool.

## Per-repo detail

### plantuml-ts (current project)
- **Front end:** `src/index.ts` public API; `core/BlockUmlBuilder.ts` splits
  the document into `@start…/@end…` blocks **before** preprocessing;
  `core/preprocessor.ts` + `core/tim/` run the TIM preprocessor with
  `IncludeStore`/`StdlibStore`; `core/block-extractor.ts` types the block.
- **Dispatch:** `core/dispatcher.ts` — an ordered plugin registry in
  upstream `PSystemBuilder` factory order (`src/registered-plugins.ts`);
  each plugin's `parse()` is tried, first non-refusal wins.
- **Plugins:** 24 directories under `src/diagrams/` (activity, board, chart,
  chronology, class, dedication, description, donors, dot, eggs, emoji,
  files, gantt, hcl, json, mindmap, openiconic, packetdiag, salt, sequence,
  state, version, wbs, yaml) plus `listArchimateSprites` under
  `core/klimt/sprite/`. Layout engines: class/description/state and the
  json/yaml/hcl/dot family → `@knowvah/dot-engine` via
  `core/graph-layout.ts`; class and description optionally → ELK via
  `core/elk/` (elkjs, lazily loaded, `!pragma layout elk`); everything else
  owns its layout.
- **Back end:** `core/assemble-svg.ts` + `core/annotations/` chrome
  (title/header/footer/legend/caption) + `TextBlockExporter` emit a pure SVG
  string. No DOM, canvas, async, Node built-ins or `Date.now()` in `src/`.
- **Seams (injected):** text measurer, include store/fetcher, stdlib
  store/registry, asset store, image provider, security profile, clock, ELK
  backend.
- **Workspace packages (`packages/*`, all 0.1.0, peer `@knowvah/plantuml-ts
  ^0.2.0`):** `plantuml-stdlib`, `plantuml-stdlib-aws`,
  `plantuml-stdlib-tupadr3`, `plantuml-stdlib-all`, `plantuml-sprites-archimate`,
  `plantuml-emoji`, `plantuml-all` — generated by
  `scripts/build-stdlib-packages.ts` from vendored `assets/stdlib`.
- **Tests:** `tests/unit`, `tests/integration`, `tests/oracle` (DOT/SVG
  parity against a patched upstream jar in `oracle/`), `tests/architecture`
  (fitness functions: layering, catalog drift, seam rules), `tests/e2e`
  (Playwright). Coverage gate 90/90/90.
- **CI:** `ci.yml` (static gates, 4 vitest shards, merged coverage, e2e),
  `docs.yml` (VitePress → GitHub Pages at plantuml.knowvah.com). No
  release workflow; publishing is manual (`RELEASING.md`).

### dot-engine
- Pipeline: DOT text → peggy parser → graph model → `GvcContext` layout →
  device renderer. All eight Graphviz engines registered (dot, neato, fdp,
  sfdp, circo, twopi, osage, patchwork) plus ortho splines.
- Three bundles: `.` (`renderSvg`, `tryRenderSvg`, `parse`, measurer/image
  hooks), `./api` (`createGraph`, `getLayout` geometry snapshot),
  `./render` (`render(g, format)` for svg/dot/xdot/json/plain/imap/cmapx,
  `getDrawOps`). plantuml-ts uses `createGraph` + `render(...,'svg')` +
  `getLayout` from `core/graph-layout.ts`, and `renderSvg` directly for
  `@startdot`.
- Oracle-verified against C Graphviz (±0.01 numeric bar). semantic-release
  publishes to npmjs and mirrors to GitHub Packages.

### plantuml-plugins
- `packages/core` is the only importer of `@knowvah/plantuml-ts`: a Node
  build-time path (`render.ts`: `renderAll` with an eager stdlib registry
  and a filesystem fetcher, optionally in a child process with a timeout)
  and a browser sync path (`browser.ts`: `renderSync` with a caller-supplied
  include store), plus a `<plantuml-diagram>` web component.
- `markdown-it` pre-renders fences asynchronously into a cache and emits
  synchronously; reused by `eleventy`, `vitepress` and the VS Code Markdown
  preview. `docusaurus` is a remark plugin; `react` a component; `vscode`
  renders `.puml` previews in a `worker_threads` worker; `jetbrains`
  bundles the browser path into an IIFE for JCEF.
- Engine and stdlib resolve via `link:` to the sibling checkout; README
  still points at `sseely/plantuml-ts` (stale URL).

### common
- pnpm workspace with one package, `@knowvah/theme` 0.3.0: CSS tokens
  (`./css`), a VitePress restatement (`./vitepress`), logo assets
  (`./assets/*`), and a React `ThemeProvider`/icons layer. Published to
  GitHub Packages on `theme/v*` tags. plantuml-ts's docs-site is a consumer.

### plantuml-grammar
- Java extractor compiled against the pinned PlantUML jar (the same
  `oracle/dist/stock/*.jar` plantuml-ts keeps) dumps command regex trees;
  Python tooling translates them into a YAML command model, validates it
  against the jar and the pdiff corpus, and emits a TextMate grammar and an
  "engine JSON" consumed by the TypeScript `packages/engine`.
- plantuml-ts does **not** consume it; the tooling dependency runs the other
  way (grammar reads plantuml-ts's oracle jar and corpus).

### elk-engine
- Faithful pure-TS port of Eclipse ELK (core, graph, alg.common,
  alg.layered so far), spec-pinned to eclipse-elk/elk commit `8aaa3c14` —
  the same commit the knowvah `elk` mirror sits on. Oracle built from the
  Java. No public exports yet; no reference to plantuml-ts or to replacing
  elkjs found in the repo.

### elk
- Mirror of eclipse-elk/elk used as the specification for `elk-engine` and
  as the source of ELK layout-option metadata (`Layered.melk`) that
  plantuml-ts's `src/core/elk/elkjs-options.ts` pins its option contract
  against.
