# SI15 data flow — the two-notion split

The one diagram that matters: where declared dims flow vs where raster dims
flow after T1/T3. The bug was that the left-hand consumers received the
right-hand column's number.

```plantuml
@startuml
participant "render-atoms.ts\nresolveSpriteAtom /\nresolveImgAtom" as R
participant "UImage" as U
participant "Sea / drawAtoms\n(cursor advance,\nplacement x/y)" as S
participant "Footprint.MyUGraphic\n#drawImage" as F
participant "driver-image-svg.ts\n(<image> emission)" as D

R -> U : build(declared w/h,\nraster w/h when raster-backed)
U -> S : getWidth()/getHeight()\n(DECLARED — unchanged)
U -> F : raster dims present?\nraster − 1 : declared as-is (ADR-1)
U -> D : raster dims present?\nMath.round(declared) : declared (ADR-2)
note right of F
  upstream UImage.java:87-92:
  getImage().getWidth() - 1
  (native pixel count, scale-independent)
end note
note right of D
  D9 Amendment 1: jar MEASURES raw,
  EMITS Math.round — rounding lives at
  the emission site, never the resolver
end note
@enduml
```

Raster sources: monochrome sprite → native grid dims (PNG raster is one
pixel per grid cell); `<img>` atom → IHDR dims (`creole-atoms.ts:358`).
Rasterless (latex/KaTeX, SVG sprites via `drawPath`): both consumers keep
today's behaviour bit-for-bit.
