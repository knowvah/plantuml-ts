# Component map — what this mission touches

Modified components are tagged with the task that owns them. Anything
untagged is read-only context.

```plantuml
@startuml
title Namespace cluster box - affected components

package "src/core (shared)" {
  component "svek-dot-wrappers" as W
  component "graph-layout-build\naddClusters" as AC
  component "graph-layout\nmapClusters" as ML
  component "cluster-title-table\n(T3 - new)" as CTT
}

package "src/diagrams/state" {
  component "state-composite-header\n(T3 - loses the helper)" as SCH
  component "layout-dot-tree\n(worked example)" as LDT
}

package "src/diagrams/class  (shared with object)" {
  component "class-cluster-levels\n(T2 - new)" as CCL
  component "class-dot-graph\n(T4)" as CDG
  component "class-geo-builders\n(T5, T7)" as CGB
  component "class-namespace-shape\n(T6)" as CNS
  component "layout" as CL
  component "class-ink-box" as CIB
  component "renderer" as REN
}

package "gates" {
  component "shape-match-report\n(T1 - new)" as SMR
  component "wrapper-parity.test\n(T4 extends)" as WP
}

CCL --> CDG : wrapper level
CTT --> CDG : title table height
CTT --> SCH : same helper, shared
LDT ..> CDG : pattern to mirror

CDG --> AC : DotInputCluster
W --> AC : wrapperLevels
AC --> ML : laid-out clusters
ML --> CGB : DotLayoutResult.clusters
CL --> CGB : threads clusters + clusterIdByNs

CGB --> CIB : NamespaceGeo
CGB --> REN : NamespaceGeo
CNS --> CGB : padding constants (T6 deletes)

SMR ..> REN : measures rendered output
WP ..> CDG : emitter vs builder agree

note bottom of SMR
  the only gate that can see this work:
  DOT parity checks cluster membership only,
  and the census stops at a childCount mismatch
end note

note bottom of CGB
  object diagrams share this whole package -
  3 of the 126 affected fixtures are objects
end note
@enduml
```

## Boundary that must not move

`svek-dot-wrappers` and `graph-layout-build#addClusters` are **shared with
the state engine and are correct**. This mission wires class into them; it
does not change them. If either looks wrong from inside a class task, that
is a STOP condition, not an edit.
