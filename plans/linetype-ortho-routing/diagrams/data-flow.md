# Data flow — how `linetype` reaches the two emitters

Sequence diagram: multiple participants exchange messages, and *who* calls
*whom in what order* is the point (per `rules/diagrams.md`'s tie-breaker).

```plantuml
@startuml
autonumber
participant "skinparam" as SK
participant "Theme" as TH
participant "engine\n(state/class/desc)" as EN
participant "DotInputGraph" as GI
participant "dotSplinesAttrs" as HP
participant "applyGraphAttrs" as AP
participant "dot-engine" as DE
participant "graphAttrLines" as GA
participant "parity harness" as PA

SK -> TH : linetype ortho
TH -> EN : theme.linetype
note over EN
  D3: the SAME expression
  the label half already reads
end note
EN -> GI : linetype: 'ortho'   (T4/T5/T6)

group layout path (T2)
  GI -> AP : linetype
  AP -> HP : dotSplinesAttrs('ortho')
  HP --> AP : [[splines,ortho],[forcelabels,true]]
  AP -> DE : setAttr x2
  DE --> AP : ortho-routed geometry
end

group DOT-parity path (T3)
  GI -> GA : linetype
  GA -> HP : dotSplinesAttrs('ortho')
  HP --> GA : same pairs
  GA -> PA : "splines=ortho;forcelabels=true;"\n(ONE line, after searchsize, before rankdir)
end

PA -> PA : splinesOk joins structurallyEqual   (T7)
note right of PA
  Blind until T7: zero splines
  tokens in the harness today
end note
@enduml
```

## The break, today

Steps 4-9 do not happen. `DotInputGraph` has no `linetype` field, so both
emitters fall through with no splines attribute, and `dot-engine` routes
with default curved splines where the jar routes ortho.
