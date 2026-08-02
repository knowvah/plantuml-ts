# Component map — where sizing decisions are made

The mission's whole subject is the **left/right split** below: two paths
that must agree on geometry but are wired independently. Every instance of
the recurring bug is a setting that reached the right path and not the left.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "SIZER — decides the box" {
  [measureLeafNode\nleaf-sizing.ts] as MLN
  [leaf-sizing-consts.ts\n5 parallel symbol tables] as CONSTS
  [leaf-sizing-text.ts\nper-line metrics] as TEXT
  [leaf-sizing-folder.ts] as FOLDER
  [usecase-footprint.ts\nFootprint + SEC] as ELLIPSE
}

package "RENDERER — draws the ink" {
  [renderer-symbol.ts\ntextFont] as RSYM
  [renderer-entity.ts] as RENT
  [EntityImageDescription*.ts\nbuildTextBlock / buildWrappedLines] as EID
}

[theme / skinparam\ntheme-element-resolve.ts\n10 x resolveElement*] as THEME
[ClassifyCtx\nlayout.ts] as CTX
[BoxSizingOpts\nlayout-dot-tree.ts] as OPTS
[SHARED creole lexer\nStripeSimple.buildLineAtoms] as LEX

THEME --> CTX
CTX --> OPTS
OPTS --> MLN
THEME ..> RSYM : consulted directly
MLN --> CONSTS
MLN --> TEXT
MLN --> FOLDER
MLN --> ELLIPSE
TEXT --> LEX
EID --> LEX
RSYM --> RENT
RENT --> EID
MLN --> EID : must agree
@enduml
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
