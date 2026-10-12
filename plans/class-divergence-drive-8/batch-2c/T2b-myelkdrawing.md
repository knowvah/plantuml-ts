# T2b: port `MyElkDrawing`

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java`
(352 lines) 1:1 to `src/core/elk/MyElkDrawing.ts`, as a klimt `TextBlock`:
- the constructor `(clusterManager→adapter, diagram→adapter, minMax, clusters, edges,
  nodes)` (`:101-108`)
- `drawU`: **clusters, then nodes, then edges** (`:110-114`)
- `drawAllClusters` with `MyElkCluster` (T2c)
- `drawAllNodes`: the corner from `getPosition`; `svekNode.resetMove/moveDelta`
  becomes the adapter's equivalent; then `adapter.drawLeaf(id, ug.apply(translate))`
  in place of `IEntityImageUtils.translate(printEntityInternal(e)).drawU(ug)`
  (`:128-145`)
- `drawAllEdges`, with the label/tail/head/quantifier blocks and `MyElkEdge` (T2d)
  (`:150-210`)
- `calculateDimension` from `minMax` (`:341-350`)

Map iteration order is the maps' insertion order, which mirrors Java's `LinkedHashMap`
(`CucaDiagramFileMakerElk.java:140-142`).

## Write-set
`src/core/elk/MyElkDrawing.ts`, `tests/unit/elk/MyElkDrawing.test.ts`, `docs/catalog.md`.

## Read-set
`MyElkDrawing.java` (all); T2a's `ElkMakerResult` + `ElkDiagramAdapter`; T2c/T2d's
classes; `src/core/klimt/` (`TextBlock`, `UGraphic`, `UTranslate`).

## Interface contract (output, consumed by T3a, T3b)
`class MyElkDrawing implements TextBlock { constructor(adapter, result: ElkMakerResult); drawU(ug): void; calculateDimension(sb): XDimension2D }`

## Acceptance
- Given a synthetic adapter with 1 group, 2 leaves and 1 link, when drawn through a
  recording `UGraphic`, then the call order is cluster → leaf, leaf → edge, and leaf
  translates equal `getPosition` corners.
- Given cadutu's layout result through elkjs and a test adapter drawing leaf rects, then
  the leaf rect positions and edge `<line>` endpoints equal the jar's `in.svg`.
- Given `calculateDimension`, then it equals the Java formula over `minMax`.

## Architecture decisions (locked)
D13.
