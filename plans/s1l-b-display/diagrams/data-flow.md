# Data flow — `[ … ]` element body

How a multi-line element body travels from source to sized+rendered box, and
where each task acts.

```mermaid
flowchart TD
  SRC["node n [ foo1 / ==== / foo2 ]<br/>(.puml source)"]
  SRC --> P["parser.ts tryElementBlock<br/><b>T2</b>: accumulate body →<br/>node.display = 'foo1\n====\nfoo2'"]
  P --> AST["DescriptiveNode.display"]
  AST --> SIZE["leaf-sizing.ts measureBox<br/><b>T3</b>: creole-lexer width<br/>(strip &lt;b&gt; via spans) +<br/>HR line = 8px height"]
  AST --> REND["renderer-cluster.ts<br/>leaf label creole draw"]
  SIZE --> DOT["DOT node width/height<br/>(gated by size-backlog + parity)"]
  REND --> HR{"body has<br/>==== / ---- ?"}
  HR -- yes --> WRAP["<b>T1</b>: AbstractUGraphicHorizontalLine<br/>+ UGraphicStencil interception<br/>→ draws rule w/ box x-extent"]
  HR -- no --> DRAW["normal creole text draw"]
  WRAP --> SVG["SVG (no error diagram)"]
  DRAW --> SVG
  STYLE["&lt;style&gt; package { MinimumWidth 300 }"] -. "<b>T5</b>: per-element floor" .-> SIZE

  classDef done fill:#e8f5e9,stroke:#43a047;
  classDef crux fill:#fff3e0,stroke:#fb8c00;
  class P,SIZE done
  class WRAP crux
```

- **T1** (crux, orange): wire the already-ported HR interceptor into the render
  path so `UHorizontalLine` never reaches `LimitFinder` raw.
- **T2/T3** (green): parser + sizer — substantially prototyped on the WIP branch.
- **T5**: scoped `MinimumWidth` feeds the same `BoxSizingOpts.minimumWidth` seam.
