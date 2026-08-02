# Data Flow

```plantuml
@startuml
participant User
participant "renderSync()" as API
participant "block-extractor" as BE
participant "parseBoard()" as Parser
participant "layoutBoard()" as Layout
participant "renderBoard()" as Renderer
User -> API : renderSync('@startboard\nWorld\n+Card\n@endboard')
API -> BE : extractBlocks(lines)
BE --> API : UmlSource { type: 'board', lines: [...] }
API -> Parser : parseBoard(source)
Parser --> API : BoardDiagramAST { activities: [{ name: 'World', root: BNode }] }
API -> Layout : layoutBoard(ast)
Layout --> API : BoardGeometry { activities: [...], totalWidth, maxStage }
API -> Renderer : renderBoard(geo, theme)
Renderer --> API : svg.../svg
API --> User : SVG string
@enduml
```

## computeX DFS Detail

```plantuml
@startuml
participant "Root(0)" as Root
participant "Child A(1)" as A
participant "Child B(1)" as B
participant "A.child P(2)" as P
note over Root : count=0, x=0
Root -> A : computeX(count) [i=0, no inc]
note over A : count=0, x=0
A -> P : computeX(count) [i=0, no inc]
note over P : count=0, x=0
Root -> B : computeX(count) [i=1, count++ → 1]
note over B : count=1, x=1
@enduml
```
