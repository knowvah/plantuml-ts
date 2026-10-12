# Component map: the ELK path (D2, D13)

What cdd8 adds and where it touches existing components. The backend is the swap
point: a future TypeScript ELK port replaces the elkjs adapter and nothing else.

```plantuml
@startuml
skinparam componentStyle rectangle

package "public API (src/index.ts)" {
  [renderSync] as RS
  [render] as R
  [loadElk] as LE
}

package "src/core/elk" {
  [ElkBackend\n(proxy interfaces)] as EB
  [elkjs backend] as EJ
  [future TS ELK backend] as TS
  [CucaDiagramFileMakerElk] as MK
  [MyElkDrawing] as MD
  [MyElkCluster] as MC
  [MyElkEdge] as ME
  [ElkDiagramAdapter] as AD
}

package "engines" {
  [class plugin] as CP
  [class elk adapter] as CA
  [description plugin] as DP
  [description elk adapter] as DA
}

[elkjs 0.12.0] as ELKJS

RS --> CP : options.elk
R --> LE : lazy import when requiresElk
LE --> EJ : returns
EJ ..|> EB
TS ..|> EB
EJ --> ELKJS : sync dispatcher
CP --> CA : builds
DP --> DA : builds
CA ..|> AD
DA ..|> AD
CP --> MK : layoutEngine elk
DP --> MK : layoutEngine elk
MK --> EB : layout(root)
MK --> AD : reads leaves, groups, links
CP --> MD : draws result
DP --> MD : draws result
MD --> MC : clusters first
MD --> AD : drawLeaf second
MD --> ME : edges last
@enduml
```
