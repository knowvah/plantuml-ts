# Data flow — class DOT-sync

```plantuml
@startuml
participant ".puml source" as Src
participant "block-extractor" as BE
participant "class parser" as P
participant "class layout" as L
participant "class-html-label (T3)" as H
participant "svek-dot-emit" as E
participant "oracle svek DOT" as O
participant "compareStructural" as C
Src -> BE : extract block(s)
note over BE : T6: split on `newpage` → N pages
BE -> P : UmlSource (per page)
P -> L : ClassDiagramAST (classifiers, relationships, qualifiers T7)
loop each classifier
  L -> H : buildClassHtmlLabel(classifier)
  H --> L : {label,w,h} | null
note over L : T4: non-null→plaintext, null→rect
end
note over L : T5: relationship→edge topology\nT7: qualifier→PORT edge
L -> E : DotInputGraph (shape + label per node)
E -> C : our svek DOT (per graph)
O -> C : oracle svek DOT (per graph)
C --> C : structurallyEqual? (shape/degree/minlen/labels/clusters)
@enduml
```
