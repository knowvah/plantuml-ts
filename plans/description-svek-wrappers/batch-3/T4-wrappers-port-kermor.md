# T4 — description wrappers: port and kermor families

Sent to the **`dsw-wrappers`** agent (T3) via `SendMessage`; it keeps T3's context. If that agent
is unavailable, spawn a fresh one with [../task-preamble.md](../task-preamble.md) + this file + T3's spec.

## Task
Finish D6 for the two families T3 left unchanged.

1. **Port family** (`portRanksByCluster` non-empty; jar `entityPositionsExceptNormal().size() > 0`
   with `hasPort()`):
   - Protection forced false (`ClusterDotString.java:109-112`), so no `innerMarginLevels`.
   - `ee` gets no label (`:132-133`).
   - The title TABLE goes on the `empty()` rect anchor declared last inside `ee` (`:175-181`).
   - Description already sets `portRanks`/`portAnchorId` (`layout-dot-tree.ts:256-262`). Add the T1c
     dims to the anchor node as `titleLabelWidth/titleLabelHeight`, the way class's `applyPortBranch`
     does (`class-dot-clusters.ts:88-107` and the anchor node built just above it).
   - The `a`/`i` pair still fires when the group is a link endpoint (`borderPointAncestorWrap`).
   - The entry/exitpoint-without-port sub-branch (`portRanksLabelOnEe`) applies only if a description
     cluster reaches it. Journal it if one does.
2. **Kermor family** (`ast.kermor === true`): read `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotStringKermor.java`
   whole. Quote its `protection0/1` (`:258-265`) and title table (`:135-137`) and whether `p0`/`p1` are
   ever emitted. Mirror exactly what it prints. If it needs a core builder change, that is stop 7.

## Write-set
Same as T3: `layout-dot-tree.ts`, `layout.ts`, `tests/unit/description/description-svek-wrappers.test.ts`.

## Read-set (beyond T3's)
- `src/diagrams/description/layout-dot-tree.ts:100-160` (anchor node construction, `buildDotNodes`)
- `src/core/graph-layout-cluster.types.ts` and `graph-layout.types.ts`: `titleLabelWidth/Height` on
  `DotInputNode`
- the 3 kermor fixtures: `grep -l -i kermor test-results/dot-cache/*/*/in.puml`

## Acceptance
- Given `component/repoge-41-demu604` and `class/sokevu-87-toce485`, then `layoutParity` is `equal`,
  or `firstDiff` is past `clusterTree` with the residual named.
- Given a port cluster, then its emitted svek DOT matches the jar's `ee`/anchor shape: the anchor
  `[shape=rect,width=.01,height=.01,label=<TABLE…>]` with the jar's WIDTH/HEIGHT.
- Given each kermor fixture, then the cluster tree matches the jar's DOT (layoutParity `clusterTree` clean).
- Given the layout-parity ratchet and `oracle/goldens/svg-description/ratchet.json`, then both stay green.

**Observability:** N/A. **Rollback:** Reversible.
