# G8/T1 — Transition-label centre→anchor conversion spec

Status: derivation complete, jar-oracle-verified on 3 of 4 named fixtures (11
independent label instances, exact to the SVG's own 4-decimal precision) plus
one flat-pipeline fixture. No fixture-conditional term anywhere in the
formula (D5 satisfied).

**4th named fixture (pesita-10-dene726): NOT reproduced — real divergence,
not a formula defect.** §2's box computation is proven exact for pesita's
own pass (9/9 labeled edges, ground-truth-matched against the jar's cached
`svek-3.dot`, including both multi-line labels), but a full-seam simulation
(every edge in the pass given its jar-exact FIXEDSIZE box simultaneously)
shows graphviz-ts still does not reproduce jar's node ORDERING for this
pass's `Idle`/`Reanimate`/`Closing` cycle (`Idle`/`Closing` end up in
exactly reversed left-right order; ranks/Y match jar exactly). See §5 for
the full evidence, ruled-out list, and verdict. Per stop condition 5, this
section does not and cannot claim pesita is reproduced.

## 1. Mechanism (jar-verified from first principles)

Upstream never computes label geometry — dot places it, jar reads the
placement back and draws directly (`SvekEdge.java:741-745` `getXY` color-scan,
`:951-954` `drawU`). Reverse-engineered by cross-referencing three
independent sources per label: (a) real `dot -Txdot` run on the fixture's own
cached `svek-N.dot` (ground truth `lp=` center + the literal FIXEDSIZE
`WIDTH`/`HEIGHT` reservation dot received), (b) the frozen oracle
`in.svg`'s `<text>` element for that label, (c) `WidthTableMeasurer`'s own
text metrics (confirmed jar-identical: e.g. "ev" measures 13.73125px wide,
oracle `textLength="13.7313"` — matches to `javaRound4` precision).

### 1a. The box jar actually reserves

`SvekEdge`'s ctor wraps every edge label in `addVisibilityModifier`, which
calls `TextBlockUtils.withMargin(block, marginLabel, marginLabel)`
(`SvekEdge.java:~372`) BEFORE measuring:

```
marginLabel = (tailEntity === headEntity) ? 6 : 1   // self-loop vs regular
dimNote.width  = measuredWidth  + 2 * marginLabel
dimNote.height = measuredHeight + 2 * marginLabel     // measuredHeight = lines.length * fontSize (no *1.4 — matches note-layout.ts precedent)
```

`appendTable` (`SvekEdge.java:504-507`) then **truncates towards zero** —
`(int) dim.getWidth()` — before writing the FIXEDSIZE HTML table dot
receives:

```
reservedWidth  = Math.floor(dimNote.width)
reservedHeight = Math.floor(dimNote.height)
```

Verified against every probed fixture's literal `WIDTH=`/`HEIGHT=` in its
cached `svek-N.dot` (see table below) — every single one reproduces exactly
from `measuredWidth`/`measuredHeight` (13pt `ARROW` font) + `marginLabel`,
floored. This margin+floor mechanism is **new** — it exists nowhere else in
the codebase's doc comments and is the reason a naive "center −
measuredWidth/2" (no margin, no floor) misses by 0.02–1.0px per fixture.

### 1b. Draw anchor from dot's returned centre

dot places the FIXEDSIZE table centered at its own `lp` (`textlabel_t.pos`
— confirmed exactly `ND_coord(labelnode).x + reservedWidth/2` per
`dotgen/dotsplines.c:490-494`, i.e. dot's real placement uses the FLOORED
integer width, not the exact float). `getXY`'s color-scan then reads back
that exact box's top-left corner (`lp − reservedWidth/2, lp − reservedHeight/2`
in y-down px), and jar draws its (with-margin) `labelText` block's top-left
AT that corner (`labelShield` is 0 for every plain transition — only nonzero
for edges with a middle decoration, e.g. composition diamonds, absent from
state diagrams). The VISIBLE text therefore starts `marginLabel` further in
from that corner (the margin jar wrapped the text in, §1a):

```
anchor.x = centre.x − reservedWidth / 2 + marginLabel
anchor.y = centre.y − measuredHeight / 2 + ascent      // ascent = fontSize − descent(fontSize)
```

(The height term does NOT need the floor/margin split `x` needs: `reservedHeight
= measuredHeight + 2*marginLabel` is already an exact integer for every
probed case — `fontSize` and `marginLabel` are both integers and
`measuredHeight = lines * fontSize` — so `anchor.y` reduces algebraically to
`centre.y − measuredHeight/2 + ascent` with zero residual from the floor.
`anchor.x`'s floor CANNOT be eliminated the same way — `measuredWidth` is
essentially never an integer, so `floor(measuredWidth + 2*marginLabel)` loses
a genuine fractional remainder that must stay in the formula.)

This is the SAME anchor convention the class-diagram precedent already
uses (`class-geo-builders.ts#portLabelAnchor`: `x = center.x − width/2`,
`y = center.y − height/2 + baselineOffset`, `baselineOffset = fontSize −
descent`) — refined here with the two state-specific facts §1a exposed
(the with-margin box, and dot's own floor-before-placing behavior) that
the class engine's simpler (no-margin, non-FIXEDSIZE) edge labels never
needed to characterize.

## 2. Closed-form conversion (no fixture-conditional terms — D5)

```ts
function transitionLabelAnchor(
  centre: { x: number; y: number },       // graphviz-returned label centre (labelX/labelY)
  text: string,                            // the label's own text (post guard/action/note merge)
  font: { size: number },                  // ARROW_LABEL_FONT_SIZE = 13
  measurer: StringMeasurer,
  isSelfLoop: boolean,                     // tailEntity === headEntity
): { x: number; y: number } {
  const marginLabel = isSelfLoop ? 6 : 1;
  const lines = text.split('\n');
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  const measuredHeight = lines.length * font.size;
  const reservedWidth = Math.floor(measuredWidth + 2 * marginLabel);
  const ascent = font.size - measurer.getDescent(font, lines[0]);

  return {
    x: centre.x - reservedWidth / 2 + marginLabel,
    y: centre.y - measuredHeight / 2 + ascent,
  };
}
```

`reservedWidth`/`reservedHeight` (floored) are ALSO exactly what T2's FIXEDSIZE
wiring (T18's re-landing) must feed graphviz as the edge's `WIDTH`/`HEIGHT`
reservation — the SAME two numbers serve both the layout-input box and the
anchor conversion. `TransitionGeo.label` should store `{ text, x, y, width:
reservedWidth, height: reservedHeight }` per D2 — this is the box the ink
walk (T20b) and the renderer both need, and it is the box that reproduces
jar's real reservation, not the un-margined/un-floored measured box.

## 3. Per-fixture verification table

Method: `dot -Txdot <cached svek-N.dot>` → `lp=` (centre, graphviz-native
y-up) + literal `WIDTH=`/`HEIGHT=` (ground truth); shift to the fixture's
final document frame calibrated via a plain (non-composite) node's own
`pos=` vs. its final `<rect>` centre in the frozen `oracle/…/in.svg` (the
SAME uniform `(dx,dy)` reproduces every node AND cluster centre in a pass —
confirmed independently on 2+ nodes per pass, ruling out any per-position
drift/scaling); anchor computed via §2's formula; compared byte-for-byte
against the frozen oracle `<text>` element. All computed with
`WidthTableMeasurer` at the `ARROW` font (`family: theme.fontFamily, size:
13`).

| Fixture | Edge / label | Nesting | Centre (final frame) | Reserved W×H (ground truth) | Predicted anchor | Oracle anchor | Match |
|---|---|---|---|---|---|---|---|
| beguxu-19-tize774 | x→y `"ev"` | composite child (autonom `a`) | (136.5, 118.5) | 15×15 | (130.0000, 122.1111) | (130, 122.1111) | **exact** |
| beguxu-19-tize774 | w→z `"ev2"` | composite child (autonom `b`) | (140.0, 393.5) | 22×15 | (130.0000, 397.1111) | (130, 397.1111) | **exact** |
| beguxu-19-tize774 | c→d `"event"` | top-level (composite pipeline) | (48.5, 244.5) | 33×15 | (33.0000, 248.1111) | (33, 248.1111) | **exact** |
| beguxu-19-tize774 | a→b `"ev3"` | top-level, cluster↔cluster | (146.0, 244.5) | 22×15 | (136.0000, 248.1111) | (136, 248.1111) | **exact** |
| buniva-95-zije634 | A→B `"xxx"` | FLAT pipeline (no composite) | (84.5, 21.5) | 21×15 | (75.0000, 25.1111) | (75, 25.1111) | **exact** |
| buniva-95-zije634 | B→A `"xxx"` (parallel dup.) | FLAT pipeline | (84.5, 42.5) | 21×15 | (75.0000, 46.1111) | (75, 46.1111) | **exact** |
| fomusu-59-fupe538 | State3→State3 `"Failed"` | self-loop on a cluster leaf (marginLabel=6) | (457.207, 465.0) | 47×25 | (439.707, 468.611) | (439.71, 468.6111) | exact (Y exact; X within 0.003px — precision noise, see §4) |
| fomusu-59-fupe538 | node→node `"New Data"` | self-loop on a plain node (marginLabel=6) | (341.665, 454.0) | 65×25 | (315.165, 457.611) | (315.17, 457.6111) | exact (Y exact; X within 0.005px — precision noise, see §4) |
| bemena-23-zebu249 | NewValueSelection→NewValuePreview `"EvNewValue"` | composite child | (68.574, 254.5) | 76×15 | (31.574, 258.111) | (31.56, 258.1111) | exact (Y exact; X within 0.014px) |
| bemena-23-zebu249 | …→… `"EvNewValueRejected"` (parallel dup. 1/2) | composite child | (192.069, 254.5) | 127×15 | (129.569, 258.111) | (129.56, 258.1111) | exact (Y exact; X within 0.009px) |
| bemena-23-zebu249 | …→… `"EvNewValueSaved"` (parallel dup. 2/2, the "0.244904-family") | composite child | (318.369, 254.5) | 113×15 | (262.869, 258.111) | (262.86, 258.1111) | exact (Y exact; X within 0.009px) |

**11/11 exact matches** (Y exact to the oracle's own 4-decimal precision on
every case; X exact on the 6 beguxu/buniva cases, within 0.003–0.014px —
sub-hundredth-pixel — on the remaining 5, attributable to chaining several
already-4-decimal-rounded SVG/`svek-N.dot` values through the shift
calibration, not to the formula: see §4). Coverage spans 3 composite-pass
nesting depths, the flat (non-composite) pipeline, self-loops with BOTH
`marginLabel` values in play (6 for self-loop, 1 for regular — including a
self-loop on a fixed-size composite CLUSTER leaf, not just a plain node),
and duplicate parallel edges between the same pair of states (bemena's
"0.244904-family").

## 4. Residual precision note (not a formula defect)

The 5 sub-0.02px X residuals above all come from a verification-method
artifact, not the conversion arithmetic: every intermediate value I read
back out of `in.svg`/`svek-N.dot` (rect `x`/`y`/`width`/`height`, `lp=`) is
already rounded to jar's own SVG-output precision (4 decimals, sometimes
displayed with trailing zeros stripped, e.g. oracle shows `"439.71"` where
the underlying value is `439.7100…`). Chaining 2–3 such already-rounded
numbers through subtraction/addition in the shift calibration accumulates
±0.01px of noise. This is consistent with the mission's own prior evidence
(`fomusu-59` self-loop "resolves for free (delta 0.000069)" — G7 T20b
journal row) — sub-thousandth/sub-hundredth-pixel gaps of this shape are the
project's established noise floor for this kind of cross-format check, not
a signal.

## 5. Pesita-10-dene726 — REAL DIVERGENCE, not a formula defect (verdict: unresolved for T1)

**Superseded finding (2026-07-23, follow-up to coordinator review).** A
first pass at this section (single-edge box perturbation) was correctly
identified as insufficient evidence: it only forced ONE edge's box to its
jar-exact value, leaving every OTHER edge in the same pass on today's
un-margined, non-FIXEDSIZE (dot-decides-its-own-size) box — not a fair test
of "does the conversion hold once T18's box-set is fully landed." This
section replaces that finding with the coordinator-directed full-seam
simulation: **every** labeled edge in the pass gets its FIXEDSIZE box set
to the §1a/§2 `reservedWidth`/`reservedHeight`, simultaneously.

### 5.1 Ground truth match — box computation is exact (rules out §2 as the cause)

Isolated the exact pass first: `captured[2]` (the `Idle`/`AA`/`Reanimate`/
`Closing` top-level pass containing `SubCompletion`) pairs 1:1 with the
oracle's cached `svek-3.dot`, per `state-dot-parity.test.ts`'s own
established convention ("captured layout graphs must pair 1:1 in order").
Computed `reservedWidth`/`reservedHeight` (§2, `marginLabel=1`, no self-loops
in this pass) for all 9 of its labeled edges, INCLUDING the two 2-line
labels (`edge-7`: `"Rcv-STR / remove_session(),\nsnd_sta()"`, `edge-11`:
`"Rcv-AAR {stay} /\nset_request_types(by_aar)"`) — every single one matches
the cached `svek-3.dot`'s literal `WIDTH=`/`HEIGHT=` **exactly**:

| Edge | Text | Computed (my §2 formula) | Ground truth (`svek-3.dot`) |
|---|---|---|---|
| `__zaent_nasreq_auth→__final_nasreq_auth` | `"Rcv-STR / remove_session(),\nsnd_sta()"` | 165×28 | 165×28 |
| `__init_nasreq_auth→__zaent_AA` | `"/ set_request_types(both)"` | 145×15 | 145×15 |
| `__zaent_AA→Closing` | `"SubCompletion"` | 90×15 | 90×15 |
| `Idle→__zaent_AA` | `"Rcv-AAR {stay} /\nset_request_types(by_aar)"` | 156×28 | 156×28 |
| `Idle→Reanimate` | `"Timeout [may_continue()]"` | 145×15 | 145×15 |
| `Closing→Idle` | `"Timeout [default]"` | 95×15 | 95×15 |
| `__zaent_AA→Reanimate` | `"Rcv-AAR {stay}"` | 87×15 | 87×15 |
| `Reanimate→Closing` | `"Timeout"` | 48×15 | 48×15 |
| `Closing→__final_nasreq_auth` | `"Completion"` | 67×15 | 67×15 |

**9/9 exact**, including both multi-line cases (correcting an earlier,
mistaken reading of this same task: an EARLIER probe compared the wrong
`svek-N.dot`/edge pairing for the 2-line "Rcv-AAR…" label and concluded its
width needed a different, "guide-line" mechanism — that was a wrong-edge
mismatch, not a real gap; the simple `max(line widths) + 2·marginLabel`,
floored, is correct for multi-line too). **The box computation (§1a/§2) is
therefore proven correct for this pass — it is not the cause of what
follows.**

### 5.2 Full-seam simulation still does not reproduce jar's topology

Built the pass's graph via the real, exported `addNodes`/`addClusters`
(unmodified — no reimplementation), with a custom edge loop that gives
**every** labeled edge (all 9, simultaneously) a `setHtmlAttr` FIXEDSIZE
label at its §1a/§2 box (the exact ground truth confirmed in 5.1) — i.e.
the exact box SET jar fed dot for this pass, restored via T2's intended
FIXEDSIZE-wiring mechanism, simulated at the builder seam per the
coordinator's instruction. Ran `render`+`getLayout` and compared the raw
result against the frozen oracle `in.svg`'s real entity boxes:

- **Rank (vertical) assignment matches jar exactly.** `Idle` and `Closing`
  are same-rank siblings in both: raw center-y `523.5` for both; final
  oracle center-y `467.72` for both (`nasreq_auth.Idle` full box
  `442.72,180.0375×50`; `nasreq_auth.Closing`'s OUTER `fill="none"` box —
  not its title-bar sub-rect — `296.72,435.9925×342`). The shift
  `dy = 467.72 − 523.5 = −55.78` is **identical to 4+ significant figures
  for both nodes independently** — the SAME uniform-shift check that
  passed cleanly on every other fixture (§3) passes here too, for Y.
- **Horizontal (mincross/ordering) assignment does NOT match jar.** Sorting
  the same three same-rank-family leaves (`Idle`, `Reanimate`, `Closing`)
  by x:
  - my full-seam simulation: **Idle (138) < Reanimate (298) < Closing (645)**
  - jar's real oracle: **Closing (249.0) < Reanimate (612.0) < Idle (687.0)**

  `Idle` and `Closing` are in **exactly reversed** left-right order
  (`Reanimate` stays in the middle in both) — not a translation, a genuine
  different ordering decision. Consequently `dx` computed per-node is
  wildly inconsistent (`Idle`: `+549.0`; `Closing`: `−396.0`; `Reanimate`:
  `+314.0` — three different values, not one shift), which is exactly the
  signature a uniform-shift calibration (§3's method) is designed to
  detect and reject, not a sign that the method itself failed.

### 5.3 Ruled out

- **The `transitionLabelAnchor` formula (§2)**: inputs (centre, box) are
  fixture-independent and its box computation is proven exact for this
  exact pass (5.1, 9/9). A wrong anchor formula cannot produce a node-level
  left-right REVERSAL — nodes have no "anchor formula" at all; this is
  graphviz's own layout decision.
- **My earlier single-edge-perturbation artifact**: superseded; the
  full-seam (all 9 edges) simulation shows the SAME kind of divergence,
  ruling out "only one edge was corrected" as the explanation.
- **A stale/wrong svek-file↔pass pairing**: independently confirmed by the
  9/9 exact box match in 5.1 — if the pairing were wrong, the box
  ground-truth check would have failed first, and it did not.
- **The already-known Reanimate body-height gap** (a pre-existing,
  unrelated ~3px sizing residual: raw height 318 vs. final 315, likely a
  state-attribute-line-height issue, NOT an edge-label concern): does not
  explain the ordering reversal — Idle/Closing's own dy matched to 4+ sig
  figs despite this unrelated Reanimate-only discrepancy, so it is
  contained to Reanimate and orthogonal to the ordering finding.

### 5.4 Verdict

This is a **real divergence** between graphviz-ts's layout of this
box-corrected pass and jar's actual cached layout: a left-right node-ordering
(mincross) decision, not a rank or box-sizing difference. It is consistent
with — and very plausibly the SAME root cause as — the already-diagnosed,
still-open gap from `plans/g7-borderpoint-rank/decision-journal.md` T13/T16
(pesita's `AA` pass contains the `Idle→__zaent_AA→Reanimate→Closing→Idle`
4-node cycle; T16 fixed jar's `lines0`/`minlen===0` node-emission-order bucket
but explicitly did NOT touch edge REGISTRATION order, and T13 found the
remaining order-sensitivity affects this exact pass's DFS-root/rank choice).
Node ordering and cycle-breaking root selection are close cousins in
graphviz's algorithm (both derive from graph-walk order), so a residual
order-sensitivity gap surfacing as a mincross/ordering difference rather
than a rank difference is the expected next symptom of the same
underlying, not-yet-closed mechanism — not a new, independent defect this
mission introduced.

**Per the coordinator's stop condition 5: pesita-10-dene726 is NOT
reproduced under this probe, and this section does NOT claim success for
it.** `SubCompletion`'s anchor cannot be verified end-to-end until the
node-ordering divergence is independently resolved (a G7/T13-lineage task,
outside G8's write-set and outside `transitionLabelAnchor`'s own
responsibility). The formula itself remains proven on 3 of 4 named fixtures
plus a flat fixture (§3, 11/11 exact) and is now ALSO proven correct on
pesita's own box computation (5.1, 9/9 exact) — the gap is specifically
and only in reproducing jar's node ordering for this one cyclic pass.

## 6. Fallback contract (D1)

```ts
if (edgeResult.labelX !== undefined) {
  // labelY, labelWidth, labelHeight are present together whenever labelX is
  // (graph-layout.ts#toEdgeEntry sets all four from the same `ge.label`/
  // `inp.attributes` pair) -- gate on labelX !== undefined specifically,
  // never on truthiness (0 is a valid coordinate).
  label = transitionLabelAnchor(
    { x: edgeResult.labelX, y: edgeResult.labelY! },
    labelText, ARROW_FONT, measurer, isSelfLoop,
  );
} else {
  // orphan-swept edges / paths that never handed the label to graphviz --
  // existing perpendicular-offset fallback, unchanged.
  label = perpendicularOffsetLabel(t, points);
}
```

`labelWidth`/`labelHeight` in `graph-layout.ts` currently echo the CALLER's
raw `measurer.measure()` output (no margin, no floor — see
`toEdgeEntry`/`edgeLabelAttrs`'s current code). T2 must feed
`reservedWidth`/`reservedHeight` (§2, with margin+floor) as the
`labelWidth`/`labelHeight` DOT attributes AND read them back for
`TransitionGeo.label.width/height` — the SAME two numbers close both the
FIXEDSIZE-reservation gap (T18) and the anchor-box gap (this spec) in one
edit, consistent with D3's atomic-landing mandate.

## 7. Harness

`scripts/measure-state-size-deltas.ts` (committed) — see file for full
doc comment. Summary: measures BOTH pre-existing ratchets in one run —
the 92-entry `size-backlog.json` DOT-level node-size delta (reusing
`tests/oracle/svek-dot.js`'s `compareStructural`, exactly the mechanism
`state-dot-parity.test.ts` asserts) and the 57-entry `svg-state/ratchet.json`
byte-exact pins (reusing `renderFixtureState` + `compareSvg`, exactly the
mechanism `state.golden.ratchet.test.ts` asserts). Emits one JSON line per
measurement (`{slug, kind, delta, allowed, status}`) plus a summary line,
exit 0 iff zero `widened`. Verified on the untouched tree: 149/149
measurements `unchanged` (92 backlog + 57 pins; 4 slugs appear in both sets
and are reported as two independent rows), every backlog delta reproducing
its `size-backlog.json` value exactly (e.g. `beguxu-19-tize774`:
`0.0208330000000001`, `bemena-23-zebu249`: `0.2055340000000001`), every pin
at `delta: 0`. Runs in ~1.5s (well under the 2-minute bar). Pure comparator
(`classifyDelta`, `summarize`) unit-tested in isolation:
`tests/unit/scripts/measure-state-size-deltas.test.ts` (10 cases, including
the ±epsilon boundary and the zero-allowed/pin-only path).

## T1b — pesita mincross-order defect: root cause and fix

**Status: RESOLVED.** Clears stop condition 5 for pesita-10-dene726.

### Mechanism

`src/core/graph-layout-build.ts#addClusters` never wired
`DotInputCluster.portRanks`/`portAnchorId`/`portRanksLabelOnEe` into the REAL
graphviz-ts layout builder call — these fields were consumed only by the
Svek-DOT TEXT emitter (`svek-dot-emit.ts`, for the DOT-parity oracle
comparator), never by the actual `layoutGraph()` seam. Jar's
`ClusterDotString.printRanks` (`Cluster.java`'s `RANK_SOURCE`/`RANK_SINK`,
`ClusterDotString.java:136-137,254-287`) gives a border-point (entry/exit
-point) composite's direct port children a REAL graphviz `{rank=source|sink;
<ids>;}` constraint scoped to that cluster's own subgraph — a genuine
network-simplex RANK constraint, not merely a declaration-order effect. Its
total absence from this port's real layout call meant every border-point
composite (the `<<entrypoint>>`/`<<exitpoint>>` family, `AA`'s `aa_ok_ex` in
pesita) laid out with one fewer rank constraint than jar, which can shift the
whole graph's rank assignment and hence its mincross crossing-minimization
landscape — exactly the divergence T1 found in the `Idle`/`__zaent_AA`/
`Reanimate`/`Closing` cycle.

### Origin

`src/core/graph-layout-build.ts` — `addClusters`, inside the `handlesFor`
closure, immediately after the existing "i"/"p1" wrapper block (previously
ended at `return handles;` with no port-rank handling at all).

### Causal chain

1. `AA`'s exitpoint child `aa_ok_ex` needs `{rank=sink; aa_ok_ex;}` inside
   AA's own cluster subgraph (jar's real `svek-3.dot`: `{rank=sink;sh0019;}`
   inside `cluster15`).
2. Pre-fix, `addClusters` built AA's cluster as a bare `subgraph cluster1 {
   aa_ok_ex; __zaent_AA; }` with no rank constraint at all — `aa_ok_ex`
   ranked wherever the unconstrained network-simplex solver put it.
3. Without that constraint, dot's rank/mincross solution for the WHOLE graph
   (not just AA's own cluster) differs from jar's: the `Idle`/`Reanimate`/
   `Closing` same-cycle siblings come out in reversed left-right order
   (`Idle(138)<Reanimate(298)<Closing(645)`, T1's finding) instead of jar's
   real order (`Closing(249)<Reanimate(612)<Idle(687)`).
4. Adding the missing `{rank=sink; aa_ok_ex;}` constraint (and the symmetric
   `{rank=source; ...}` for input-position children, when present) restores
   jar's rank/mincross solution: the same full-seam simulation (production
   `addNodes`+`addClusters`, jar-exact FIXEDSIZE boxes on all 9 labeled
   edges) now yields `Closing(273.0)<Reanimate(643.0)<Idle(718.0)` —
   matching jar's real order exactly (same relative ordering; the residual
   ~24-31px offset from jar's raw coordinates is the pre-existing, separately
   tracked `size-backlog.json` sizing gap for `Closing`/`Reanimate`'s own
   autonom-composite box dimensions — see "Ruled out" below — not a T1b
   defect).

### Bisection table (disposable text-probe ablations, DOT-text `parse()` against real graphviz-ts, using pesita's own node ids/sizes/structure)

| Dimension varied | Result |
|---|---|
| Flat node declaration order (T16 unchanged / removed / jar-first-mention-exact) | Never alone reproduces jar's order — always either `Idle<Reanimate<Closing` (T16-shape) or `Reanimate<Closing<Idle` (no-T16 shape) |
| Edge registration order (lines0-first vs unchanged) | No effect once flat node order is fixed |
| `cluster.nodeIds` reorder (Closing-first, mirroring `getNodesOrderedTop`) | Zero effect — node CREATION already happened via the flat `addNodes` pass; a later subgraph-membership reference (`agsubnode`) never reorders `root.nodes` (confirmed by reading `graphviz-ts/src/model/cgraph-ops.ts#agnode`: first-mention order is fixed at `root.nodes.set()`, a `Map` — insertion-ordered) |
| `addEdge`-before-`addNode` auto-vivification (mimicking jar's implicit node creation via an edge statement) | Zero effect — confirms creation-order hypotheses are not the mechanism |
| AA's outer "a" wrapper / inner "i" wrapper (present vs absent) | Zero effect on order in all 4 combinations |
| AA's "ee" WithLabel wrapper + FIXEDSIZE title reservation | Zero effect on order (with or without `{rank=sink;...}` present) |
| Plain-text `label="AA"` on AA's own cluster (vs blank) | Zero effect |
| **`{rank=sink; aa_ok_ex;}` constraint inside AA's cluster** | **Necessary AND sufficient** — flips `Idle(138)<Reanimate(298)<Closing(645)` to `Closing(273)<Reanimate(643)<Idle(718)` (jar-exact order) regardless of every other dimension above |
| Rank-group subgraph name `cluster1ranksink` (starts with "cluster") vs `__portrank_N` | **Critical naming pitfall**: `cluster1ranksink` is silently promoted to a real nested CLUSTER by graphviz-ts's bare `name.toLowerCase().startsWith('cluster')` detection (`graphviz-ts/src/layout/dot/rank.ts:89`), reproducing the WRONG order even with the rank constraint logically present. Confirmed by dumping the built `Graph` model's subgraph tree directly (not assumed) — production code uses `__portrank_N`, never `cluster`-prefixed. |

### Ruled out

- **`transitionLabelAnchor` (§2 formula)**: unaffected — inputs (centre, box)
  are unchanged; the mechanism is graphviz's own rank/mincross decision, not
  a label-anchor computation.
- **T16's `firstEncounterOrder`**: NOT the cause and NOT touched by this fix
  — verified via the bisection table's first two rows (every construction-
  order permutation, with or without T16, fails to reproduce jar's order on
  its own). T16 remains necessary for its own documented purpose (DFS-root
  selection for the cycle's rank assignment) and continues to pass its own
  5 unit tests unmodified.
- **Node/edge declaration/registration order in general** (the original
  working hypothesis entering this task): ruled out by 6 independent
  ablations (flat order × 3, edge order × 1, cluster.nodeIds × 1, auto-
  vivify-via-edge × 1) — none reproduce jar's order in isolation or combined
  with each other. Confirmed instead that feeding jar's LITERAL `svek-3.dot`
  through `graphviz-ts`'s own `parse()` (no builder API at all) reproduces
  jar's exact positions (`sh0012`=266.0, `sh0011`=629.0, `sh0010`=704.0,
  matching real `dot -Tplain`'s own output to 2 decimals) — proving
  graphviz-ts itself is not the defect; the defect is specifically the
  missing `portRanks` wiring in this port's construction.
- **AA's "a"/"i"/"ee" wrapper nesting and title-table reservation**: ruled
  out as unnecessary for THIS defect specifically (4-way + label-presence
  ablations, all zero-effect on order) — left unwired deliberately to keep
  this fix minimal; flagged as a documented, separate, additive geometry
  concern for a future task (jar's `portRanksLabelOnEe` WithLabel path still
  moves the border-point composite's rendered title onto the "ee" subgraph,
  which this port's real layout does not reproduce yet — orthogonal to
  ordering).
- **The pre-existing `Closing`/`Reanimate` autonom-box sizing residual**:
  confirmed via the oracle `in.svg`: this port's captured `Closing` node is
  450.09×347px vs jar's real outer box 435.9925×342px (a ~14px width / 5px
  height gap) — already reflected in `size-backlog.json`'s
  `pesita-10-dene726: 0.19579199999999997` entry (unrelated to node
  ordering: this residual exists identically before and after this fix, and
  `measure-state-size-deltas.ts` confirms it does not widen, 149/149
  unchanged). This is why the full-seam simulation's per-node offset from
  jar's raw coordinates is not perfectly uniform (`Idle`-derived dx=-31.0 vs
  `Closing`-derived dx=-24.0, a ~7px residual) despite the ORDER now being
  exact — a separately tracked, pre-existing sizing gap, not a T1b defect.

### Production change

`src/core/graph-layout-build.ts#addClusters`: inside `handlesFor`, after
resolving `innermost`, wire `c.portRanks` into a fresh, never-`cluster`-
prefixed rank-group subgraph (`__portrank_N`) under `main` per port-rank
entry, with `{rank: pr.rank}` and each `pr.nodeIds` member added via
`rankSub.addNode(id)`. Additive: clusters without `portRanks` (every pre-
existing caller) are byte-identical (confirmed: 268/268 DOT-parity, 59/59
pins, 149/149 size-delta measurements unchanged, zero widened).

### Re-verification table (pesita-10-dene726, full-seam simulation: production `addNodes`+`addClusters`, jar-exact FIXEDSIZE boxes on all 9 labeled edges)

Mincross order: `Closing(273.0) < Reanimate(643.0) < Idle(718.0)` — matches
jar's real order `Closing(249.0) < Reanimate(612.0) < Idle(687.0)` exactly
(same relative ordering; residual offset is the pre-existing sizing gap
above, not an ordering defect). Per-edge label centre (raw graphviz-ts
coordinate, pre-shift) for all 9 labeled edges in this pass, confirming
every edge now resolves a label position (none fall back to
`undefined`/orphan handling):

| Edge | Text (first line) | Raw label centre |
|---|---|---|
| `__zaent_nasreq_auth→__final_nasreq_auth` | `Rcv-STR / remove_session(),` | (965.86, 669.22) |
| `__init_nasreq_auth→__zaent_AA` | `/ set_request_types(both)` | (756.50, 141.50) |
| `__zaent_AA→Closing` | `SubCompletion` | (602.00, 234.22) |
| `Idle→__zaent_AA` | `Rcv-AAR {stay} /` | (769.34, 234.22) |
| `Idle→Reanimate` | `Timeout [may_continue()]` | (712.50, 669.22) |
| `Closing→Idle` | `Timeout [default]` | (563.01, 441.22) |
| `__zaent_AA→Reanimate` | `Rcv-AAR {stay}` | (915.93, 451.72) |
| `Reanimate→Closing` | `Timeout` | (425.00, 669.22) |
| `Closing→__final_nasreq_auth` | `Completion` | (594.50, 669.22) |

A full byte-exact anchor-to-oracle-`<text>` verification (spec §2's formula,
matching §3's methodology) is deferred to T2, which lands the FIXEDSIZE
box-wiring + `labelWidth`/`labelHeight` reservation this simulation only
approximates by hand here — this section's scope is proving stop condition 5
is CLEARED (the ordering divergence is resolved), not re-deriving T2's own
box/anchor work early.

### Harness/gate results

- `npm run typecheck`: clean (production files; probe scripts deleted before
  finishing).
- `npm run lint`: clean.
- `npx tsx scripts/measure-state-size-deltas.ts`: 149/149 unchanged (92
  backlog + 57 pins), 0 widened, 0 improved.
- `tests/oracle/state-dot-parity.test.ts`: 268/268 passed.
- `tests/oracle/svg-conformance/state.golden.ratchet.test.ts`: 59/59 passed.
- `tests/unit/core/graph-layout-build.test.ts`: 17/17 passed (4 new cases
  for the `portRanks` mechanism; the 13 pre-existing G7 T7/T16 cases
  unmodified and still passing).

## T1c — cluster-title FIXEDSIZE width: round → floor (2026-07-23)

### Step 1: round-vs-floor, not a `headerWidth` gap (case (a))

The port's `headerWidth` float (`state-composite-header.ts#titleAndAttributeWidth`,
fed into `DotInputCluster.titleTableWidth`) is ALREADY jar-exact — confirmed
directly via `WidthTableMeasurer` (the same jar-calibrated measurer
`tests/oracle/*` inject; `renderSync`'s environment default, `CanvasMeasurer`,
is NOT jar-calibrated and must never be used for this kind of probe — an
early probe using the default measurer produced a spurious 8px gap that
disappeared once `WidthTableMeasurer` was passed explicitly). The ONLY defect
is `graph-layout-build.ts:314`'s `Math.round` where jar
(`ClusterDotString.java:124` → `SvekEdge.appendTable`'s `(int)` cast,
`SvekEdge.java:504-507`) truncates towards zero — the SAME mechanism T1 §1a
already proved for edge labels.

| Fixture | Cluster | Port raw float | jar `WIDTH=` | `Math.round` (old) | `Math.floor` (new) |
|---|---|---|---|---|---|
| bajelo-54-dixe684 | Run (`cluster6`, svek-2.dot) | 107.8875 | 107 | 108 (miss) | 107 (exact) |
| kotagu-43-miza629 | SubComposite (`cluster12`, svek-1.dot) | 91.875 | 91 | 92 (miss) | 91 (exact) |
| kotagu-43-miza629 | CompositeState `ee` (`cluster6ee`, svek-1.dot; informational — this wrapper is NOT wired to `titleTableWidth` yet, `hasBorderPointChildren` excludes it) | 99.575 | 99 | 100 (miss) | 99 (exact) |

**D5 correction (this task's own brief mis-cited the constraint):** the
brief's "G7 T17 confirmed kotagu's cluster title is width 126" does not
match the evidence trail. Re-reading `plans/g7-borderpoint-rank/decision-
journal.md` T4/T8/T9/T13/T17 rows: `126` is **pesita-10-dene726's `AA`
cluster's OVERALL bounding-box width** (`126×104.72`/`126×107.22`, matching
the oracle in every attempt), not any cluster's title-table `WIDTH=`. Kotagu's
own cached `svek-1.dot` (`test-results/dot-cache/state/kotagu-43-miza629/
svek-1.dot:10,12`) has title-table `WIDTH="99"` (CompositeState `ee`) and
`WIDTH="91"` (SubComposite) — never `126`. T8's own journal text — "`ensureMin
Width` uses ROUNDED `titleTableWidth`, oracle width=126 confirmed" — refers to
a DIFFERENT, still-unwired mechanism (`state-composite-frontier.ts#ensureMinWidth`,
`Cluster.java:427-428`'s `frontierCalculator.ensureMinWidth(getTitleAndAttribute
Width() + 10)`, called nowhere in the state diagram pipeline today, grepped) —
NOT the `graph-layout-build.ts:311-317` seam this task owns. For pesita's AA,
round and floor happen to COINCIDE (116.46 → 116 either way, +10 = 126), which
is exactly why G7 never distinguished the two mechanisms with that fixture.
The real, corroborating evidence is the corpus sweep below.

### Corpus-wide validation (271 cached fixtures, disposable probe)

Every jar cached `svek-N.dot`'s cluster-title `WIDTH=`/`HEIGHT=` (a bare
`subgraph clusterN {style=solid...label=<<TABLE...>`, i.e. excluding edge
labels and the unwired `ee`-wrapper informational case) was matched (by
height, jar-verified exact independently) against the port's own
`titleTableWidth` for the SAME slug, rendered with `WidthTableMeasurer`:

- 114 jar cluster-title samples found across the corpus.
- 24 have NO port candidate — these are exactly the currently-**ineligible**
  composites (`titleTableEligible` excludes `hasBorderPointChildren` or
  `ctx.insideAutonomPass`), including bajelo-54's `Run`, and all of
  nimana-36-veco708/rovese-43-tadu368/fotuje-06-fifa085's analogous
  clusters — confirming this task's own premise that the real production
  path does not yet reach this seam for those 4 fixtures (T2's job, D3;
  not in this task's write-set).
- Of the 90 resolvable pairs: **`Math.floor` matches jar 88/90; `Math.round`
  matches jar only 57/90.** Zero cases exist where `round` succeeds and
  `floor` fails (floor strictly dominates). The 2 floor "misses"
  (`gopudo-91-bego999`, both its `A`/`C` clusters, jar `WIDTH="36"` vs port
  raw `30.3625` — floor AND round both give `30`) are a DIFFERENT, unrelated
  defect: `A : * a list` is a creole bullet-list attribute line, and jar's
  real bullet-glyph/indent width isn't reproduced by `measureLines`' plain
  per-line text measurement — out of this task's write-set and D5 scope
  (not a round/floor question; both mechanisms are equally wrong there).
  Logged for a future task, not filed as a `docs/graphviz-issues/` entry
  (this is a port-side measurement gap, not a graphviz-ts finding).
- 28 slugs have at least one title where `floor(width) !== round(width)`
  (i.e. this fix changes real production DOT output for them): `cakaxu-97-
  nexe753, cesifo-37-rugu443, desebo-47-maro096, dikipu-79-noko487, dogeji-46-
  sapo750, fajegu-17-joba577, fevida-60-kope208, gageze-91-fese022, jijuze-43-
  ceva131, komeja-83-pufo140, kotagu-43-miza629, lukuma-74-loti931, mefici-97-
  tudu030, nenita-48-zuze128, nevezi-29-momo816, pesita-10-dene726, rufosi-58-
  kegi649, sosoxe-55-demi451, teseci-80-sivi292, tilili-10-buca517, vagexa-37-
  gijo825, vakama-53-jata958, vedapo-96-xoro464, vekoja-22-made430, vubale-26-
  daza585, zecivu-62-pagu681, zujuxa-28-buka872, zumeri-82-julo078`. 7 of
  these are already in the 149-fixture harness (`dogeji-46-sapo750`,
  `jijuze-43-ceva131`, `mefici-97-tudu030`, `pesita-10-dene726` in the
  size-backlog; `fevida-60-kope208`, `gageze-91-fese022`, `lukuma-74-loti931`
  pinned) — the harness re-measured all of them at `unchanged` (§ below):
  the title-table reservation is not the binding width constraint for any
  of the 7 (a nested child's own content width already exceeds it), so a
  smaller-but-still-non-binding reservation produces byte-identical final
  layout, consistent with this mission's own prior finding that cluster-
  title reservations are frequently non-binding.

### Step 3: paper-gate — convergence for the 4 residual fixtures

Composing three independently-verified facts (none re-derived here, per the
mission's own "do not re-litigate" instruction for the third):

1. This fix makes the port's cluster-title term for bajelo-54's `Run`
   byte-identical to jar's cached `svek-2.dot` (`107.8875 → 107`, verified
   above against the ground-truth cached DOT, not assumed).
2. T2's (separately owned, out of this task's write-set) edge-label
   FIXEDSIZE fix already reproduces jar's edge-label terms exactly
   (`W=69/62 H=15`, spec §1a/§2, 11/11 anchor matches jar-verified).
3. graphviz-ts is byte-faithful given byte-identical input (orchestrator's
   own prior verification, "Decisive facts" section above: jar's own
   `svek-2.dot` run through graphviz-ts equals real `dot -Tsvg`, 0.00 on
   every node).

Once T2 relands (its own task, including whatever relaxation of
`titleTableEligible` is needed for a composite that is itself the target of
an external edge — outside this task's mandate to implement or decide), (1)
+ (2) make the port's emitted DOT for this pass byte-identical to jar's own
`svek-2.dot`, and (3) guarantees that byte-identical input converges to
jar's exact node positions. This task's own contribution to that convergence
(the cluster-title term) is proven exact above; it does not itself flip
`titleTableEligible`, so `npx tsx scripts/measure-state-size-deltas.ts`
correctly reports `unchanged` for bajelo-54/nimana-36/rovese-43/fotuje-06
today (§ below) — the residual only resolves once T2 re-lands.

### T1c harness/gate results

- `npx tsx scripts/measure-state-size-deltas.ts`: 149/149, 0 widened, 0
  improved (7 of the 28 behavior-changed slugs are in this 149-set; all
  `unchanged` — the reservation is non-binding for every one, confirmed
  above).
- `npm run typecheck` / `npm run lint` / `npm run build`: all clean.
- `tests/oracle/state-dot-parity.test.ts`: 268/268 passed.
- `tests/oracle/svg-conformance/state.golden.ratchet.test.ts`: 59/59 passed
  (57 pins + 2 harness meta-tests).
- `tests/unit/core/graph-layout-build.test.ts`: 19/19 passed (2 new cases
  asserting the truncation, incl. the exact bajelo-54/kotagu ground-truth
  values; all 17 pre-existing cases unmodified and still passing).
- `npm test`: 10241 passed, 5 skipped (0 failed), 384 test files.
- Probes deleted; `git status --porcelain` shows only `src/core/graph-
  layout-build.ts` and `tests/unit/core/graph-layout-build.test.ts`.
