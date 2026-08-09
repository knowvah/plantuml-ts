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
  - title: Real graphviz, not Smetana
    details: Where upstream lays out with Smetana — its partially-complete graphviz transpile — this port uses @knowvah/dot-engine, a real port of the graphviz C. Same diagram; better edge routing. See below.
  - title: Pure SVG renderer
    details: No DOM, no canvas, no async rendering path. renderSync() takes PlantUML source and returns an SVG string, synchronously, in the browser or Node.
  - title: Preprocessor with documented scope
    details: "!define/!undefine, conditionals (!ifdef/!ifndef/!else/!endif), and !theme are supported. External !include is opt-in via a caller-supplied fetcher — see the divergences page for exact scope."
---

## Layout: real graphviz, not Smetana

Everywhere upstream PlantUML lays a diagram out with **Smetana**, this port uses
[`@knowvah/dot-engine`](https://www.npmjs.com/package/@knowvah/dot-engine)
instead, and accepts that the geometry differs. That is a deliberate, standing
decision.

Smetana is upstream's hand-transpile of graphviz 2.38 into Java. It was never
brought to full fidelity with graphviz — that was hard — and it shows: it
cannot measure text the way graphviz does, so it smuggles node dimensions
through a sentinel string in the label. `@knowvah/dot-engine` is that work done
properly, a real port of the graphviz C, which we wrote and publish separately.
Reproducing Smetana's shortfalls would mean porting bugs on purpose.

### What this means for your diagrams

PlantUML's value is in **what** it draws — the diagram types, the syntax, the
semantics of your source. That is preserved faithfully. Layout is **how** the
drawing is arranged, and there a better engine means better edge routing and
spacing.

On Smetana-backed diagram types, expect:

- the same diagram: same elements, labels, colours, structure;
- node sizes and text metrics matching upstream;
- **edge routing and node spacing that may differ from the Java**, and are
  intended to be at least as readable.

Readability is the bar on those types, not pixel equality. Everywhere else —
every diagram type upstream renders by calling a real graphviz binary — we do
target upstream's geometry, measured fixture by fixture on the
[parity page](/parity).

Smetana-backed types: `@startjson`, `@startyaml`, `@starthcl`, `@startgit`, and
any diagram using `!pragma layout smetana`.
