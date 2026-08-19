### joleju-94-maru748

- **bucketLabel:** G17-note-only-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 9 | width | 2 | 4.157639 | 4.199306 | -3.000 |
  | 9 | height | 2 | 2.763889 | 2.805556 | -3.000 |
  | 11 | width | 2 | 4.157639 | 4.199306 | -3.000 |
  | 11 | height | 2 | 4.708333 | 4.75 | -3.000 |
  | 12 | width | 0 | 5.842448 | 5.884115 | -3.000 |
  | 12 | height | 0 | 8.847222 | 8.972222 | -9.000 |
- **status:** resolved
- **mechanism:** Re-measured first (per this task's instructions): identical
  to SI28's own numbers — T7's `buildNoteBody` note-sizing change and T8's
  `clusterPosMapOf` cluster fix (both already landed in Batches 1-3) do not
  move this fixture; SI28's own record already ruled out `measureNote` (the
  note's own box matches jar bit-for-bit) and the `clusterPosMap: undefined`
  gap (joleju has zero cluster-kind composites). Scope mapping confirmed by
  magnitude+id against `test-results/dot-cache/state/joleju-94-maru748/in.svg`
  and `svek-N.dot`: scope9=`OS1.IS2`, scope11=`OS1.IS1`, scope12=`OS1` — the
  three composites in this fixture that each own a note-only trailing `--`
  region (`Note.IS2`, `Note.OS1.IS1`, `Note.OS1.IS2` respectively).
  REAL mechanism, isolated this round via direct instrumentation (monkeypatch
  of `computeSvekResultGeometry`/`stackConcurrentRegions`/`measureAutonomWrapper`/
  `layoutGraph`, all cross-module, `scripts_scratch/T14/probe.ts`+`probe2.ts`,
  both deleted): a `--`-delimited region containing ONLY a note (no `State`
  members — `s.concurrentRegions[i]` is `[]`, the note reaches the pass
  exclusively via `addScopeNotes`'s raw-DOT-node push, never via `p.specs`)
  makes `regionInkGeometry`'s `materializeSpecs(p.specs=[], ...)` produce zero
  materialized states, so `computeSvekResultGeometry([], [])` returns the
  DEGENERATE `{width:0,height:0,dx:0,dy:0}` (directly observed, 6/6 note-only
  calls in this fixture). `regionInkGeometry`'s `Math.max(ink.width,
  p.result.width)` then falls back to `p.result.width/height` — the RAW
  GRAPHVIZ **CANVAS** size from that region's own `layoutGraph()` call, which
  is the note's own declared box PLUS `@knowvah/dot-engine`'s own flat
  graph-level margin, directly measured as **+12px on both axes** (note
  `Note.OS1.IS1` 267.35×49 in → canvas 279.35×61 out; `Note.IS2` 267.35×23 →
  279.35×35; `Note.OS1.IS2` 388.656×23 → 400.656×35 — three independent
  confirmations, all exactly +12/+12). Jar's equivalent term is NOT a raw
  canvas at all: a note-only `GroupType.CONCURRENT_STATE` region is its own
  real `GraphvizImageBuilder` pass (`GroupMakerState.java:116`,
  `createGeneralImageBuilder(group.leafs()).buildImage(...)`, the
  `containsSomeConcurrentStates()==false` branch — inferred from the exact
  arithmetic closure below, not independently traced in a Java debugger this
  round; the `countChildren()==0` `EntityImageState` early-return at
  `GroupMakerState.java:113-115` is ruled OUT by the same closure, since that
  branch's dimension formula is unrelated to the note's own box and could not
  reproduce a flat, note-size-proportional +15), returning a `SvekResult`
  whose `calculateDimension()` (`SvekResult.java:130-135`) is
  `minMax.getDimension().delta(15, 15)` — a flat **+15px on both axes** over
  the tight content bbox (which, for a lone un-clustered note, equals the
  note's own box). The entire discrepancy is `15 − 12 = 3px per axis`,
  confirmed to the pixel on every one of the 6 rows with ONE constant and NO
  fitting (arithmetic below).
- **originFileLine:** src/diagrams/state/state-composite-concurrent.ts:139-140
  (`regionInkGeometry`'s `return { width: Math.max(ink.width, p.result.width),
  height: Math.max(ink.height, p.result.height), ... }` — for a note-only
  region `ink` is always `{0,0}` so this unconditionally returns
  `p.result.width/height`, dot-engine's own graph-canvas size, never jar's
  `SvekResult`+15 margin)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:126-136
  (`calculateDimension`, `return minMax.getDimension().delta(15, 15);` — the
  +15/+15 this port's fallback never applies); ~/git/plantuml/src/main/java/
  net/sourceforge/plantuml/svek/GroupMakerState.java:110-129 (`getImage()` —
  the `containsSomeConcurrentStates()==false` else-branch, :116, that gives a
  note-only `CONCURRENT_STATE` sub-group a real `SvekResult`, not the
  `countChildren()==0` `EntityImageState` short-circuit at :113-115); ~/git/
  plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141
  (`calculateDimensionSlow` — sums each region's `inner.calculateDimension()`
  unconditionally, no note-only special case, confirming jar treats this
  region exactly like any other `inner`)
- **causalChain:** Per-region gap: our note-region contribution = raw note
  box + 12 (dot-engine canvas margin); jar's = raw note box + 15
  (`SvekResult#calculateDimension`). Gap = 3px, both axes, every note-only
  region in this fixture. **scope11 (`OS1.IS1`)**: `stackConcurrentRegions`
  inputs `[{68.6375,65},{116.275,179},{279.35,61}]` (note dominates width,
  raw canvas 267.35+12=279.35 / 49+12=61) → stacked `{279.35, 305}`
  (height=65+179+61, gap=0); `measureAutonomWrapper` adds `+20`
  (`MARGIN*2+2*MARGIN_LINE`, `state-sizing.ts:13`) to width and
  `+text.height(14)` then `+20` to height → declared `{299.35, 339}` —
  MATCHES our own scope11 row exactly. Jar-corrected note term
  `267.35+15=282.35 / 49+15=64` → stacked `{282.35, 308}` → declared
  `{302.35, 342}` = jar's row exactly. `Δwidth=(299.35−302.35)=-3.000px`;
  `Δheight=(339−342)=-3.000px` — EXACT, both rows. **scope9 (`OS1.IS2`)**:
  identical shape (`Note.IS2`'s own raw box also 267.35×23, canvas
  279.35×35), stacked `{279.35,165}`→declared `{299.35,199}`; jar-corrected
  stacked `{282.35,168}`→declared `{302.35,202}`. `Δ=-3.000/-3.000` — EXACT,
  both rows. **scope12 (`OS1`)**: `stackConcurrentRegions` inputs
  `[{392,354},{392,214},{400.656,35}]` (note term dominates width: its raw
  box 388.656+12=400.656) → stacked `{400.656,603}` → declared
  `{420.656,637}` — matches our own row exactly. Jar-corrected: `OS1.IS1`'s
  own +3 height (339→342) propagates into region0's ink (354→357, the SAME
  ink-walk that already includes `OS1.IS1` as one materialized node);
  `OS1.IS2`'s own +3 (199→202) propagates into the CONC-region ink
  (214→217); `OS1`'s OWN note region gets its own direct +3
  (388.656+15=403.656, 23+15=38) → stacked `{403.656, 357+217+38=612}` →
  declared `{423.656, 646}` = jar's row exactly. `Δwidth=(420.656−423.656)
  =-3.000px` — EXACT. `Δheight=(637−646)=-9.000px` — EXACT (the three
  independent +3 height corrections, one per region, summing to +9 at this
  outer level — not a coincidental ×3, a real triple application of the
  SAME single-axis mechanism).
- **ruledOut:** `state-note-layout.ts#measureNote` (SI28's own T8 finding,
  reconfirmed this round: every note's OWN declared/input box —
  `Note.OS1.IS1` 267.35×49, `Note.IS2` 267.35×23, `Note.OS1.IS2` 388.656×23 —
  matches jar's cached `svek-4/6/10.dot` bit-for-bit; scopes 1-8,10 all
  EXACT on re-measurement). `clusterPosMap: undefined` gap (SI28, joleju has
  zero cluster-kind composites; confirmed still true — current
  `regionInkGeometry` already threads `clusterPosMapOf(p.result)`, not
  `undefined`, per T8's landed fix, and re-measurement shows unchanged
  numbers, i.e. that fix never touches this fixture). A downstream
  post-`measureAutonomWrapper` override of `spec.width`/`.height` — RULED
  OUT directly: `resolveMember` (`state-composite-pass.ts:134`) pushes
  `spec.width`/`.height` verbatim into `acc.nodes`, and `layoutGraph` (a
  fixed-size `shape=rect` node) returns that width/height completely
  unchanged (instrumented: input == output on every composite node in this
  fixture). Text-measurer mismatch — an early false lead in THIS session
  (first probe pass used the default measurer instead of `WidthTableMeasurer`,
  producing spurious 317.66-vs-299.35-style "gaps" that vanished once the
  measurer matched the harness's own `WidthTableMeasurer`); flagged so a
  future session doesn't re-chase it.
- **pairingRisk:** none (scope9/scope11 each have 3 nodes but the target
  composite is unambiguously the largest — the other two are 20px/22px
  pseudo-state circles; scope12 has exactly 1 node)
- **sharedCauseWith:** none in the currently-cached corpus — grepped
  `test-results/dot-cache/state/*/in.puml` for a bare `--` line followed by a
  `note` with no intervening `state`; only joleju-94-maru748 matches. The
  mechanism itself (an empty-materialized-states concurrent region falling
  back to dot-engine's raw canvas instead of jar's `SvekResult`+15 formula)
  is generic and would recur for any OTHER note-only trailing region, but no
  second instance exists in this corpus slice to confirm against.
- **proposedWriteSet:** src/diagrams/state/state-composite-concurrent.ts
  (`regionInkGeometry`'s degenerate-ink branch only) — when `ink` is the
  degenerate `{0,0}` (no materialized `StateNodeGeo` members for this
  region), do not fall back to `p.result.width/height` (dot-engine's own
  graph-canvas size, which bakes in an unrelated +12 default graph margin);
  instead sum `p.result.nodes`' own raw declared boxes (pre-canvas-margin —
  already directly observable, e.g. `p.result.nodes[0].width/height`) and add
  a new named constant citing `SvekResult.java:135`'s `.delta(15, 15)`
  (`NOTE_REGION_SVEK_MARGIN = 15`, both axes) — mirroring the SAME
  `SvekResult#calculateDimension` formula `computeSvekResultGeometry`
  already ports for the non-degenerate case, just seeded from the region's
  raw note node(s) instead of materialized states.
- **sizeEstimate:** 1 file, 1 function (~5-10 line change to the fallback
  branch, plus the new named constant); low blast radius — only fires when a
  `--`-delimited region's materialized-states list is empty (note-only
  trailing regions, a narrow and already-identified condition). Verification:
  this fixture's 6 rows + a full corpus `harness-diff.py`/DOT-parity re-run
  to catch any other note-only-region fixture not in the current cache.
- **confidence:** high — the arithmetic closes to the pixel on all 6
  independent rows (including the compounded -9px at the outer `OS1` level)
  using ONE flat per-axis constant (15−12=3px) with zero fitting, derived
  from four independent direct-instrumentation captures
  (`computeSvekResultGeometry`, `layoutGraph`, `stackConcurrentRegions`,
  `measureAutonomWrapper`). The one un-traced link is which `GroupMakerState
  .java` branch jar takes for a note-only `CONCURRENT_STATE` sub-group
  (inferred from arithmetic closure, not stepped in a debugger this round).
- **nextStep:** n/a (resolved)
