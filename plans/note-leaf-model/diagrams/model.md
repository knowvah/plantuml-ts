# The three models

Upstream has one collection of polymorphic leaves. State mirrors it. Class
carries a second array alongside.

```plantuml
@startuml
title Entity model: upstream vs the two engines

package "upstream (net/atmp + svek)" {
  class Entity {
    leafType : LeafType
  }
  note right of Entity
    ONE collection.
    reallyCreateLeaf(..., LeafType.NOTE, ...)
    CommandFactoryNote.java:197
  end note
  Entity --> EntityImageClass : CLASS
  Entity --> EntityImageNote : NOTE
  Entity --> EntityImageTips : TIPS
}

package "state engine (mirrors upstream)" {
  class StateNodeGeo {
    kind : 'normal' | 'note' | ...
    creationIndex : number
  }
  note right of StateNodeGeo
    ONE array. Document order
    falls out of creationIndex.
  end note
}

package "class engine (the divergence)" {
  class ClassifierGeo
  class NoteGeo {
    conflates NOTE + TIPS
  }
  ClassifierGeo ..> NoteGeo : positions + row text\nneeded to resolve Opale\n(layout.ts:267)
}
@enduml
```

The dashed edge is the mission's real obstacle: it is a LAYOUT-time
dependency that upstream does not have, because upstream resolves the Opale
connector at DRAW time inside `EntityImageNote#drawU`. Batch 2 removes it;
only then can the two class boxes become one.

## What is already unified

```plantuml
@startuml
title Class engine: DOT is already one graph; geometry is not

start
:parse;
:build DOT graph;
note right
  classifiers + notes flattened
  into the root graph already
  (layout.ts:249) — the
  712-fixture DOT gate must
  not move (decision D4)
end note
:run layout;
if (post-layout geometry) then (today)
  :ClassifierGeo[];
  :NoteGeo[]  <-- needs classifier positions;
else (target)
  :one leaf collection,
  each carrying its upstream leaf type;
endif
:render;
stop
@enduml
```
