## Observation: the class-engine ink gaps left after the shared-offset sweep

- **Context**: G9/T12-T15 closed four shared-offset groups in the class
  engine's ink walk by ranking cached fixtures whose misses collapse to ONE
  rigid (dx, dy). Two groups remain diagnosed but unfixed; both are
  mission-sized, not one-commit fixes. Recorded so the next reader starts from
  the mechanism rather than re-deriving it.
- **Superseded**: the `(0, 4)` group (`kidugi-68-noje040`,
  `minuko-19-pobo264`) was NOT an ink rule — it was `portNodeSize` reading a
  member-port classifier back at graphviz's `PAD`ded size. Closed by T15
  (`fe5e43db`); do not re-open it as an ink question.
- **Finding**:

  **(a) `(0.18, 0)` — the namespace box is a member-bbox approximation, not
  the cluster box.** `class-geo-builders.ts#buildNamespaceGeos:222-227`
  computes a package's box as `min/max` over its member NODE positions
  ± `NAMESPACE_SIDE_PADDING`. Jar reads the CLUSTER polygon graphviz drew
  (`DotStringFactory#solve:429-434` -> `Cluster#setPosition`) and pads THAT.
  The two differ by the cluster box's own fractional offset: on
  `dopuzi-50-muxo994` the engine reports `cluster0` at `x = -8.181` (graphviz's
  8pt CL_OFFSET, fractionally placed), so jar's package left is `-8.181 - 8 =
  -16.181` where ours is `0 - 16 = -16`. The 0.181 propagates to every child,
  halved by centring, as the observed 0.18.
  Affects `dopuzi-50-muxo994`, `finono-05-cuvu171`, `zomidu-04-fizu253` in this
  group and, in principle, every namespace fixture (~100). `DotLayoutResult
  .clusters` already carries what is needed — the state engine consumes it via
  `clusterPosMap` — so the fix is a re-derivation of the box plus a re-check of
  `NAMESPACE_SIDE_PADDING`/`NAMESPACE_TOP_EXTRA`, which exist only to
  approximate what the cluster box already knows.

  **Five of the ranking's groups are this ONE mechanism — 11 fixtures, not 3.**
  Every one of them puts a classifier inside a package, whether declared
  (`package a`) or implicit via a dotted name (`class A.B.Z`, `class
  foo1.foo2`), which is why a grep for `^package` undercounts them:

  | group | fixtures | package form |
  |---|---|---|
  | `(0.18, 0)` | `dopuzi-50-muxo994`, `finono-05-cuvu171`, `zomidu-04-fizu253` | declared |
  | `(0.32, 0)` | `jinibe-02-tebi269`, `mucuxi-36-beku683` | declared (one `packageStyle rect`) |
  | `(0.39, 0)` | `ditapa-46-bete946`, `repipi-06-dike782` | implicit / declared |
  | `(-0.29, 0)` | `sugifi-33-xefe083`, `sumule-00-pefa744` | implicit (`A.B.Z`) |
  | `(8, 4)` | `cidepu-54-bemo048`, `kicolo-81-sidi387` | implicit (`pack.ClassA`) |

  The fractional groups differ only in WHICH fraction the cluster box landed
  on; `(8, 4)` is the same thing at full size, where our approximation misses
  `CL_OFFSET` outright rather than just its remainder.

  The `(8, 4)` pair also carries the one measurement that does not fit. After
  T15 every class box in `cidepu` matches jar exactly in SIZE; what
  remains is a rigid (8, 4) on all three of them while the package outline's
  own top-left is pinned at (6, 6) on both sides by the document margin. The
  padding around the members measures:

  | side | ours | jar |
  |---|---|---|
  | left | 16 | 24 |
  | right | 16 | 24.262 |
  | bottom | 16 | 20 |
  | top | 33 | 37 |

  x is +8 — `CL_OFFSET` on top of our 16, exactly (a) — and the 0.262 on the
  right is (a)'s fractional cluster placement, the same thing the `0.18` group
  shows. **The y side is +4, not +8, and that is NOT yet explained**; whoever
  takes (a) should treat the vertical half as an open question rather than
  assume `CL_OFFSET` applies symmetrically.

  **(b) `(0, -1.5)` — a USymbol classifier takes the classifier-box ink rule.**
  A `kind: 'descriptive'` classifier with a `usymbol` (actor, component, node,
  database, …) draws its own klimt shapes, but `class-ink-box.ts
  #addClassifierInk` has branches only for `folderTab`, `usecase` and
  `lollipop` — everything else falls to `addRectInk`'s `(x-1, y-1)`.
  Measured on `cacoma-43-poxu615`: the actor's geo box top is `y = 0`, its
  drawn head ellipse top is `y = 0.5`, and jar's ink is the union of the drawn
  `UEllipse` + `UPath` + label `UText` — head top 0.5 against our `-1`, hence
  the uniform 1.5.
  Affects `cacoma-43-poxu615`, `cezaka-60-jado323` here; 6 cached class
  fixtures carry `mix_actor`/`mix_usecase`/`actor`/`usecase`. A real fix needs
  a per-USymbol ink rule (the same shape `renderer-arrowhead.ts
  #edgeExtremityInk` already takes for edge decor: walk the symbol's own
  shapes), not another special case.
  **(c) state's `(-0.261, 0)` — the composite's inner canvas, not an ink rule.**
  `bemena-23-zebu249`, `pajefo-95-neri955`, `xepafa-33-lazi826` are one diagram
  in three spellings. Their document size already matches jar exactly and every
  shape is within 0.01 EXCEPT the `Configuring` composite, whose box is 0.527
  wider than jar's; everything to its right then sits at half that, 0.261.
  The composite reaches the outer scope as a plain node — jar's `svek-2.dot`
  declares `sh0012 [width=5.449097]` where we declare `5.456412`, and our
  document dims are exactly that engine width + 24.

  Ruled out, with the evidence:
  - **Our DOT is not wrong.** Every node width and every edge-label table in
    our `svek-1` matches jar's byte for byte.
  - **The engine is not wrong.** `dot -Tplain` (graphviz 15.1.1) on jar's own
    `svek-1.dot` puts all three nodes and both edge splines at coordinates the
    engine reproduces EXACTLY, and our three label centres match graphviz's
    42.315 / 165.816 / 292.111 to 0.003 once the origin shift is removed.
  - **Node declaration order is not the cause here, though it IS divergent.**
    Jar declares the `[*]` circle FIRST in both scopes (it is the source of the
    first transition); we append synthetic `__init_*`/`__zaent_*` nodes LAST,
    so the `shNNNN` ids are assigned in a different order than upstream's.
    Re-running the same graph with the circle moved to the front gives a
    byte-identical layout, so it is not what produces the 0.527 — but it is a
    real divergence the DOT comparator cannot see (it ignores synthetic ids),
    and it is worth its own look on a fixture where order does bite.

  What is left is the derivation of the composite's own node size from the
  inner layout: ours is the engine's canvas + 24, jar's is its own inner
  `LimitFinder` walk. That is where a fix has to start.
- **Impact**: (a) is a single mission worth 11 measured fixtures and ~100 in
  principle, not the five separate small groups the ranking makes it look like.
  (b) and (c) are smaller and independent. Everything else in the ranking is
  float noise (`0.001`, `0.005`), a singleton, or a structurally-divergent big
  diagram (`puvono-84-doro361`/`sekame-22-meze147`, 20 of 160 shapes aligned and
  161px too wide — a different kind of problem). There are no cheap shared-offset
  wins left; anyone continuing should expect a mission rather than a commit.
- **Confidence**: High — every claim measured against cached oracles or, for
  (c), against real graphviz directly, with the upstream code path named.
