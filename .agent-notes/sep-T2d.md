# sep-T2d: salt tree (ElementTree, ElementTreeEntry)

## Observation: upstream draws tree cells with a null dimToUse
- **Context**: porting `ElementTreeEntry#drawFirstCell`/`drawSecondCell`.
- **Finding**: both pass `null` as `dimToUse` (ElementTreeEntry.java:90, 96); `src/diagrams/salt/element/Element.ts` types `drawU`'s `dimToUse` as non-null `XDimension2D`. The port re-types the `null` (`NULL_DIM_TO_USE` in `ElementTreeEntry.ts`) instead of inventing a dimension, so a cell that reads it (`ElementLine.java:62`, `ElementMenuBar.java:108`, `ElementBorder.java:80`) fails as Java's NPE does. The faithful fix is `dimToUse: XDimension2D | null` on `Element.ts`.
- **Impact**: T2a/T2b/T2c widgets that read `dimToUse` will crash inside a `{T` cell, exactly as the jar does; do not "fix" it with a fallback dimension.
- **Confidence**: High

## Observation: salt element dimensions can be probed from the jar classes directly
- **Context**: pinning `ElementTree#getPreferredDimension` without an SVG render.
- **Finding**: `java -DPLANTUML_DETERMINISTIC_TEXT=true -cp oracle/dist/plantuml-oracle.jar <Probe>.java` with `new SaltDictionary(null, null)` and `FileFormat.SVG.getDefaultStringBounder()` measures with the same width table as `DeterministicMeasurer`; widths come back float-rounded (195.32500457763672) and the port's `getPreferredDimension` equals them with `toEqual`, no tolerance. Committed example: `tests/unit/salt/element/fixtures/ElementTreeProbe.java`.
- **Impact**: any salt element's preferred dimension can be pinned exactly from a probe; prefer it over deriving from SVG coordinates.
- **Confidence**: High

## Observation: an empty `{T#}` still draws its grid
- **Finding**: `{T#` with no rows draws `hline(5)` and two zero-length `vline`s at the tree origin (rows `[0]`, cols `[0, margin / 2]`, ElementTree.java:131-135); probe `tests/unit/salt/element/fixtures/tree-empty.jar.svg`. The port's SVG writer emits zero-length lines identically.
- **Confidence**: High
