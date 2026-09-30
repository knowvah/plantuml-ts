# Component map: what the mission adds and touches

New components are the style engine (`src/core/style/`), the mindmap engine
(`src/diagrams/mindmap/`) and the node box. Existing engines and the flat StyleMap are not
changed (D1, D12); the dashed arrows are read-only seams.

```plantuml
@startuml
package "src/core/style (new, D1)" {
  [StyleParser + Context] as SP
  [StyleBuilder / StyleStorage / Style] as SB
  [StyleSignatureBasic + StyleKey (widened)] as SK
  [Value* / PName / SName / MergeStrategy] as SV
  [FromSkinparamToStyle subset] as FS
  [plantuml-skin.ts (generated from the jar)] as SKIN
}
package "src/diagrams/mindmap (new)" {
  [Commands + MindMapDiagram] as CMD
  [Idea / MindMap / Branch] as TREE
  [FingerImpl] as FI
  [Tetris / StripeFrontier / SymetricalTee] as TET
}
[FtileBoxOld (activity/ftile/vertical)] as BOX
[SkinParamColors] as SPC
package "existing (unchanged)" {
  [klimt: SheetBlock1/2, UGraphicSvg, LimitFinder] as K
  [style-skinparam-segments.ts] as SEG
  [assemble-svg.ts chrome] as CH
  [flat StyleMap engines] as FLAT
}

SP --> SB : builds styles
SB --> SK : matches signatures
SB --> SV : merges values
FS --> SB : mutes converted skinparams
SKIN --> SP : parsed first
SEG ..> SP : source-order segments (read-only)
CMD --> TREE : builds tree
TREE --> SB : getStyle (level, star)
FI --> TET : packs children
FI --> BOX : node boxes
BOX --> SPC : color override
BOX --> K : draws text + box
CMD --> CH : TitledDiagram chrome
FLAT ..> SB : no dependency (D12)
@enduml
```
