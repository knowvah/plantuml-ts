# Component Map — dot-pipeline

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/core/dot/ — existing (modified)" {
  [index.ts] as IDX
  [rank.ts] as RNK
  [mincross.ts] as MC
  [position.ts] as POS
  [splines.ts] as SPL
  [acyclic.ts] as ACY
  [types.ts] as TYP
}

package "src/core/dot/ — new" {
  [fastgr.ts] as FASTGR
  [decomp.ts] as DECOMP
  [class1.ts] as C1
  [class2.ts] as C2
  [flat.ts] as FLAT
  [cluster.ts] as CLUST
  [compound.ts] as COMP
  [sameport.ts] as SMPRT
  [conc.ts] as CONC
  [aspect.ts] as ASP
}

package "src/core/pathplan/ — new" {
  [pathplan/index.ts] as PP
}

package "src/core/common/ — new" {
  [shapes.ts] as SHP
  [routespl.ts] as RSPL
}

package "src/core/pack/ — new" {
  [pack/index.ts] as PCK
}

package "src/core/label/ — new" {
  [label/index.ts] as LBL
}

IDX --> ACY
IDX --> DECOMP
IDX --> CLUST
IDX --> COMP
IDX --> RNK
IDX --> C2
IDX --> MC
IDX --> POS
IDX --> ASP
IDX --> SPL
IDX --> LBL
RNK --> C1
RNK --> CONC
MC --> FLAT
SPL --> PP
SPL --> RSPL
SPL --> SHP
SMPRT --> SPL
@enduml
```

## Batch dependency order

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[Batch A\nfastgr, decomp] as A
[Batch B\nclass1, class2] as B
[Batch C\nrank refactor\nmincross+flat\nindex cleanup] as C
[Batch D\ncluster, compound\nintegration] as D
[Batch E\nsameport, conc, aspect] as E
[Batch F-A\npathplan, shapes\npack, label] as FA
[Batch F-B\nsplines+pathplan\nxlabel wiring] as FB

A --> B
B --> C
C --> D
D --> E
E --> FA
FA --> FB
@enduml
```
