# cdd-T13 — cluster-anchored edge clipping

## Mechanism

`SvekEdge.java:671-672`: `dotPath = dotPath.simulateCompound(lhead ==
null ? null : lhead.getRectangleArea(), ltail == null ? null :
ltail.getRectangleArea())`, run AFTER the `:643-655` direction-reversal
check, so by clip time `dotPath` always runs entity1 (`ltail`) ->
entity2 (`lhead`). `ltail`/`lhead` are set at `:252-258` when
`startUid`/`endUid` (`link.getEntityPort1/2(bibliotekon)`) begins with
`Cluster.CENTER_ID`. `src/core/spline-clip.ts`'s `clipSplineStart`/
`clipSplineEnd` are an existing faithful port of `DotPath
#simulateCompound`'s two branches, but had no class-diagram caller
before this task.

## What landed

- `class-shield-helpers.ts#clipClusterEdgeEnds(points, startId, endId,
  clusterRects)`: the shared wiring both call sites use. Looks up each
  end's id in `clusterRects` (built from `NamespaceGeo.x/y/width/height`
  — the same real graphviz cluster box the byte-identical rendered
  `<path class="cluster">` comes from) and calls `clipSplineStart`/
  `clipSplineEnd` independently. A no-op end (id absent, or already
  outside the rect) returns `points` unchanged — the clip functions
  carry that guard themselves.
- `class-edge-geo.ts#buildEdgeGeos`: new `clusterRects` param; after
  `normalizeEdgePoints` (which already reorders `points[0]`/`.at(-1)`
  to match entity1/entity2), `startId`/`endId` are `rel.from`/`rel.to`
  re-ordered by `matchesFromTo` — exactly mirroring upstream's own
  post-reversal `ltail`/`lhead` assignment.
- `layout.ts`: builds `clusterRects` from `namespaces` (already computed
  before both `buildEdgeGeos` and `mapNoteGeos`, same pre-chrome
  coordinate frame as `result.edges[].points` — `core/graph-layout.ts
  #shiftToOrigin` shifts nodes/edges/clusters together).
- **Write-set extension (flagged, precedent rows 18/29/36/39):** a
  `note top of <package>` connector is upstream's OWN `SvekEdge` too
  (`CommandFactoryNoteOnEntity.java:342`), and decision-journal rows
  36/39 explicitly named this as T13's own residual (pecabi/sanixi's
  1/0). Fixed in `note-layout-tip.ts#resolveGroupGeos` (+ new
  `groupConnectorPoints` helper, split out for the CCN hook — 12 CCN in
  one function, fixed by extracting the clip-decision into its own 6-
  line function) and `mapNoteGeos`'s optional 5th param (restructured
  from a bare `freestandingConnectors` map into `{
  freestandingConnectors, clusterRects }` — no existing call site broke,
  since all test callers omit the optional param and the one production
  call site is updated alongside). A note connector's direction
  (note-first vs host-first) is not threaded onto `NoteGeo`
  (`renderer-note-connector.ts#noteIsConnectorSource`'s own doc comment
  names the same gap for rendering) — sidestepped by passing
  `group.target` as BOTH `startId` and `endId`: `clipClusterEdgeEnds`
  only clips whichever end the boundary-`contains` test actually finds
  inside the rect, and a note connector has at most one cluster-anchored
  end, so this is safe without knowing which end is which.

## Residual (filed, stop 8): `docs/graphviz-issues/18-compound-clip-last-segment-shape-delta.md`

For 6 of the 17 GEO1 fixtures (`bejusa`, `pisobo`, `runane`, `vusute` —
relationship edges; `pecabi`, `sanixi` — note connectors), the clip
lands on the curve's LAST bezier segment and that segment's own
trailing two points (its `cp2`/endpoint) differ from the jar's by a
near-constant amount (~20px for the four relationship-edge fixtures,
~4.9px for the two note-connector ones) — while the segment's LEADING
point matches the jar to within 0.003px, the segment COUNT matches
exactly, and (verified directly) the cluster's own rendered `<path>`
and every node's `<rect x y>` are byte-identical between engines on
both `bejusa` and `pecabi`. `bejusa`'s structurally-identical sibling
edge (`PCAN_DRV *-- Bus_Tx`) clips exact (<0.001px) — a negative
control ruling out a wiring bug (wrong end, wrong rect, wrong segment
index all eliminated). Classified as a per-curve `@knowvah/dot-engine`
spline-shape delta in the routed curve's own trailing control points
near a cluster boundary — not chased/tuned.

`bajotu-30-soku184` (this task's own acceptance-criteria fixture) and
`PCAN_DRV -> Bus_Tx` (bejusa's third cluster edge) clip EXACT — the
delta is not general to every cluster-anchored clip.

## Verified NOT a regression

- `npx jiti scripts/dot-sync-report.ts class`: 711/712, unchanged (this
  is a render-only fix, no DOT emission change).
- `pin-diff b3.json t13.json`: 11 transitions, ALL 11 are inside this
  task's own 17-fixture GEO1 reach list (bajotu, bejusa, pecabi,
  pisobo, runane, sanixi, vusute moved verdict; cocube, delasa, lojiga,
  sijisi moved diff-count only, verdict unchanged). Zero fixtures
  outside the 17 moved at all. None of the 17 was ever `conformant` in
  `b3.json` (D3: all were `diverged`), so no b3-conformant fixture lost
  conformance.
- `jojime`/`rezoba`/`mujopi` (3 of the 17 with unchanged/zero pin-diff
  verdict transitions) were independently confirmed via a `git stash`
  before/after `render-diff` comparison to have MOVED closer to the jar
  (numeric diff count dropped, e.g. jojime 25->0, rezoba 20->0) even
  though their remaining STRUCTURAL diff count is unchanged — those
  fixtures carry another, unrelated mechanism (per the brief's own
  framing: batch 4's T12/T14, batch 5, T37) that T13 does not (and
  should not) fix; T13's own clip measurably improved, never worsened,
  their content.
- `sokevu-87-toce485`, `guxode-39-dobi371`, `nijeli-04-ponu844`: byte-
  for-byte unchanged before/after (structural AND numeric counts
  identical) — confirms T13's clip is a genuine no-op on fixtures whose
  divergence has nothing to do with M1.

## Endpoint verdict per fixture (17 GEO1 fixtures)

Exact (both structural AND the specific clip endpoint numeric-exact):
`bajotu-30-soku184`, and `PCAN_DRV -> Bus_Tx` within `bejusa-95-gafo325`.

Residual named (structural fixed, endpoint lands on OUR OWN cluster's
own border self-consistently, small numeric gap vs jar's own clip
point filed as issue 18): `bejusa-95-gafo325` (2 of 3 edges),
`pecabi-95-demu756`, `sanixi-31-nofa193`, `pisobo-93-sipa138`,
`runane-30-vena766`, `vusute-48-xono099`.

Improved but not fully resolved (numeric fell, structural count
unchanged — a DIFFERENT, pre-existing mechanism, out of scope):
`jojime-80-savu279`, `rezoba-58-xaze387`, `mujopi-30-zadi566`.

Unchanged (pre-existing large divergence, unrelated to M1, confirmed
byte-identical before/after): `cocube-46-tusu692` (diff count rose
slightly, not fixed — has its own unrelated large divergence),
`delasa-80-jusu462`, `lojiga-09-meka859`, `sijisi-94-ripu606`,
`sokevu-87-toce485`, `guxode-39-dobi371`, `nijeli-04-ponu844`.

## Gotcha for future tasks

`layoutFixtureClass`'s `geo` is PRE-chrome (no title/legend shift
applied) — do not compare its `edge.points`/`namespaces[].y` directly
against a fixture's rendered `<path d>`/`<rect y>` when the diagram has
a `title`/annotation; the two frames differ by the chrome height
(confirmed uniform for plain nodes, but NOT uniform end-to-end on a
decorated edge's endpoint, because arrow/diamond decoration shortening
is a SEPARATE render-time trim applied only at decorated ends — compare
`layoutFixtureClass`'s geo against `renderSync`'s own rendered SVG
directly when in doubt, never assume a flat offset).
