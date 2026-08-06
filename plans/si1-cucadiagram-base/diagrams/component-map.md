# Component map — the SI1 base and its consumers

```plantuml
@startuml
package "src/core/plasma (T1)" {
  class "Quark<D>" as Quark
}
package "src/core/abel (T2,T5,T6)" {
  class Entity
  class Link
  class LinkArg
  enum LeafType
  enum GroupType
}
package "src/core/cucadiagram (T7-T10)" {
  class CucaDiagram
  interface Bodier
  class BodierLikeClassOrObject
  class MethodsOrFieldsArea
  class BodyEnhanced1
  class BodyFactory
}
package "skin slice (T3)" {
  class VisibilityModifier
}
Quark "1" o-- "1" Entity : data
Entity --> LeafType : leafType
Entity --> Bodier : bodier
Link --> Entity : cl1/cl2
CucaDiagram --> Quark : namespace tree
CucaDiagram --> Link : links + addLink dedup
BodyFactory --> BodyEnhanced1 : create2
BodyEnhanced1 --> MethodsOrFieldsArea : buildTextBlock
MethodsOrFieldsArea --> VisibilityModifier : icon rows
@enduml
```

Consumers this mission (T11/T12 only): description/class/state parsers
(dedup hook) and the two sizing narrowing sites (folder path).
@enduml is per-block; future G-missions consume the whole base.
