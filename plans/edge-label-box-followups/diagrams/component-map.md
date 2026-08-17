# Component map — what this mission touches

Shared arithmetic in `src/core/`, one wiring per engine. Solid arrows are the
new or changed dependencies; the state arm (T7) is optional.

```plantuml
@startuml
skinparam componentStyle rectangle

package "src/core" {
  component [edge-label-box.ts] as ELB
  component [arrow-label-font.ts\n(T2, new)] as ALF
  component [style-cascade-class.ts\n+ style-map-theme.ts\n+ skinparam handlers] as SC
}

package "src/diagrams/class" {
  component [class-layout-edge-labels.ts\n(T4 multi-line branch)] as CLE
  component [class-dot-graph.ts\n+ renderer-edge.ts (T5)] as CDG
}

package "src/diagrams/description" {
  component [ast + note-grammar\n+ parse-state (T3)] as DP
  component [link-note-box.ts\n(T3, new)] as LNB
  component [link-edge-attrs.ts\n+ layout.ts (T3, T6)] as LEA
  component [renderer-edge.ts\n(T3, T6)] as DR
}

package "src/diagrams/state" {
  component [six ARROW_LABEL_FONT_SIZE\nsites (T7, optional)] as ST
}

SC --> ALF : arrowFont{Size,Family,Style}\n(D3)
ELB <-- CLE : stripCreoleMarkup,\nparseMagicArrowLabel (T4)
ELB <-- LEA : computeMergedLabelBox (T3)
ELB <-- LNB : roseNoteDim (T3, D5)
DP --> LEA : linkNote,\nlinkNotePosition (D1)
LNB --> LEA : noteDim
LEA --> DR : label + note lines (D2)
ALF --> CDG : resolveArrowLabelFont (T5, D4)
ALF --> LEA : resolveArrowLabelFont (T6, D4)
ALF --> DR : same font for SVG (D4)
ALF ..> ST : optional (T7)
@enduml
```

`computeQuantifierBox` (T1) changes inside `edge-label-box.ts` and is already
consumed by both class and description — no new edge.
