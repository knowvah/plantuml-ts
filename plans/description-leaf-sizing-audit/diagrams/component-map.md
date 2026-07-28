# Component map — where sizing decisions are made

The mission's whole subject is the **left/right split** below: two paths
that must agree on geometry but are wired independently. Every instance of
the recurring bug is a setting that reached the right path and not the left.

```mermaid
graph TD
  THEME["theme / skinparam<br/>theme-element-resolve.ts<br/>10 x resolveElement*"]
  CTX["ClassifyCtx<br/>layout.ts"]
  OPTS["BoxSizingOpts<br/>layout-dot-tree.ts"]

  subgraph SIZER["SIZER — decides the box"]
    MLN["measureLeafNode<br/>leaf-sizing.ts"]
    CONSTS["leaf-sizing-consts.ts<br/>5 parallel symbol tables"]
    TEXT["leaf-sizing-text.ts<br/>per-line metrics"]
    FOLDER["leaf-sizing-folder.ts"]
    ELLIPSE["usecase-footprint.ts<br/>Footprint + SEC"]
  end

  subgraph RENDERER["RENDERER — draws the ink"]
    RSYM["renderer-symbol.ts<br/>textFont"]
    RENT["renderer-entity.ts"]
    EID["EntityImageDescription*.ts<br/>buildTextBlock / buildWrappedLines"]
  end

  LEX["SHARED creole lexer<br/>StripeSimple.buildLineAtoms"]

  THEME --> CTX --> OPTS --> MLN
  THEME -.->|"consulted directly"| RSYM
  MLN --> CONSTS & TEXT & FOLDER & ELLIPSE
  TEXT --> LEX
  EID --> LEX
  RSYM --> RENT --> EID

  MLN -->|"must agree"| EID
```

## Reading it

- `ClassifyCtx` → `BoxSizingOpts` is the ONLY channel by which a
  per-diagram or per-element setting reaches the sizer. If a setting is
  not in that chain, the sizer cannot see it — that is the bug class.
- The renderer reads `theme` directly (dotted edge), which is why it
  routinely gets a feature first.
- `buildLineAtoms` is the one component both sides already share; making
  more geometry flow through shared components (as the use-case point fit
  and the guillemet pass now do) is what structurally prevents drift.
