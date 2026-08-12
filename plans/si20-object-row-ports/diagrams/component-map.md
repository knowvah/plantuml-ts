# Component map — si20-object-row-ports

Which modules this mission touches, and how they relate. Two are **created**
by the split tasks (S1, S2); one is deliberately **not touched** despite
sitting on the path.

```plantuml
@startuml
title SI20 object row ports - module map

package "src/diagrams/class" {
  component [class-object-map-sizing] as OMS
  component [class-object-sizing] as OS #LightGreen
  component [class-layout-helpers] as CLH
  component [class-shield-helpers] as CSH #LightGreen
  component [class-port-rows] as CPR
  component [class-dot-graph] as CDG #LightGray
  component [class-classifier-ast] as AST
}

package "src/core" {
  component [svek-dot-emit] as EMIT #LightGray
  component [cucadiagram MethodsOrFieldsArea] as MOFA
  component [svek Ports] as PORTS
}

CLH --> OS : routes an object leaf to\nmeasureObjectClassifier
OMS --> OS : shared helpers\n(map and json stay behind)
OS --> CLH : publishes portMemberSections\non MeasuredClassifier (T1)
CDG --> CPR : applyShapeAndPorts\nper leaf
CDG --> CSH : shieldedClassifierIds\nper diagram
CPR --> CSH : memberPortIsP decides\nwhether a leaf keeps colon-P
CPR --> MOFA : reuses the ported election\n(getElected, sortBySize)
CPR --> PORTS : md5 id encoding and\nhigher-score-wins merge
CPR --> AST : reads the persistent\nportShortNames registry
CDG --> EMIT : DotInputNode.portRows\nand edge endpoints

note right of OS
  Created by S1.
  T1 adds the publish here.
end note

note right of CSH
  Created by S2.
  T2 narrows memberPortIsP
  to include object.
end note

note bottom of CDG
  Grey = expected to need NO change.
  Only 1 line of headroom to the
  500-line cap. If it must change,
  that is a stop condition.
end note
@enduml
```

## Reading it

- **Green** — new files created by the up-front split tasks (ADR-7).
- **Grey** — on the path but expected to be untouched. `svek-dot-emit` was
  already fixed by SI17's B1 (`:h` gated on the qualifier test rather than on
  shape), so an object node that gains `portRows` takes the correct branch
  with no further change. `class-dot-graph` needs no change because
  `classPortShortNamesById` returning a larger map requires no signature
  change in its callers.
- `map` and `json` continue to reach `class-object-map-sizing` and are out of
  scope entirely (ADR-4).
