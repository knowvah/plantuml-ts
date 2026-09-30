# Data flow: rendering one @startmindmap block

Shows how a mindmap block travels the pipeline after batch 5, and where the new style
engine is built (D2: in the mindmap plugin, never in `buildTheme`).

```plantuml
@startuml
participant "renderSync" as R
participant "DiagramRegistry" as D
participant "mindmap plugin" as P
participant "buildMindmapStyleBuilder" as S
participant "MindMapDiagram" as M
participant "FingerImpl / Tetris" as F
participant "FtileBoxOld" as B
participant "assemble-svg (chrome)" as A

R -> D : resolve(block)
D -> P : parse(lines)
P -> M : commands build Idea tree (addIdea, getSmartLevel)
P -> S : skin text, then skinparam + style segments in source order
S --> P : StyleBuilder (muted)
P -> M : getTextBlock()
M -> F : per MindMap: computeFinger, drawU
F -> S : Idea.getStyle() via getMergedStyleSpecial (level, star, priority)
F -> B : createMindMap(style, SkinParamColors, label)
B --> F : node box (SheetBlock1/2)
F --> M : drawn phalanx + nail + curves
M --> P : TextBlock (width + 10)
P -> A : fragment, diagramType MINDMAP
A --> R : SVG with title/legend/scale chrome
@enduml
```
