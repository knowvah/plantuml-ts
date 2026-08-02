# Component map

Affected components and how they relate before/after the merge.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "src/core" {
  [dispatcher.ts resolve] as DISP
  [block-extractor.ts DiagramType] as BE
  [descriptive-keywords.ts NEW] as KW
  [graph-layout.ts seam] as SEAM
}

package "Before - diverged" {
  [diagrams/component/*] as COMP
  [diagrams/usecase/*] as UC
  [diagrams/class/index accepts] as CLS
  [diagrams/sequence/index accepts] as SEQ
}

package "After - one engine" {
  [diagrams/description/*] as DESC
}

KW --> CLS : hasDescriptiveSignal
KW --> SEQ : hasDescriptiveSignal
KW --> DESC : USymbol + KEYWORD_TO_SYMBOL
DISP --> CLS
DISP --> SEQ
DISP --> DESC
DESC --> SEAM
BE ..> DISP : type description
COMP ..> DESC : deleted batch-8
UC ..> DESC : deleted batch-8
@enduml
```

- `descriptive-keywords.ts` is the single source consumed by both the Phase-1
  guards (`class`, `sequence`) and the Phase-2 engine (`description`).
- `component/*` and `usecase/*` are deleted in Batch 8 once `description/*` is
  proven and registered.
