# Data Flow — Phase 2 Async Render Pipeline

```plantuml
@startuml
participant "Caller" as C
participant "src/index.ts" as API
participant "preprocessor" as Pre
participant "block-extractor" as BE
participant "registry" as Reg
participant "plugin.parse()" as P
participant "plugin.layout()" as L
participant "plugin.render()" as R
C -> API : render(source, options)
API -> Pre : preprocess(source)
Pre --> API : { lines, theme }
API -> BE : extractBlocks(lines)
BE --> API : Block[]
API -> Reg : registry.resolve(block)
Reg --> API : AsyncPlugin
note over API : 'layout' in plugin → AsyncPlugin path
API -> P : plugin.parse(block)
P --> API : AST
API -> L : plugin.layout(ast, theme, measurer)
L -> L : build ELK graph (pre-measured nodes)
L -> L : elk.layout(graph) [async]
L --> API : Geometry
API -> R : plugin.render(geo, theme)
R --> API : SVG string
API --> C : SVG string
@enduml
```

## renderSync() path for AsyncPlugin

```plantuml
@startuml
participant "Caller" as C
participant "src/index.ts" as API
participant "registry" as Reg
C -> API : renderSync(source, options)
API -> Reg : registry.resolve(block)
Reg --> API : AsyncPlugin
note over API : 'layout' in plugin → no layoutSync available
API --> C : errorSvg('renderSync() not supported for [type]')
@enduml
```
