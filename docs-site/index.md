---
layout: home
hero:
  name: plantuml-ts
  text: PlantUML, in pure TypeScript
  tagline: PlantUML in pure TypeScript — no Java, no server, browser-native.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Open the playground
      link: /playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/sseely/plantuml-ts
features:
  - title: Faithful to upstream PlantUML
    details: A deep port of the Java implementation's parsing, layout, and rendering rules — including the long tail of special cases. The class-diagram dot pipeline matches the upstream oracle on 680/680 comparable fixtures.
  - title: One layout engine, always
    details: Upstream uses two layout implementations — a real graphviz binary for most diagram types, and Smetana for a few. This port uses only @knowvah/dot-engine, so there is one set of layout behaviours to reason about. On the affected types, geometry may differ from the Java. See below.
  - title: Pure SVG renderer
    details: No DOM, no canvas, no async rendering path. renderSync() takes PlantUML source and returns an SVG string, synchronously, in the browser or Node.
  - title: Preprocessor with documented scope
    details: "!define/!undefine, conditionals (!ifdef/!ifndef/!else/!endif), and !theme are supported. External !include is opt-in via a caller-supplied fetcher — see the divergences page for exact scope."
---

## Layout: one engine, always

All layout in this port goes through
[`@knowvah/dot-engine`](https://www.npmjs.com/package/@knowvah/dot-engine).
Upstream PlantUML uses two layout implementations — it shells out to a real
graphviz binary for most diagram types, and uses **Smetana**, its in-JVM Java
transpile of graphviz, for a few others. This port uses one. Where upstream
would have used Smetana, we use dot-engine and accept that the geometry
differs.

The reason is consistency, not ranking: a single layout implementation means
one set of behaviours to reason about, test and fix, rather than two that must
be kept in agreement. dot-engine is a port of the graphviz C source, which we
maintain and publish separately.

### What this means for your diagrams

PlantUML's value is in **what** it draws — the diagram types, the syntax, the
semantics of your source. That is preserved. Layout is **how** the drawing is
arranged.

On the affected diagram types, expect:

- the same diagram: same elements, labels, colours, structure;
- node sizes and text metrics matching upstream;
- **edge routing and node spacing that may differ from the Java.**

Our goals in priority order, on those types: **readability first, SVG fidelity
to upstream second.** That trade applies to a closed, enumerated set —
`@startjson`, `@startyaml`, `@starthcl`, `@startgit`, and any diagram using
`!pragma layout smetana`. Every other diagram type is held to upstream's
geometry and measured fixture by fixture on the [parity page](/parity).
