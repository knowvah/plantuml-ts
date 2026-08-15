# T7 — adopt upstream's `setTitlePosition`

## Context

Upstream reads a cluster's title position from the layout, in the same loop
that reads its box:

```java
// DotStringFactory.java:436-439
if (cluster.getTitleAndAttributeWidth() == 0 || cluster.getTitleAndAttributeHeight() == 0)
    continue;
idx = getClusterIndex(svg, cluster.getTitleColor());
final List<XPoint2D> pointsTitle = svgResult.substring(idx).extractList(SvgResult.POINTS_EQUALS);
cluster.setTitlePosition(SvekUtils.getMinXY(pointsTitle));
```

Note the guard: a cluster with a zero-size title area is skipped entirely.

We instead re-measure the title with a `StringMeasurer` and derive
`baselineOffset` ourselves (`buildNamespaceGeos`, via
`getTitleBaselineOffset`). Any divergence between the engine's placement and
that re-derivation lands straight in the SVG.

## Task

1. Bump `@knowvah/dot-engine` from `^1.4.0` to `^1.5.0`, which carries
   `ClusterGeometry.label`.
2. Surface it through the seam: `src/core/graph-layout.ts#mapClusters` copies
   it onto `DotLayoutResult.clusters[]`, and `graph-layout.types.ts` gains
   the field. Keep it optional — a cluster may have no label.
3. `buildNamespaceGeos` uses it for the title position instead of
   `getTitleBaselineOffset`, mirroring the guard above: skip when the title
   area is empty.

## Write-set

- `package.json` (and the lockfile)
- `src/core/graph-layout.ts`
- `src/core/graph-layout.types.ts`
- `src/diagrams/class/class-geo-builders.ts`
- Affected tests

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:436-439`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java` —
  `setTitlePosition` and `xyTitle`'s use in `drawUState:433-435,491-502`
- `docs/graphviz-issues/14-cluster-label-position-not-in-getlayout.md` —
  especially the RESOLVED note at the top
- `src/core/graph-layout.ts` — `mapClusters`

## Interface contracts

Verified against the published `1.5.0` `dist/api/geometry.d.ts`:

```ts
interface ClusterGeometry {
  name: string;
  x: number; y: number; width: number; height: number;   // box: CORNER
  label?: { x: number; y: number; width: number; height: number }; // CENTRE
}
```

## Acceptance criteria

- Given a laid-out package with a title, when the geo is built, then the
  title position derives from `cluster.label`, not from a re-measurement.
- Given `label.x`/`label.y` are a CENTRE while the box's `x`/`y` are a
  CORNER, when the conversion is written, then a test asserts the converted
  value against a known fixture — see `batch-4/overview.md#the-trap-in-this-batch`.
- Given a cluster with an empty title area, when the geo is built, then the
  title position is left alone, mirroring the upstream `continue` guard.
- Given T1's harness, when it runs, then both headline numbers are at or
  above the end of Batch 3.
- Given all four gates, when they run, then green.

## Observability requirements

N/A.

## Rollback

Reversible — but note this task changes a dependency version, so a revert
must revert `package.json` and the lockfile together.

## Quality bar

All four gates green. Never pipe `npm test`.

## Boundaries

- **Always:** verify the shipped type against the package's own `.d.ts`
  before writing against it. The interface above is from a tracker note.
- **Never:** write code expecting the label to be gated on a `set` flag —
  that was deliberately not implemented upstream.
- **Never:** reach into engine internals (`g.info.clust[...].info.label`) if
  the published field is missing. That breaks the single-seam architecture;
  wait for the release instead.
- **Never:** run any git command.
