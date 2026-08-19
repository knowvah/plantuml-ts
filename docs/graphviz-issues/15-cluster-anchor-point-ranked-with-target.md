# Point-node cluster anchor ranked with its target, not at the cluster border

Filed 2026-08-18 (SI29 `state-declared-size-fix` T8/T9; fixture
`test-results/dot-cache/state/fovafu-44-mifu394`).

**Impact:** an edge that leaves a composite state (PlantUML draws it from an
invisible `shape=point,width=.01` anchor node `zaent0001` inside the cluster,
`svek/Cluster.java:410-436` / `ClusterHeader.java:81-95`) starts 24 px lower
in `@knowvah/dot-engine` than in graphviz, so its spline swings 7.82 px past
the composite's right frontier where graphviz's stays 7 px inside. The
composite's declared width therefore differs by +7.82 px on
`fovafu-44 scope 2` after everything else in that composite (cluster box,
node positions, the anchor's own x) matches the jar's `in.svg` exactly.

## Finding

Our emitted DOT for the fixture is structurally identical to the jar's
`svek-1.dot` (same anchor, same `ltail`/`lhead`, same sizes — the state
DOT-parity gate reports EQUAL). The difference is placement only:

| | graphviz (jar `in.svg`) | dot-engine (ours) |
|---|---|---|
| anchor `zaent0001` y | 88.187 = cluster `A`'s top border | 112 = the rank of its edge target |
| edge `__zaent_A → Y` max x | 7 px inside `A`'s right frontier | 7.82 px outside |

Graphviz places a `shape=point` node that is the tail of a cluster-clipped
edge on the cluster's border rank (the `rank.c` / `class2.c` cluster
collapse treats it as part of the cluster skeleton); dot-engine ranks it
like an ordinary node, one rank above its target. Everything downstream —
the spline's control points and the ink extent PlantUML folds via
`LimitFinder` — follows from that one rank.

**Verified:** cluster rectangle, leaf positions and anchor x reproduce the
jar's SVG byte-for-byte after T8; the residual is exactly the spline
excursion (measured, not fitted). **Not yet verified:** which graphviz pass
pins the anchor to the border rank — `~/git/graphviz/lib/dotgen/rank.c` /
`class2.c` are the places to read.

## Requested behaviour

Rank a `shape=point` tail node of an `ltail`-clipped edge on the cluster's
boundary rank, as graphviz does, so the clipped edge leaves at the border.

## Workaround in plantuml-ts

None (a fitted shift is forbidden). The row is pinned in
`oracle/goldens/state/size-backlog.json` with this account and the harness
baseline carries it as a journaled exception (SI29 decision-journal,
batch-3).
