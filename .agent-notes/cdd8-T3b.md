# cdd8 T3b: description ELK wiring

## Observation: the ELK maker sees applySingleStrategy's invisible links
- **Context**: foraba and a synthetic group of three standalone leaves laid out as one row by elkjs, as 2 rows by the jar.
- **Finding**: `CucaDiagram#applySingleStrategy` (`CucaDiagram.java:679-702`, run from `DescriptionDiagram#checkFinalError`) appends invisible chaining links to `getLinks()`. The ELK maker adds an ELK edge for every link (`CucaDiagramFileMakerElk.java:366-371`); only the DRAW skips `isInvis()` (`MyElkDrawing.java:154`). So the magma chain steers ELK's layering. Without them the three leaves are disconnected components and `SimpleRowGraphPlacer` packs a row.
- **Impact**: any engine whose diagram runs `applySingleStrategy` (description; class too if it ever chains) must put the chain in the adapter's `getLinks()`. The class adapter (T3a) should check whether class diagrams run it.
- **Confidence**: High (synthetic standalone-group.puml is byte-conformant with the jar).

## Observation: the fixtures' remaining residue is not ELK
- **Context**: vakasu (c4) and foraba (unknown) after the ELK wiring.
- **Finding**: stripping `!theme C4_united` from vakasu leaves ONLY colour/style diffs against the jar (j.puml, 0 numeric diffs). Two description-wide gaps remain, both visible on the dot path too: (1) stereotype-scoped skinparam/style (`skinparam rectangle<<osa_server>> {BackgroundColor BorderColor}`, C4 `<<component>>` and `AddRelTag` link styles): `resolveElementPaint` has no stereotype tier; (2) the theme's root `Margin 10` (`theme.diagramMargin`, read only by activity): description uses CucaDiagram's fixed (0,5,5,0), a uniform 10.417 shift. The legend under `skinparam dpi` is also unscaled (chrome fragment).
- **Impact**: c4 9/11 diverged on the dot path for the same reasons; owner a description stereotype-style + document-margin mission.
- **Confidence**: High for the mechanisms (oracle experiments), Medium for the legend dpi detail.

## Observation: description edge labels on the dot path are drawn raw
- **Finding**: `SvekEdge` draws a link label as raw text (`**Te<$person>st**\n|= ...` literally); the jar runs `create0(..., SIMPLE_LINE)` (tables, sprites, bold). The ELK path now builds the real creole block (`description-elk-label.ts`); the dot path is unchanged.
- **Impact**: candidate follow-on; would change non-ELK bytes.
- **Confidence**: High.
