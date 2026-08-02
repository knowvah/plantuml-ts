# G0b data flow — render pipeline before / after

## Before (today)

```plantuml
@startuml
participant "index.ts" as I
participant "plugin.parse" as P
participant "plugin.layoutSync" as L
participant "plugin.render" as R
I -> P : UmlSource (title line IGNORED here)
P --> I : AST (no annotations)
I -> L : AST + theme + measurer
L --> I : Geo
I -> R : Geo + theme
R --> I : complete 'svg…/svg' (svgRoot inside plugin)
@enduml
```

## After (G0b)

```plantuml
@startuml
participant "index.ts" as I
participant "plugin.parse" as P
participant "annotations/commands" as M
participant "plugin.layoutSync" as L
participant "plugin.render" as R
participant "annotations/chrome" as C
I -> P : UmlSource
P -> M : matchAnnotationCommand(line) at dispatch position
M --> P : consumed → DiagramAnnotations
P --> I : AST { annotations }
I -> L : AST + theme + measurer
L --> I : Geo (UNCHANGED — chrome is post-layout; DOT gate untouched)
I -> R : Geo + theme
R --> I : RenderFragment { body, w, h }
I -> C : applyChrome(fragment, annotations, styles, measurer)
note over C : header/footer outermost →\ncaption → title → legend → frame → body\n(mergeTB: width=max, height=sum)
C --> I : decorated RenderFragment
I -> I : assembleSvg → svgRoot ONCE, centrally
@enduml
```

Chrome wrap order (DiagramChromeFactory.create :137-149, applied inside-out):
frame → legend → title → caption → header/footer.
