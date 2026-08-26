# Component map — what this mission touches

Component diagram: logical structure of the sequence engine after the mission,
with the task that owns each new or changed piece.

```plantuml
@startuml
title sequence engine after sequence-command-coverage

package "parse" {
  [sequence-arrow-regex.ts\n(T3, new)] as REGEX
  [command-arrow.ts\n(T7 skeleton, T12 dressing)] as CARROW
  [command-exo-arrow.ts\n(T13, new)] as CEXO
  [command-note-factory.ts\n(T8)] as CNOTE
  [other command families\n(T5, T9, T10, T11)] as CREST
  [sequence-command-registry.ts\n(T5, new - order FROZEN)] as REG
  [parser.ts] as PARSER
}

package "model" {
  [ast.ts\n(T6 - sole owner)] as AST
}

package "layout" {
  [sequence-layout-message.ts\n(T2 split)] as LMSG
  [sequence-layout-exo.ts\n(T14, new)] as LEXO
  [layout.ts] as LAYOUT
}

package "render" {
  [renderer-message.ts\n(T1 split, T16, T17)] as RMSG
  [sequence-arrowhead.ts\n(T15)] as AHEAD
  [renderer-arrowhead.ts\n(T15, T17)] as RAHEAD
}

package "gates" {
  [refusal-baseline.json] as GREF
  [routing-baseline.json] as GROUTE
  [svg-sequence/diff-baseline.json] as GDIFF
  [sequence-ratchet-adjudicate.ts\n(T4, new)] as ADJ
}

REGEX --> CARROW : supplies shared\nregex fragments
REGEX --> CEXO : supplies ARROW_SUPPCIRCLE1/2
CARROW --> REG : registered in\ninitCommandsList order
CEXO --> REG : registered in\ninitCommandsList order
CNOTE --> REG : registered in\ninitCommandsList order
CREST --> REG : registered in\ninitCommandsList order
PARSER --> REG : dispatches first match
REG --> AST : commands populate

AST --> LMSG : MessageEvent
AST --> LEXO : MessageExoEvent
LMSG --> LAYOUT : contributes geometry
LEXO --> LAYOUT : contributes x-extent\n(feeds diagram width)

LAYOUT --> RMSG : MessageGeo
RMSG --> AHEAD : ArrowConfiguration
AHEAD --> RAHEAD : head geometry

RMSG --> GDIFF : measured by
PARSER --> GREF : refusal measured by
PARSER --> GROUTE : routing measured by
ADJ --> GDIFF : adjudicates rises\n(D5)
@enduml
```

## Notes

- `ast.ts` has **exactly one writer** for the whole mission (T6). Every later
  task fills fields it declared. This is what keeps batches 3–6 parallel.
- `sequence-command-registry.ts` order is frozen by D2. A reorder is a stop
  condition, not a fix.
- `sequence-arrow-regex.ts` exists so `CommandArrow` and both exo commands
  share the fragments they share upstream, rather than diverging copies.
