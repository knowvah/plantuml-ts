# Component map — what this mission adds and rewires

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "NEW — ported this mission" {
  [BodyFactory\ncreate2 / create3] as BF
  [BodyEnhancedAbstract\ndecorate + getMarginX] as BEA
  [BodyEnhanced1\ngetMarginX = 6] as BE1
  [BodyEnhanced2\ngetMarginX = 0] as BE2
  [TextBlockLineBefore\nseparator rule] as TBLB
}

package "SHARED pipeline — seams wired" {
  [AtomImageResolver\n+ ink fields (T3)] as AIR
  [buildLineAtoms\nimgFallbackFont ALREADY exists,\nnever passed (T3)] as BLA
}

[EntityImageDescription\nname = create2, desc = create3] as EID
[EntityImageDescriptionSupport\nbuildTextBlock / buildDesc] as SUP
[measureLeafNode\nroutes here since T6] as SIZ
[renderer-entity / renderer-symbol] as REN

BF --> BE1
BF --> BE2
BE1 --> TBLB : BEA
BE2 --> TBLB : BEA
BF --> EID
SUP ..> EID : superseded by T4
AIR --> SUP
BLA --> SUP
EID --> SIZ
EID --> REN
@enduml
```

## Reading it

- `EntityImageDescription` is the convergence point. Because the SIZER has
  routed through `calculateDimensionSlow` since T6, wiring `BodyFactory`
  there serves BOTH paths — that is ADR-1, and it is why there is no
  sizer-only shim.
- The dotted edge is what T4 supersedes: our local `buildTextBlock`/
  `buildDesc` stop being the builder.
- `buildLineAtoms` is drawn as a seam that EXISTS and is never passed —
  ADR-3. The fix is threading, not new API.
- `getMarginX` 6 vs 0 is the entire folder/package story: `name` goes
  through `create2`, `desc` through `create3`.
