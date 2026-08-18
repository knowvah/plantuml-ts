# composite-b findings (T2)

### pacami-67-dafe414

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 2.744965 | 2.744931 | +0.002 |
  | 3 | height | 2 | 2.055556 | 2.069444 | -1.000 |
- **status:** resolved
- **mechanism:** Scope-3 idx2 is state `A`'s own outer box (`state A { state B{} state C{ state c: state c } }`). Instrumented via a `scripts_scratch/T2` probe that drives the REAL exported `computeSvekResultGeometry` with B/C's own verified-exact declared sizes laid out through the REAL `layoutGraph`: it reproduces our port's own reported childImg exactly (`{width:177.6375, height:114}`, which round-trips to our real 148px wrapper height and 197.638px width — cross-validated against the harness's own numbers). The gap is `addNodeInk`'s composite dispatch (`layout-ink-extent.ts:307`, `addStateBoxInk(box, node, true)`) modeling a composite's outer box as ONLY the plain rounded-rect draw (`LimitFinder#drawRectangle`, `-1`-inset all 4 corners, with the divider `ULine` separately dominating the right edge to `x+w` uninset). It is missing jar's SEPARATE `RoundedSouth` south-cap contribution: `RoundedContainer.drawU` (`RoundedContainer.java:89-92`) always draws a `RoundedSouth` south cap for `rounded>0` (the corpus default), and `RoundedSouth.drawU` (`RoundedSouth.java:69-77`) draws that cap as a `UPath` (bezier arcs), NOT a `URectangle`, reaching LOCAL `(width,height)` — i.e. the composite's FULL, UNINSET bottom edge. `LimitFinder#drawUPath` (`LimitFinder.java:159-162`) has NO `-1` inset at all (unlike `drawRectangle`'s explicit one), so this south-cap path's ink reaches 1px lower than the rect's own `y+h-1`, and DOMINATES it via the `Math.max`-style union every other ink rule in this file already uses. The X-axis shows no visible delta because the divider line ALREADY reaches the same uninset right edge (`x+w`) the south-cap path would separately reach — the two contributors agree on X, so only Y (which has no OTHER uninset contributor) shows the 1px gap.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321 (`addNodeInk`'s composite dispatch — needs an additional south-cap-path ink point, `(x, y+h)` to `(x+w, y+h)` uninset, alongside the existing `addStateBoxInk` rect call, gated on `rounded>0`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/RoundedContainer.java:89-92 (draws `RoundedSouth` unconditionally after the outer rect); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedSouth.java:65-83 (`rounded!=0` branch: `UPath` reaching local `(width,height)` uninset); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162 (`drawUPath` — raw min/max, no `-1`) and :184-188 (`drawRectangle` — confirms the `-1`-on-both-corners rule `addStateBoxInk` already applies correctly to the plain rect itself, ruling out the rect draw as the cause)
- **causalChain:** Probe: `computeSvekResultGeometry([B,C], [])` with B(50×50px)/C(93.275×99px) laid out via the real `layoutGraph` → childImg `{width:177.6375, height:114}`; `text("A").height=14` (back-solved: 148 wrapper − 114 childImg − 20 delta = 14, and independently 197.638 width matches `max(text.width, 177.6375)+20` exactly, confirming the reconstruction). Jar's target childImg height is `129 − text("A").height = 115` (149 wrapper − 20 delta). `115 = C.height(99) + 1(south-cap uninset bottom) + 15(INK_DELTA)` — exact. Height: jar 2.069444in×72=149.000px vs ours 2.055556in×72=148.000px, Δ=-1.000px. Width: jar 197.635px vs ours 197.638px, Δ=+0.002px (float noise, both south-cap-X and divider-line-X independently reach the same uninset `x+w`, so no visible width signal).
- **ruledOut:** `addStateBoxInk`'s `hasDivider` param (verified correct per `RoundedContainer.java:97`, and structurally cannot affect Y regardless — confirmed by direct read, then superseded by the RoundedSouth finding above); the outer `rect` draw in `RoundedContainer.drawU` itself (`LimitFinder#drawRectangle`, `LimitFinder.java:184-188`, confirmed `-1`-inset on both corners, matching `addStateBoxInk` exactly — NOT the source of the extra ink); B's own contribution (fully subsumed vertically within C's own span in the real layout — B never sets the box min/max either side); the shared "A{B,C}" substructure exists identically in `decede-10-buvu414` (composite-a) with byte-identical Δ, ruling out anything fixture-specific (styling, `<style>` blocks) as the cause.
- **pairingRisk:** none — scope 3 has 3 nodes (S2 0.694444, S1 0.936458, A 2.744931); A is the unambiguous max-width node, no close neighbors.
- **sharedCauseWith:** tofezi-64-koda860, xojudi-20-keco020 (same fixture family, byte-identical Δ), decede-10-buvu414 (composite-a — same "state A{B,C}" substructure, identical +0.002/-1.000 pair; T1 should cross-check)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts (`addNodeInk`'s composite dispatch — add the RoundedSouth uninset-bottom ink point, gated on `rounded>0`)
- **sizeEstimate:** small — one function, one new conditional ink point; blast radius is every composite whose PARENT ink-walk includes it (every "composite wraps another composite/leaf, both rounded" fixture) — needs the full state size-backlog corpus re-verified, not just these 4 fixtures, since it changes a widely-shared primitive.
- **confidence:** high
- **nextStep:** N/A — mechanism confirmed via direct instrumentation (probe output above) and Java citation. Remaining open question for the fix mission: confirm whether `rounded` is ever 0 for a state composite in the corpus (would need the ink point OMITTED in that case, matching `RoundedSouth.java:68`'s own `rounded==0` branch which falls back to a plain `URectangle` — inset, no extra ink) — not checked this pass.

### pebepi-32-cati486

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.444444 | 1.463061 | -1.340 |
- **status:** resolved
- **mechanism:** `state parent { child --> child }` — a composite wrapping a single self-looping leaf. Instrumented via a `scripts_scratch/T2` probe: built the real self-loop layout with `layoutGraph` (child=50×50px), fed the REAL routed edge points into the REAL exported `computeSvekResultGeometry` (arrowhead excluded, as the real pipeline runs it) → `childImg.width=83.999984` (≈84.0, exactly matching our own reported wrapper width back-solved: 104.0−20). Then called the REAL exported `transitionArrowheadInk(transition)` directly on the same routed points → its own ink box `{minX:40.18, maxX:69.34, ...}`. Manually unioning that box into the childImg extent (replicating exactly what `addTransitionInk` does when `includeArrowheadInk` is true) gives `width=85.338`, matching jar's target (105.34−20=85.34) to within the same ~0.002px float-noise floor seen elsewhere in this bucket. This is a clean, direct confirmation: jar's width IS reproduced by including this self-loop's real arrowhead ink; `computeSvekResultGeometry`'s deliberate `includeArrowheadInk:false` (`layout-ink-extent.ts:522`, a documented workaround for a SEPARATE, more general `transitionArrowheadInk` over-reach concern named in the module's own doc comment) is what's excluding it here.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:522 (`computeSvekResultGeometry`'s `includeArrowheadInk: false` call — the exclusion, verified this pass to be the full and exact explanation for this specific self-loop shape)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135 (`calculateDimension`, the same ink-extent recipe upstream uses, arrowhead ink included via its own `LimitFinder` walk over every drawn shape — jar's `SvekEdge`/`ExtremityArrow` machinery is not separately re-opened this pass; the numeric match above stands in for a line-level Java citation of jar's own arrowhead ink)
- **causalChain:** jar 1.463061in × 72 = 105.340px; ours 1.444444in × 72 = 104.000px; Δ = -1.340px. Probe: childImg width without arrowhead ink = 83.999984 (≈ our own 104.0−20); WITH the real `transitionArrowheadInk` box unioned in = 85.338 (≈ jar's 105.34−20=85.34, Δ from target = 0.002px, same noise floor as pacami-67's +0.002px width residual). 85.338−83.999984 = 1.338 ≈ the fixture's own 1.340px Δpx, closing the arithmetic.
- **ruledOut:** background-color styling as a cause — `pebepi-32-cati486` (`<style>state{BackgroundColor green}</style>`), `taxile-56-goca422` (`skinparam StateBackgroundColor green`), and `tigibi-80-zidi137` (`<style>state{BackgroundColor green} stateBody{BackgroundColor blue}</style>`) are otherwise-identical `state parent { child --> child }` diagrams with three DIFFERENT styling mechanisms and produce the byte-identical Δ, isolating the cause to the shared self-loop geometry, not styling; the module doc comment's claim that `transitionArrowheadInk` "occasionally reports a MUCH wider... ~30px span" is NOT reproduced for THIS exact self-loop shape (the real box unions to almost precisely jar's target, not an over-reach) — that broader over-reach concern may be real for a different geometry/configuration, but is not exercised by this fixture family; not re-litigated here.
- **pairingRisk:** none — scope 2 has exactly 1 node.
- **sharedCauseWith:** taxile-56-goca422, tigibi-80-zidi137 (identical fixture shape and Δ)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts:522 (re-enable `includeArrowheadInk` for the composite childImg case, at minimum for self-loop transitions) — contingent on confirming the module doc's broader over-reach concern doesn't regress a DIFFERENT fixture; that check is out of this record's scope.
- **sizeEstimate:** medium — `includeArrowheadInk` is shared machinery (every composite whose content includes a transition, self-loop or not, would be affected by a flag flip), so a fix needs the full state-diagram size-backlog corpus re-verified, not just these 3 fixtures.
- **confidence:** high
- **nextStep:** N/A for this fixture family (mechanism confirmed numerically). Open item for the fix mission: reconcile this record's finding (arrowhead ink is CORRECTLY sized here) against the module doc's original over-reach claim (~30px span) — find or re-derive the specific geometry that triggered that original finding, since flipping the flag globally risks reintroducing it elsewhere.

### rovese-43-tadu368

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 3.963889 | 4.083333 | -8.600 |
  | 3 | height | 2 | 5.138889 | 5.486111 | -25.000 |
- **status:** unresolved
- **mechanism:** Scope-3 idx2 is composite `SharedMemory` (`SharedMemory{ Virtual_Config{Config1...}, Data_Space{Data_Discovery_Table_Memory...} }`, with `Config1 --> Data_Discovery_Table_Memory: OFFSET = 0x4000h` crossing BOTH child composites' boundaries). Read jar's own `svek-2.dot`: both `Virtual_Config` (`cluster6`) and `Data_Space` (`cluster11`) are real graphviz `subgraph cluster`s (upstream keeps a composite as a live cluster, not a collapsed opaque node, when a transition crosses its boundary). This pass, I opened `state-composite-classify.ts` and `state-composite-cluster.ts#resolveClusterComposite`/`materializeCluster` (not done in the previous pass) to test the "missing cluster-margin ink" hypothesis directly — it is REFUTED as stated: `materializeCluster` (`state-composite-geo.ts:340-385`) already gives a `titleTableEligible` cluster (true here: `ctx.theme.fontSize===14`, no override) a `StateNodeGeo` whose `x/y/width/height` come from `real` — the ACTUAL graphviz cluster box (`clusterPosMap`, sourced from `DotLayoutResult.clusters`, the SAME dot-engine cluster geometry this port already trusts as jar-accurate elsewhere per CLAUDE.md's graphviz-is-a-target ruling) — not a synthesized approximation. That `StateNodeGeo` then flows through the ORDINARY `addNodeInk` composite dispatch, no special-casing missing. Narrowed candidate: a graphviz CLUSTER's real visual footprint is drawn by `ClusterHeader`/`ClusterDotString` (a Java class family this pass did not open), a DIFFERENT shape than `InnerStateAutonom`'s `RoundedContainer` (the family behind pacami-67-dafe414's own, CONFIRMED, `RoundedSouth`-uninset-bottom finding) — so the SAME fix does not obviously transfer; whether an analogous "extra uninset ink" term exists for `ClusterHeader`'s own drawn shape is unconfirmed. Attempted a numeric reconstruction (`scripts_scratch/T2` probe: real `layoutGraph` on Virtual_Config/Data_Space with the label box) but could not get the cross-cluster edge's label actually PLACED by the layout (`labelX`/`labelY` came back `undefined` despite `labelBoxWidth/Height` on the edge attrs), so the reconstructed childImg (241.4×252) undershoots even OUR OWN real pipeline's reported number (265.4×350, back-solved from the harness's own 3.963889in) by MORE than the jar gap itself (8.6/25px) — the probe is not yet faithful enough to isolate the exact missing term, so I'm reporting it as inconclusive rather than fitting a number to it.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321 (`addNodeInk`'s composite dispatch — confirmed reached for a materialized cluster's `StateNodeGeo`, same as any composite; NOT confirmed to be the actual defect, see mechanism)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135 (`calculateDimension`); `ClusterHeader.java`/`ClusterDotString.java` (the cluster's own real draw sequence — NOT opened this pass, named as the concrete next read)
- **causalChain:** jar 4.083333in×72=294.000px, ours 3.963889in×72=285.400px, Δ=-8.600px (width). jar 5.486111in×72=395.000px, ours 5.138889in×72=370.000px, Δ=-25.000px (height). Probe reconstruction attempt (label not placed): childImg 241.4×252, which is BELOW even our own real 265.4×350 — confirms the probe under-models the real pipeline (label-driven ranksep effect missing at minimum) and is not yet usable to isolate the jar-vs-ours delta specifically.
- **ruledOut:** the individual member sizes (Virtual_Config, Data_Space, and their own leaf children Config1/Data_Discovery_Table_Memory) are ALL exact/unflagged at scope 1 and scope 2 — the bug is specific to SharedMemory's own wrapper computation one level up, not to any individual node's own declared size; `materializeCluster` synthesizing an inaccurate box for cluster children (refuted — it uses the real `clusterPosMap` box, verified by reading the code, when `titleTableEligible`); `tightContentDimension` (`state-composite-cluster.ts:196-213`) as a candidate culprit — read it directly, it is used ONLY by `buildConcurrentRegionLeaf` for `--`-delimited CONCURRENT regions, structurally unrelated to this fixture's plain nested composites.
- **pairingRisk:** none — scope 3 sorted widths are [0.277778 (`__initial__`), 2.160243 (`Device_0_Function_2`), 4.083333 (`SharedMemory`)], well separated.
- **sharedCauseWith:** zoriza-41-rege543 (candidate — same cluster-strategy-child + labeled cross-cluster edge shape); zizemo-86-gisa766 (weaker candidate — same cluster-strategy-child family but its cross-cluster edge is UNLABELED, so if the label-box ink is part of the true mechanism the two may only be partially shared)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts (pending the `ClusterHeader.java` read below narrowing it further)
- **sizeEstimate:** medium-large — pending confirmed origin; likely a new ink code path specific to cluster-drawn (not autonom-drawn) composite children, needing re-verification across every corpus fixture using cluster-strategy composites, not just these 3.
- **confidence:** low
- **nextStep:** Open `ClusterHeader.java`/`ClusterDotString.java` (jar's real cluster draw sequence — this pass's own missing read) to find whether a cluster's title bar or border draws any shape reaching beyond the plain `-1`/`+0`-inset rect `addStateBoxInk` currently assumes, analogous to `RoundedSouth`'s uninset south cap for `InnerStateAutonom` (see pacami-67-dafe414). Separately, fix the probe's label wiring (the `labelBoxWidth`/`labelBoxHeight` edge attrs did not produce a placed `labelX`/`labelY` from `layoutGraph` — check `graph-layout-build.ts#addEdges` for what a label needs to actually be laid out) so the reconstruction can be trusted to isolate the exact term numerically.

### taxile-56-goca422

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.444444 | 1.463061 | -1.340 |
- **status:** resolved
- **mechanism:** Identical to pebepi-32-cati486 — `state parent { child --> child }`, styled via `skinparam StateBackgroundColor green` (a different styling mechanism, ruling out styling as the cause). Same self-loop arrowhead-ink exclusion gap, confirmed via the same probe (real `computeSvekResultGeometry` + real `transitionArrowheadInk`, see pebepi-32-cati486's own causalChain for the numeric match: without-arrowhead childImg width 83.999984, with-arrowhead-unioned 85.338 ≈ jar's 85.34 target).
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:522
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135
- **causalChain:** jar 1.463061in×72=105.340px; ours 1.444444in×72=104.000px; Δ=-1.340px. See pebepi-32-cati486 for the full probe arithmetic (identical fixture shape, byte-identical Δ).
- **ruledOut:** same as pebepi-32-cati486 (styling mechanism differs across the 3 fixtures; Δ is byte-identical regardless); the module doc's "~30px over-reach" claim not reproduced for this shape (see pebepi-32-cati486)
- **pairingRisk:** none — scope 2 has exactly 1 node.
- **sharedCauseWith:** pebepi-32-cati486, tigibi-80-zidi137
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts:522
- **sizeEstimate:** medium (shared `includeArrowheadInk` primitive, corpus-wide blast radius)
- **confidence:** high
- **nextStep:** N/A — see pebepi-32-cati486's nextStep for the one open item (reconciling with the module doc's broader over-reach claim).

### tigibi-80-zidi137

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.444444 | 1.463061 | -1.340 |
- **status:** resolved
- **mechanism:** Identical to pebepi-32-cati486/taxile-56-goca422 — `state parent { child --> child }`, styled via `<style>state{BackgroundColor green} stateBody{BackgroundColor blue}</style>` (yet another styling mechanism, third confirmation styling is not the cause). Same self-loop arrowhead-ink exclusion gap, confirmed via the same real-pipeline probe (see pebepi-32-cati486's causalChain).
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:522
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135
- **causalChain:** jar 1.463061in×72=105.340px; ours 1.444444in×72=104.000px; Δ=-1.340px. See pebepi-32-cati486 for the full probe arithmetic (identical fixture shape, byte-identical Δ).
- **ruledOut:** styling (third independent styling mechanism, same Δ); the module doc's "~30px over-reach" claim not reproduced for this shape (see pebepi-32-cati486)
- **pairingRisk:** none — scope 2 has exactly 1 node.
- **sharedCauseWith:** pebepi-32-cati486, taxile-56-goca422
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts:522
- **sizeEstimate:** medium (shared `includeArrowheadInk` primitive, corpus-wide blast radius)
- **confidence:** high
- **nextStep:** N/A — see pebepi-32-cati486's nextStep for the one open item (reconciling with the module doc's broader over-reach claim).

### tofezi-64-koda860

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 3 | 2.744965 | 2.744931 | +0.002 |
  | 3 | height | 3 | 2.055556 | 2.069444 | -1.000 |
- **status:** resolved
- **mechanism:** Same as pacami-67-dafe414 — `state A { state B{} state C{ state c: state c} }` plus a sibling `state E{state F}` / `F --> S1` (which itself renders correctly via a cluster, unrelated to this row). idx3 (not idx2, since scope 3 has 4 nodes here) is state A's own outer box; same missing `RoundedSouth` south-cap uninset-bottom ink (see pacami-67-dafe414's own mechanism/causalChain for the full probe-verified derivation).
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321 (`addNodeInk`'s composite dispatch)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/RoundedContainer.java:89-92; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedSouth.java:65-83; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162,184-188
- **causalChain:** jar 2.069444in×72=149.000px vs ours 2.055556in×72=148.000px, Δ=-1.000px; width jar 197.635px vs ours 197.638px, Δ=+0.002px (negligible). See pacami-67-dafe414 for the full probe arithmetic (`childImg.height=114` ours vs `115` jar-required = `C.height+1(south-cap)+15`).
- **ruledOut:** same as pacami-67-dafe414 — hasDivider flag and the outer-rect draw both verified correct/irrelevant; the `E{F}`/`F-->S1` cluster-strategy sibling in this same fixture does NOT interfere (its own scope-3 node is unaffected, ruling out cross-contamination between the two composite subtrees in one document).
- **pairingRisk:** none — scope 3 has 4 nodes; A (2.744931) is unambiguous max.
- **sharedCauseWith:** pacami-67-dafe414, xojudi-20-keco020, decede-10-buvu414 (composite-a)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
- **sizeEstimate:** small blast radius, confirmed origin — see pacami-67-dafe414.
- **confidence:** high
- **nextStep:** N/A — see pacami-67-dafe414's nextStep for the one open item (rounded==0 gating).

### vixobo-14-jole910

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 3.811806 | 4.00625 | -14.000 |
  | 1 | height | 0 | 2.027778 | 2.416667 | -28.000 |
- **status:** resolved
- **mechanism:** `state Active { Active: entry / ... \n\t ... \n\t ...  \  Active: SEND_MSG (...) / \ <newline> \n\t HAL_CAN_AbortTxRequest(...) \ <newline> \n\t HAL_CAN_AddTxMessage(...)  Active: RX_MSG (msg) / \ <newline> }` — `Active` is a composite with ZERO real child states (only self-referencing `Active: ...` description lines), so it collapses to a leaf-with-description render on both sides. Three of its four description lines end their PHYSICAL source line in an unescaped `\`. Upstream's `ReadFilterMergeLines` (`preproc2/ReadFilterMergeLines.java:57-81`) repeatedly merges any physical line ending in a backslash with the next physical line BEFORE parsing (`while (... endsWithBackslash ...) result = result.mergeEndBackslash(next)`), so jar sees the 3-physical-line "SEND_MSG" continuation as ONE logical line containing 2 literal `\n` escapes (→ 3 rendered sub-lines after creole `\n` splitting) and the trailing "RX_MSG (msg) / \" line merges with the closing `}` (1 rendered sub-line). Grepped the whole `src/` tree (`ReadLine*.ts`, `BlockUmlBuilder.ts`, `preprocessor.ts`, `block-extractor.ts`, state command parsers) for any backslash-continuation merge and found none — `buildBlockUmls` (`BlockUmlBuilder.ts:101`) feeds `readLines(source)` straight into `splitRawBlocks` with no merge pass. Our port therefore keeps each physical line separate: the 2 orphaned continuation lines (`\n\t HAL_CAN_AbortTxRequest(...) \` and `\n\t HAL_CAN_AddTxMessage(...) \`) don't match the `Active: ...` command pattern and are silently dropped, so our "SEND_MSG" description line never gains its `\n`-driven sub-lines, and our "RX_MSG" line keeps its trailing `\` as a literal character instead of picking up jar's stray merged `}`. T6 independently reached the same mechanism on `fibudu-53-bode309#a`, corroborating this is a real, shared, repo-wide gap rather than a fixture-specific coincidence.
- **originFileLine:** src/core/tim/ReadLineReader.ts:45-59 (the raw line reader — where the merge pass would sit, per `BlockUmlBuilder.java:91-100`'s doc'd chain, and does not); src/core/BlockUmlBuilder.ts:101 (`buildBlockUmls` — raw lines flow to `splitRawBlocks` with no merge-lines filter applied)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java:57-81 (`applyFilter`'s `readLine`, the `while (... endsWithBackslash ...)` merge loop); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/BlockUmlBuilder.java:91-100 (doc'd reader chain: `ReadLineReader -> UncommentReadLine -> preproc2.Preprocessor` (which applies `ReadFilterMergeLines`) `-> the loop`)
- **causalChain:** jar height 2.416667in×72=174.000px vs ours 2.027778in×72=146.000px, Δ=-28px ≈ 2 missing rendered sub-lines at this fixture's line height (jar's merged "SEND_MSG" line gains 2 extra `\n`-split sub-lines ours never sees: jar total 10 sub-lines across 4 description entries vs our 8 across the same 4 entries — entry(3)+exit(3)+SEND_MSG(3 jar / 1 ours)+RX_MSG(1/1)). Width: jar 4.00625in×72=288.450px vs ours 3.811806in×72=274.450px, Δ=-14px — consistent with jar's widest line being the tab-expanded merged continuation text (`\t HAL_CAN_AbortTxRequest(...)`) that our port never constructs at all. Open, non-blocking detail: `ReadFilterMergeLines.java:71` re-applies a `ReadFilterQuoteComment` filter mid-merge (protecting `'` comment content from being treated as a continuation trigger) — not checked against this port's own comment handling this pass; it would only matter for a description line containing a `'`-style comment marker immediately before a trailing backslash, which none of this fixture's 4 lines do, so it does not change this record's mechanism or status.
- **ruledOut:** the `\t`→tab and `\n`→newline escape resolution itself (`text-escapes.ts:48-58`, `DisplayNewlines.ts`) — verified present and correctly firing on entry/exit's OWN embedded `\n`/`\t` sequences, which contribute identically on both sides (2 lines each, unaffected by this bug); a local backslash-continuation check inside the state description grabber (`state-commands-declarations.ts`) — grepped, none exists, confirming the gap is at the raw-line-reader stage, not the state-diagram parser.
- **pairingRisk:** none — scope 1 has exactly 1 node.
- **sharedCauseWith:** duzazu-41-telu529 (composite-a, T1) — read its `in.puml`: near-identical source (same 4 `Active: ...` lines, same 3-line SEND_MSG backslash continuation, only difference is a trailing `[*] --> Processing` and a blank line before it), byte-identical Δpx pair (-14/-28); fibudu-53-bode309#a (attribute-line, T6) — T6 independently resolved this record to the SAME mechanism (`ReadFilterMergeLines.java:57-81` unported), cross-bucket confirmation this is one shared root cause, not three coincidences.
- **proposedWriteSet:** a new merge-lines filter (e.g. `src/core/tim/ReadLineMergeFilter.ts` or folded into `ReadLineReader.ts`), wired into `src/core/BlockUmlBuilder.ts:101`'s `buildBlockUmls`.
- **sizeEstimate:** medium — this is shared, diagram-type-agnostic machinery (every `@start*` block goes through `buildBlockUmls`), so a fix's blast radius is the WHOLE corpus, not just state diagrams; needs a full regression pass across every diagram type before landing.
- **confidence:** high
- **nextStep:** N/A — mechanism confirmed (this record) and independently corroborated (T6/fibudu-53-bode309#a).

### xojudi-20-keco020

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 3 | 2.744965 | 2.744931 | +0.002 |
  | 3 | height | 3 | 2.055556 | 2.069444 | -1.000 |
- **status:** resolved
- **mechanism:** Same as tofezi-64-koda860 (near-identical source: `state A{B,C}` + `state E{F}` + `F-->S1`, differing only in the `<style>stateDiagram{RoundCorner 2 Shadowing 0 BackgroundColor cyan}</style>` styling directive vs tofezi-64's `<style>stateDiagram{BackgroundColor cyan}</style>` — a THIRD independent confirmation this is styling-agnostic, and its explicit `RoundCorner 2` confirms `rounded>0` for this fixture, matching the `RoundedSouth` mechanism's gating condition). Same missing `RoundedSouth` south-cap uninset-bottom ink — see pacami-67-dafe414.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321 (`addNodeInk`'s composite dispatch)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/RoundedContainer.java:89-92; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedSouth.java:65-83; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162,184-188
- **causalChain:** jar 2.069444in×72=149.000px vs ours 2.055556in×72=148.000px, Δ=-1.000px; width Δ=+0.002px (negligible). See pacami-67-dafe414 for the full probe arithmetic.
- **ruledOut:** styling (RoundCorner/Shadowing skinparam additions vs tofezi-64's plain BackgroundColor — same Δ either way); see pacami-67-dafe414 for the hasDivider/outer-rect ruling.
- **pairingRisk:** none — scope 3 has 4 nodes; A (2.744931) is unambiguous max.
- **sharedCauseWith:** pacami-67-dafe414, tofezi-64-koda860, decede-10-buvu414 (composite-a)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
- **sizeEstimate:** small blast radius, confirmed origin — see pacami-67-dafe414.
- **confidence:** high
- **nextStep:** N/A — see pacami-67-dafe414's nextStep.

### zizemo-86-gisa766

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 1.630035 | 1.75 | -8.637 |
  | 2 | height | 0 | 2.736111 | 3.027778 | -21.000 |
- **status:** unresolved
- **mechanism:** `state SM { state V { config: foo } state data } config --> data` (a TOP-LEVEL edge reaching from deep inside `V` to its sibling `data`). Read jar's own `svek-1.dot` (SM's inner pass, 2 rendered scopes total): `config` (`sh0010`, inside `V`) is emitted wrapped in a real graphviz `subgraph cluster6` with its own reserved 9×9 title-placeholder box, and the `config --> data` edge is drawn directly from `sh0010` (inside the cluster) to `sh0011` (`data`, a sibling) — i.e. jar keeps `V` as a live cluster because the edge crosses its boundary, matching rovese-43-tadu368's/zoriza-41-rege543's structural pattern. Re-opened `state-composite-cluster.ts`/`state-composite-geo.ts#materializeCluster` this pass (see rovese-43-tadu368's own mechanism for the full account): `materializeCluster` gives `V` a `StateNodeGeo` from the REAL graphviz cluster box (`clusterPosMap`), which then flows through the ordinary `addNodeInk` composite dispatch — no missing plumbing, contrary to my earlier "no cluster-specific ink code path" framing. Narrowed candidate, unconfirmed: same as rovese-43-tadu368 — a graphviz-cluster-drawn shape (`ClusterHeader`/`ClusterDotString`, not opened this pass) may need ink beyond `addStateBoxInk`'s plain-rect rule. This fixture's edge is UNLABELED, so it remains the cleanest isolate for that follow-up once the probe's label-placement gap (see rovese-43-tadu368) is fixed for the OTHER two.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135; `ClusterHeader.java`/`ClusterDotString.java` (not opened this pass)
- **causalChain:** jar 1.75in×72=126.000px vs ours 1.630035in×72=117.363px, Δ=-8.637px (width). jar 3.027778in×72=218.000px vs ours 2.736111in×72=196.999px, Δ≈-21.000px (height).
- **ruledOut:** `config`'s and `data`'s own individual declared sizes (scope 1, both unflagged/exact); `materializeCluster` synthesizing an inaccurate box (refuted, see rovese-43-tadu368); `tightContentDimension` (region-only, refuted, see rovese-43-tadu368). Not yet ruled out: whether the missing ink is label-box-specific (this fixture has NO label, so if rovese-43/zoriza-41's gap turns out to be label-driven, THIS record would need a separate, smaller mechanism — not yet distinguished).
- **pairingRisk:** none — scope 2 has exactly 1 node (`SM`).
- **sharedCauseWith:** rovese-43-tadu368, zoriza-41-rege543 (candidate, same cluster-strategy-child structural family; weaker confidence than their own mutual pairing since this edge is unlabeled — see ruledOut)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
- **sizeEstimate:** medium-large, same as rovese-43-tadu368 (new ink code path, corpus-wide re-verification).
- **confidence:** low
- **nextStep:** Same as rovese-43-tadu368 (open `ClusterHeader.java`/`ClusterDotString.java`; fix the probe's label wiring for the OTHER two fixtures). Once available, use THIS fixture (no label) to test whether a cluster-ink fix explains its full 8.637/21px gap alone, isolating any label-specific residual on rovese-43/zoriza-41.

### zoriza-41-rege543

- **bucketLabel:** composite
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 4 | 3.471319 | 3.583333 | -8.065 |
  | 3 | height | 4 | 3.111111 | 3.680556 | -41.000 |
- **status:** unresolved
- **mechanism:** `state Big2 { c1-->c2, state AbstractState { InnerState2 --> InnerState1 }, AbstractState --> InnerState1 : all }` — `AbstractState --> InnerState1: all` is a LABELED edge from inside nested composite `AbstractState` to its own sibling `InnerState1`, crossing `AbstractState`'s boundary. Read jar's own `svek-2.dot` (Big2's inner pass): `AbstractState` is emitted as a real graphviz cluster (`cluster6`/`cluster6a`/`cluster6i`) wrapping a synthetic zero-size `zaent0003 [shape=point]` proxy node, with the labeled edge `zaent0003 -> sh0011` carrying a 15×15 reserved label box. Same structural family as rovese-43-tadu368 (cluster-strategy composite child + a labeled cross-cluster edge feeding the WRAPPING composite's own ink-extent) — see that record for the narrowed mechanism (`materializeCluster` confirmed to use the real graphviz cluster box; `ClusterHeader`/`ClusterDotString`'s own draw sequence, not `addStateBoxInk`'s reuse, is the concrete unread next step).
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:305-321
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135; `ClusterHeader.java`/`ClusterDotString.java` (not opened this pass)
- **causalChain:** jar 3.583333in×72=258.000px vs ours 3.471319in×72=249.935px, Δ=-8.065px (width). jar 3.680556in×72=265.000px vs ours 3.111111in×72=224.000px, Δ=-41.000px (height) — notably larger than rovese-43's -25px, consistent with an ADDITIONAL nested level here (`AbstractState` nested inside `Big2`, vs rovese-43's siblings both directly inside `SharedMemory`) compounding the same per-cluster gap twice, or a genuinely different magnitude for the point-node-proxy pattern vs the direct-two-cluster pattern — not distinguished this pass.
- **ruledOut:** `Big1` (the fixture's OTHER top-level composite, no boundary-crossing edge, plain autonom strategy) is NOT flagged mismatched at all — confirms the gap is specific to composites containing (or wrapping) a cluster-strategy child, not a general composite-sizing regression in this fixture; `materializeCluster` synthesizing an inaccurate box (refuted, see rovese-43-tadu368); `tightContentDimension` (region-only, refuted, see rovese-43-tadu368).
- **pairingRisk:** none — scope 3 sorted widths [0.277778, 0.762674, 0.807639, 1.194444, 3.583333]; idx4 (Big2) is well separated from its nearest neighbor (1.194444, `Big1`).
- **sharedCauseWith:** rovese-43-tadu368 (candidate, same cluster-strategy-child + labeled cross-cluster edge family); zizemo-86-gisa766 (weaker candidate, see that record's own note)
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
- **sizeEstimate:** medium-large, same as rovese-43-tadu368.
- **confidence:** low
- **nextStep:** Same as rovese-43-tadu368, PLUS: once instrumented, check whether the extra nesting level (`AbstractState` inside `Big2`, vs rovese-43's flat two-cluster-siblings shape) changes the formula (additive per level, or a different term entirely) — this fixture is the one with the deepest nesting in the slice.
