# cdd8 T2a: CucaDiagramFileMakerElk + ElkDiagramAdapter

## Observation: the maker's MinMax needs the drawing
- **Context**: porting `CucaDiagramFileMakerElk.java:495-498`.
- **Finding**: `minMax = TextBlockUtils.getMinMax(new MyElkDrawing(..., null, ...), sb, false)`:
  the maker DRAWS the whole drawing (clusters, nodes, edges) into a
  LimitFinder. It cannot be computed from the ELK graph alone, so
  `makeElkLayout` takes a third argument, `MyElkDrawingFactory`
  (`(adapter, minMax | null, maps) => UDrawable`), which T2b supplies.
- **Impact**: the brief's `makeElkLayout(adapter, backend)` signature gained
  one parameter; callers (T3a/T3b) pass `MyElkDrawing`'s constructor.
- **Confidence**: High

## Observation: this port's `TextBlockUtils.EMPTY_TEXT_BLOCK` is `undefined`
- **Context**: `getLabel` returns `EMPTY_TEXT_BLOCK` for an unlabelled link
  (`CucaDiagramFileMakerElk.java:204`), and the maker measures it (`:423`).
- **Finding**: upstream's constant is `empty(0, 0)` (`TextBlockUtils.java:57`);
  ours is `undefined as unknown as TextBlock` (`src/core/klimt/shape/TextBlockUtils.ts:60`).
  `calculateDimension`/`drawU` on it throw.
- **Impact**: an adapter must return `TextBlockUtils.empty(0, 0)` for an
  unlabelled link (documented on `ElkDiagramAdapter.getLabel`); MyElkEdge
  (T2c) draws the centre label unconditionally (`MyElkEdge.java:261`).
- **Confidence**: High

## Observation: two NullPointerExceptions the jar can hit on the ELK path
- **Finding**: (1) a link end with no ELK node (removed entity, or a leaf of a
  CONCURRENT_STATE group, which `printSingleGroup` skips at `:349-350`)
  dereferences `node.obj` in `proxy/graph/util/ElkGraphUtil.java:23-26`;
  (2) a quantifier/role STRING that is non-null while both blocks are empty
  leaves `forLayout` null at `:435`/`:449`. The port throws in both places.
- **Impact**: a fixture hitting either renders the jar's error page.
- **Confidence**: High for the code path; neither seen in a fixture yet.

## Observation: the ELK path never reads link direction or length
- **Finding**: `getLinkArrow` (`:185-187`) feeds only commented-out code;
  `Link#getLength` is read nowhere under `elk/`.
- **Confidence**: High (grep of `elk/*.java`)
