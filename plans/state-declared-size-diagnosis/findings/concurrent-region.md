# concurrent-region findings (T3)

Method note (applies to every record below). Round 1: probed via
`scripts_scratch/T3/probe.ts`/`probe2.ts` (dumped per-scope `DotInputGraph`
node id/width/height/clusters + replayed captured inputs through
`layoutGraph()` for raw canvas). Round 2 (follow-up, this revision):
`scripts_scratch/T3/probe-monkeypatch2.ts` reassigns
`materializeSpecs`/`computeSvekResultGeometry`/`layoutGraph`'s exported
bindings on the imported module NAMESPACE OBJECT at runtime (verified this
works under `jiti`'s loader — a pure in-memory technique, no file touched)
to observe the REAL, single, already-in-flight ink computation for every
`clusterPosMap: undefined` call site directly, recomputing what the SAME
specs/posMap would have produced with the REAL `clusterPosMapOf(lastResult)`
substituted in — without re-invoking `resolveMember`/`runPass`, which
earlier hand-replay (round 1) proved UNSAFE for autonom composites (they
mutate shared `ctx.consumed`/`ctx.consumedNotes` Sets, so a second call
produces a smaller, wrong graph — caught and corrected below, see
Vendor_Radio_Root). `scripts/oracle-render.sh` was used for two isolated
minimal-repro `.puml` fixtures (giniti's tab removed; joleju's note-region
pattern in isolation) to get fresh jar ground truth. All probes lived under
`scripts_scratch/T3/`, deleted before this file was finalized; no `src/`
file was ever written, only read via `Read`/`Bash cat`/monkeypatch
(runtime-only, reverted on process exit).

### darime-88-moda428

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 0 | 2.5 | 2.555556 | -4.000 |
  | 3 | height | 0 | 2.611111 | 2.958333 | -25.000 |
- **status:** resolved
- **mechanism:** `state S { state b { state c } c -> d -- state a }` — `b` (single child `c`, no own transitions) is emitted as a native graphviz CLUSTER. `S`'s own declared size comes from `regionInkGeometry` → `materializeSpecs(p.specs, posMap, undefined, …)`, and with `clusterPosMap: undefined`, `materializeCluster` (state-composite-geo.ts:340-385) cannot look up `b`'s REAL graphviz-laid-out box and falls to `boundingBox(children)` (line 380) — `b`'s ink box collapses to child `c`'s bare box, dropping `b`'s header/margin entirely from the ink extent that sizes region0 (the pre-`--` content). CONFIRMED via monkeypatch replay of the exact in-flight call: substituting the REAL `clusterPosMapOf(lastResult)` for the `undefined` argument changes region0's ink from `160×89` (dx=19,dy=19) to `164×114` (dx=23,dy=40) — a `+4px / +25px` delta that reproduces the row's `-4.000/-25.000` Δ to the pixel.
- **originFileLine:** src/diagrams/state/state-composite-geo.ts:352-385 (`materializeCluster`, `boundingBox(children)` fallback at :380); called with `clusterPosMap: undefined` from src/diagrams/state/state-composite-concurrent.ts:129 (`regionInkGeometry`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141 (`calculateDimensionSlow`, sums each region's `inner.calculateDimension()` — jar's `inner` is the REAL laid-out cluster, header included, no equivalent gap); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:65-95 (the header-size formula our own `titleTableHeight=9` already faithfully reproduces — the bug is that region-sizing never READS it, not that the formula is wrong)
- **causalChain:** `S.width = stackConcurrentRegions([region0Ink, region1Ink]).width + 20` (MARGIN·2+MARGIN_LINE·2, `state-composite-sizing.ts` `measureAutonomWrapper`); `S.height = region0Ink.height + region1Ink.height + text.height("S") + 20`. Monkeypatch-observed BROKEN region0 ink: `160×89`; REAL (fixed) region0 ink: `164×114` (CONC1's own ink is `66×65` either way, delta 0 — `a` is a plain leaf, no cluster). `S.width`(broken)=`160+20=180` ✓ matches actual declared `180px`(=2.5in); `S.width`(real)=`164+20=184` ✓ matches jar's `184px`(=2.555556in) exactly. `Δwidth=180-184=-4.000px` — EXACT. `S.height`(broken)=`89` — wait, height uses the FLOORED-against-raw-canvas value `89` not `89`; using the confirmed formula: broken height=`89(region0)+65(CONC1)+14(text.height,"S")+20=188` ✓ matches actual `188px`(2.611111in); real height=`114+65+14+20=213` ✓ matches jar's `213px`(2.958333in) exactly. `Δheight=188-213=-25.000px` — EXACT.
- **ruledOut:** Simple "ink floors to raw canvas, raw canvas already jar-correct" model — ruled out by direct observation: region0's REAL (fixed) ink (`164×114`) exceeds its OWN raw canvas (`144×62px`) on both axes, so the floor is not what jar relies on either; `titleTableWidth` rounding (ours `7.7875` vs jar's displayed `"7"`) ruled out as a width driver — the two independently-verified reconstructions above (hand-replay round 1, monkeypatch round 2) agree to the pixel without needing it.
- **pairingRisk:** none (scope 3 has exactly one node, `S`)
- **sharedCauseWith:** lumamo-63-zupa263 (identical mechanism, ALSO fully closed to the pixel — see that record). NOT jetuse-93-gopi146 (same root cause but leaves an unexplained +5px residual after the fix — see that record) or jijuze-43-ceva131 (monkeypatch-CONFIRMED this call site is never even exercised for jijuze's mismatched value — different mechanism, see that record) or giniti-22-fexo000 (same root cause, deeper nesting, ALSO fully closed — see that record; listing separately since its own record carries the fuller derivation).
- **proposedWriteSet:** src/diagrams/state/state-composite-geo.ts (`materializeCluster`), src/diagrams/state/state-composite-concurrent.ts (`regionInkGeometry`), src/diagrams/state/state-composite-autonom.ts (`buildPlainAutonomSpec`, same `undefined` clusterPosMap pattern at line 195 — see giniti-22-fexo000, which needs this second call site fixed too)
- **sizeEstimate:** 3 files touched, but the `clusterPosMap: undefined` pattern is a codebase-wide convention at both ink-extent seams (not concurrent-region-specific) — full verification needs the whole `size-backlog.json` 268-fixture DOT-parity ratchet re-run, not just this 8-fixture slice; medium-high blast radius, high verification cost
- **confidence:** high
- **nextStep:** n/a (resolved)

### fimivu-15-vogi904

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 5 | width | 1 | 1.194444 | 2.111111 | -66.000 |
  | 5 | height | 0 | 2.277778 | 1.375 | +65.000 |
- **status:** resolved
- **mechanism:** `state A { state B -- state C }` uses `--` (regions stack VERTICALLY, upstream `Separator.HORIZONTAL` — the separator is a horizontal LINE); `state D { state E || state F }` uses `||` (regions stack HORIZONTALLY, upstream `Separator.VERTICAL` — a vertical LINE). Our parser and composite pass never record which character was used per state (state-commands.ts:162's own comment treats `--`/`||` as interchangeable; `ast.ts`'s `State` has no separator-orientation field), so `stackConcurrentRegions` (state-composite-sizing.ts:121-128) ALWAYS applies the `--` formula (width=max, height=sum) even for a `||`-separated state. `A` (`--`, correctly narrow-tall) and `D` (`||`, should be wide-short) therefore come out geometrically IDENTICAL in our port (both 86×164px, confirmed by probe), while jar gives them swapped shapes.
- **originFileLine:** src/diagrams/state/state-composite-sizing.ts:121-128 (`stackConcurrentRegions`, unconditional width=max/height=sum); src/diagrams/state/state-commands.ts:162-178 (parser does not retain `--` vs `||`); src/diagrams/state/ast.ts `State.concurrentRegions` (no orientation field)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:63-89 (`Separator.fromChar`: `'|'`→VERTICAL, `'-'`→HORIZONTAL; `Separator.add`: VERTICAL sums WIDTH and maxes HEIGHT, HORIZONTAL maxes WIDTH and sums HEIGHT — the exact swap this port is missing); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/command/CommandConcurrentState.java:64-71 (`arg.get("TYPE",0).charAt(0)` feeds the char through)
- **causalChain:** With jar's real (VERTICAL/`||`) formula, `D.width = E.width+F.width` (≈2.111111in) and `D.height = max(E.height,F.height)` (≈1.375in). Our port applies the HORIZONTAL/`--` formula regardless: `D.width = max(E.width,F.width)` (=1.194444in, matching `A`'s own width exactly) and `D.height = E.height+F.height` (=2.277778in). Arithmetic: `(1.194444−2.111111)×72 = -66.000px` (row width, exact); `(2.277778−1.375)×72 = +65.000px` (row height, exact).
- **ruledOut:** Not a text-measurement or margin-constant issue (leaf `E`/`F` boxes individually match jar elsewhere in the corpus); not a scope-pairing artifact alone — the swapped-axis SIGN pattern is the specific signature of a stacking-direction inversion.
- **pairingRisk:** likely — `A` and `D` are IDENTICALLY sized in our port (both 86×164px), so sorted-per-axis pairing cannot determine which jar value belongs to which of our two nodes; a fix verification must check both fixtures by NAME, not by sorted rank.
- **sharedCauseWith:** none in this slice; likely recurs anywhere else in the corpus a `||` separator is used inside a `state { }` block — worth a corpus grep in SYNTHESIS
- **proposedWriteSet:** src/diagrams/state/ast.ts (add a per-owner separator-orientation field), src/diagrams/state/state-commands.ts (thread the `--`/`||` char through), src/diagrams/state/state-composite-sizing.ts (`stackConcurrentRegions` branch on orientation), src/diagrams/state/state-composite-concurrent.ts (separator draw direction / `SEPARATOR_LINE_DASH` orientation), src/diagrams/state/renderer.ts (dashed separator line orientation)
- **sizeEstimate:** 5 files, a real structural feature gap (horizontal `||` stacking is entirely unimplemented, not a numeric tweak) — moderate blast radius, isolated to concurrent-region code
- **confidence:** high
- **nextStep:** n/a (resolved)

### giniti-22-fexo000

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 5 | width | 1 | 28.285642 | 28.486667 | -14.474 |
  | 5 | height | 1 | 6.5 | 10.666667 | -300.000 |
  | 6 | width | 0 | 28.855087 | 29.056111 | -14.474 |
  | 6 | height | 0 | 17.472222 | 19.125 | -119.000 |
- **status:** resolved
- **mechanism:** Same class of gap as darime-88-moda428, at the OTHER of the two `clusterPosMap: undefined` call sites — `Vendor_Radio_Root` (`Radio_Root`'s own region0 content) is `autonom`-kind (not `cluster`-kind), sized via `buildPlainAutonomSpec`'s `materializeSpecs(localSpecs, rawPosMap, undefined, …)` (state-composite-autonom.ts:195), and its 3 children include deeply-nested `cluster`-kind composites (`Radio_Disabled` titleTableHeight=70, `Radio_Enabled`→`Vendor_Radio_Enabled`→`Radio_Scanning` chain, titleTableHeight up to 126) whose headers/margins are lost the SAME way. TAB CHARACTER RULED OUT: `scripts/oracle-render.sh` on a copy of `in.puml` with both trailing `\t` characters stripped produced BYTE-IDENTICAL jar output (`svek-5.dot`/`svek-6.dot` width/height unchanged to 6 decimals) AND byte-identical port output on the same tab-free copy — the tab contributes exactly zero to either side's declared size, fully ruling out the ADR-6/tabSize hypothesis from the first round.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:195 (`buildPlainAutonomSpec`, `materializeSpecs(localSpecs, rawPosMap, undefined, …)`); src/diagrams/state/state-composite-geo.ts:352-385 (`materializeCluster` fallback)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/InnerStateAutonom.java:186-210 (`calculateDimensionSlow` — jar's own child image is the REAL laid-out `SvekResult`, header-inclusive, no analogous gap)
- **causalChain:** Monkeypatch-observed the REAL in-flight `materializeSpecs` call for `Vendor_Radio_Root` (nSpecs=3, `realCpm.size=4` — 4 nested clusters available to substitute): BROKEN ink `2016.566×434.000`; REAL ink `2031.044×734.000`. `Vendor_Radio_Root.width = ink.width + 20`: broken=`2016.566+20=2036.566` ✓ matches actual declared width EXACTLY (2036.56625); real=`2031.044+20=2051.044`, vs. jar's implied width `28.486667×72=2051.040` — matches to 0.004px (rounding). `Δwidth=(2036.566−2051.044)/72=-0.20103in=-14.474px` — matches the row to 0.003px. `Vendor_Radio_Root.height = ink.height + text.height("Vendor_Radio_Root",14) + 20`: broken=`434+14+20=468` ✓ matches actual (467.999968); real=`734+14+20=768`, vs jar's implied `10.666667×72=768.0` — EXACT. `Δheight=(468−768)/72×… = -300.000px` — EXACT MATCH to the row. `Radio_Root`'s own outer wrapper (scope6): the SAME `-14.474px` width propagates UNCHANGED (confirmed: `materializeSpecs` calls for `Radio_Root`'s own region0/CONC1 passes show `realCpm.size=0`, delta 0 — no ADDITIONAL cluster-gap at this outer level; the width simply passes `Vendor_Radio_Root`'s already-wrong value through `childImg.width` unmodified). Height (`-119.000` vs. the inner `-300.000`) is the SAME single root cause propagating NON-LINEARLY through the outer wrapper's stacking math (Vendor_Radio_Root is one term among several in `Radio_Root`'s own region0 raw-canvas layout, not a 1:1 pass-through) — confirmed NOT an independent second contributor by the same zero-delta finding at the outer level; the exact -119 cascade arithmetic was not further hand-derived (would require simulating the fix end-to-end through graphviz a second time), but the ROOT CAUSE and its non-propagation are both directly observed, not guessed.
- **ruledOut:** Tab-stop/ADR-6 hypothesis (round 1's leading guess) — DISPROVEN by direct A/B oracle-render experiment, zero effect on either side. Independent/second contributor at `Radio_Root`'s own outer level — ruled out via monkeypatch (`realCpm.size=0`, delta 0 at that level).
- **pairingRisk:** none for width (scope5 has 2 nodes, unambiguous; scope6 has 1 node)
- **sharedCauseWith:** darime-88-moda428, lumamo-63-zupa263 (same `clusterPosMap: undefined` gap, both call sites now confirmed via monkeypatch to be the SAME mechanism, not merely "same class")
- **proposedWriteSet:** same as darime-88-moda428, PLUS this fixture specifically requires the fix at BOTH call sites (state-composite-autonom.ts:195 AND state-composite-concurrent.ts:129) since it exercises the `autonom`-kind path darime/lumamo don't reach
- **sizeEstimate:** same 3 files as darime-88-moda428; this fixture is the highest-value regression test for the fix since it's the only one in the slice exercising the `buildPlainAutonomSpec` call site
- **confidence:** high
- **nextStep:** n/a (resolved)

### jetuse-93-gopi146

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 0 | 1.819444 | 2.055556 | -17.000 |
  | 3 | height | 0 | 5.152778 | 5.319444 | -12.000 |
- **status:** unresolved
- **mechanism:** Same `clusterPosMap: undefined` gap as darime-88-moda428 (`A1`, single child `A2`+own init pseudo, emitted as a DOUBLY-protected cluster — `innerMarginLevels:2`, `__zaent_A1` anchor). Monkeypatch-confirmed the fix (REAL clusterPosMap substituted for the SAME in-flight call): region0 ink goes from BROKEN `111×217` to REAL `123×229` (CONC1's own ink is `66×120` either way, delta 0). `Running.height = 217(broken)+120+14(text.height,"Running")+20=371` ✓ matches actual EXACTLY (5.152778in×72=371.0); real=`229+120+14+20=383` ✓ matches jar EXACTLY (5.319444×72=383.0). `Δheight=371-383=-12.000px` — EXACT, fully closed. `Running.width = 111(broken)+20=131` ✓ matches actual EXACTLY (1.819444×72=131.0); real=`123+20=143`, but jar needs `2.055556×72=148.0` — a REMAINING `148-143=5px` gap the clusterPosMap fix does NOT close. 5px = exactly `ENTITY_IMAGE_MARGIN` (state-composite-sizing.ts's `MARGIN`), a strong but unconfirmed candidate for a second, additive margin term specific to the `innerMarginLevels:2`/zaent-anchor case (darime's `b` is `innerMarginLevels:1`, no zaent anchor, and closed with ZERO residual — lumamo's `A1` is ALSO `innerMarginLevels:2` with a zaent anchor and ALSO closed with zero residual on width, which argues against a simple "always +5 for zaent" rule and toward something specific to jetuse's OWN extra `[*]-->A2` init pseudo inside `A1`).
- **originFileLine:** src/diagrams/state/state-composite-geo.ts:352-385 (`materializeCluster` fallback — closes height); src/diagrams/state/state-composite-concurrent.ts:129 (`regionInkGeometry`); width residual origin UNRESOLVED — candidate: state-composite-cluster.ts's `resolveClusterComposite` zaent/`unwrappedNodeId` handling (not yet isolated to a line)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141 (`calculateDimensionSlow`); zaent-margin candidate: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java (protection0/1 wrap sizing, not read this task)
- **causalChain:** height: `(371−383)×… already in px = -12.000px` EXACT. width: `(131−148)= -17.000px` (matches row); of that, `4px` is NOT applicable here (darime's own delta), the CORRECT breakdown for jetuse is: broken `131`, real-with-clusterPosMap-fix `143`, jar `148` → clusterPosMap fix recovers `131→143` (12px of the 17px gap), leaving `143→148` (5px) unexplained.
- **ruledOut:** Not a plain leaf-sizing issue (every individual leaf node matches jar exactly, no PARTITION row for scopes 1/2). Not the SAME magnitude/mechanism as darime/lumamo's clean closes — this fixture is the ONLY one of the four with a residual, ruling out "the clusterPosMap fix alone is sufficient for every case in this group."
- **pairingRisk:** none (scope 3 has exactly one node, `Running`)
- **sharedCauseWith:** darime-88-moda428, lumamo-63-zupa263, giniti-22-fexo000 for the HEIGHT mechanism only (confirmed identical, both fully closed); NOT confirmed shared for the WIDTH residual (5px, unique to this fixture in the slice)
- **proposedWriteSet:** same as darime-88-moda428 for height; width residual needs its own investigation before a write-set can be proposed
- **sizeEstimate:** height: covered by the shared 3-file fix. width residual: unknown until isolated — likely 1 additional file (zaent/protection-margin handling) if the MARGIN=5 hypothesis holds
- **confidence:** high (height); low (width residual)
- **nextStep:** Re-measure this fixture immediately after the shared clusterPosMap fix lands — if the 5px width residual survives (predicted: yes), monkeypatch `resolveClusterComposite`'s own `zaentId`/`unwrappedNodeId` branch (state-composite-cluster.ts, not externally patchable from THIS module since it's called internally — would need to isolate via a targeted unit test on that function instead) to see whether the "real" cluster box from `clusterPosMapOf` already includes zaent-margin space or needs it added on top.

### jijuze-43-ceva131

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 0.9625 | 0.976389 | -1.000 |
- **status:** unresolved
- **mechanism:** CORRECTED from round 1 — the `clusterPosMap: undefined` gap is DEFINITIVELY RULED OUT for this fixture: monkeypatching `materializeSpecs` (relaxed filter to `specs.length>=1`) shows this call site is NEVER exercised with a non-empty `clusterPosMap` substitution opportunity anywhere in jijuze's build (zero intercepted calls, vs. 1-6 calls for every other fixture in this group) — `XA6` (the concurrent-region owner) resolves as `cluster`-kind at the TOP level directly (no separate `autonom` wrapper scope at all — confirmed via probe: jijuze has only 2 layoutGraph scopes total, not 3), so it never reaches `regionInkGeometry`/`buildPlainAutonomSpec`. The REAL mechanism: `XA6::CONC1` (the region-1 leaf, since `XA6` self-loops into its own CONC1) is sized via `buildConcurrentRegionLeaf`'s `tightContentDimension(resolved.result) + REGION_LEAF_MARGIN(15)` (state-composite-cluster.ts:197-260). `tightContentDimension` computes `Math.max(n.x+n.width)` over CONC1's own raw nodes — for CONC1 (just leaf `XA13` alone, whose OWN declared width matches jar's `svek-1.dot` exactly, `0.754167in` both sides) this gives content=`54.3px`, `+15=69.3px` — our declared `XA6::CONC1` value. Jar needs `70.3px` (content=`55.3px`, i.e. jar's own equivalent "content" bbox reaches 1px FURTHER than the raw node width even though the raw node itself is identical) — HEIGHT matches exactly (both `65px` = `50+15`), so the 15px margin constant itself is confirmed correct on that axis; only WIDTH has the 1px gap, and it is NOT reproducible by re-deriving `content.width` from the (identical) leaf node box.
- **originFileLine:** src/diagrams/state/state-composite-cluster.ts:197-210 (`tightContentDimension`, plain `n.x+n.width` walk — no ink-rule/divider-line adjustment) + :236-265 (`buildConcurrentRegionLeaf`, `REGION_LEAF_MARGIN=15`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:126-136 (`calculateDimension`, `TextBlockUtils.getMinMax` — the real ink-box walk `tightContentDimension` is meant to mirror; not independently re-read this round for the 1px source)
- **causalChain:** `(0.9625−0.976389)×72 = -1.000px` (row-exact). `content.width`(ours)=54.3px (=XA13's own raw box, matches jar's own leaf declaration bit-for-bit); `content.width`(jar, implied)=`70.3−15=55.3px` — exactly 1px more than the identical leaf box, meaning jar's `TextBlockUtils.getMinMax`-equivalent walk adds something `tightContentDimension`'s plain `n.x+n.width` scan does not (candidate: a divider-line ink convention, `layout-ink-extent.ts#addStateBoxInk`'s `hasDivider ? x+w : x+w-1` asymmetric-per-axis rule documented elsewhere in this same file — but `tightContentDimension` does not call that function at all, it is a SEPARATE, cruder bounding-box walk with no shape-aware ink rules).
- **ruledOut:** The shared `clusterPosMap: undefined` mechanism — DEFINITIVELY, via monkeypatch (zero intercepted calls at that call site for this fixture, contradicting the round-1 speculative `sharedCauseWith`). Not a leaf-box mismatch (XA13's own declared node width is byte-identical to jar's).
- **pairingRisk:** possible — scope 2 has 3 nodes (`XA1`, `XA6::CONC1`, `__zaent_XA6`); the reported `idx 2` (largest of 3) is presumably `XA6::CONC1`, consistent with its being the only plausible candidate near this magnitude, but not independently confirmed by name.
- **sharedCauseWith:** none in this slice (mechanism now ruled distinct from the cluster-header group; magnitude 1.0px repeats elsewhere in the mission's cross-fixture table but under a different, unrelated shape per that table's own note)
- **proposedWriteSet:** src/diagrams/state/state-composite-cluster.ts (`tightContentDimension`) — give it the same shape-aware ink walk `layout-ink-extent.ts#addNodeInk` already has, or identify the specific 1px source in jar's `SvekResult.java:130-135` first
- **sizeEstimate:** smallest fixture in the corpus for this mechanism (1px, single row) — cheap to verify once isolated, but isolating it requires either reading `SvekResult.java`'s real ink walk in full or adding a temporary (gated, reverted) trace in `tightContentDimension` itself, which sits in `src/` and is out of this task's write-set
- **confidence:** medium (mechanism/site confirmed via elimination; exact 1px source still open)
- **nextStep:** Because `tightContentDimension` is called from WITHIN the same file (`state-composite-cluster.ts`) that defines it, it cannot be monkeypatched from an external scratch script (same-module calls resolve via the closure-local binding, not the exported one — confirmed empirically: the identical monkeypatch technique that worked for `materializeSpecs`/`computeSvekResultGeometry`/`layoutGraph`, all called cross-module, produced zero interceptions here). Next diagnosis session should read `SvekResult.java:126-136` in full (not just cited) to find the exact ink-box formula jar uses for a region-leaf's "content" dimension.

### joleju-94-maru748

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 9 | width | 2 | 4.157639 | 4.199306 | -3.000 |
  | 9 | height | 2 | 2.763889 | 2.805556 | -3.000 |
  | 11 | width | 2 | 4.157639 | 4.199306 | -3.000 |
  | 11 | height | 2 | 4.708333 | 4.75 | -3.000 |
  | 12 | width | 0 | 5.842448 | 5.884115 | -3.000 |
  | 12 | height | 0 | 8.847222 | 8.972222 | -9.000 |
- **status:** unresolved
- **mechanism:** CORRECTED from round 1 on two counts. (1) `clusterPosMap: undefined` mechanism DEFINITIVELY RULED OUT — monkeypatch shows every `materializeSpecs` call in this fixture's build has `realCpm.size=0` (delta 0 everywhere); joleju has no `cluster`-kind composites at all. (2) The candidate `sharedCauseWith` with `fatupo-62-bemu777` is DISPROVEN by T8's OWN `findings/note.md` record for that fixture, read directly this round: fatupo's mechanism is `state-note-layout.ts#measureNote`'s raw-line/creole-table bug, and T8's own record EXPLICITLY states it is "NOT shared with … joleju-94-maru748 … those rows land at the same rounded magnitude by coincidence." REAL mechanism, newly isolated via a minimal jar-cross-checked repro (`state OS1 { state OS1.IS1 { state IS1.1 -- state IS1.2 {...} -- note as Note.OS1.IS1 ... end note } }`, rendered both ways through `scripts/oracle-render.sh`): `Note.OS1.IS1`/`Note.IS2` are each declared as a THIRD `--`-delimited concurrent region of their OWNING composite (`OS1.IS1`, `OS1.IS2` each have TWO `--` separators — region0=leaf, CONC1=nested composite, CONC2=note-only), not merely "attached." In the minimal repro, the note's OWN declared size matches jar EXACTLY (`267.350×49.000` both sides — ruling out `measureNote` entirely for THIS shape, since it's plain text with no creole markup, unlike fatupo's pipe-table). Yet the OWNER's (`OS1.IS1`-equivalent) declared size still comes out `-3px/-3px` short vs. the SAME jar run (ours `299.35×339.0`, jar `302.35×342.0` from the fresh oracle-render) — reproducing the EXACT `-3/-3` pattern in isolation, with the note's own sizing PROVEN not at fault. The gap is therefore in how `stackConcurrentRegions`/`combineConcurrentPasses` folds a NOTE-ONLY region into the owner's stack, not in the note's own dimensions.
- **originFileLine:** src/diagrams/state/state-composite-concurrent.ts (`stackConcurrentRegions`/`combineConcurrentPasses` — the note-only-region case specifically; not yet isolated to an exact line since `addNoteInk`'s uninset box rule, `layout-ink-extent.ts:289-292`, and the generic per-graph raw-canvas margin are both plausible but unconfirmed candidates)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141 (`calculateDimensionSlow` — jar treats a note-only `inners` entry via the SAME `calculateDimension()` call as any other region; no special-casing found this round)
- **causalChain:** Minimal repro (isolated 2-region-plus-note structure): note declared `267.350×49.000` both sides (Δ=0, note sizing ruled out). Owner declared ours `299.350×339.000`, jar `302.350×342.000` (`4.199306in×72`, `4.75in×72`). `Δwidth=(299.35−302.35)=-3.000px`; `Δheight=(339−342)=-3.000px` — reproduces the fixture's own `-3.000/-3.000` rows exactly, in total isolation from every other structure in the real fixture (no other composites, no cross-region transitions). `OS1`'s own outer delta (`-3.000` width, `-9.000` height = 3× the per-child `-3px`) is CONSISTENT with (not independently re-derived from) the same per-note-region deficit occurring identically in BOTH `OS1.IS1` and `OS1.IS2`, then summing at `OS1`'s own height axis (2 children × -3 + presumably 1 more from `OS1`'s OWN attached note-region, `Note.OS1.IS2`) — not fully closed to the pixel this round.
- **ruledOut:** `state-note-layout.ts#measureNote` (T8's fatupo mechanism) — DISPROVEN directly: note's own declared size matches jar bit-for-bit in the isolated repro. `clusterPosMap: undefined` gap — DISPROVEN via monkeypatch (zero non-empty substitutions anywhere in this fixture's build).
- **pairingRisk:** none (scope9/scope11 both have the target node as the unambiguous largest of 3; scope12 has a single node)
- **sharedCauseWith:** none confirmed. Explicitly NOT fatupo-62-bemu777 (per T8's own note.md record, cross-checked directly this round — the earlier "unconfirmed, flagged per rule 3" status is now a confirmed non-match, not a coincidence left open).
- **proposedWriteSet:** src/diagrams/state/state-composite-concurrent.ts (`combineConcurrentPasses`/region-ink handling for a note-only region) — needs the exact site identified first
- **sizeEstimate:** unknown until the note-only-region ink path is isolated; the minimal repro above is a ready-made, already-oracle-rendered regression fixture for the next session (`scripts_scratch/T3/note-pair-B.puml`, NOT preserved — recreate from this record's mechanism description, 12 lines)
- **confidence:** medium (mechanism narrowed to exactly one code region and independently reproduced in isolation with jar ground truth; exact line/formula still open)
- **nextStep:** Recreate the minimal repro (`state OS1 { state OS1.IS1 { state IS1.1 -- state IS1.2 { state IS1.2.1 -- state IS1.2.2 } -- note as N ... end note } }`) under `scripts_scratch/`, monkeypatch `computeSvekResultGeometry` (cross-module call, confirmed patchable) with a wide net (no `clusterPosMap` filter this time) to compare the note-only region's OWN ink vs. its raw canvas — the generic per-graph `MARGIN=12` floor (`state-composite-cluster.ts:170`'s own doc comment) crossing into a region that is ONLY ever sized via `tightContentDimension`-style bare content elsewhere is the leading remaining candidate.

### lumamo-63-zupa263

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 0 | 1.527778 | 1.861111 | -24.000 |
  | 3 | height | 0 | 2.925234 | 3.468333 | -39.103 |
- **status:** resolved
- **mechanism:** Same `clusterPosMap: undefined` gap as darime-88-moda428 (`A1`, single child `A2`, no own transitions, emitted as a doubly-protected cluster). Monkeypatch-confirmed: region0's ink goes from BROKEN `90×111.617` (dx=19,dy=4.897) to REAL `114×150.720` (dx=31,dy=32) — CONC1 (`B` alone) unaffected, delta 0. The ".103px" fractional residual flagged as "unexplained" in round 1 was a round-1 ARITHMETIC ERROR (the hand replay's "predicted wrapper" formula omitted `+text.height`, applying it uniformly to width only) — NOT a real second contributor; the corrected formula closes to the pixel.
- **originFileLine:** src/diagrams/state/state-composite-geo.ts:352-385 (`materializeCluster` fallback); src/diagrams/state/state-composite-concurrent.ts:129 (`regionInkGeometry`, `clusterPosMap: undefined`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141 (`calculateDimensionSlow`)
- **causalChain:** `Running.width = 90(broken region0)+20=110` ✓ matches actual EXACTLY (1.527778×72=110.0); real=`114+20=134` ✓ matches jar EXACTLY (1.861111×72=134.0). `Δwidth=110-134=-24.000px` — EXACT. `Running.height = 111.617(broken)+65(CONC1)+14(text.height,"Running")+20=210.617` ✓ matches actual EXACTLY (2.925234×72=210.617); real=`150.720+65+14+20=249.720` ✓ matches jar EXACTLY (3.468333×72=249.71998≈249.720). `Δheight=210.617-249.720=-39.103px` — EXACT MATCH to the row, fully closing the previously-flagged fractional residual.
- **ruledOut:** A second, non-integer-px contributor (round 1's leading hypothesis) — DISPROVEN; the corrected wrapper-height formula (`+text.height`, which darime/jetuse/giniti all also needed) closes the delta with zero residual.
- **pairingRisk:** none (scope 3 has exactly one node, `Running`)
- **sharedCauseWith:** darime-88-moda428, giniti-22-fexo000 (identical mechanism, all three now fully closed to the pixel via monkeypatch)
- **proposedWriteSet:** same as darime-88-moda428
- **sizeEstimate:** see darime-88-moda428 (same shared fix)
- **confidence:** high
- **nextStep:** n/a (resolved)

### zacajo-09-tamu628

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 4 | width | 1 | 4.112429 | 4.164271 | -3.733 |
  | 4 | height | 1 | 7.388888 | 7.388889 | -0.000 |
- **status:** unresolved
- **mechanism:** UNRESOLVED, but TWO specific candidates from round 1 are now DISPROVEN with direct numbers, per the coordinator's request. (1) Edge-label-width hypothesis — DISPROVEN: emitted our own Svek DOT for the ScrollLock region (scope2) via `tests/oracle/svek-dot.ts#toSvekDot` on the captured `DotInputGraph` and diffed against jar's cached `svek-2.dot` directly — BOTH declare `WIDTH="122" HEIGHT="15"` on the `ScrollLockOff↔ScrollLockOn` label boxes, byte-identical. (2) `clusterPosMap: undefined` gap — DISPROVEN via monkeypatch: all 6 `materializeSpecs` calls in this fixture's build show `realCpm.size=0`, delta 0 (this fixture has no nested composites at all, consistent with round-1's own structural read). With BOTH the node sizes (already confirmed exact in round 1) AND the edge-label boxes (confirmed exact this round) identical between our DOT emission and jar's cached input, and the SAME `dot`-engine formula (`stackConcurrentRegions`'s `Math.max` over raw region canvases + wrapper delta, confirmed to reproduce OUR OWN declared width bit-for-bit: `276.09px(ScrollLock raw)+20=296.09px=4.112429in`) — the remaining candidate is that graphviz itself lays out a STRUCTURALLY-IDENTICAL input differently between our `@knowvah/dot-engine` invocation and whatever produced jar's cached oracle (a version/flag difference in the underlying `dot` binary, not a bug in this port's own DOT construction).
- **originFileLine:** src/diagrams/state/state-composite-sizing.ts:121-128 (`stackConcurrentRegions` — confirmed correct, not the site); no remaining candidate site inside this port's own code — the divergence appears to originate in the external `dot`-engine layout call itself for this specific two-parallel-labeled-edge topology
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141 (`calculateDimensionSlow`, confirms jar sums the SAME per-region dimension this port mirrors — not implicated)
- **causalChain:** `Active.width = maxRegionRawCanvas + 20`. Ours: `276.09+20=296.09px=4.112429in` — EXACT match to our own declared value (formula confirmed correct on our side). Jar's implied widest-region raw canvas: `4.164271×72−20=279.828px` — `3.738px` more than our OWN graphviz run produces on a byte-identical DOT input (node sizes exact, edge-label boxes exact). `Δwidth=(4.112429−4.164271)×72=-3.733px` — matches the row.
- **ruledOut:** Edge-label box width (WIDTH="122"/"119" attrs, direct DOT-emission diff — identical). `clusterPosMap` gap (monkeypatch, zero non-empty substitutions). Leaf-node sizing (round 1, PARTITION has zero rows for scopes 1-3). `stackConcurrentRegions` formula itself (reproduces our own value exactly).
- **pairingRisk:** none (scope 4 has 2 nodes, `Active` vs. a 20px `__initial__` pseudo-state — unambiguous)
- **sharedCauseWith:** none
- **proposedWriteSet:** none inside this repo's own diff surface if the graphviz-version hypothesis holds — this would be a proposed `DIVERGENCES.md`/METRIC-AUDIT entry (external tool version drift), not a source fix; needs confirmation first
- **sizeEstimate:** if confirmed a graphviz-version/flag difference: zero source files, a documentation-only divergence entry; if NOT confirmed (i.e. some other in-repo mechanism is eventually found): unknown
- **confidence:** medium (two of three candidates now eliminated with hard evidence; the remaining candidate is external to this port's own code, which itself is a meaningful, actionable finding)
- **nextStep:** Run `dot -V` (or equivalent @knowvah/dot-engine version query) and compare against whatever produced the pinned oracle jar's cached `svek-*.dot` files' generation environment (check `oracle/dist/` provenance / `scripts/oracle-corpus.ts` for the graphviz version it shells out to) — if versions differ, this is a tooling-environment divergence, not a port defect, and belongs in METRIC-AUDIT rather than a fix write-set.
