# cdd8 T3a: class ELK wiring

## Observation: applySingleStrategy's invisible links shape ELK layouts
- **Context**: temofi-63-vega763 (5 unlinked classes) placed every node in one row.
- **Finding**: `ClassDiagram.java:87` runs `applySingleStrategy` (`CucaDiagram.java:701-726`),
  which `addLink`s invisible `Magma` links (`Magma.java:51`) between standalone leaves of
  a group with >= 3 of them. The ELK maker lays out EVERY link (`MyElkDrawing.java:154`
  only skips drawing `isInvis()`), so these links decide rows. The class port already
  computes them for DOT (`class-magma.ts#buildClassMagmaEdges`); the ELK adapter
  appends them to `getLinks()` after the relationships.
- **Impact**: any engine wiring ELK must include them (T3b found the same independently).
- **Confidence**: High (jar model dump + jar ELK probe reproduced our one-row layout
  without the links; with them temofi is 0/0)

## Observation: the jar's diagram model can be dumped in seconds
- **Context**: diagnosing temofi.
- **Finding**: `javac -cp oracle/dist/plantuml-oracle.jar Model.java`, then
  `new SourceStringReader(src).getBlocks().get(0).getDiagram()` cast to
  `net.atmp.CucaDiagram` gives `getChildrenGroups`, `leafs()`, `getLinks()` with
  `isInvis()`/`getType()` exactly as the maker reads them.
- **Impact**: settles "what graph did the jar build" without inferring from the SVG.
- **Confidence**: High

## Observation: Link#getLabel strips the magic arrow token, the ELK path draws no glyph
- **Finding**: `Labels.java:64` -> `StringWithArrow.java:56-91` strips `" >"` etc. from
  a single-guide-line label; the ELK maker's `addMagicArrow` calls are commented out
  (`CucaDiagramFileMakerElk.java:205-207`). The class AST keeps the raw label, so the
  ELK label builder strips it (`class-elk-text.ts#stringWithArrowLabel`).
- **Confidence**: High (oracle probe `A --> B : owns >`)

## Observation: class ELK path refuses notes, stereotyped/USymbol packages, link notes, together
- **Finding**: `class-elk-adapter.ts#assertSupported` throws for these; each needs a
  klimt-side piece the class engine draws only as strings today (note leaves, the
  cluster stereo splice, `ClusterHeader` for USymbol groups, `EntityImageNoteLink`,
  `GroupType.TOGETHER` clusters). No corpus row reaches them.
- **Impact**: follow-on work, not silently wrong output.
- **Confidence**: High
