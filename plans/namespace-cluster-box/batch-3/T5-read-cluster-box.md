# T5 — read the package box from the cluster polygon

## Context

This is the mission's point. Upstream does not compute a package box; it
reads one:

```java
// DotStringFactory.java:425-433
for (Cluster cluster : getBibliotekon().allCluster()) {
    int idx = getClusterIndex(svg, cluster.getColor());
    final List<XPoint2D> points = svgResult.substring(idx).extractList(SvgResult.POINTS_EQUALS);
    cluster.setPosition(SvekUtils.getMinXY(points), SvekUtils.getMaxXY(points));
}
```

`Cluster#setPosition` (`Cluster.java:511-512`) stores it verbatim —
`RectangleArea.build(min, max)`, no padding — and `Cluster#drawU:356-374`
hands that same `rectangleArea` to `ClusterDecoration`. The polygon it reads
is the BASE `clusterN`, identified by `cluster.getColor()`; the protection
wrappers carry no color and are invisible to that lookup.

Ours (`class-geo-builders.ts#buildNamespaceGeos:189-243`) instead takes
min/max over member node positions and pads by `NAMESPACE_SIDE_PADDING` on
three sides and `getHTitle(...) + NAMESPACE_TOP_EXTRA` on top.

After T4, `DotLayoutResult.clusters` carries the real polygon, keyed by our
synthetic `clusterN` id.

## Task

Rewrite `buildNamespaceGeos` to take the box from `DotLayoutResult.clusters`,
looked up via T4's `clusterIdByNs`. Thread `result.clusters` and the map from
`layout.ts` (both are already in scope at the call site, `layout.ts:251-258`).

Keep everything else `NamespaceGeo` carries — `wtitle`, `htitle`,
`baselineOffset`, `creationIndex`, `inkShape` — unchanged. Only `x`, `y`,
`width`, `height` change provenance. The title POSITION is Batch 4; do not
touch it here.

Update the tests this breaks. They are yours: a commit with a red suite is
not a commit.

## Write-set

- `src/diagrams/class/class-geo-builders.ts`
- `src/diagrams/class/layout.ts`
- `src/diagrams/class/class-dot-graph.ts` (only if T4 left the map unexposed)
- The test files whose namespace expectations move. Known candidates —
  confirm by running, do not assume:
  `tests/unit/class/class-geo-builders.test.ts`,
  `tests/unit/class/class-namespace-shape.test.ts`,
  `tests/unit/class/class-namespace-separator.test.ts`,
  `tests/unit/class/layout-ink-extent.test.ts`,
  `tests/unit/class/class-empty-package-stereotype-a8.test.ts`,
  `tests/unit/class/renderer-uid.test.ts`,
  `tests/unit/class/class-singles2.test.ts`,
  `tests/unit/class/class-magma-notes.test.ts`,
  `tests/unit/class/class-sep-skinparam.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:425-439`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:356-374,511-512`
- `src/diagrams/class/class-geo-builders.ts:178-243`
- `src/diagrams/class/layout.ts:248-262`
- `src/core/graph-layout.ts` — `mapClusters`, which keys clusters by OUR
  `DotInputCluster.id`
- `plans/namespace-cluster-box/decisions.md#3`

## Interface contracts

Consumes from T4: `clusterIdByNs: Map<string, string>`.

`NamespaceGeo`'s shape is unchanged — this task changes where four numbers
come from, not the type.

## Acceptance criteria

- Given a laid-out package, when `buildNamespaceGeos` runs, then `x`, `y`,
  `width`, `height` come from `DotLayoutResult.clusters` with no padding
  applied, mirroring `Cluster#setPosition`.
- Given a namespace with no matching cluster, when the geo is built, then
  behaviour is unchanged from today (it is skipped) — do NOT invent a
  fallback here; decision 3 governs that and T6 proves it.
- Given T1's harness, when it runs, then BOTH headline numbers are above the
  batch-1 baseline of 691 / 20685.
- Given each of the 11 named residual fixtures, when re-measured, then it is
  exact, or its remaining delta is recorded in the decision journal with a
  mechanism — not with "close enough".
- Given the full suite, when it runs, then all four gates are green.

## Observability requirements

N/A — no new observable operations.

## Rollback

Reversible.

## Quality bar

All four gates green. Never pipe `npm test`.

`hooks/check-complexity.py` blocks writes over 500 lines/file, 30 NLOC, 10
CCN, 5 params. `class-geo-builders.ts` is near the file cap — plan a split
rather than discovering the block. Do NOT edit `hooks/complexity-ignore`.

## Boundaries

- **Always:** when a test expectation moves, verify the ORACLE decided it and
  record the oracle value in the commit message. A moved expectation with no
  oracle behind it is fitting.
- **Ask first / STOP:** if this needs splitting — expected, and fine. Split
  by consumer, never source-vs-tests.
- **Never:** touch the title position. That is Batch 4.
- **Never:** run any git command.
