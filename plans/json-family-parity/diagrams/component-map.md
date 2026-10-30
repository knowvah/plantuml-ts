# Component map — json family node/edge placement after the mission

Proposed state. T2a adds the engine-frame read to core; T3a moves json's
placement onto the jar's `getPosition` + `Mirror` arithmetic. Every other
engine keeps reading the unchanged `nodes`/`edges` fields.

```plantuml
@startuml
skinparam componentStyle rectangle
package "@knowvah/dot-engine" {
  [getLayout] as gl
}
package "src/core" {
  [graph-layout.ts\nlayoutGraph] as lg
  [graph-layout-result.types.ts\nDotLayoutResult] as res
}
package "src/diagrams/json" {
  [layout.ts\nlayoutJson] as lj
  [json-node-position.ts\ngetMaxX / getPosition] as pos
  [Mirror.ts] as mir
  [JsonCurve.ts] as curve
  [document-dimensions.ts] as dims
}
package "other engines" {
  [class / state / component ...] as others
}
lg --> gl : y-down read (svek)\nand y-up native read (exact)
lg --> res : nodes, edges (unchanged)\n+ engineNodes, engineEdges (exact only)
others --> lg : read svek, fields unchanged
lj --> lg : read exact
lj --> pos : engineNodes
pos --> mir : max over node extents
lj --> mir : engineEdges through invAndXYSwitch
curve --> lj : mirrored spline + ep
dims --> lj : node and edge extents
@enduml
```
