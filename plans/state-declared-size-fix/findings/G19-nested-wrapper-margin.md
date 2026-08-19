# G19 findings (T13) — nested-cluster wrapper margin (fovafu-44#b)

Re-measured before any new diagnosis, per task instruction: `npx jiti
scripts/measure-composite-declared-size.ts fovafu-44-mifu394` ->
`{"fixtures":1,"declarations":8,"exact":6,"mismatched":2,"lastDigitOnly":0,
"unmatchedFixtures":0,"dirtyFixtures":1}`. Scope-1 (A's own leaf rows) is
now fully exact (T5/G10 landed). Scope-2 height is now sub-threshold exact
(0.0038px, was −10.594px at SI28 time, −12.00px mid-Batch-1); width is
+7.8204959999999915px (was −4.18px at SI28, −4.18→+7.82 per T8's journal
row). This is a DIFFERENT sign/magnitude than SI28's #b record (which
predates T5 G10 and T8's clusterPosMap fix) — confirms T8 landed be193177
already moved this row exactly as journaled, and no later batch moved it
further (T9/batch-3 also confirm this value in their journal rows).

### fovafu-44-mifu394#b

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 3.025285 | 2.916667 | 7.8204959999999915 |
  | 2 | height | 0 | 2.908109 | 2.908056 | 0.0038159999999898275 |
- **status:** resolved
- **mechanism:** CONFIRMS T8/issue-15's account with fresh numbers and a
  direct probe of our own engine's layout — not a re-statement of the prior
  claim. Scope 2 is `B`'s outer `InnerStateAutonom` pass wrapping the
  already-laid-out `A` cluster (from scope 1) as a single node; `B`'s
  declared width is `measureAutonomWrapper`'s `mergedWidth + delta`
  (`state-composite-sizing.ts:79,83`), and since `B` has no description and
  a 1-char name, `mergedWidth === childImg.width` — the ENTIRE +7.82px lands
  on `childImg.width`. `childImg` comes from
  `computeSvekResultGeometry(inkStates, inkTransitions)`
  (`state-composite-autonom.ts:262-266`, `buildPlainAutonomSpec`), which
  folds every point of each transition's ROUTED SPLINE
  (`layout-ink-extent.ts:385`, `addTransitionInk`: `for (const p of
  transition.points) addPoint(box, p.x, p.y)`) — this mirrors jar's own
  `SvekResult#calculateDimension` -> `TextBlockUtils.getMinMax(this, ...,
  false)` walk, which calls `SvekResult#drawU` (`SvekResult.java:80-98`),
  which draws every `SvekEdge` including its spline
  (`svekEdge.drawU(ug2)`, `SvekResult.java:96`). Both ports use the SAME
  recipe (drawn ink of nodes + edge splines); only the ROUTED SPLINE differs
  between engines. Direct probe: called `layoutGraph` on the captured scope-1
  input graph (`X`,`Y`,`__zaent_A` inside `cluster0` labeled `A` — this
  matches jar's `svek-1.dot` `cluster6` nesting structurally, DOT-parity
  EQUAL) and read the raw layout back. Our point anchor `__zaent_A` lands at
  `y=112.02387241880626` — between leaf `X`/`Y`'s own top (87.38) and bottom
  (137.38), i.e. ranked with its edge target `Y`, not at the cluster's own
  border rank. jar's `in.svg` (`test-results/dot-cache/state/
  fovafu-44-mifu394/in.svg`) shows the analogous edge `A-to-Y` starting at
  `M185.997,88.187` — `88.187` is `cluster A`'s own top-border y in that
  same SVG (`<g class="cluster" ...><path d="M31.5,88.38 ...`), i.e.
  graphviz pins the anchor to the cluster's border. Our edge's routed spline
  (`edge-1` in the probed layout) reaches `x=157.8204967462667` — 39.8px
  right of leaf `X`'s own right edge (118) and past the anchor node's own x
  (141.64–142.36) — a wide rightward excursion consistent with a
  differently-ranked, differently-positioned anchor producing a differently
  shaped curve. jar's path's rightmost point is its START point,
  `x=185.997`, staying 7.003px inside cluster A's own right border (193,
  from `<rect x="19" ... width="174">` -> right edge 193) — matching issue
  15's "7px inside" vs "7.82px past the frontier" framing exactly. Both
  height rows (scope 2 and every scope-1 row) are now exact, which is only
  possible if the NODE geometry (real leaf/cluster positions, unaffected by
  this one edge's spline) matches jar's; the isolated, single-axis residual
  is consistent with one mis-ranked point node, not a broader layout
  divergence.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:385
  (`addTransitionInk`'s `for (const p of transition.points) addPoint(box,
  p.x, p.y)` — the site where the dot-engine's mis-ranked spline point
  enters our declared-size computation); consumed at
  src/diagrams/state/state-composite-sizing.ts:79 (`measureAutonomWrapper`'s
  `mergedWidth = Math.max(text.width, attr.width, childImg.width)`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
  (`calculateDimension` -> `TextBlockUtils.getMinMax(this, stringBounder,
  false)`, the walk our `computeSvekResultGeometry` mirrors) and
  SvekResult.java:80-98 (`drawU`, specifically `svekEdge.drawU(ug2)` at
  line 96 — the edge-spline ink fold that line 385 above reproduces);
  ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/InnerStateAutonom.java:186-197
  (`calculateDimensionSlow`'s `im.calculateDimension(stringBounder)`, where
  `im` is `A`'s own `SvekResult`, matching `childImg` here). The RANKING
  itself (why graphviz pins a cluster-clipped edge's point-shape anchor to
  the border rank) is in graphviz's own C, NOT the jar Java — `~/git/graphviz/
  lib/dotgen/rank.c` / `class2.c` (cited, not yet read line-by-line; see
  `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-target.md`'s own
  "Not yet verified" note, unchanged by this task — that file's write-set is
  `docs/graphviz-issues/`, outside T13's).
- **causalChain:** ours 3.025285in × 72 = 217.8204967... px; jar 2.916667in
  × 72 = 210.0000007... px (implied full-precision jar target = ours −
  Δpx = 217.8204967462667 − 7.8204959999999915 = 210.0000007462752,
  ÷72 = 2.9166666770...in, rounds to jar's displayed 2.916667 — consistent).
  `measureAutonomWrapper`'s fixed `delta` (`MARGIN*2 + 2*MARGIN_LINE +
  marginForFields` = 5*2+2*5+0 = 20px, `IEntityImage.ts:28,32`) and the
  `text`/`attr` terms for `B` (1-char name, no description) are shared by
  both sides and verified equal by the height row's near-exact match
  (0.0038px, 132× below the 0.05px sub-pixel threshold, SCHEMA rule 5) — so
  the entire width Δ is isolated to `childImg.width`, and `childImg.width`
  is isolated to the one routed spline's rightward excursion (see mechanism).
- **ruledOut:** (1) A residual leaf-width/label bug: scope-1 rows (X, Y
  widths) are byte-exact (T5/G10), and this scope-2 row has no label
  (`A -> Y` carries no `:text`) and no arrowhead ink fold (`from !== to`,
  so `arrowheadInk === 'self-loop'` guard at `layout-ink-extent.ts:401`
  returns before folding any arrowhead geometry) — ruled out by direct
  inspection of the transition's fields, not assumption. (2) A node-position
  mismatch (our engine placing `X`/`Y`/cluster `A` differently than
  graphviz): ruled out by the height row's near-exact match — if real node
  positions diverged, height (which folds the SAME node set, only omitting
  this one edge's y-extent since its points stay within the y-range) would
  also show a residual, and it does not. (3) A margin/`delta`-constant
  divergence in `measureAutonomWrapper` itself (SI28's original hypothesis,
  "smaller MARGIN/MARGIN_LINE-derived allowance"): ruled out by the height
  row's near-exact match, since `delta` is added to BOTH axes identically —
  a wrong constant would show on height too. (4) This being a NEW/different
  defect from T8's journaled account: ruled out — the re-measured Δpx
  (7.8204959999999915) and the size-backlog pin
  (`0.10861799999999988` = 7.82049.../72) are IDENTICAL to T8's landed
  value; nothing moved this row since be193177.
- **pairingRisk:** none — scope 2 has exactly 1 declared node (`B`).
- **sharedCauseWith:** none — grepped the mission's decision-journal and
  findings for `7.82`/`7.8204`; no other fixture in this mission carries
  this delta (jetuse-93-gopi146's residual is a different value, 5.000px /
  0.069445in, diagnosed separately in `concurrent-region.md`).
- **proposedWriteSet:** N/A — root cause is `@knowvah/dot-engine`'s own
  ranking of a `shape=point` cluster-clipped edge tail, not this repo's
  `src/`. No in-repo change can close this row without diverging from the
  D-D6/D8-mandated engine boundary (ADR "one layout engine: dot-engine,
  never Smetana" — CLAUDE.md — treats `@knowvah/dot-engine` geometry deltas
  as accepted, not chased). A local mitigation (e.g. clamping `childImg`'s
  ink walk to exclude a spline's excursion past the frontier) would be a
  fitted workaround forbidden by decisions.md#D8 ("never fit a value") and
  would risk masking real overflow ink on other fixtures.
- **sizeEstimate:** N/A — no local fix; upstream tracked at
  `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-target.md`
  (already filed by T8/T9, unchecked in `docs/graphviz-issues/TRACKER.md:84`)
  and pinned shrink-only in `oracle/goldens/state/size-backlog.json`
  (`"fovafu-44-mifu394": 0.10861799999999988`, T8's own re-pin note in that
  file's `_doc`).
- **confidence:** high
- **nextStep:** N/A for this mission — an engine-side residual, proven
  irreducible within this repo (diagnosis.md stop condition 2: cause is a
  constraint below the code, `@knowvah/dot-engine`'s rank assignment,
  documented with controlled-experiment evidence above). Follow-on (not
  T13's write-set): read `~/git/graphviz/lib/dotgen/rank.c` / `class2.c` to
  identify which pass pins a cluster-clipped edge's `shape=point` tail node
  to the cluster's border rank, and file/port that behavior into
  `@knowvah/dot-engine` — the "Not yet verified" line issue 15 already
  carries.
