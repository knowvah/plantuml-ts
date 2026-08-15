# What this mission touches

```plantuml
@startuml
title Ink dispatch — new path (solid) vs existing (dashed)

package "src/diagrams/class" {
  [class-ink-box.ts] as BOX
  [class-ink-shapes.ts] as SHAPES
  [class-ink-symbol.ts] as SYM
  [renderer-arrowhead.ts] as ARROW
}

package "src/core (read-only)" {
  [klimt/drawing/LimitFinder.ts] as LF
  [decoration/symbol/USymbol.ts] as USYM
}

BOX -[#green]-> SYM : T3 consults first
SYM -[#green]-> LF : T2 walks drawn shapes
SYM -[#green]-> USYM : asSmall / asBig
SYM ..> ARROW : reuses the edgeExtremityInk shape
BOX ..> SHAPES : addRectInk fallback, unchanged

note right of SYM
  T2: symbolInkExtent
  returns undefined for
  non-symbol classifiers
end note

note bottom of BOX
  T3: additive dispatch.
  usecase / lollipop output
  must not change (D2).
end note
@enduml
```

## Ownership

| File | Owner | Batch |
|---|---|---|
| `.agent-notes/usymbol-ink-family.md` | T1, then T4 | 1, 2 |
| `src/diagrams/class/class-ink-symbol.ts` | T2 | 1 |
| `src/diagrams/class/class-ink-box.ts` | T3 | 2 |

No two tasks in a batch share a file.
