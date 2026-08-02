# Data Flow — repeat/break/arrow-label

## T1: repeat terminator fix

```plantuml
@startuml
participant "parseNodes" as P
participant "matchesStopKeyword" as M
participant "RE_REPEATWHILE" as R
P -> M : lineLc='repeat while', stops=['repeatwhile','repeat while']
M --> P : true (matches 'repeat while')
P -> R : RE_REPEATWHILE.exec('repeat while')
R --> P : match[1]=undefined → condition=''
P --> P : push ActivityRepeat{body, condition:''}
@enduml
```

## T2: break propagation

```plantuml
@startuml
participant "layoutSequence" as LS
participant "layoutBreak" as LB
participant "layoutRepeat" as LR
LR -> LS : layoutSequence(body)
LS -> LB : layoutBreak(breakNode)
LB --> LS : BranchResult{breakGeos:[geo], lastId:undefined}
LS --> LR : BranchResult{breakGeos:[geo]}
LR -> LR : create break-exit diamond
LR -> LR : edge(breakGeo → exitDiamond)
LR --> LR : exitIds includes exitDiamond.id
@enduml
```

## T3: arrow-label pending state

```plantuml
@startuml
participant "layoutSequence" as LS
participant "nodes[]" as N
note over LS : processing node: ActivityArrowLabel
LS -> LS : pendingLabel = {label, color}
note over LS : processing next node: ActivityAction
LS -> N : layoutSingleNode(action) → firstId
LS -> LS : create edge(lastId → firstId, label, color)
LS -> LS : pendingLabel = undefined
@enduml
```
