## Observation: the skinparam collector cannot tell the one-line form from a block
- **Context**: T6h, porting `CommandSkinParam`'s deprecation warnings (handwritten/ParticipantPadding/padding) for mindmap.
- **Finding**: `preprocessor-collector.ts` stores `skinparam X v` and a top-level `skinparam { X v }` entry under the same key, so a producer reading `styleSource.skinparam` also warns for the block form, which upstream's `CommandSkinParamMultilines` never does (no `Warning` in that class).
- **Impact**: An exact producer needs the collector to record the one-line names (a shared, every-engine file). No corpus fixture uses the block form with these three names.
- **Confidence**: High

## Observation: a chromed body can be drawn through klimt from an anchor
- **Context**: T6h, zebuzi's 22 `textLength` rows (body rounded before the post-scale).
- **Finding**: `shiftFragmentBody` shifts a `transform="translate(a,b)"` with unrounded `String(a + dx)`, so a placeholder `<g data-body-anchor="" transform="translate(0,0)"/>` carries the body's exact final offset through `applyChrome` and the margin shift. `finalizeTitledDiagramFragment` swaps it for `drawBodyAt(scale, dx, dy)` (`TextBlockExporter.ts#BODY_ANCHOR`).
- **Impact**: Any engine whose chrome is string-composed but whose body is klimt can reuse this to get upstream's one-scaled-UGraphic rounding.
- **Confidence**: High

## Observation: root width/height attributes are written truncated on scaled mindmaps
- **Context**: T6h, zirabo (dpi 300).
- **Finding**: jar root `height="465.625px"` (`format(maxY)`, SvgGraphics.java:810-811) vs the port's `465px`; the style and viewBox (truncated `maxYscaled`, java:801-813) match. `compareSvg` does not see it (same flag as T6d's `1299.111px`).
- **Impact**: The fix lives in the assembly (fragment carries one width/height for all three), not the export path.
- **Confidence**: High
