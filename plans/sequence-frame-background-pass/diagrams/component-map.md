# Component map — what this mission touches

Ports of upstream classes are named for them; the arrow labels say what
crosses each seam.

```plantuml
@startuml
title sequence-frame-background-pass — affected components

package "parse" {
  component [command-grouping.ts] as CG
}
package "contract" {
  component [ast.ts\nFrameEvent / FrameGeo] as AST
  component [frame-style.ts\ncited plantuml.skin constants] as FS
}
package "layout" {
  component [sequence-layout-events.ts\nhandleFrameEvent] as LAY
}
package "render" {
  component [renderer.ts\nthe five passes] as R
  component [renderer-frame-blotter.ts\nport of teoz/Blotter] as BL
  component [renderer-frame-header.ts\nport of ComponentRoseGroupingHeader] as HD
}
package "measure" {
  component [sequence-ratchet-adjudicate.ts] as ADJ
}

CG --> AST : backColorElement,\nbackColorGeneral
AST --> LAY : FrameEvent
FS --> LAY : tab padding,\nDisplay rule
LAY --> AST : FrameGeo,\npushed before its children
AST --> R : events, in tile order
FS --> BL : transparent default
FS --> HD : colours, thickness,\nfont size
R --> BL : background pass
R --> HD : both passes
R --> ADJ : SVG, compared\nagainst the jar golden
@enduml
```

## Ownership

One writer per file, enforced by the batch tables. `renderer.ts` is written
only by T6; the two component ports are written only by T3 and T4; the
contract only by T1.
