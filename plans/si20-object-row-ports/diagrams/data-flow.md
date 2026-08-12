# Data flow — si20-object-row-ports

How an object leaf carrying a member port reaches the emitted DOT, after this
mission lands. The fixture is `rozuxo-44-fudi093`, whose source is two object
leaves joined by an edge naming a member on each end.

```plantuml
@startuml
title Object member-port band, after SI20

participant "class-dot-graph\nbuildDotNodes" as CDG
participant "class-port-rows\nclassPortShortNamesById" as IDS
participant "class-layout-helpers\nmeasureClassifier" as CLH
participant "class-object-sizing\nbuildFieldBasedObjectGeo" as OS
participant "class-port-rows\napplyShapeAndPorts" as APS
participant "class-port-rows\nclassPortRows" as CPR
participant "svek-dot-emit\nedgeRef" as EMIT

CDG -> IDS : collect declared port\nshort names per leaf
note right of IDS
  T2: stops skipping object.
  Unions the persistent
  Classifier.portShortNames
  registry with the live
  relationship scan.
end note
IDS --> CDG : map of leaf id to name set

CDG -> CLH : measure each leaf
CLH -> OS : kind is object
OS --> CLH : MeasuredClassifier plus\nportMemberSections (T1)
note right of OS
  T1 publish-only:
  headerHeight from T0,
  per-member heights already
  computed by measureObjectFields.
  No new measurement.
end note

CDG -> APS : apply shape and ports
APS -> APS : port name count is\ngreater than zero (ADR-4)
APS -> CPR : one fields compartment
CPR -> CPR : elect a member row per\nport name, keep higher score
CPR --> APS : bands as id, position, height
APS --> CDG : node is plaintext,\nportRows attached

CDG -> EMIT : emit node and edges
EMIT -> EMIT : node has portRows and\nnames a row, so use\nthe md5 suffix
EMIT --> CDG : endpoint anchored to\nthe member row
@enduml
```

## What changes versus today

Today the object leaf never reaches `classPortRows` at all:
`classPortShortNamesById` filters it out, so `applyShapeAndPorts` attaches no
bands, `memberPortIsP` leaves the leaf marked for the PORTIN/PORTOUT shield,
and `edgeRef` emits the compass suffix against a shield table. The oracle
instead anchors each endpoint to that member's own row.

## The one branch worth reading twice

`edgeRef`'s precedence, post-SI17-B1, tests `isPort` **before** `portRows`.
That is why T2 must retire the `:P` marking for objects in the *same* commit
that attaches the bands — a leaf still carrying `isPort` keeps winning the
compass suffix no matter what bands hang off it.
