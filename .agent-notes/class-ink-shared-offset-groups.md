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

  **(a) — SUPERSEDED 2026-08-14 by the `namespace-cluster-box` mission
  (`dc202e31` T5, with `62a278aa` T4 and `3a3fc581` T6). FIXED; do not
  re-open.** The package box is now the cluster polygon, read from
  `DotLayoutResult.clusters` with no padding, mirroring `Cluster#setPosition`
  (`Cluster.java:511-512`); the protection wrappers and HTML title table jar
  emits are now in our DOT, so the polygon graphviz returns is the real one;
  and `NAMESPACE_SIDE_PADDING`/`NAMESPACE_TOP_EXTRA` are deleted.

  Measured on `scripts/shape-match-report.ts` (committed by that mission as
  the gate both standing suites were blind to): **691 → 769** fixtures
  matching jar's document size exactly, and **20765 → 25403** rigid-aligned
  matched shapes, with zero fixtures regressing.

  Per-fixture outcome for the 11 named below — nine went FULLY exact
  (every shape, not just the document size):

  | fixture | before | after |
  |---|---|---|
  | `dopuzi-50-muxo994` | 6/9 | **9/9** |
  | `finono-05-cuvu171` | 6/9 | **9/9** |
  | `zomidu-04-fizu253` | 6/9 | **9/9** |
  | `jinibe-02-tebi269` | 4/7 | **7/7** |
  | `mucuxi-36-beku683` | 5/6 | **6/6** |
  | `ditapa-46-bete946` | 4/7 | **7/7** |
  | `repipi-06-dike782` | 28/31 | **31/31** |
  | `sugifi-33-xefe083` | 6/9 | **9/9** |
  | `sumule-00-pefa744` | 6/9 | **9/9** |
  | `cidepu-54-bemo048` | 13/28 | 13/28 (doc size now exact) |
  | `kicolo-81-sidi387` | 13/28 | 13/28 (doc size now exact) |

  The two that did not are a DIFFERENT mechanism, diagnosed and written up
  separately in `class-html-node-corner-vs-quantized-width.md`: both are
  member-port diagrams, and their residual is our centre→corner conversion
  using an unquantized width, not the package box. The `(8, 4)` group's
  "y side is +4, not +8, and that is NOT yet explained" question below is
  ANSWERED — there was never a separate y mechanism; the asymmetry was the
  old approximation's own (flat padding on three sides, `htitle + extra` on
  top, `CL_OFFSET` on none). Both axes went exact together.

  The original finding follows, unedited, for the record.

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

  **(b) CLOSED 2026-08-15** — fixed exactly as this entry proposed, by the
  per-USymbol ink walk rather than a fourth special case
  (`plans/usymbol-ink-rule/`, commit `bb820507`). `ClassifierGeo.symbolInk`
  now carries a `LimitFinder` walk over the leaf's own
  `EntityImageDescription`, measured at layout time where the drawable
  already exists, and `addClassifierInk` reads it in place of `addRectInk`.
  Harness: **773 → 776 doc-size-exact**, matched-shapes flat at 25695 (a
  UNIFORM offset is what rigid alignment already absorbed, so document size
  was the only axis that could move). `cezaka-60-jado323`,
  `sofagu-98-fezi999` and `gapisu-00-celo011` newly exact;
  `cacoma-43-poxu615` exact on height and every shape, 1px wide.

  **Two corrections to this entry's own text**, both found by measuring:
  the affected set is NOT just the two named here — `sofagu-98-fezi999`
  (class) and `gapisu-00-celo011`/`ruturo-47-kapi300` (OBJECT, which shares
  the class ink path) move too, so 6 class + 3 object carry the family. And
  "6 cached class fixtures" is RIGHT; an earlier pass through this mission
  reported 5 and blamed the note, which was a case-sensitive grep missing
  `sofagu`'s `Actor "fg" as fr`. The note was correct.

  Residual: `ruturo-47-kapi300` moved 424 → 422 against jar's 430, 2px
  further out on a fixture already 6 off and never exact — its height is
  dominated by another mechanism, unidentified.

  Original entry follows.

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
  **(c) CLOSED 2026-08-15** — by `plans/transition-label-ink/`, commit
  `c62f7d21`. It WAS an ink rule after all, just not one of the ones this
  entry ruled out: the composite's ink walk folded the label's
  `(int)`-floored DOT reservation at the glyph anchor, where upstream folds
  the `UEmpty` `TextBlockMarged#drawU` emits for the whole MARGED block
  (`TextBlockMarged.java:79-87` + `LimitFinder.java:159-162`), anchored at
  the reserved box's own corner. The per-fixture error is
  `floor(w + 2m) − w − m` = `1 − frac(measuredWidth)`, which is 0.525 for
  `EvNewValueSaved`; the remaining 0.002 was graphviz's 2dp SVG print
  precision, which jar inherits by scraping `dot -Tsvg`'s text.

  This entry's "our DOT is not wrong" and "the engine is not wrong" lines
  were both correct and remain so — the defect was downstream of both, in
  how the port derived the composite's node size from the inner layout,
  exactly where the entry's last paragraph said a fix had to start.

  Harness: `measure-composite-declared-size.ts` **2454 → 2469** exact with
  zero regressions; `shape-match-report.ts` **776 → 779** doc-size-exact
  and **25695 → 25952** matched shapes. The family is **six** fixtures, not
  the three named below — `jorere-75-peja265`, `ketibo-84-juzo029` and
  `zitifa-97-bizo337` carry the same composite. Full mechanism in
  `transition-label-ink.md`. The original entry follows, unedited.

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
  **(a), (b) and (c) are now ALL DONE — see their blocks above.**
  Everything else in the ranking is
  float noise (`0.001`, `0.005`), a singleton, or a structurally-divergent big
  diagram (`puvono-84-doro361`/`sekame-22-meze147`, 20 of 160 shapes aligned and
  161px too wide — a different kind of problem). There are no cheap shared-offset
  wins left; anyone continuing should expect a mission rather than a commit.
- **Confidence**: High — every claim measured against cached oracles or, for
  (c), against real graphviz directly, with the upstream code path named.
