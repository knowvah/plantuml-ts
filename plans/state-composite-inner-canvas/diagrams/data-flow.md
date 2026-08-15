# How a composite's declared size is derived

Upstream's order of operations, which this mission ports. The shift happens
*between* the ink walk and the returned dimension — that ordering is why
decision D2 keeps both halves in one mission.

```plantuml
@startuml
title Upstream: composite size from inner ink

participant "GroupMakerState" as GM
participant "GraphvizImageBuilder" as GIB
participant "SvekResult" as SR
participant "LimitFinder" as LF
participant "InnerStateAutonom" as ISA
participant "outer DOT" as DOT

GM -> GIB : buildImage(inner leafs)
GIB --> GM : IEntityImage (inner layout)
GM -> ISA : new InnerStateAutonom(image, group)

ISA -> SR : im.calculateDimension()
SR -> LF : TextBlockUtils.getMinMax(this)
LF --> SR : MinMax over DRAWN ink
SR -> SR : moveDelta(6 - minX, 6 - minY)
SR --> ISA : minMax.getDimension().delta(15, 15)

ISA -> ISA : text.mergeTB(attr, img)
ISA -> ISA : delta(MARGIN*2 + 2*MARGIN_LINE + marginForFields)
ISA --> DOT : composite declared as one node (width, height)
@enduml
```

## What this port does today

```plantuml
@startuml
title This port: composite size from child boxes

participant "state-composite-pass" as PASS
participant "state-composite-geo" as GEO
participant "outer DOT" as DOT

PASS -> GEO : boundingBox(children)
GEO -> GEO : min/max over child RECTS
GEO -> GEO : + BOX_PAD * 2 (uncited 12)
GEO --> DOT : composite declared as one node (width, height)
@enduml
```

Two divergences, stacked: boxes measured where jar measures ink, and a
`+24` where upstream layers `delta(15,15)` then a 20/25 margin. Neither is
visible to the standing gates — hence T1's declared-size harness.
