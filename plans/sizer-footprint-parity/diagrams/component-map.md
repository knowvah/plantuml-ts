# Component map

What this mission touches, and the sizer↔renderer split it closes.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "upstream (the spec)" {
  [AtomImg.create\njava:106-107\nHARDCODES monospace(14)] as AI
  [TextBlockInEllipse.java:60] as TBIE_J
  [Footprint\npoint-collecting UGraphic] as FP_J
}

package "our RENDERER — already faithful" {
  [USymbolUsecase.ts:14] as USU
  [TextBlockInEllipse.ts:37-38] as TBIE
  [Footprint.ts] as FP
}

package "our SIZER — the divergence" {
  [leaf-sizing.ts\n(two guards, T3)] as LS
  [leaf-sizing-text.ts\nfootprintBoxes] as LST
  [usecase-footprint.ts\n152-line SUBSTITUTE\nDELETED by T2] as UFP
}

package "dead seams — DELETED" {
  [imgFallbackFont\nStripeSimple + Support\nDELETED by T1] as IFF
  [AtomImageResolver\nink fields\nDELETED by T2] as INK
}

[Sea / SheetBlock1 / AtomOps\nADR-3: one value per atom is FAITHFUL\nNOT TOUCHED] as UNTOUCHED

TBIE_J --> FP_J
USU --> TBIE
TBIE --> FP
LS --> LST
LST --> UFP
AI ..> IFF : T1 reproduces
FP_J ..> FP : T2 routes sizer to
LST ..> TBIE : T2 re-points
@enduml
```

**The shape of the bug:** the renderer already reaches upstream's real
`Footprint`; the sizer runs a parallel analytic substitute. Everything red
above exists only to feed that substitute. Delete it and the seams have no
reason to exist.
