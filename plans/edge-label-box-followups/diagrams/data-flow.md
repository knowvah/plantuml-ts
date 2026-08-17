# Data flow — how a description `note on link` becomes a reserved box (T3)

Before: the parser folds the note text into `link.label`; the DOT box is a
bare label. After: `linkNote` rides the AST, the note operand is sized as a
`ComponentRoseNote`, and the merge arithmetic SI23 ported produces the box.

```plantuml
@startuml
participant "parse-state.ts" as P
participant "DescriptiveLink" as L
participant "link-note-box.ts" as N
participant "leaf-sizing.ts\nbuildNoteBody" as B
participant "core/edge-label-box.ts" as C
participant "link-edge-attrs.ts" as A
participant "renderer-edge.ts" as R

P -> L : linkNote = text\nlinkNotePosition = pos (D1)
A -> N : measureLinkNoteDim(linkNote)
N -> B : buildNoteBody(text).calculateDimension()
B --> N : pure {w,h}
N -> C : roseNoteDim(pure) (D5)
C --> N : {w+31, h+20}
N --> A : noteDim
A -> C : computeMergedLabelBox({label, noteDim, position, shield 0})
C --> A : ReservedLabelBox
A -> A : DOT label TABLE WIDTH x HEIGHT
A -> R : label + note lines (D2)
R -> R : draw label text, then note text\ninside the merged box
@enduml
```

The arrow-font path (T2 → T5/T6) is a one-hop resolver, not a flow:
`resolveArrowLabelFont(theme)` is called once per layout and once per render.
