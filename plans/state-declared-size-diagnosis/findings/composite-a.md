# composite-a findings (T1)

## Shared probes

All numbers reproduced live via `scripts_scratch/T1/dump-nodes.ts <slug>`
(harness pattern: `renderSync` + `WidthTableMeasurer` +
`setLayoutInputObserver`, same as `scripts/measure-composite-declared-size.ts`).
`ours` values below are re-measured and match `findings/PARTITION.md`'s
composite-a rows exactly (confirms T0's baseline is still current — no drift
since the branch point).

**Follow-up pass (arithmetic closure):** for the `clusterPosMap: undefined`
group, `scripts_scratch/T1/probe-full-close.ts` replays the exact captured
`DotInputGraph` for the composite's own pass through the REAL exported
`layoutGraph`, `materializeSpecs`, `computeSvekResultGeometry`,
`attachTransitionLabel`, and `measureAutonomWrapper` — once with a
correctly-populated `clusterPosMap` (built from `layoutGraph`'s own
`result.clusters`, the SAME real graphviz cluster box `state-composite-
geo.ts:480` already reads for the top-level pass) and once with `undefined`
(reproducing the bug). The `undefined` run is cross-checked against the
harness's own reported "ours" value bit-for-bit before trusting the "real"
run's number against jar. Also confirmed a SECOND origin site for the same
argument bug: `state-composite-concurrent.ts:129`
(`regionInkGeometry`'s `materializeSpecs(p.specs, posMap, undefined,
shadowing)` — identical pattern, concurrent-region passes) — relevant to
T3's darime-88-moda428/jetuse-93-gopi146/lumamo-63-zupa263/jijuze-43-ceva131.

### bajelo-54-dixe684

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 3 | 3.423611 | 3.423576 | +0.003 |
  | 3 | width | 2 | 6.394635 | 6.561719 | -12.030 |
  | 3 | height | 2 | 5.361111 | 5.527778 | -12.000 |
- **status:** resolved
- **mechanism:** `Track_FSM` (idx2, scope3) is autonom and wraps a pass whose
  content includes `Run` — a CLUSTER (touched by the top-level `Run --> Stop`
  edge, confirmed by the jar SVG's `<!--cluster Run--><g class="cluster"...>`
  marker). `buildPlainAutonomSpec` materializes `Track_FSM`'s local content
  with `clusterPosMap` hard-coded to `undefined`, so `materializeCluster`
  cannot find `Run`'s real graphviz-returned cluster box and falls back to
  `boundingBox(children)` — a box around `Run`'s CHILDREN only, plus a fixed
  12px pad, with NO title-bar/attribute/frontier-margin ink.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:195
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:410-436 (`manageEntryExitPoint` — `rectangleArea` from `FrontierCalculator` + `ensureMinWidth(getTitleAndAttributeWidth() + 10)`, unconditional, no "nested inside an autonom pass" special case)
- **causalChain:** CLOSED via direct pipeline replay
  (`scripts_scratch/T1/probe-full-close.ts bajelo-54-dixe684 2 Run
  Track_FSM`). Buggy (`clusterPosMap: undefined`) reconstruction, WITH the
  real routed `EV_START`/`EV_STOP` edge labels folded in: final width
  463.0325px, height 385.999984px — matches the harness's own reported
  "ours" (460.41375, 385.99998400000004) to within 2.6px width / bit-exact
  height, confirming the reconstruction is faithful. Fixed (real
  `clusterPosMap`) reconstruction: final width 475.06375px, height
  397.999972px — jar is 472.444px/398.00002px. **Δ(fixed−buggy) =
  +12.03125 width / +11.999988 height**, matching the OBSERVED -12.030/
  -12.000px gap to within 0.001px on both axes. (The 2.6px width offset
  common to BOTH runs — absent from the height axis — is a reconstruction
  artifact, not the mechanism: my hand-built `StateNodeGeo` array omits
  `Stop`'s real `headerLines`/divider-ink flags, a ±1-2px-scale item; it
  cancels in the delta.)
- **ruledOut:** `Do_Sector` (autonom, untouched) and `Chg_Sector` (empty →
  leaf) are pixel-exact against jar (246.498×132 and 93.938×50, confirmed
  via SVG) — rules out a general autonom wrapper-formula bug; the defect is
  specific to CLUSTER content nested inside an autonom pass. Ruled out
  mis-pairing: scope3 has only 3 widely separated nodes (20/22/460).
- **pairingRisk:** none
- **sharedCauseWith:** cupesu-59-sajo991, lojeju-04-fadu517,
  nuvura-69-mafe604 (same mechanism, CONFIRMED via the same probe
  methodology — see their own records). state-composite-concurrent.ts:129
  (T3's darime-88-moda428/jetuse-93-gopi146/lumamo-63-zupa263/
  jijuze-43-ceva131) — CONFIRMED same argument-pattern bug, second origin
  site, not independently numerically closed for T3's own fixtures (out of
  this task's write-set). NOTE for SYNTHESIS: T10's `other.md`
  (nimise-04-jove070 record) lists `bajelo-54-dixe684` in its "size-backlog
  RE-PIN group of six" alongside a -3.836px label-position mechanism —
  bajelo has NO row anywhere near -3.836px (its real rows are -12.030/
  -12.000), so that inclusion looks like a T10 transcription error, not a
  second mechanism on bajelo; flagged, not silently adopted.
- **proposedWriteSet:** src/diagrams/state/state-composite-autonom.ts (pass
  `clusterPosMapOf(result)` instead of `undefined` at the `materializeSpecs`
  call in `buildPlainAutonomSpec`, mirroring state-composite-geo.ts:480);
  src/diagrams/state/state-composite-concurrent.ts:129 (same pattern,
  `regionInkGeometry`).
- **sizeEstimate:** 2 files, low blast radius (two call-site argument
  fixes); verification cost medium — re-run the full composite-a/b/
  concurrent-region DOT-parity + size-delta harness, since this fix moves
  several fixtures across 3 buckets at once.
- **confidence:** high — mechanism confirmed by code read (asymmetric
  argument vs the correct sibling call) AND by direct arithmetic closure
  (Δ(fixed−buggy) matches the observed Δpx to within 0.001px on both axes,
  via the REAL exported production functions, not a hand-rolled formula).
- **nextStep:** n/a (resolved)

### cupesu-59-sajo991

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.527778 | 1.861111 | -24.000 |
  | 2 | height | 0 | 2.022456 | 2.565556 | -39.103 |
- **status:** resolved
- **mechanism:** `Running` (autonom) wraps `A1`, a composite classified
  `cluster` (touched — the self-referencing `A1 --> A2` written inside its
  own block resolves via the documented orphan-edge retry,
  state-composite-autonom.ts:137-157, and needs a `__zaent_A1` anchor,
  confirmed present: `scope 1: __zaent_A1, A2`). Same `clusterPosMap:
  undefined` defect as bajelo-54-dixe684.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:195
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:410-436
- **causalChain:** CLOSED for WIDTH, PARTIALLY closed for HEIGHT, via
  `probe-full-close.ts cupesu-59-sajo991 1 A1 Running`. Fixed
  reconstruction: `geomReal={width:114,height:150.719968}` → wrapper
  `width=134, height=184.719968` — jar is 1.861111in×72=134.00000px /
  2.565556in×72=184.72003px: **width matches jar EXACTLY (134=134); height
  matches jar to 0.00006px (184.719968 vs 184.72003)**. Buggy
  reconstruction (`clusterPosMap: undefined`): `geomFallback={width:90,
  height:125.71998399999998}` → wrapper `width=110, height=159.71998399999998`
  — WIDTH matches the harness's own "ours" bit-for-bit (110=110), but
  HEIGHT does not (159.72 simulated vs 145.6168 actual "ours", a 14.1px
  gap in the BUGGY-side reconstruction only). Verified via
  `verify-wrapper.ts` (calling the REAL exported `measureAutonomWrapper`
  directly on both childImg pairs) that the wrapper FORMULA itself is not
  the source of this asymmetry — both totals reproduce exactly what the
  formula predicts for the given childImg inputs. The self-referencing
  `A1-->A2` edge (no label) was confirmed NOT the missing term: its real
  `points` were folded into `computeSvekResultGeometry`'s transitions arg
  and changed nothing (already within the existing box on both runs).
- **ruledOut:** not a pairing artifact — scope2 has exactly one node
  (`Running`). Not the self-loop/self-ref edge's ink (folded in, no
  effect on either run). Not the wrapper formula (`measureAutonomWrapper`
  called directly, reproduces both totals exactly from their childImg
  inputs).
- **pairingRisk:** none
- **sharedCauseWith:** bajelo-54-dixe684, lojeju-04-fadu517,
  nuvura-69-mafe604 (same primary mechanism, WIDTH axis closed exactly).
  Both this fixture's rows round to values shared with
  lumamo-63-zupa263 (concurrent-region/T3, PARTITION's 24.0/39.1 rows on
  BOTH axes) — a stronger signal than a single-axis coincidence, worth a
  direct T3 cross-check.
- **proposedWriteSet:** same as bajelo-54-dixe684.
- **sizeEstimate:** covered by the bajelo fix for the width axis; the
  height axis's 14.1px buggy-reconstruction gap needs one more
  instrumentation pass (see below) before the fix mission can be sure the
  SAME single fix closes height too, vs a second, self-reference-specific
  term.
- **confidence:** medium-high — width fully closed (exact, both the buggy
  and fixed reproductions match); height's FIXED total matches jar
  essentially exactly (184.719968 vs 184.72003), which is strong evidence
  the same fix closes it in production, but my hand-reconstructed BUGGY
  baseline doesn't reproduce production's actual buggy height (159.72 sim
  vs 145.6168 actual), an unexplained 14.1px gap specific to my probe's
  child-height accounting for this self-referencing-edge case — not
  fully closed, so not "high".
- **nextStep:** n/a for the mechanism (resolved); residual instrumentation
  for full confidence: re-run `probe-full-close.ts` with `A2`/`__zaent_A1`
  given their REAL `stateKind` (`'point'`/pseudostate ink treatment for
  the zaent anchor, not generic `'normal'`) to see whether the 14.1px
  buggy-height gap is a probe artifact (likely, given width closed exactly
  with the same simplification) rather than a second production bug.

### dapunu-39-kava045

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 2.932639 | 2.96087 | -2.033 |
- **status:** unresolved
- **mechanism:** UNRESOLVED
- **originFileLine:** n/a
- **javaRef:** n/a
- **causalChain:** n/a
- **ruledOut:** (all via direct probe, `scripts_scratch/T1/probe-dapunu-close.ts`
  + `probe-dapunu-edges.ts`, replaying `Main_Connected`'s own pass through
  the REAL `layoutGraph`/`materializeSpecs`/`computeSvekResultGeometry`/
  `measureAutonomWrapper`) — **1. Cluster mechanism:** no `__zaent_*`
  anchor anywhere in this fixture; `Main_Connected`/`Main_Connected_First`/
  `Main_Connected_First_WaitingMeasure` are all untouched, all classify
  `autonom`. **2. Self-loop arrowhead ink** (the confirmed T2 mechanism on
  pebepi-32-cati486/taxile-56-goca422/tigibi-80-zidi137,
  `layout-ink-extent.ts:522`'s `includeArrowheadInk:false`): the
  `Main_Connected_First --> Main_Connected_First` self-loop's REAL routed
  points + `transitionArrowheadInk(...)` ink box, unioned manually into
  the pass's ink box, changed NOTHING — the arrowhead ink is already fully
  within the existing box on this fixture (unlike T2's fixtures, where the
  self-loop dominates a much smaller box). **3. Pseudostate ink formula:**
  fixed `__init_Main_Connected`'s `stateKind` from generic `'normal'` to
  `'initial'` — this closed an UNRELATED 1px gap in my OWN reconstruction
  (my sim now reproduces the harness's "ours" 211.15000400000002 ×
  258.000008 BIT-FOR-BIT on both axes) but the -2.033px jar gap remains
  untouched by this fix, ruling out ellipse-vs-rect ink as the cause. **4.
  URL-space reservation:** dapunu's states carry `[[{...}]]` URL links,
  and `measureAutonomWrapper`'s own doc comment flags "no URL case...
  matching every fixture in the corpus" as an assumption this fixture
  violates — but re-reading `InnerStateAutonom.java` directly:
  `calculateDimensionSlow` (the SIZE formula) never references `url` at
  all; `getSpaceYforURL` (which does the same "ignore url" thing,
  confusingly) only offsets the child image's DRAW position, not the
  wrapper's SIZE — ruled out on Java evidence, not by assumption. Since my
  reconstruction is bit-exact for "ours" yet still short of jar on every
  ink-based hypothesis tried, the missing term is NOT reachable via this
  pass's ink walk.
- **pairingRisk:** none — scope3's 3 nodes (20/109.5/211.15) are widely
  separated.
- **sharedCauseWith:** none confirmed after ruling out the T2 self-loop
  mechanism specifically (checked and rejected, see ruledOut #2).
- **proposedWriteSet:** unknown.
- **sizeEstimate:** unknown; the residual survives every ink-extent-level
  hypothesis tried, so it may originate upstream of this pass entirely
  (e.g. a DOT-input-level sizing constraint on `Main_Connected_First`,
  or how `[*] --> Main_Connected_First_WaitingMeasure`'s own initial-arrow
  minLen/geometry is fed into the parent scope) rather than in the
  ink-extent/wrapper formula this task's tooling can reach without
  editing src.
- **confidence:** low
- **nextStep:** diff jar's own `svek-3.dot` node line for `Main_Connected`
  against the DOT INPUT (not ink-extent output) this port emits for the
  same node — since every ink-extent hypothesis is now ruled out with
  probe evidence, the next productive step is comparing the two DOT files
  directly (`test-results/dot-cache/state/dapunu-39-kava045/svek-3.dot`
  vs a captured `DotInputGraph` dump for scope3) to see whether jar's own
  graphviz INPUT for this node already differs (e.g. a `width=` floor or
  minimum-width constraint neither `computeSvekResultGeometry` nor
  `measureAutonomWrapper` models), rather than continuing to instrument
  the ink walk.

### decede-10-buvu414

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 3 | 2.744965 | 2.744931 | +0.002 |
  | 3 | height | 3 | 2.055556 | 2.069444 | -1.000 |
- **status:** resolved
- **mechanism:** `A`'s own outer box (`state A { state B{} state C{ state
  c: state c } }`) is missing jar's `RoundedSouth` south-cap ink.
  `addNodeInk`'s composite dispatch (`addStateBoxInk(box, node, true)`)
  models a composite's outer box as only the plain rounded-rect draw
  (`-1`-inset all 4 corners, with the divider `ULine` separately reaching
  the uninset right edge `x+w`). It is missing jar's SEPARATE
  `RoundedSouth` south-cap contribution: `RoundedContainer.drawU` always
  draws a `RoundedSouth` south cap for `rounded>0` (the corpus default),
  drawn as a `UPath` (bezier arcs) reaching the FULL, uninset bottom edge
  `(width,height)` — `LimitFinder#drawUPath` has no `-1` inset (unlike
  `drawRectangle`'s), so this cap's ink reaches 1px lower than the rect's
  own `y+h-1` and dominates via the same max-union every other ink rule
  here already uses. X shows no delta because the divider line already
  reaches the same uninset right edge the south-cap path would separately
  reach.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321
  (`addNodeInk`'s composite dispatch — needs an additional south-cap-path
  ink point, `(x, y+h)` to `(x+w, y+h)` uninset, gated on `rounded>0`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/RoundedContainer.java:89-92 (draws `RoundedSouth` unconditionally after the outer rect); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedSouth.java:65-83 (`rounded!=0` branch: `UPath` reaching local `(width,height)` uninset); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162,184-188
- **causalChain:** ADOPTED from T2's `findings/composite-b.md` record
  `pacami-67-dafe414` (read this pass, per the coordinator's instruction):
  that record's fixture is `state A { state B{} state C{ state c: state
  c } }` — STRUCTURALLY IDENTICAL to decede-10-buvu414's own `A` (same
  B{}/C{c} shape) — with the EXACT same Δpx: height jar 2.069444in×72=
  149.000px vs ours 2.055556in×72=148.000px (Δ=-1.000px); width jar
  197.635px vs ours 197.638px (Δ=+0.002px). T2's own probe: `childImg`
  {177.6375,114} round-trips to our 148px/197.638px wrapper exactly;
  jar's target `childImg` height = 149−20(delta)−... = 115 =
  `C.height(99) + 1(south-cap uninset bottom) + 15(INK_DELTA)`. Not
  re-derived independently this pass (T2's numbers already close it
  exactly for the identical shape) — re-verified only that decede-10's OWN
  `A`/`B`/`C` dimensions (93.275×99 for `C`, 50×50 for `B`) match T2's
  fixture's own component sizes via `dump-nodes.ts`, confirming the SAME
  mechanism applies rather than merely a coincidental Δ.
- **ruledOut:** not the cluster-undefined mechanism — `A`/`C` are both
  untouched, classify `autonom`, no `__zaent_*` anchor anywhere. Not a
  pairing artifact — scope3's 4 nodes sort to [50, 50, 67.425, 197.6375];
  `A` (idx3) is unambiguous even though `F`/`S2` tie at exactly 50 (only
  affects idx0/idx1, both already-exact rows).
- **pairingRisk:** none
- **sharedCauseWith:** pacami-67-dafe414, tofezi-64-koda860,
  xojudi-20-keco020 (all composite-b/T2) — CONFIRMED, same mechanism,
  same exact Δpx, read directly from `findings/composite-b.md`.
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts (shared
  with T2's 3 fixtures — one fix closes all 4).
- **sizeEstimate:** 1 file, low blast radius; verification cost low-medium
  (re-run composite DOT-parity + size-delta harness; affects every
  `rounded>0` composite in the corpus, likely more than these 4).
- **confidence:** high — adopted a fully-closed, probe-verified T2
  mechanism for a structurally identical fixture with byte-identical Δpx.
- **nextStep:** n/a (resolved)

### duzazu-41-telu529

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 3.88125 | 4.075694 | -14.000 |
  | 2 | height | 0 | 3.763889 | 4.152778 | -28.000 |
- **status:** resolved
- **mechanism:** PlantUML's trailing-backslash physical-line-continuation
  convention is not implemented by this port's parser. `Active`'s 3rd/4th
  `Active: ... / \` description statements each end in a bare `\`; jar
  joins each onto the FOLLOWING physical line before command dispatch,
  while our parser has no such pre-pass — the continuation lines (which
  lack an `Active:`/`CODE:` prefix) never match any command pattern and
  are silently dropped. Confirmed by direct parse probe
  (`scripts_scratch/T1/dump-desc2.ts`): `Active.description` has exactly 4
  entries, the 3rd/4th ending in a literal trailing `\` with the 2
  continuation-only physical lines entirely absent from the array.
- **originFileLine:** src/diagrams/state/state-commands.ts:258-267 (rule
  15, `CODE : text` pattern — the site that silently fails to match a
  continuation line with no `CODE:` prefix; the missing pre-pass belongs
  upstream of the whole command dispatcher, in preprocessing)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java:69 (`while (... StringUtils.endsWithBackslash(result.getString()))`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:454-456 (`endsWithBackslash`)
- **causalChain:** `Active`'s body is missing 2 of what should be joined
  into its longer entries; jar's real body renders more text lines/wider
  content, so jar's `attr` TextBlock (via `measureAutonomWrapper`,
  state-composite-sizing.ts:73-74) is both wider and taller than ours —
  undersizing `Active`'s wrapper on both axes (-14 width, -28 height).
  Already independently verified jar-ward and unrelated to the `\t` fix by
  `.agent-notes/si27-t1-display-newlines-one-port.md` (DOT-hash unchanged
  old vs new escape-pair branch for this exact fixture), re-confirmed here
  by direct content diff. T2's own record for vixobo-14-jole910
  (`findings/composite-b.md`, read this pass) independently reaches the
  SAME mechanism and cites the SAME `ReadFilterMergeLines.java:57-81` +
  `BlockUmlBuilder.java:91-100` reader chain — two independent
  derivations agree.
- **ruledOut:** the `\t`/tab-escape fix (SI27 T1) — confirmed unrelated:
  the DOT hash for this fixture was unchanged by that fix per the cited
  note, and the dropped lines have nothing to do with tab expansion.
- **pairingRisk:** none (scope2 has 2 widely separated nodes)
- **sharedCauseWith:** vixobo-14-jole910 (composite-b/T2) — CONFIRMED both
  numerically (both this fixture's rows match PARTITION's repeated-Δ
  groups where vixobo-14 is the only other member on BOTH axes) AND by
  independent T2 mechanism agreement (read `composite-b.md` this pass).
- **proposedWriteSet:** a new preprocessing pass upstream of
  `src/diagrams/state/parser.ts` (or inside `BlockUmlBuilder.ts`/
  `preprocessor.ts`'s line pipeline) implementing
  `ReadFilterMergeLines`-equivalent physical-line joining; diagram-agnostic
  in jar, likely shared across diagram types here too.
- **sizeEstimate:** 1-2 files, moderate blast radius (pipeline-wide
  preprocessing change) — verification cost medium-high, re-run the full
  corpus manifest, not just state.
- **confidence:** high
- **nextStep:** n/a (resolved)

### fotuje-06-fifa085

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 5.855937 | 6.388889 | -38.373 |
  | 2 | height | 0 | 7.046615 | 7.996512 | -68.393 |
  | 3 | width | 0 | 6.619826 | 6.888889 | -19.373 |
  | 3 | height | 0 | 8.318837 | 8.677068 | -25.793 |
- **status:** unresolved
- **mechanism:** UNRESOLVED
- **originFileLine:** n/a
- **javaRef:** n/a
- **causalChain:** n/a
- **ruledOut:** the ADR-4-flagged doc comment in
  state-composite-autonom.ts:114-118/160-165 (claiming
  `bajelo-54-dixe684`/`fotuje-06-fifa085` are "jar-verified byte-exact" or
  that the `Math.max` floor removal fixed this fixture's regression) is
  STALE against current numbers — contradicted: both fixtures show real,
  non-trivial Δpx today (bajelo's is now fully closed, see its own
  record). Re-instrumented this pass with `scripts_scratch/T1/probe-
  cluster2.ts`: the FULL cluster structure is now precisely mapped —
  `XA5`(cluster0, leaf child XA6), `XA7`(cluster1, leaf child XA8 +
  own `__zaent_XA7` anchor — touched directly), `XA9`(cluster2, touched
  directly) ⊃ `XA10`(cluster3, `parentId=cluster2`) ⊃ `XA16`(cluster4,
  `parentId=cluster3`, containing auto-vivified leaf `XA12`) — a
  THREE-DEEP nested-cluster chain, all within XA4's single pass, all
  hitting the SAME `clusterPosMap: undefined` fallback simultaneously.
  Attempted the SAME `probe-full-close.ts`-style closure
  (`scripts_scratch/T1/probe-fotuje.ts`, reconstructing the full nested
  GeoSpec tree from the captured `parentId` chain and real
  `layoutGraph`/`materializeSpecs`/`computeSvekResultGeometry`/
  `measureAutonomWrapper`) but it did NOT converge: my buggy-mode
  reconstruction for `XA4` alone (width 424.36, height 311.999968) does
  not match the harness's own reported "ours" for XA4 (421.627×507.356) —
  width is close (2.7px off, consistent with the same reconstruction-
  fidelity gap seen elsewhere) but height is off by ~195px, FAR outside
  what any of the other fixtures' reconstruction gaps showed. Given the
  clean, near-exact closures achieved on bajelo/lojeju/nuvura/cupesu(width)
  using the IDENTICAL methodology on 1-level cluster structures, I
  attribute this large gap to my own probe's 3-level nested-cluster-tree
  reconstruction being subtly wrong (most likely: mis-assigning a node to
  the wrong nesting level, or missing the `XA7-->XA10:Z` labeled edge,
  which crosses from XA7's subtree into XA9's — a genuinely different
  edge-label case from anything the simpler fixtures had), NOT a second
  confirmed production mechanism. Not closed enough to report `resolved`.
- **pairingRisk:** none (scope2 and scope3 are each single-node)
- **sharedCauseWith:** proposed (structurally confirmed, NOT numerically
  closed): bajelo-54-dixe684, cupesu-59-sajo991, lojeju-04-fadu517,
  nuvura-69-mafe604 — same `clusterPosMap: undefined` mechanism, compounded
  across a 3-deep nested-cluster chain (XA9⊃XA10⊃XA16) plus 2 more
  independent clusters (XA5, XA7) all within one pass, plus a second
  compounding level (XA1 wrapping XA4). This is now the single most
  structurally complex instance of the mechanism in the bucket.
- **proposedWriteSet:** likely the same as bajelo-54-dixe684 (the argument
  fix is generic, not depth-limited), but this fixture specifically should
  be the fix mission's REGRESSION TEST for nested-cluster-chain depth,
  since it is the only bucket-a fixture exercising >1 level of nesting.
- **sizeEstimate:** unknown until closed; likely still just the 1
  `state-composite-autonom.ts:195` fix, but needs dedicated verification
  at this fixture given the failed closure attempt.
- **confidence:** low
- **nextStep:** rebuild `probe-fotuje.ts`'s nested-cluster GeoSpec
  reconstruction with the labeled `XA7-->XA10:Z` edge included (via
  `attachTransitionLabel`, as `probe-full-close.ts` does for bajelo) and
  verify each nesting level's `topSpecs`/`buildClusterSpec` output against
  the captured `graph.clusters[].nodeIds`/`parentId` one cluster at a time
  (print each level's `boundingBox` before summing) — the ~195px height
  gap in the CURRENT reconstruction is too large to be ink-formula noise
  and points at a tree-assembly bug in the probe itself, not a second
  production mechanism, but this needs to be verified line-by-line rather
  than asserted.

### kinuca-03-nice683

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 3.034201 | 2.487326 | +39.375 |
  | 2 | height | 0 | 2.027778 | 2.083333 | -4.000 |
- **status:** resolved
- **mechanism:** `X`'s description lines are creole TABLE syntax
  (`|= header 1 |= header 2 |= header 3 |` / `| A | abc | def |` /
  `| B | qwe | |`). Jar's `Entity.getStateDescription` feeds this through
  `Display.create(...)` — the full creole engine, laying these out as a
  real bordered table. Our `measureAutonomWrapper`
  (state-composite-sizing.ts:73-74) instead calls `measureLines(bodyLines,
  font, measurer)` — plain-text per-line measurement, with NO table-syntax
  recognition at all, so the raw markup characters (`|=`, `|`) count
  directly toward text width instead of being parsed into cells.
- **originFileLine:** src/diagrams/state/state-composite-sizing.ts:73-74
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:610-631 (`getStateDescription` → `display.create(...)`, `Display.java:614`)
- **causalChain:** direct probe (`scripts_scratch/T1/dump-desc.ts`, real
  `WidthTableMeasurer`) confirms our `attr.width` = 193.4625px (the widest
  raw line, the header row); `mergedWidth = max(text.width≈"X", 193.4625,
  childImg.width=50) = 193.4625`; `delta = MARGIN*2 + 2*MARGIN_LINE +
  marginForFields(5) = 25`; final width = `193.4625 + 25 = 218.4625px =
  3.034201in` — EXACTLY our measured 3.034201in. Jar's real table is
  narrower (columns sized to content, not raw markup text), producing
  2.487326in — the +39.375px Δ is precisely this gap.
- **ruledOut:** not a pairing issue — scope2 has exactly one node (`X`).
  Not the parser dropping the description (all 3 lines ARE present and
  measured, just as flat text).
- **pairingRisk:** none
- **sharedCauseWith:** none within composite-a. Likely shares root cause
  with any `attribute-line`(T6)/`stereotype`(T7) fixture whose description
  also contains `|...|` creole-table syntax — flagged for SYNTHESIS.
- **proposedWriteSet:** src/diagrams/state/state-composite-sizing.ts
  (`measureAutonomWrapper`'s `attr` term) and the equivalent flat-leaf path
  (src/diagrams/state/state-sizing.ts's `measureNormalState`) — both need
  a real creole-table layout when a description line matches table syntax.
- **sizeEstimate:** non-trivial — a missing FEATURE, not a formula tweak;
  2-4 files, high verification cost (any `|...|` description line across
  all diagram types is potentially affected).
- **confidence:** high
- **nextStep:** n/a (resolved)

### lojeju-04-fadu517

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 2.606076 | 2.666667 | -4.363 |
  | 2 | height | 2 | 2.736111 | 3.027778 | -21.000 |
- **status:** resolved
- **mechanism:** `A` (autonom, containing `B{}`→leaf and `C{state c: state
  c}`, plus `c --> b` where `b` is an implicit new leaf) wraps a pass whose
  content includes `C` — classified `cluster` because `c --> b` crosses
  `C`'s boundary. Same `clusterPosMap: undefined` defect as
  bajelo-54-dixe684.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:195
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:410-436
- **causalChain:** CLOSED bit-exact via `probe-full-close.ts
  lojeju-04-fadu517 1 C A`. Buggy reconstruction (`clusterPosMap:
  undefined`): final width=187.6375, height=196.99996800000002 — matches
  the harness's own "ours" (187.6375, 196.99996800000002) BIT-FOR-BIT.
  Fixed reconstruction (real `clusterPosMap`): final width=192,
  height=217.999952 — jar is 2.666667in×72=192.00002px /
  3.027778in×72=218.00002px: **both axes match jar to within 0.00005px.**
  This is a complete, dual-sided (buggy AND fixed) exact closure.
- **ruledOut:** the puml differs from nuvura-69-mafe604 ONLY in `<style>`
  color values — confirmed COSMETIC-only (`in.puml` diffed by hand): both
  fixtures' `dump-nodes.ts` output is byte-identical, ruling out any
  style-driven geometry difference.
- **pairingRisk:** none (scope2's 3 nodes — 50, 67.425, 187.6 — are widely
  separated)
- **sharedCauseWith:** nuvura-69-mafe604 (CONFIRMED — byte-identical
  geometry), bajelo-54-dixe684, cupesu-59-sajo991 (same mechanism,
  CONFIRMED via the same closure methodology).
- **proposedWriteSet:** same as bajelo-54-dixe684.
- **sizeEstimate:** covered by the bajelo fix.
- **confidence:** high — both the buggy and fixed reconstructions match
  their respective targets (harness "ours" / jar) to within float noise.
- **nextStep:** n/a (resolved)

### nimana-36-veco708

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 1 | 2.563594 | 2.616871 | -3.836 |
  | 2 | height | 1 | 3.152777 | 3.152778 | -0.000 |
- **status:** resolved
- **mechanism:** Same label-POSITION divergence as T10's
  bunade-42-fudu910/nimise-04-jove070 — `yes`'s own declared width is fed
  by an ink walk over a labeled transition whose computed label-box
  position (not the label's own measured width) is wrong, at the SAME
  fold site both T10 fixtures cite.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:386-392
  (adopted from T10's `findings/other.md`, `nimise-04-jove070` record —
  same fold site, wrong value computed upstream of it)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:79-87; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162
- **causalChain:** ADOPTED from T10's `findings/other.md` (read this pass,
  per the coordinator's instruction): `nimise-04-jove070`'s own record
  reports Δpx = `(2.549670-2.602948)*72 = -3.836016px`, EXPLICITLY naming
  `nimana-36-veco708` in its own `sharedCauseWith` list as part of a
  "size-backlog.json RE-PIN group of six" pinned 2026-08-15. Re-verified
  the number matches THIS fixture's own measured row exactly: -3.836px
  width, and the height row (-0.000072, sub-pixel) is consistent with
  T10's own height-side non-issue. Not independently re-derived (T10's
  probe already isolates the mechanism for a structurally analogous
  labeled-edge case); re-confirmed only that the numeric match is not
  coincidental (identical Δ to 6 significant figures, and T10 names this
  fixture explicitly, not a generic "similar magnitude" note).
- **ruledOut:** not the `clusterPosMap: undefined` mechanism — `yes` wraps
  only `yesno`/`yesyes`, both plain leaves, no cluster anywhere in this
  fixture's subtree (no `__zaent_*` anchor). Not the shadow-ink gap the
  `state-composite-autonom.ts:184-194` doc comment attributes to a PRIOR
  closed size-backlog entry for this same fixture — re-verified per ADR-4:
  that fix (`ctx.theme.shadowing ?? 0` threading) is present in current
  code, and the HEIGHT row is now a sub-pixel match (-0.000px), consistent
  with THAT fix having closed the height side; the WIDTH residual is a
  separate, still-open (until now unattributed) term — now attributed to
  T10's label-position mechanism instead. Not a pairing artifact — scope2's
  2 nodes (78.1875, 184.57875) are widely separated.
- **pairingRisk:** none
- **sharedCauseWith:** nimise-04-jove070 (T10, CONFIRMED — T10 names this
  fixture explicitly), bunade-42-fudu910, fotuje-06-fifa085 (per T10's own
  RE-PIN group of six naming — fotuje-06's inclusion in that group is
  UNVERIFIED by me, since fotuje-06's own rows in THIS bucket are
  -38.373/-68.393/-19.373/-25.793, none close to -3.836; possibly T10
  means a DIFFERENT row of fotuje-06's not in composite-a's own real-row
  set — flagged for SYNTHESIS to reconcile, not resolved here), and
  pavuzo-79-zodu430 (skinparam-style/T5, per the same T10 group, also
  unverified by me).
- **proposedWriteSet:** src/diagrams/state/state-composite-edge-label.ts /
  layout-ink-extent.ts — per T10, shared with bunade-42-fudu910/
  nimise-04-jove070; one fix should close all three plus this fixture.
- **sizeEstimate:** see T10's bunade-42-fudu910 record — shared fix,
  shared verification.
- **confidence:** medium — adopted a T10-confirmed mechanism with an
  exact numeric match and an explicit T10 cross-reference to this exact
  fixture (not a guess), but not independently re-derived via my own
  probe against nimana-36's own specific self-loop-free, two-labeled-edge
  shape (`yesno`/`yesyes`'s bidirectional labeled edges differ structurally
  from nimise-04's single self-loop).
- **nextStep:** n/a (resolved)

### nuvura-69-mafe604

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 2.606076 | 2.666667 | -4.363 |
  | 2 | height | 2 | 2.736111 | 3.027778 | -21.000 |
- **status:** resolved
- **mechanism:** identical to lojeju-04-fadu517 (byte-identical geometry;
  the two fixtures' `in.puml` differ only in `<style>` color values,
  cosmetic-only). Same `clusterPosMap: undefined` defect: `A` wraps `C`
  (cluster, touched by `c --> b`), materialized via `boundingBox(children)`
  instead of `C`'s real graphviz cluster box.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:195
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:410-436
- **causalChain:** identical to lojeju-04-fadu517 — re-ran
  `probe-full-close.ts nuvura-69-mafe604 1 C A` independently this pass:
  produces BYTE-IDENTICAL output to lojeju-04-fadu517's own run (buggy
  187.6375×196.99996800000002 = harness "ours" exactly; fixed
  192×217.999952 = jar to within 0.00005px). Two independent probe runs,
  same result — not just asserted identical.
- **ruledOut:** see lojeju-04-fadu517 — the two fixtures' `in.puml` diff
  was read directly and confirmed cosmetic-only (color values).
- **pairingRisk:** none
- **sharedCauseWith:** lojeju-04-fadu517 (CONFIRMED, byte-identical),
  bajelo-54-dixe684, cupesu-59-sajo991 (same mechanism, CONFIRMED).
- **proposedWriteSet:** same as bajelo-54-dixe684.
- **sizeEstimate:** covered by the bajelo fix (and by lojeju-04-fadu517 —
  these two fixtures are one verification point, not two).
- **confidence:** high (independently re-run and closed exact, same basis
  as lojeju-04-fadu517).
- **nextStep:** n/a (resolved)
