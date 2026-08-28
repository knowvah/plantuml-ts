# Component map — what this mission touches

The sequence engine is the only engine still hand-rolling participant glyphs.
The class and description engines already route through the shared faithful
primitives; this mission makes sequence do the same.

```plantuml
@startuml
title Participant glyph drawing: before and after

package "src/diagrams/sequence" {
  component [renderer.ts] as SeqRender
  component [renderer-participant-shapes.ts] as SeqShapes
  component [sequence-layout-participants.ts] as SeqSize
  component [renderer-participant-symbol.ts\n(NEW - T1)] as SeqSeam
}

package "src/core (shared, already ported)" {
  component [decoration/symbol/USymbol*.ts] as USym
  component [skin/Actor*.ts] as ActorFam
  component [klimt/drawing/svg/u-graphic-svg.ts] as UGSvg
  component [usymbol-shapes.ts\n(simplified emitters)] as Simple
}

package "other engines" {
  component [class/renderer-usymbol-entity.ts] as ClassR
  component [description/renderer-entity.ts] as DescR
}

SeqRender --> SeqShapes : dispatches head/tail\nby ParticipantType
SeqShapes ..> Simple : **today: hand-rolled**\nrect+line+line+ellipse
SeqSize ..> SeqSize : **today: fitted**\nDB_MIN_WIDTH = 40

SeqRender --> SeqSeam : **after T2/T4**
SeqSize --> SeqSeam : **after T3/T5**
SeqSeam --> USym : asSmall().drawU()
SeqSeam --> ActorFam : getTextBlock() (T6)
SeqSeam --> UGSvg : adapter

ClassR --> USym : precedent (SI14 T4)
DescR --> USym

note bottom of Simple
  The class engine migrated AWAY
  from these to the faithful path.
  D1: sequence must not re-adopt them.
end note
@enduml
```

## Read this before touching the seam

- `src/diagrams/class/renderer-usymbol-entity.ts:1-40` — the same move, done
  once already, with its ADR-1/ADR-2 rationale in the header comment.
- `planning/sizer-renderer-parity.md` — why the sizer and the renderer must
  move together.
