# plantuml-ts

[![CI](https://github.com/sseely/plantuml-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/sseely/plantuml-ts/actions/workflows/ci.yml)

A TypeScript port of [PlantUML](https://plantuml.com), producing SVG
diagrams synchronously in the browser and Node.js with no server
dependency.

## Layout: one engine, always

**All layout in this port goes through
[`@knowvah/dot-engine`](https://www.npmjs.com/package/@knowvah/dot-engine).**
Upstream PlantUML uses two layout implementations — it shells out to a real
graphviz binary for most diagram types, and uses Smetana, its in-JVM Java
transpile of graphviz, for a few others. This port uses one. Where upstream
would have used Smetana, we use dot-engine and accept that the resulting
geometry differs.

The reason is consistency, not ranking: a single layout implementation means
one set of behaviours to reason about, test, and fix, rather than two that must
be kept in agreement. dot-engine is a port of the graphviz C source, which we
maintain and publish separately.

**What this means for your diagrams.** PlantUML's value is in *what* it draws —
the diagram types, the syntax, the semantics of your source — and that is
preserved. Layout is *how* the drawing is arranged. So on the affected diagram
types you should expect:

- the same diagram: same elements, labels, colours and structure;
- node sizes and text metrics matching upstream;
- **edge routing and node spacing that may differ from the Java.**

Our goals in priority order, on those types: **readability first, SVG fidelity
to upstream second.** That trade applies only to a closed, enumerated set —
`@startjson`, `@startyaml`, `@starthcl`, `@startgit`, and any diagram using
`!pragma layout smetana`. Every other diagram type is held to upstream's
geometry and measured fixture by fixture (see [parity](docs/parity-report.md)).

## Provenance and Attribution

This project is a **derivative work** of PlantUML. The diagram parsing,
AST design, layout semantics, and rendering rules are ported from the
PlantUML Java source.

**PlantUML**
- Author: Arnaud Roques and contributors
- Source: <https://github.com/plantuml/plantuml>
- License: MIT (per the MIT license option in upstream PlantUML's LICENSES.md)

The `dot` layout engine (`src/core/dot/`) and the `sfdp`, `fdp`,
`neato`, `twopi`, `circo`, `osage`, and `patchwork` engines are ported
from **Smetana** — PlantUML's auto-generated Java translation of the
Graphviz 2.38.0 C source — and from the original Graphviz algorithms.

**Graphviz**
- Authors: Emden R. Gansner, John C. Ellson, Yifan Hu, and the AT&T
  Research / Lucent Technologies Graphviz team
- Source: <https://gitlab.com/graphviz/graphviz>
- Graphviz 2.38.0 License: Common Public License 1.0 (CPL-1.0)

The algorithms implemented here follow the methods described in:

- Gansner, E. R., Koutsofios, E., North, S. C., & Vo, K.-P. (1993).
  *A technique for drawing directed graphs.* IEEE Transactions on
  Software Engineering, 19(3), 214–230.
- Fruchterman, T. M. J., & Reingold, E. M. (1991). *Graph drawing by
  force-directed placement.* Software: Practice and Experience,
  21(11), 1129–1164.
- Kamada, T., & Kawai, S. (1989). *An algorithm for drawing general
  undirected graphs.* Information Processing Letters, 31(1), 7–15.
- Bruls, M., Huizing, K., & van Wijk, J. J. (2000). *Squarified
  treemaps.* Data Visualization 2000, 33–42.

Modifications relative to the original PlantUML source are recorded
in the Git history of this repository.

## License

Copyright (C) 2024 Scott Seely and contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

## Supported Diagram Types

| Diagram | Status |
|---------|--------|
| Sequence | ✓ |
| Class | ✓ |
| Component | ✓ |
| State | ✓ |
| Use Case | ✓ |

### Preprocessor scope

The preprocessor supports `!define`/`!undefine`, conditionals
(`!ifdef`/`!ifndef`/`!else`/`!endif`), and `!theme`; the
`!procedure`/`!function` macro family is in scope and being ported.
**External import/include functionality (`!import`, `!include`
of local files and the PlantUML stdlib) is not included at this time** —
it is deferred past v1.0 pending a TypeScript/JavaScript-friendly design
for folding in external sources. An opt-in seam for URL-based `!include`
exists (`resolveIncludes()` with a caller-supplied fetcher, see
`src/core/include-resolver.ts`), but no filesystem or stdlib resolution
ships with the library.

## Layout Engines

| Engine | Algorithm |
|--------|-----------|
| `dot` | Sugiyama hierarchical (acyclic → rank → mincross → Brandes-Köpf → splines) |
| `neato` | Kamada-Kawai stress majorization |
| `fdp` | Fruchterman-Reingold spring embedder |
| `sfdp` | Multilevel Fruchterman-Reingold |
| `twopi` | BFS radial |
| `circo` | Circular |
| `osage` | Per-component dot + bin-packing |
| `patchwork` | Squarified treemap |

## Development

```sh
npm install
npm test          # vitest + coverage (90/90/90 thresholds)
npm run typecheck # tsc --noEmit
npm run lint      # eslint src tests demo
npm run build     # vite library build
npm run dev       # demo app (Vite dev server)
```
