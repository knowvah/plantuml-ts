# Component map — what moves where

Proposed state after T10 (arrows = static imports that REMAIN; every former
engine→engine and core→engine edge is gone).

```plantuml
@startuml
skinparam componentStyle rectangle
package "src/core" {
  component [klimt/creole/Display] as Disp
  component [klimt/document-shell] as Shell
  component [assemble-svg\n(diagramType)] as Asm
  component [svek/FrontierCalculator] as FC
  component [svek/image/leaf-sizing*\n+ LeafSizingSubject] as LS
  component [svek/image/EntityImageNoteLink] as NL
  component [decoration/symbol/usymbol-resolve\ncreole-atoms-image-resolver] as US
  component [color-override] as CO
  component [command/Command<S>\ncommand/CommandCreateJson + JsonNode] as CMD
  component [edge-label-box] as ELB
}
package "src/diagrams" {
  component [class] as C
  component [state] as S
  component [description] as D
  component [json] as J
  component [yaml] as Y
  component [hcl] as H
  component [sequence] as Q
}
ELB --> Disp : splitDisplayLines (T1)
C --> Disp : T1
S --> Disp : T1
D --> Disp : T1
C --> LS : T3
D --> LS : T3
LS --> US : T2
C --> US : T2
D --> US : T2
C --> CO : T4
S --> CO : T4
D --> FC : T5
S --> FC : T5
C --> NL : T6
S --> NL : T6
D --> NL : T6
C --> CMD : T7 T9
S --> CMD : T7 T9
D --> CMD : T7
Q --> CMD : T7
Asm --> Shell : T8
C ..> Asm : returns fragment\n{diagramType}
S ..> Asm
D ..> Asm
J ..> Asm
Y --> J : allowlisted (JsonDiagram)
H --> J : allowlisted (JsonDiagram)
@enduml
```

Retained cross-boundary edges (ALLOWLIST, D5): registry → `diagrams/*/index`
(dispatch); `yaml`/`hcl` → `json` (upstream `JsonDiagram`).
