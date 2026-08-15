# The coordinate frames

This is where the problem is easiest to get lost: four frames, and the
0.527 only makes sense once you can move between them.

```plantuml
@startuml
title bemena-23-zebu249 — from raw inner layout to the declared node

start
:RAW inner layout frame;
note right
  our probe: ink minX 0, maxX 357.86168
  label "EvNewValueSaved" drawn at x = 244.86168
end note

:moveDelta( 6 - minX );
note right
  SvekResult#calculateDimension
  ink min corner lands at (6, 6)
end note

:inner image;
note right
  width = ink extent + delta(15,15)
  = 372.86168  (ours)
end note

:InnerStateAutonom wraps it;
note right
  + MARGIN*2 + 2*MARGIN_LINE + marginForFields
  = +20  (marginForFields = 0, no attributes)
  -> 392.86168   jar: 392.335   delta +0.527
end note

:declared as one DOT node;
note right
  ours  width=5.456412 in
  jar   width=5.449097 in  (x72 = 392.33498)
end note
stop
@enduml
```

## Absolute placement, and how to check any number against jar's SVG

```plantuml
@startuml
title Mapping a raw coordinate into jar's SVG

rectangle "jar composite rect\nx=7  width=392.335" as BOX
rectangle "inner image origin\nabsolute 12" as IMG
rectangle "leftmost ink\nabsolute 18" as INK
rectangle "label text\nx=262.86  textLength=111.475" as LBL

BOX -right-> IMG : + IEntityImage.MARGIN (5)\nInnerStateAutonom#drawU
IMG -right-> INK : + 6\nthe moveDelta target
INK -right-> LBL : raw 244.86168 + 6 + 12\n= 262.86168  ✓ matches jar
@enduml
```

**The conversion, memorise it:** `absolute = raw + 6 + 12`.

Both directions were confirmed independently — the +5 comes from
`InnerStateAutonom#drawU`'s `UTranslate(IEntityImage.MARGIN, …)`, and jar's
leftmost drawn ink (a transition spline at absolute 18.000) corroborates our
raw `minX = 0`.

## The contradiction, in one line

```
jar DRAWS to   absolute 374.335   (label right edge, measured from its SVG)
jar's width implies  375.335      (392.335 - 15 - 20, then + 6 + 12)
                     --------
                     +1.000       mechanism (B), unidentified
```
