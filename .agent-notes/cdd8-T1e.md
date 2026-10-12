## Observation: dot-engine exposes no node polygon
- **Context**: cdd8 T1e, porting `DotStringFactory.java:414-420`'s HEXAGON/OCTAGON polygon read for xagomi.
- **Finding**: `@knowvah/dot-engine` 2.3.0 `NodeGeometry` (`dist/api/geometry.d.ts`) carries only name/x/y/width/height; `DotLayoutResult.nodes` likewise. The hexagon polygon is derived from the node box by graphviz's `shapes.c:2221-2289` vertex rule (`(+-w/2,0)`, `(+-w/4,+-h/2)`), which reproduces real `dot -Tsvg` and the jar exactly.
- **Impact**: Local points are rounded with `svgDouble` relative to the box, not as `round2(abs) - round2(min)`; a node whose centre is not on a 0.01 grid can differ by 0.01 from the jar. Exact parity would need the native centre on `DotLayoutResult` (core change). Octagon (`EntityImageActivity.java:109`) has the same seam.
- **Confidence**: High

## Observation: description engine has the same hexagon gap
- **Context**: same task, comparing engines.
- **Finding**: `src/diagrams/description/renderer-entity.ts:288` passes `hexagonPolygon: null` for every description hexagon, so description-routed hexagons (e.g. `class/febeka-77-node589`, which routes DESCRIPTION) draw no outline; the class fix (`class-hexagon-leaf.ts`) does not reach them.
- **Impact**: A description-side port can reuse `hexagonPolygonPoints` + a post-layout LimitFinder ink stamp.
- **Confidence**: High

## Observation: Smetana never stores a polygon
- **Context**: same task.
- **Finding**: `SvekNode#setPolygon`'s only caller is `DotStringFactory.java:420`; `CucaDiagramFileMakerSmetana` never calls it, so under `!pragma layout smetana` a hexagon draws only its label. Class gates the stamp on `ast.layoutEngine !== 'smetana'`.
- **Impact**: Any polygon-shape port must keep the Smetana branch polygon-free.
- **Confidence**: High
