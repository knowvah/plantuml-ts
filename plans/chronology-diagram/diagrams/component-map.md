# Component Map

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[src/index.ts] as A
[chronologyPlugin] as B
[src/diagrams/chronology/index.ts] as C
[parser.ts] as D
[layout.ts] as E
[renderer.ts] as F
[ast.ts] as G
[src/core/svg.ts\ndiamond, line, text, svgRoot] as H
[src/core/block-extractor.ts] as I
[src/core/dispatcher.ts] as J

A --> B : registers
B --> C
C --> D
C --> E
C --> F
D --> G
E --> G
F --> G
F --> H
I --> B : routes 'chronology'
J --> C : SyncPlugin interface
@enduml
```

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[@startchronology source] as SRC
[parseChronology] as P
[ChronologyDiagramAST\nevents: ChronologyEvent\{\}] as AST
[layoutChronology] as L
[ChronologyGeometry\nevents x/labelAbove\ndayTicks x/label\ndimensions] as GEO
[renderChronology] as R
[SVG string] as SVG

SRC --> P
P --> AST
AST --> L
L --> GEO
GEO --> R
R --> SVG
@enduml
```
