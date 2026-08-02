# Component map

Green = created, amber = modified, grey = read-only context.
Task IDs in brackets.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "New ports (982 Java lines)" {
  [SvgPath.ts\n[T1] &larr; openiconic/SvgPath.java 255] as SP
  [ColorResolver.ts\n[T2] &larr; emoji/ColorResolver.java 77] as CR
  [UGraphicWithScale.ts\n[T3] &larr; emoji/UGraphicWithScale.java 128] as UGS
  [SvgNanoParser.ts\n[T6 core, T8 shapes]\n&larr; svg/parser/ 522] as NANO
}

package "Modified" {
  [svg-path-bbox.ts [T5]] as BBOX
  [creole-atoms.ts [T4]\nAtomImageResolver union] as ATOMS
  [EntityImageDescriptionSupport.ts [T7]\ndrawAtoms] as DRAW
  [render-atoms.ts [T9]\nresolveSpriteAtom] as RENDER
  [leaf-sizing.ts [T10]\nretire fitToInk] as LEAF
}

package "Read-only context" {
  [klimt/shape/UPath.ts\nminmax rule + getters] as UPATH
  [SheetBlock1.ts:180-182\nline-stacking cursor] as SHEET
  [driver-path-svg.ts\nUPath to SVG path] as DRIVER
  [openiconic-glyphs.ts\nSTOP if touched] as OIC
  [class-layout-leaf-shapes.ts\nSTOP if touched] as CLASS
}

SP --> NANO
CR --> NANO
UGS --> NANO
SP --> BBOX
UPATH ..> SP
UPATH ..> BBOX
NANO --> RENDER
ATOMS --> DRAW
ATOMS --> RENDER
DRAW --> LEAF
RENDER --> LEAF
DRIVER ..> DRAW
SHEET ..> DRAW
OIC ..> SP : rejected ADR-1 C
CLASS ..> LEAF : blocks retiring\nthe substitute
@enduml
```

## Blast radius — why 389 goldens guard a description fix

`drawAtoms` is private to `EntityImageDescriptionSupport.ts` and called only
from `buildTextBlock#drawU` — but `buildTextBlock` is the SHARED creole
renderer:

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[drawAtoms [T7]] as DRAW
[buildTextBlock#drawU] as BTB
[EntityImageDescription.ts:287] as EID
[EntityImageDescriptionDelegates.ts:254] as DEL
[renderer-entity.ts:294,351] as RE
[renderer-cluster.ts:92,99] as RC
[class-member-creole.ts] as CM
[class-object-map-sizing.ts] as COM
[svg-class: 310 goldens] as G1
[svg-object: 22 goldens] as G2
[svg-state: 57 goldens] as G3

DRAW --> BTB
BTB --> EID
BTB --> DEL
BTB --> RE
BTB --> RC
BTB --> CM
BTB --> COM
CM --> G1
COM --> G2
RE --> G3
@enduml
```

None of those 389 goldens contains a sprite, so they cannot churn — any diff
is collateral damage in the shared renderer. That is why a diff is a STOP
rather than an expected update.
