# T1c — description DOT-side `ClusterHeader` sizing

Prepend [../task-preamble.md](../task-preamble.md).

## Task
Port the DOT-side half of `ClusterHeader` for description groups (decisions.md D5): the
`titleAndAttributeWidth/Height` the jar prints as the cluster's label `<TABLE>`
(`ClusterDotString.java:122-125`). Pure function, no wiring (T3 wires it).

## Write-set
- `src/diagrams/description/description-cluster-header.ts` (new)
- `tests/unit/description/description-cluster-header.test.ts` (new)
- `docs/catalog.md` (`npm run catalog`)

## Read-set
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java` (whole; `:60-120` is
  the formula, `:89-94` the USymbol supplements)
- `~/git/plantuml/.../svek/Cluster.java:261-268` (`MinimumWidth` max), `:671-673` (`isLabel`)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeSimple.java:125-126` (empty Display = one `" "` atom)
- `src/core/cluster-title-table.ts` (whole): `computeTitleTableHeight` already subtracts the `-5`
- `src/diagrams/class/class-namespace-title-table.ts:60-180`: class's version, the convention to match
  (returned dims ARE the TABLE dims)
- `src/core/decoration/symbol/USymbol.ts:40-90`, `USymbolNode.ts:170-185`, `USymbolDatabase.ts:240-245`
- `src/diagrams/description/renderer-cluster.ts:90-140` (`buildHeader`): the title/stereo the drawing
  side measures. Measure the SAME block; do not re-derive fonts.

## Interface contract (output, consumed by T3/T4)
```ts
/** ClusterHeader#getTitleAndAttributeWidth/Height for a description group, as the DOT TABLE dims
 *  (height already net of ClusterDotString.java:124's -5). undefined iff !cluster.isLabel(). */
export function descriptionClusterTitleTable(
  container: /* the description container type buildDotClusters maps over */,
  theme: Theme,
  measurer: StringMeasurer,
): { width: number; height: number } | undefined;
```
Keep it at ≤5 params (complexity hook); the container type is whatever
`ClassifyCtx.containers` holds (`layout-dot-tree.ts:242-247`).

## Acceptance
- Given bamami's `file "file\n" as package`, when sized with `DeterministicMeasurer`, then
  `{width:17, height:23}` (jar `svek-1.dot`).
- Given a `node` group, then the width includes `USymbolNode.suppWidthBecauseOfShape()`. Pin the
  value from a cached jar DOT; find one with `grep -l 'p0 {' test-results/dot-cache/component/*/svek-1.dot`
  and a `node` group in `in.puml`.
- Given a group with a displayed stereotype, then the height includes the stereo lines, per
  `ClusterHeader`, pinned from a jar DOT.
- Given an empty display `""`, then the `" "` atom rule gives a non-undefined table.
- Given ten fixtures with `p0` wrappers (pick from component/usecase), then the function's dims equal
  the jar's TABLE `WIDTH`/`HEIGHT` on each. List any miss with its mechanism; never adjust a constant
  to fit.

**Observability:** N/A. **Rollback:** Reversible (unused until T3).
