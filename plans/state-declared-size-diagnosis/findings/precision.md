# Findings — precision (T11, ADR-7)

27 fixtures / 40 rows, all |Δpx| < 0.05. Two mechanism clusters, evidenced via
`scripts_scratch/T11/probe1.ts` (deleted before close-out; imported
`renderSync`+`WidthTableMeasurer`+`setLayoutInputObserver` exactly like
`scripts/measure-composite-declared-size.ts` does — no harness edit).

**Harness is not the source.** `measure-composite-declared-size.ts` reads
`ours`/`jar` straight off `DotInputGraph`/`parseSvekDot(svek-N.dot)`
(`axisRows`, lines 130-152) with no reformatting of its own — both numbers
are exactly what each side's OWN pipeline produced. Confirmed by probe: for
`beguxu-19-tize774` scope 3, the RAW double `setLayoutInputObserver` captures
(before any `.toFixed`) is `height=199.99996799999999553`, not `200` — the
residual is in the underlying double, not a display-rounding artifact.

## Cluster A — position never echo-corrected (height AND width, |Δpx| < 0.0001, `ours` always ≤ `jar`)

**Mechanism.** Every inner autonom/composite svek pass quantizes each child
node's width/height to jar's own 6-decimal-place inches STRING before handing
the graph to `@knowvah/dot-engine` (`inches()`,
`src/core/svek-dot-emit-clusters.ts:37`, consumed by `addOneNode`,
`src/core/graph-layout-build.ts:114-116`). `mapNodes`
(`src/core/graph-layout.ts:186-195`) echoes the returned node WIDTH/HEIGHT
back to the exact pre-quantization value whenever the engine's answer is
within `ROUND_TRIP_EPSILON=1e-3` (`graph-layout.ts:89`, doc at lines 74-79) —
by explicit design, because "the engine decides POSITION; it never decides a
size THAT WAY." X/Y is **never** echo-corrected (`graph-layout.ts:194`:
`x: n.x - cornerW/2, y: n.y - cornerH/2`, straight off the engine snapshot).
So a child node's SIZE survives the round trip exactly, but its POSITION
carries the ≤0.000072px-per-node quantization residual forward. That residual
enters `computeSvekResultGeometry`'s ink-extent walk
(`src/diagrams/state/layout-ink-extent.ts` `addNodeInk`/`addStateBoxInk`/
`addEllipseInk`/`buildInkBox`, which sum `node.x`/`node.y` with the
now-exact width/height) and then `measureAutonomWrapper`'s merge
(`src/diagrams/state/state-composite-sizing.ts:78-80`:
`mergedHeight = text.height + attr.height + childImg.height`,
`mergedWidth = Math.max(text.width, attr.width, childImg.width)`), producing
the composite's own declared width/height for the OUTER svek scope — exactly
what `layoutInputObserver` captures, one nesting level removed from any echo
of its own (this composite node has no prior "declared" counterpart to echo
against; its size **is** this computed value).

Jar quantizes identically at the DOT-text boundary
(`SvekUtils.pixelToInches`, `~/git/plantuml/.../svek/SvekUtils.java:99-102`:
`String.format(Locale.US, "%6.6f", pixel/72.0)`, used by
`SvekNode.java:159,214`) — ruling out "jar just doesn't round" as the
explanation. The divergence is that jar's own composite-dimension computation
(`SvekResult.calculateDimension`,
`~/git/plantuml/.../svek/SvekResult.java:130-136`, via
`TextBlockUtils.getMinMax`) evidently does not carry the same position
residual back into its ink box the way ours does — consistent with the
already-accepted, already-ADR'd dot-engine-vs-real-graphviz arithmetic
divergence (`CLAUDE.md` "One layout engine: dot-engine, never Smetana"), which
`plans/burn-graphviz-engines/README.md` confirms now covers `state` too (all
6 "graph diagram types" route through `dot-engine`, not a real-graphviz shell
-out) — **this is a documentation drift worth flagging**: `CLAUDE.md`'s own
scoping list still says state "shells out to real graphviz, where the jar's
geometry IS a target," which the burn mission already superseded.

**Status:** resolved (mechanism + origin known). Always a real, but
imperceptible (<0.0001px), sizing residual — not a formatting bug, not a
harness artifact.

## Cluster B — RESOLVED: refuted as a text-table issue, merges into Cluster A (width axis, |Δpx| 0.001–0.005, mixed sign)

**Follow-up (coordinator request): the width-table hypothesis is REFUTED.**
`WidthTableMeasurer#measure` (`src/core/measurer.ts:186-193`) sums raw
per-codepoint table widths then multiplies by `factor = font.size/16`
**once**, at the end. Jar's `StringBounderFromWidthTable.calculateDimension`
(`~/git/plantuml/.../klimt/drawing/font/StringBounderFromWidthTable.java:66-79`)
does the identical sum-then-multiply-once, same order, same formula (double
`size`, no `Math.round` anywhere in either path) — this rules out both
accumulation-order AND font-size-scaling/rounding as a cause.

That left a per-glyph `SANS_SERIF_BLOCKS`-vs-`UnicodeFontWidthSansSerif
.SANS_SERIF` table-value difference as the only remaining text-table
candidate — but a direct probe (`scripts_scratch/T11/probe2.ts`, a
`WidthTableMeasurer` subclass logging every `measure(text, font)` call
during a real render, deleted before close-out) **refutes it**: for every
one of the 14 Cluster-B fixtures, NO candidate label text (state names,
transition labels, descriptions, diagram titles — all logged) has a raw
measured width anywhere near the row's implied non-margin composite-width
component. E.g. `fadupe-90-koti079`'s row needs a ~200.19px component;
its own composite title "Active" measures only 38.15px, and no other label
in the fixture is close either. `jaxebo-54-nifi592` needs ~445px against a
77px "NotShooting"/72px "Configuring" — same story.

**The true driver is `childImg.width`** — the inner autonom pass's own
ink-extent (`computeSvekResultGeometry`), i.e. **the identical Cluster A
mechanism** (uncorrected X/Y position from `mapNodes`,
`src/core/graph-layout.ts:189-194`, propagating through
`addNodeInk`/`buildInkBox`, `src/diagrams/state/layout-ink-extent.ts`),
just on the WIDTH axis of composites with enough internal structure
(multiple children, labeled-edge boxes, or — `domoru-86-coki670` — a
second level of nesting) that more position terms accumulate into a
larger (still sub-0.05px) residual than the single-node height cases.
`jelusa-98-nexa591` additionally shows the residual can land on EITHER
side (there `ours` is the near-round value and `jar` carries the
fraction) — consistent with genuine dot-engine-vs-real-graphviz
rank/spacing arithmetic feeding the ink box, not a one-directional
quantization artifact.

**Status:** all 14 records RESOLVED, reclassified under Cluster A's
`originFileLine`/`javaRef` (see each record below). The earlier
"Cluster B" label is kept only as provenance in each record's mechanism
text; no fixture remains unresolved in this bucket.

## Rows, split by cluster (ADR-1 `<slug>#a`/`<slug>#b` where a fixture has both)

### beguxu-19-tize774

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | height | 2 | 2.777777 | 2.777778 | -0.000 |
  | 3 | height | 3 | 2.777777 | 2.777778 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A — position never echo-corrected (see file preamble). Probed: raw px `height=199.99996799999999553` for this scope's composite (nominal 200), i.e. the double itself, not display rounding.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.777777-2.777778)×72 = -0.000072 px per row; the composite's inner-pass ink extent carries a ≤0.000072px-per-node X/Y residual from the `inches()` 6dp round trip (uncorrected, unlike width/height) into its own declared height for the outer scope.
- **ruledOut:** harness reformatting (measure-composite-declared-size.ts reads DotInputGraph/svek-N.dot directly, axisRows:130-152, no toFixed of its own); our-side accumulation-order in state-composite-sizing.ts (plain `+`/`Math.max`, no loop); confirmed via scripts_scratch/T11/probe1.ts that the raw pre-format double is already 199.99996799999999553, not exactly 200.
- **pairingRisk:** possible — two identical-valued rows in the same scope/axis (sorted pairing can't misattribute a value swap between them, but the duplication itself is notable).
- **sharedCauseWith:** bemena-23-zebu249, dulixa-11-kufe247, fojisi-40-zogo372, fomusu-59-fupe538, nuboca-13-xape657, pajefo-95-neri955, xepafa-33-lazi826, jorere-75-peja265#a, ketibo-84-juzo029#a, zitifa-97-bizo337#a, kujaju-47-neku764, fajegu-17-joba577, leloja-87-tebi184, pexiku-77-japi217 (all Cluster A)
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope) — estimate only, not prototyped.
- **sizeEstimate:** 1 file at the shared `layoutGraph` chokepoint but broad blast radius (every graph diagram type: class/component/state/usecase/dot/json); verification = full measure-composite-declared-size.ts rerun + full suite (position changes also affect spline/edge routing). Given <0.0001px magnitude, likely not worth the risk.
- **confidence:** high
- **nextStep:**

### bemena-23-zebu249

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 4 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A. Probed: raw px `height=255.99996000000001573` for this composite (nominal 256).
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px; same ink-extent-carries-X/Y-residual chain as beguxu-19-tize774.
- **ruledOut:** same as beguxu-19-tize774; probed raw double 255.99996000000001573 ≠ 256.
- **pairingRisk:** none — single row, unique value in scope.
- **sharedCauseWith:** beguxu-19-tize774 and the rest of the Cluster A `.555555/.555556` group listed there.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### domoru-86-coki670

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 4 | width | 4 | 3.224132 | 3.224167 | -0.003 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.224132-3.224167)×72 = -0.00252 px ≈ -0.003; composite `mergedWidth = Math.max(text.width, attr.width, childImg.width)` (state-composite-sizing.ts:79) is driven by `childImg.width` here (no candidate label text for this fixture measures anywhere near the ~212px non-margin component), i.e. the inner autonom pass's ink-extent carrying an uncorrected X-position residual, same as the height rows.
- **ruledOut:** accumulation order (Java and ours both sum-then-multiply-once, identical formula/order — StringBounderFromWidthTable.java:70-79 vs measurer.ts:186-193); Cluster A position residual (raw width is not round-minus-epsilon, per probe). text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none — single row, unique value in scope.
- **sharedCauseWith:** no identical ours/jar value elsewhere; same MECHANISM (now merged into Cluster A) as fadupe-90-koti079/gifasa-23-zile558/jaxebo-54-nifi592/jelusa-98-nexa591/jorere-75-peja265#b/ketibo-84-juzo029#b/lalava-26-zosi801/lasasi-13-nona547/lonuti-97-voko521/mifuti-36-jine785/soxene-95-domu248/sumiri-68-suvo696/tegali-39-molu382/zitifa-97-bizo337#b — also composite-a's decede-10-buvu414 (same ours/jar pair as lasasi/lonuti/soxene: 2.744965/2.744931), a cross-bucket link for SYNTHESIS.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### dulixa-11-kufe247

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 1 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### fadupe-90-koti079

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 1 | 3.058247 | 3.058299 | -0.004 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.058247-3.058299)×72 = -0.003744 px ≈ -0.004; same mergedWidth chain as domoru-86-coki670.
- **ruledOut:** accumulation order (identical Java/ours sum-then-multiply-once formula). text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** gifasa-23-zile558 (identical ours/jar pair 3.058247/3.058299) — same underlying title text, one shared cause. Cluster B family otherwise as domoru-86-coki670.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### fajegu-17-joba577

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 9 | 1.282812 | 1.282813 | -0.000 |
  | 1 | width | 10 | 1.282812 | 1.282813 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A, X-axis variant (same mechanism as the height rows, applied to a composite's width instead — addNodeInk sums node.x with width symmetrically to node.y with height).
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (1.282812-1.282813)×72 = -0.000072 px per row; X-position residual folded into a composite's declared width via the same ink-extent path.
- **ruledOut:** same as beguxu-19-tize774 (harness reformatting, our accumulation order).
- **pairingRisk:** possible — two identical-valued width rows in the same scope.
- **sharedCauseWith:** beguxu-19-tize774 and the rest of Cluster A (mechanism-level; distinct exact value).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### fojisi-40-zogo372

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 1 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px; same chain as bemena-23-zebu249.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### fomusu-59-fupe538

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 4 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### gifasa-23-zile558

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 1 | 3.058247 | 3.058299 | -0.004 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.058247-3.058299)×72 = -0.003744 px ≈ -0.004.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** fadupe-90-koti079 (identical ours/jar pair — one shared cause).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### jaxebo-54-nifi592

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 4 | 6.179291 | 6.179306 | -0.001 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (6.179291-6.179306)×72 = -0.00108 px ≈ -0.001.
- **ruledOut:** accumulation order; Cluster A (raw width is inherently fractional, not round-minus-epsilon). text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** mifuti-36-jine785 (identical ours/jar pair 6.179291/6.179306).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### jelusa-98-nexa591

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 1 | 3.444444 | 3.444375 | +0.005 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.444444-3.444375)×72 = +0.004968 px ≈ +0.005.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** none confirmed at value level; Cluster B family.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### jorere-75-peja265#a

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
  | 3 | height | 1 | 5.638888 | 5.638889 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A (split from #b, ADR-1: this fixture's rows have two distinct causes).
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px; (5.638888-5.638889)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** ketibo-84-juzo029#a, zitifa-97-bizo337#a (identical row values across all three — same diagram content), plus the rest of Cluster A.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### jorere-75-peja265#b

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 1 | 6.46066 | 6.460694 | -0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (6.46066-6.460694)×72 = -0.002448 px ≈ -0.002.
- **ruledOut:** accumulation order; Cluster A (this is the width row, distinct value pattern from #a's height rows). text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** ketibo-84-juzo029#b, zitifa-97-bizo337#b (identical ours/jar pair — same diagram content).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### ketibo-84-juzo029#a

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
  | 3 | height | 1 | 5.638888 | 5.638889 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A (split from #b).
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** identical to jorere-75-peja265#a.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** jorere-75-peja265#a, zitifa-97-bizo337#a, plus the rest of Cluster A.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### ketibo-84-juzo029#b

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 1 | 6.46066 | 6.460694 | -0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** identical to jorere-75-peja265#b.
- **ruledOut:** accumulation order; Cluster A. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** jorere-75-peja265#b, zitifa-97-bizo337#b.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### kujaju-47-neku764

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 1 | 2.777777 | 2.777778 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.777777-2.777778)×72 = -0.000072 px; identical value pair to beguxu-19-tize774.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** beguxu-19-tize774 (identical ours/jar pair 2.777777/2.777778).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### lalava-26-zosi801

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 5 | width | 0 | 1.959809 | 1.959757 | +0.004 |
  | 5 | width | 1 | 1.959809 | 1.959757 | +0.004 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (1.959809-1.959757)×72 = +0.003744 px ≈ +0.004, per row.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** possible — two identical-valued width rows in the same scope.
- **sharedCauseWith:** tegali-39-molu382 (identical ours/jar pair, both rows).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### lasasi-13-nona547

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 3 | 2.744965 | 2.744931 | +0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.744965-2.744931)×72 = +0.002448 px ≈ +0.002.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** lonuti-97-voko521, soxene-95-domu248 (identical ours/jar pair — this precision bucket) and composite-a's decede-10-buvu414 (same 2.744965/2.744931 pair, a cross-bucket link for SYNTHESIS).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### leloja-87-tebi184

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | height | 3 | 5.597221 | 5.597222 | -0.000 |
  | 4 | height | 3 | 5.597221 | 5.597222 | -0.000 |
  | 5 | height | 2 | 9.041665 | 9.041667 | -0.000 |
  | 5 | height | 3 | 9.041665 | 9.041667 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A. The `9.041665/9.041667` pair is 2 units off in the 6th decimal (still <0.0001px) — consistent with 2 accumulated position-residual terms rather than 1, matching the "magnitude scales with contributing-node count" pattern noted across Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (5.597221-5.597222)×72 = -0.000072 px; (9.041665-9.041667)×72 = -0.000144 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** possible — two duplicate-valued row pairs (scope3/scope4 identical, scope5 idx2/idx3 identical).
- **sharedCauseWith:** rest of Cluster A (mechanism-level; distinct exact values from this fixture).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### lonuti-97-voko521

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 2 | 2.744965 | 2.744931 | +0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.744965-2.744931)×72 = +0.002448 px ≈ +0.002.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** lasasi-13-nona547, soxene-95-domu248, and composite-a's decede-10-buvu414.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### mifuti-36-jine785

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 4 | 6.179291 | 6.179306 | -0.001 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (6.179291-6.179306)×72 = -0.00108 px ≈ -0.001.
- **ruledOut:** accumulation order; Cluster A. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** jaxebo-54-nifi592 (identical ours/jar pair).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### nuboca-13-xape657

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### pajefo-95-neri955

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 4 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### pexiku-77-japi217

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | height | 0 | 4.013888 | 4.013889 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (4.013888-4.013889)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** rest of Cluster A (mechanism-level; distinct exact value).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### soxene-95-domu248

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 3 | 2.744965 | 2.744931 | +0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.744965-2.744931)×72 = +0.002448 px ≈ +0.002.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** lasasi-13-nona547, lonuti-97-voko521, and composite-a's decede-10-buvu414.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### sumiri-68-suvo696

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 2.651345 | 2.651319 | +0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (2.651345-2.651319)×72 = +0.001872 px ≈ +0.002.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** none confirmed at value level; Cluster B family.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### tegali-39-molu382

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 5 | width | 1 | 1.959809 | 1.959757 | +0.004 |
  | 5 | width | 2 | 1.959809 | 1.959757 | +0.004 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (1.959809-1.959757)×72 = +0.003744 px ≈ +0.004, per row.
- **ruledOut:** accumulation order. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** possible — two identical-valued width rows in the same scope.
- **sharedCauseWith:** lalava-26-zosi801 (identical ours/jar pair, both rows).
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### xepafa-33-lazi826

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 4 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** Δpx = (3.555555-3.555556)×72 = -0.000072 px.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** bemena-23-zebu249 and the rest of the `.555555/.555556` group.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### zitifa-97-bizo337#a

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
  | 3 | height | 1 | 5.638888 | 5.638889 | -0.000 |
- **status:** resolved
- **mechanism:** Cluster A (split from #b).
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** identical to jorere-75-peja265#a.
- **ruledOut:** same as beguxu-19-tize774.
- **pairingRisk:** none.
- **sharedCauseWith:** jorere-75-peja265#a, ketibo-84-juzo029#a, plus the rest of Cluster A.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**

### zitifa-97-bizo337#b

- **bucketLabel:** precision
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 3 | width | 1 | 6.46066 | 6.460694 | -0.002 |
- **status:** resolved
- **mechanism:** REVISED (follow-up probe2.ts, coordinator request): the width-table hypothesis is REFUTED by direct measurement — no candidate label text in this fixture has a raw `WidthTableMeasurer` width anywhere near the row's implied non-margin component (e.g. fadupe-90-koti079's target ~200.19px vs its own title "Active" measuring only 38.15px). The true driver is `childImg.width` (the inner autonom pass's own ink-extent, `computeSvekResultGeometry`), i.e. the SAME Cluster A mechanism as the height rows — uncorrected X-position from `mapNodes` propagating through `addNodeInk`/`buildInkBox` — just larger here because more inner nodes/edge-label boxes contribute position terms on this fixture's WIDTH axis. Text-measurement accumulation-order and font-size scaling were also checked and ruled out as an independent cause (Java `StringBounderFromWidthTable.calculateDimension:66-79` uses the same sum-then-multiply-once-by-`size/16` double formula as `measurer.ts:186-193`, no `Math.round` in either path) — moot here since text width is not the driving term for this row.
- **originFileLine:** src/core/graph-layout.ts:189-194
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
- **causalChain:** identical to jorere-75-peja265#b.
- **ruledOut:** accumulation order; Cluster A. text-table-value hypothesis (this follow-up's font-table diff) refuted by probe2.ts: no measured label text width is anywhere near the row's implied childImg component.
- **pairingRisk:** none.
- **sharedCauseWith:** jorere-75-peja265#b, ketibo-84-juzo029#b.
- **proposedWriteSet:** src/core/graph-layout.ts (mapNodes echo scope).
- **sizeEstimate:** see beguxu-19-tize774.
- **confidence:** high
- **nextStep:**
