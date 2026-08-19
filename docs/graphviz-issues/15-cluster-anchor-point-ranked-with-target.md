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

---

**RECLASSIFIED 2026-08-19 — NOT a dot-engine defect. No upstream fix to wait
for; the work is ours.**

The premise above is wrong in a specific, checkable way: the two numbers in the
table are not the same quantity. `88.187` is the jar's **drawn spline start**
(`in.svg`'s `M185.997,88.187`), not the anchor's coordinate; `112` is our
**unclipped** spline start. The anchor never moved.

Measured against the native oracle (`~/git/graphviz/build/cmd/dot/dot`,
`GVBINDIR=/tmp/ghl`), not against the jar:

1. **dot-engine reproduces native graphviz exactly on this fixture's own DOT.**
   `-Tdot` on `test-results/dot-cache/state/fovafu-44-mifu394/svek-1.dot` is
   byte-identical between the port and the oracle — cluster bbs, `zaent0002`
   at `190,73`, and the spline — modulo the port not echoing `label=""`. Five
   further hand-built variants of the shape this issue describes (anchor inside
   the cluster with the target inside and outside it, `minlen` 0 and 1,
   `compound=true`+`ltail` present and absent, nested clusters) all match too.

2. **The jar and graphviz compute the same curve.** Mapping the oracle's
   control points into the jar's frame (`dx = -5`, `dy = +45.09`, derived from
   cluster6's bb `24,24,198,139` against the jar's A rect `19,88.38,174x115`)
   reproduces the jar's own path knots exactly from the third segment on —
   `164,54.38 / 143.96,42 / 131.04,42 / 111,54.38 / 85.44,70.18` — and the
   jar's arrowhead tip `70.83,128.99` *is* the oracle's endpoint `75.833,98.387`
   in that frame.

3. **The 7.82 px is arithmetic.** The oracle's control point `205.82` maps to
   `200.820`; A's right frontier is `193`; `200.820 - 193 = 7.820`. It is the
   control point of the in-cluster segment the jar clips away and we keep.

## Actual mechanism

PlantUML clips a cluster-sourced edge at the cluster rectangle **in Java** —
`DotPath#simulateCompound`, called from `SvekEdge.java:671-672` — not through
graphviz. Graphviz's own `dot_compoundEdges` cannot do it for this shape even
if we asked: with `compound=true` and `ltail=cluster6` added, the head is inside
the tail cluster's bb, so `makeCompoundEdge` (`lib/dotgen/compound.c:378-383`)
emits "head is inside tail cluster" and leaves the spline untouched. Verified —
adding both attributes changes the oracle's output not at all.

## Work here

Apply the `simulateCompound` clip we already ship (per `DIVERGENCES.md:688`,
used on the description/class paths) to state composite-anchor transitions,
before the spline is folded into the ink extent by `LimitFinder`. Ranking is
not involved and `rank.c`/`class2.c` were never reached — the jar's DOT sets
neither `compound` nor `ltail`.
