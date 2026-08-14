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

  The `(8, 4)` group — `cidepu-54-bemo048`, `kicolo-81-sidi387` — is the same
  mechanism seen at full size rather than as a fractional residual, and joins
  (a). After T15 every class box in `cidepu` matches jar exactly in SIZE; what
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
- **Impact**: both are the last known SHARED mechanisms in the class ink walk.
  Everything else in the ranking is either float noise (`0.001`, `0.005`) or a
  singleton. Anyone continuing the sweep should start here, and should expect a
  mission rather than a commit.
- **Confidence**: High — both measured against cached oracles, with the
  upstream code path named in each case.
