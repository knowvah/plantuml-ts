# Component map — what this mission touches

```plantuml
@startuml
title Components touched by dispatch-by-parse-attempt
component [dispatcher.ts] as Dispatcher
component [block-extractor.ts] as Extractor
component [parse-refusal.ts] as Refusal
component [diagram-type-set.ts] as TypeSet
component [8 strict parsers] as Strict
component [descriptive-keywords.ts] as Keywords
component [class-dispatch.ts] as ClassDispatch
component [routing gate] as RoutingGate
component [refusal gate] as RefusalGate

Refusal ..> Dispatcher : refusal type + merge rule
TypeSet ..> Extractor : candidate set per @start tag
Extractor --> Dispatcher : UmlSource.types
Dispatcher --> Strict : attempts parse, in order
Strict --> Dispatcher : AST or refusal
Dispatcher ..> Keywords : REMOVED by T21
Dispatcher ..> ClassDispatch : REMOVED by T21
RoutingGate ..> Dispatcher : measures engine choice
RefusalGate ..> Strict : measures command coverage

note bottom of Keywords
  527 + 451 lines deleted
  once nothing calls them
end note
@enduml
```

`json`, `yaml`, `hcl` and `files` are deliberately absent: their upstream
factories extend `PSystemAbstractFactory` and keep their own document-parser
error semantics ([D6](../decisions.md#d6)). `dot` is passthrough.
