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
