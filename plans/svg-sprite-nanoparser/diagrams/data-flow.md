# Data flow — the two channels, before and after

## Upstream (the reference)

Two channels, structurally independent because they are different method
calls on different objects. Nothing computes an "ink box" — the narrowing is
emergent.

```plantuml
@startuml
participant "SheetBlock1" as Sheet
participant "AtomSprite" as Atom
participant "SvgNanoParser" as Nano
participant "Footprint" as FP
note over Sheet,Atom : LAYOUT channel
Sheet -> Atom : calculateDimensionSlow()
Atom --> Sheet : DECLARED box (16x16)
note over Nano,FP : INK channel
Nano -> Nano : drawU() walks raw SVG
loop each path / circle / ellipse
  Nano -> FP : drawPath(primitive)
  FP -> FP : record real min/max corners
end
FP --> FP : ellipse fits OBSERVED ink
@enduml
```

## This port, before the mission (the bug)

One channel. `drawAtoms` emits a single opaque `UImage`, so the jar-verified
`svgInkBox` precomputation has nowhere to go but the field `SheetBlock1` also
reads for line stacking.

```plantuml
@startuml
participant "leaf-sizing#fitToInk" as Leaf
participant "AtomImageResolver" as Res
participant "drawAtoms" as Draw
participant "SheetBlock1" as Sheet
Leaf -> Res : substitute INK box as the resolved dimension
Res --> Draw : {href, width=INK, height=INK}
Draw -> Draw : one opaque UImage
Draw -> Sheet : cursor advances by INK width
note over Sheet : line 1 correct (only the ellipse reads it)
note over Sheet : line 2 stacks on INK height -> 0.029321in widening
@enduml
```

## This port, after the mission

Two channels again, and structurally unable to recollapse: ink exists only
inside `primitives`, layout only in `width`/`height`.

```plantuml
@startuml
participant "resolveSpriteAtom (T9)" as Res
participant "SvgNanoParser (T6/T8)" as Nano
participant "drawAtoms (T7)" as Draw
participant "SheetBlock1" as Sheet
participant "Footprint" as FP
Res -> Nano : decompose sprite SVG
Nano --> Res : UPath[] primitives
Res --> Draw : {kind:'drawable', primitives, width=DECLARED, height=DECLARED}
note over Draw,Sheet : LAYOUT channel
Draw -> Sheet : cursor advances by DECLARED width
note over Draw,FP : INK channel
loop each primitive
  Draw -> FP : draw UPath
  FP -> FP : record real min/max corners
end
@enduml
```
