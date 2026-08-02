# Component map — what SI10 touches

`measureUsecase` has two callers. This mission closes the class-engine one
and removes the inert half of the description-engine guard. Everything in
the "survives" package stays.

Note: the labels below say "latex branch" and "sprite atom" in prose rather
than the literal markup — inside a PlantUML diagram, `<latex>` would be
typeset and `<$name>` would be resolved as a sprite. See CLAUDE.md
§ Diagrams.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "class engine" {
  [class-layout-helpers.ts:286\nsprites IS in scope here] as CH
  [class-layout-leaf-shapes.ts\nmeasureUsecaseOrActor] as CLS
}

package "description engine" {
  [leaf-sizing.ts\nmeasureLeafNode] as MLN
  [hasUnroutedUsecaseMarkup] as GUARD
  [NEW entry point (T1)\nusecase/actor leaf sizing] as ENTRY #DDFFDD
  [measureEntityLeaf\n(module-private)] as MEL
  [EntityImageDescription\ncalculateDimensionSlow] as EID
}

package "survives — ADR-1, do not delete" {
  [measureUsecase / measureActor] as SUB #EEEEEE
  [usecase-footprint.ts\nfootprintBoxes] as FP #EEEEEE
}

package "regression guard — T3" {
  [oracle/goldens/svg-class/NEW-SLUG/\nin.puml + golden.svg (jar)] as FIX #DDFFDD
  [class-usecase-actor.test.ts] as TST #DDFFDD
}

CH --> CLS : "+ sprites (T2)"
CLS ..> SUB : "REMOVED by T2"
CLS ==> ENTRY : "NEW (T2)"

MLN --> GUARD
GUARD --> SUB : "latex branch ONLY — load-bearing, widened 2"
GUARD --> MEL : "everything else"

ENTRY --> MEL
MEL --> EID
SUB --> FP

FIX --> TST
CLS ..> FIX : "covered for the first time"
@enduml
```

## The coverage hole this mission closes

| corpus | fixtures | containing `usecase`/`actor`/`allowmixing` |
|---|---|---|
| `oracle/goldens/svg-class/` | 310 | **0** |

Nothing in the class corpus exercises the path SI10 changes. That is why T3
is a batch of its own rather than a footnote on T2.
