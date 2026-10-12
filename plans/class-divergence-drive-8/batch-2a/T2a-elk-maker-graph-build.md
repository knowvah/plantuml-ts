# T2a: `CucaDiagramFileMakerElk` + `ElkDiagramAdapter` (D3, D13)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
1. Read `~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java`
   (501 lines) end to end. Read the T0c spike graph builder
   (`plans/class-divergence-drive-8/spike/`), which already reproduced cadutu's
   coordinates.
2. **`src/core/elk/ElkDiagramAdapter.ts`.** This replaces upstream's `CucaDiagram`,
   `Bibliotekon` and `printEntityInternal` (D13). Every member is named after, and
   `@see`-cited to, the Java call it replaces. At minimum:
   - leaves and groups in `diagram.getEntityFactory()` order
   - links in `diagram.getLinks()` order
   - per leaf: the image dimension, its shield/margin if the Java reads one, and
     `drawLeaf(leafId, ug)`
   - per group: everything `MyElkCluster` reads (title block, stereotype, colours,
     `USymbol`/decoration, round corner, shadowing)
   - per link: label, tail/head label and quantifier `TextBlock`s; the link type and
     decor; colour/stroke; arrow direction and length
   - the skin params the maker reads
3. **`src/core/elk/CucaDiagramFileMakerElk.ts`.** Port 1:1:
   - the ordered `nodes`, `clusters` and `edges` maps (`:140-142`)
   - cluster creation with `DIRECTION DOWN` and padding `(topPadding,15,15,15)` (`:320-340`)
   - node sizes and label placement (`:390-410`)
   - edges with inline labels and TAIL/HEAD placement (`:420-460`)
   - root `DIRECTION DOWN` and `HIERARCHY_HANDLING INCLUDE_CHILDREN` (`:480-490`)
   - `backend.layout(root)` through T1a's `ElkBackend`, never elkjs directly
   - the `MinMax` computation and `getPosition` helpers MyElkDrawing needs (`:490-500`)

   Return what Java passes to `new MyElkDrawing(...)`: `{ minMax, clusters, edges, nodes }`.
   T2b turns it into the drawing.
4. Tests:
   - a synthetic adapter (2 leaves, 1 group, 1 labelled link) through a recording
     fake `ElkBackend` asserts every `setProperty` call (id + value) and the creation order
   - the same through the elkjs backend asserts cadutu-shaped coordinates
     equal to the T0c spike's

## Write-set
`src/core/elk/CucaDiagramFileMakerElk.ts`, `src/core/elk/ElkDiagramAdapter.ts`,
`src/core/elk/elk-minmax.ts` (only if needed for the 500-line cap),
`tests/unit/elk/CucaDiagramFileMakerElk*.test.ts`, `docs/catalog.md`.

## Read-set
`CucaDiagramFileMakerElk.java` (all); `MyElkDrawing.java:87-145, 330-352`
(constructor, draw order, dimension); `src/core/elk/**` from T1a; the T0c spike;
decisions.md#D13.

## Interface contract (output, consumed by T2b–T2d, T3a, T3b)
```ts
// src/core/elk/CucaDiagramFileMakerElk.ts
export interface ElkMakerResult {            // == MyElkDrawing ctor args (:496-498)
  minMax: MinMax;
  clusters: Map<string /*group id*/, ElkNode>; // insertion order = Java's LinkedHashMap
  edges: Map<string /*link id*/, ElkEdge>;
  nodes: Map<string /*leaf id*/, ElkNode>;
}
export function makeElkLayout(adapter: ElkDiagramAdapter, backend: ElkBackend): ElkMakerResult;
```
Freeze `ElkDiagramAdapter`'s member list in the first commit and paste it into your
report. T2b–T2d are briefed from it.

## Acceptance
- Given the synthetic adapter and a recording backend, then the property calls and
  their order equal the Java's, asserted per call.
- Given cadutu through elkjs, then node positions equal T0c's PASS table.
- Given the file, then every ported member has an `@see` to its Java line.

## Architecture decisions (locked)
D2, D3, D13.
