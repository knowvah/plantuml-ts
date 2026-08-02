# Data flow — `[ … ]` element body

How a multi-line element body travels from source to sized+rendered box, and
where each task acts.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[node n [ foo1 / ==== / foo2 ]\n(.puml source)] as SRC
[parser.ts tryElementBlock\nbT2/b: accumulate body →\nnode.display = 'foo1\n====\nfoo2'] as P
[DescriptiveNode.display] as AST
[leaf-sizing.ts measureBox\nbT3/b: creole-lexer width\n(strip] as SIZE
[renderer-cluster.ts\nleaf label creole draw] as REND
[DOT node width/height\n(gated by size-backlog + parity)] as DOT
[body has\n==== / ---- ?] as HR
[bT1/b: AbstractUGraphicHorizontalLine\n+ UGraphicStencil interception\n→ draws rule w/ box x-extent] as WRAP
[normal creole text draw] as DRAW
[SVG (no error diagram)] as SVG
[style package { MinimumWidth 300 }] as STYLE

SRC --> P
P --> AST
AST --> SIZE
AST --> REND
SIZE --> DOT
REND --> HR
HR --> WRAP : yes
HR --> DRAW : no
WRAP --> SVG
DRAW --> SVG
STYLE ..> SIZE : bT5/b: per-element floor
@enduml
```

- **T1** (crux, orange): wire the already-ported HR interceptor into the render
  path so `UHorizontalLine` never reaches `LimitFinder` raw.
- **T2/T3** (green): parser + sizer — substantially prototyped on the WIP branch.
- **T5**: scoped `MinimumWidth` feeds the same `BoxSizingOpts.minimumWidth` seam.
