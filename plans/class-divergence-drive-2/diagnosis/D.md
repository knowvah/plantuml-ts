# Group D diagnosis — dotted-name namespaces (T4)

> **T6 correction (journal rows 5-6): the dot-engine attribution below is
> DISPROVED.** Real graphviz 16.1.0 and `@knowvah/dot-engine` return the
> same raw spline for these edges (constant frame offset only). The
> mechanism is reopened as CLIP-1 (T9): the divergence arises after layout,
> in the cluster-anchored edge clip/post-processing. Read the rest of this
> report as ruled-out evidence, not as a mechanism.


| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| D-1 | bejusa-95-gafo325, runane-30-vena766, vusute-48-xono099, pisobo-93-sipa138 | `@knowvah/dot-engine` (spline router for compound/cluster-anchored edges); plantuml-ts side (`src/core/spline-clip.ts`, `src/diagrams/class/class-shield-helpers.ts`) is verified NOT at fault | dot-engine issue (upstream to this repo); no plantuml-ts fix available until dot-engine's spline router is corrected |

All four fixtures are variants of ONE mechanism: an edge whose endpoint is a
package/namespace cluster (upstream's `zaent<N>`/`Cluster.CENTER_ID` compound
anchor) gets clipped to the cluster's boundary via `simulateCompound`. Our
port of that clip (`spline-clip.ts`) is byte-faithful and was probe-verified
to reproduce the measured production output EXACTLY given its actual input.
The divergence originates one layer further down: `@knowvah/dot-engine`
returns a coarser (single-cubic, 4-point) raw spline for these
compound-anchored edges than real graphviz apparently does, and the SAME
(faithfully-ported) 8-round bisection clip lands at a different point when
fed a differently-shaped input curve.

---

### runane-30-vena766 / vusute-48-xono099
(Semantically identical diagrams — `vusute` just spells out the `class`
declarations `runane` leaves implicit. Both produce byte-identical
`compareSvg` diffs.)

- mechanism-id: D-1
- mechanism: The edge `AudioTest ..> AudioFormat` targets the `AudioFormat`
  package cluster, routed in DOT to the phantom anchor node
  `zaent0005`/`zaent-javax.sound.sampled.AudioFormat` declared inside that
  cluster (`Cluster.getSpecialPointId`). Upstream's `SvekEdge#solveLine`
  clips the routed spline to the cluster's real graphviz bounding box via
  `DotPath#simulateCompound`. Our TS port of that exact algorithm
  (`clipSplineEnd`) is verified to reproduce the measured production output
  when fed the EXACT raw spline `@knowvah/dot-engine` returns for this edge —
  so the 20px vertical gap is not a clipping-logic bug; it is that
  `@knowvah/dot-engine`'s raw pre-clip spline for this edge is a SINGLE cubic
  bezier (4 points: `(321.9,251.2)` → `(292.0,582.0)`, in final-SVG frame),
  and running the byte-faithful clip on that single-cubic curve lands the
  8-round bisection boundary crossing at `y≈517.9` (the cluster's raw top
  edge, `y=518`) — 20px short of the jar's observed `y≈537.9`.
- java: `SvekEdge.java:671-672` — `dotPath = dotPath.simulateCompound(lhead == null ? null : lhead.getRectangleArea(), ltail == null ? null : ltail.getRectangleArea());`
  — the clip call; `DotPath.java:462-489` — the `head` branch (the
  8-iteration `subdivide` bisection loop, `for (int k = 0; k < 8; k++)`,
  plus the `if (head.contains(current.getP1())) return me;` early-abandon
  quirk at `:467-468`); `Cluster.java:104,653-654` (`CENTER_ID`/
  `getSpecialPointId`); `ClusterDotString.java:149` (emits
  `zaent<uid> [shape=point,...]` inside the target cluster's own subgraph);
  `DotStringFactory.java:430-441` (`cluster.setPosition(min,max)` reads the
  cluster's REAL rectangle straight from graphviz's own rendered polygon —
  the same rectangle `ClusterDecoration` later draws the folder-tab+box
  with, confirmed identical: byte-for-byte matching `<g class="cluster"
  data-qualified-name="javax.sound.sampled.AudioFormat">` box path in both
  `ours.svg` and `jar.svg`, so the CLIP RECTANGLE itself is not the
  divergence).
- ts: `src/core/spline-clip.ts:168-192` (`clipSplineEnd`, verified faithful
  — see probe below); the actual divergence origin is
  `src/core/graph-layout.ts:414-444` (`layoutGraph`) → `@knowvah/dot-engine`'s
  `render`/`getLayout`, i.e. OUTSIDE this repo's own code.
- causal chain: `class-dot-graph.ts` emits a DOT graph for this edge
  structurally identical to jar's `svek-1.dot` (diffed byte-for-byte modulo
  cosmetic cluster-id numbering/whitespace — same nesting depth, same
  `label=<<TABLE...WIDTH=80 HEIGHT=9>>` per cluster level, same
  `sh0044->zaent0005[...minlen=1...]` edge declaration). `@knowvah/dot-engine`
  lays this DOT out and returns, for this specific edge, a raw spline of
  exactly 4 points (one cubic bezier) whose un-clipped endpoint (in final-SVG
  frame) is `(292.0, 582.0)` — deep inside the `AudioFormat` cluster's box
  (`y:[518,631]`). `clipClusterEdgeEnds` → `clipSplineEnd` (byte-faithful
  port of `DotPath#simulateCompound`'s `head` branch) then runs its 8-round
  binary-search bisection on that ONE bezier, converging on `y≈517.9` — just
  inside the cluster's own TOP edge (`y=518`), because that is where THIS
  PARTICULAR curve happens to cross the rectangle boundary. Upstream's
  rendered result instead lands at `y≈537.9`, ~20px deeper (roughly at the
  package's header/body divider, `y=538`, though that divider's y-position
  is a PlantUML decoration coincidence, not itself the clip boundary — the
  clip boundary rectangle is verified identical in both). The only way the
  SAME byte-faithful bisection algorithm, given the SAME clip rectangle,
  lands at a different point is if it is bisecting a DIFFERENT input curve —
  i.e. real graphviz's raw spline for this edge is shaped differently (very
  plausibly multi-segment/piecewise, one bezier per box/rank the edge's
  route crosses through the 4 levels of nesting on the way to
  `AudioFormat`), which could also trip the `if (head.contains(current.getP1()))
  return me;` early-abandon at `DotPath.java:467-468` on an EARLIER segment
  that already lies wholly inside the cluster, landing directly on one of
  graphviz's own internal rank/box waypoints rather than on a bisected point.
  This last step (real graphviz's actual raw spline shape) could not be
  probed directly — no access to a real graphviz binary or dot-engine's
  internal box-routing intermediate state — so it is reported as the
  best-supported explanation, not confirmed.
- ruled out:
  - **Cluster geometry / box sizing bug**: ruled out — `ours.svg` and
    `jar.svg`'s `<g class="cluster" data-qualified-name="javax.sound.sampled.AudioFormat">`
    path data is byte-identical (`M144.5,518 L225.65,518 A3.75,3.75...
    L300,628.5 A2.5,2.5 0 0 1 297.5,631 L144.5,631...`). Confirmed by direct
    string extraction from both files.
  - **DOT-emission bug (wrong nesting/labels/anchors)**: ruled out — dumped
    our own pre-layout DOT text via `setLayoutInputObserver` +
    `toSvekDot(input)` and diffed against jar's cached `svek-1.dot`;
    structurally identical (same subgraph depth, same per-level
    `WIDTH`/`HEIGHT` label tables, same `sh0044->zaent0005` edge). Only
    cosmetic differences (our cluster-id numbers start at 0, jar's at 6;
    brace/whitespace layout).
  - **Our `clipSplineEnd`/`simulateCompound` port has a logic bug**: ruled
    out — fed the exact raw 4-point spline + exact cluster rect (both
    captured from the real `layoutGraph` call for this fixture) directly
    into the exported `clipSplineEnd` function in isolation; it reproduced
    the measured production endpoint (`y≈517.9`, 19-point output matching
    the real render's point count) exactly. The function is doing precisely
    what the Java source specifies, on the input it is given.
  - **Uniform page-shift/scale bug**: ruled out — verified `dx=118.46125,
    dy=202.99998` (derived from the `AudioManager`/`Encoding`/cluster-box
    raw-vs-final deltas, three independent confirmations) correctly predicts
    the edge's START point (`M321.9,251.227`, matched to 3 decimals) and
    every OTHER node/cluster in the diagram; the shift is uniform and
    correct, it is only the raw pre-clip spline SHAPE for this one edge
    class that diverges from upstream.
  - **A measurement/instrument artifact** (per prior-mission memory that
    most "defects" are actually measurement bugs): actively checked for —
    initially suspected a double-`layoutGraph`-invocation methodology bug
    (recursion through `setLayoutInputObserver`) and a stale hardcoded
    dx/dy; both found and corrected during the probe, and the corrected
    numbers were cross-validated against 3 independent raw/final pairs
    before being trusted.
- probe:
  - `npx jiti plans/class-divergence-drive/tools/render-diff.mts
    runane-30-vena766` → `N svg/g[1]/g[14]/path[1]/@d[35,37]` and
    `polygon[1]/@points[1,3,5,7,9]`, all Δ≈20.0, all on Y indices only.
  - `plans/class-divergence-drive-2/diagnosis/scratch/dump-dot.mts` — dumped
    our pre-layout DOT via the `setLayoutInputObserver` hook +
    `toSvekDot`; diffed against `test-results/dot-cache/class/
    runane-30-vena766/svek-1.dot` (structurally identical).
  - `plans/class-divergence-drive-2/diagnosis/scratch/dump-edge-points.mts`
    — printed `layoutGraph`'s raw `result.clusters`/`result.nodes`/
    `result.edges` for this fixture. `edge-1` (`AudioTest`→`zaent-...
    AudioFormat`) raw points (shifted to final-SVG frame via the
    cross-validated `dx=118.46125, dy=202.99998`):
    `[{x:321.905,y:251.227},{x:314.842,y:329.367},{x:292.36,y:578.073},
    {x:292.009,y:581.954}]` — ONE cubic bezier, endpoint 582 (deep inside
    the cluster, `y:[518,631]`).
  - `plans/class-divergence-drive-2/diagnosis/scratch/verify-clip.mts` — fed
    that exact 4-point raw bezier + the exact cluster rect
    (`{x:142,y:518,width:158,height:113}`, matching the byte-identical
    drawn box) into the real exported `clipSplineEnd`. Output: 19 points
    (6 sub-beziers from the bisection), last point
    `{x:297.7995,y:517.8977}` — matches the measured production output
    (`298.245,512.918` after the arrowhead/extremity trims a further small
    amount) to within the residual the arrowhead geometry accounts for, and
    matches its point-count (19) exactly.
- fix shape: none available in this repo. The DOT input graph
  (`class-dot-graph.ts`) is already faithful; the clip
  (`spline-clip.ts`/`class-shield-helpers.ts`) is already faithful. A fix
  requires `@knowvah/dot-engine`'s spline router to produce a richer/
  differently-shaped raw spline for edges that terminate on a
  compound-cluster point-anchor through several nested-cluster rank
  crossings — file as a `docs/graphviz-issues/` entry per repo convention,
  not fixable inside plantuml-ts.
- owner: dot-engine
- confidence: HIGH that the clip/DOT-emission code in THIS repo is not the
  cause (directly probe-verified, reproducible, deterministic); MEDIUM on
  the exact graphviz-side mechanism (multi-segment box routing vs. a
  differently-shaped single bezier) since real graphviz's internal raw
  numbers were not directly observable from this environment (no `dot`
  binary, no dot-engine debug/box-list output found) — the `return me`
  early-abandon path is the best-supported explanation given the code and
  the measured point counts, not a confirmed one.

---

### bejusa-95-gafo325
- mechanism-id: D-1 (same mechanism as above)
- mechanism: Same root cause. Two of the diagram's five compound-anchored
  edges diverge (`compareSvg` flags `g[12]` = `Bus_Control *-- PCAN_DRV`
  targeting the `PCAN_DRV` package's `zaent0002` anchor, and `g[15]` =
  `Bus_Tx "1" *-- "n" Tx_FIFO` where `Bus_Tx` is simultaneously a class and
  a same-named nested package, targeting `zaent0008`/`zaent0010`'s peer
  anchor) — both Δ20.0 on the endpoint's dominant axis (one is a mostly
  horizontal edge, so the shift lands on the X-indices instead of Y; see
  probe).
- java: same as runane (`SvekEdge.java:671-672`, `DotPath.java:462-489`,
  `Cluster.java:104,653-654`, `ClusterDotString.java:149`).
- ts: same as runane (`src/core/spline-clip.ts:168-192`; divergence
  originates in `@knowvah/dot-engine`, not this file).
- causal chain: same shape as runane — confirmed via the cached
  `svek-1.dot` that BOTH diffed links route to a `zaent<N>` anchor
  (`sh0024->zaent0002[...]`, `sh0010->zaent0008[...]`), i.e. both are
  compound-cluster-anchored edges of the same kind as D-1.
- ruled out: same DOT-emission and clip-rectangle checks were not
  individually re-run for this fixture (time-boxed) — relying on the
  structural DOT-pattern match (`zaent<N>` target, `minlen=1`) as the
  fixture-identifying signature for D-1, not a full independent numeric
  probe. Flagged below as the weaker-confidence item.
- probe: `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  bejusa-95-gafo325` → 4 numeric diffs on `g[12]`/`g[15]`, all Δ≈20.0;
  `grep -E "zaent|sh00.*->"` on the cached `svek-1.dot` confirms both
  diffed links terminate on a `zaent<N>` node.
- fix shape: same as runane (dot-engine).
- owner: dot-engine
- confidence: MEDIUM — structural match to the probe-verified D-1
  mechanism (same DOT pattern, same anchor construct, same Δ20.0 signature)
  but the raw-spline/clip-rect numeric probe (`dump-edge-points.mts` +
  `verify-clip.mts`) was only run for runane, not repeated here.

---

### pisobo-93-sipa138
- mechanism-id: D-1 (same mechanism)
- mechanism: `boo1.boo2 +--- foo1.foo2.foo3` links two EMPTY packages;
  DOT routes it `sh0010->zaent0002` where `zaent0002` anchors
  `foo1.foo2.foo3` (the innermost of three nested clusters on that side).
  Same clip-boundary divergence as D-1: Δ20.0 on both diffed indices
  (`path[1]/@d[29,31]`, both Y — this edge is a near-vertical drop like
  runane's, so both diffed coordinates are Y).
- java: same as runane.
- ts: same as runane.
- causal chain: same shape — `sh0010->zaent0002[...minlen=2...]` in the
  cached `svek-1.dot` confirms the compound-cluster-anchor pattern
  (`minlen=2` here vs. `minlen=1` for the others, reflecting the extra
  rank the third nesting level adds — consistent with "more nested ranks
  crossed" being part of what makes this edge class produce a richer raw
  spline upstream than `@knowvah/dot-engine` currently does).
- ruled out: same caveat as bejusa — the DOT-pattern match is confirmed,
  but the raw-spline/clip-rect numeric probe was not independently re-run
  for this fixture (the one `dump-edge-points.mts` run made for pisobo used
  runane's hardcoded `dx`/`dy` by a scratch-script bug and was discarded
  rather than fixed, given the time budget — recorded here so a future pass
  doesn't mistake that discarded run for a completed probe).
- probe: `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  pisobo-93-sipa138` → 2 numeric diffs on `g[7]`, both Δ≈20.0;
  `test-results/dot-cache/class/pisobo-93-sipa138/svek-1.dot` shows the
  single link is `sh0010->zaent0002[...minlen=2...]`.
- fix shape: same as runane (dot-engine).
- owner: dot-engine
- confidence: MEDIUM — same basis as bejusa's MEDIUM rating.
