# T1b diagnosis ledger: json large rows (node |Δ| > 1px)

Measured 2026-10-29 in worktree `jfp-T1b` at `e159fd728`, jar-compatible mode
(`residue.mts`, `DeterministicMeasurer`, oracles `test-results/dot-cache/json/<slug>/in.svg`).
Real graphviz `dot` 16.1.0 (20260904.0139). Every counterfactual below ran on
uncommitted, env-gated `src/` edits that were reverted afterwards (`git diff HEAD -- src` empty).

## Headline findings

1. **M1+M2 are identity on every row.** The probe from diagnosis-method.md step 3
   (engine sizes, jar `getPosition`/`Mirror` on the y-UP frame, `max` taken over nodes
   only, edges through the same mirror) produces byte-identical residue on **all 70
   non-conformant rows and all 22 conformant rows** (`residue.mts --all` before/after:
   `diff` empty). Probe residue = baseline residue on all 18 T1b rows. Why this happens is in
   "Why M1/M2 move nothing".
2. **M3 `empty-container-size`** (port-controlled, new) causes the six rows at 7.19/9.0
   and part of six others: an empty `[]`/`{}` child is declared to the engine as a
   30-wide record carrying an empty label, where the jar declares width 0 with no label.
3. **M4 `inch-string-precision`** (port-controlled, new): `inches()` writes 6 decimals
   (`toFixed(6)`), the jar writes Java's shortest round-trip `Double.toString`. It is visible
   here only through M3's 15-pt empty node (15/72 → 14.999976, so a `ROUND(x.5)` minlen
   rounds down).
4. **Everything left is Smetana**, with both D3 equalities shown: (a) Smetana 2.38's
   `record_init` rounds the declared size (`POINTS`, i.e. `ROUND`). graphviz 16 does not
   (`INCH2PS`). That gives sub-pixel to 1.3px on the rank axis, predicted **exactly**
   (0.000) for 11 rows. (b) Network-simplex x-coordinates (diagram y) differ by up to
   127px on 7 rows, and dot-engine equals real `dot` on them.
5. **No dot-engine defect**: dot-engine == real `dot` on node x (0 differing nodes on all
   18 rows), on node y (within `-Tdot` print precision) and on edge `pos` (0 differing
   coordinates on the 10 rows checked).

## Ledger

`n`/`p`/`dims` = baseline residue (nodeMax / pathMax / dw,dh). Probe = M1+M2 probe residue.
"after M3" / "after M3+M4" = residue with the env-gated counterfactuals described under M3/M4.

| row | n | p | dims | class | mechanism (one sentence) | origin (ours `file:line` ↔ jar `file:line`) | evidence | M1+M2 probe residue | ruled out |
|---|---|---|---|---|---|---|---|---|---|
| devime-19-toze896 | 1.19 | 4.3 | dw1 | Smetana | Smetana's `record_init` rounds every declared engine y-extent (`ROUND(dim.width)+1`) where graphviz 16 keeps it fractional, so each rank's centre drifts by the accumulated rounding (diagram x only; every node dy = 0). | `src/core/svek-dot-emit-clusters.ts:33` (fractional inches reach the engine) ↔ `gen/lib/common/shapes__c.java:1807-1808,1823` vs C `shapes.c:3688-3689` | rank-axis predictor using ROUND reproduces all 32 jar node x exactly (max err 0.000; ours max 1.181). D3: x 0/32 differ, y ≤0.05, edges 0/31 differ | 1.190 / 4.300 / dw1 (unchanged) | M1, M2 (probe identical); M3 (no empty node); searchsize (no-op); dot-engine (D3-2 equal) |
| debako-68-sice023 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | `"children": []` is declared 30 tall in the engine's y (diagram width), with an empty record label padded to 19.75 wide. The jar declares 0 with label `\N`, which Smetana sizes (0,16), giving engine 15×17. So the [] node sits 7 px off its rank centre and 0.375 px off in NS x. | `src/diagrams/json/layout.ts:304`, `TextBlockJson.ts:467`, `record-label.ts:58` ↔ `TextBlockJson.java:237-240`, `SmetanaForJson.java:130-132,243-244,253-254`, `labels__c.java:121-122` | engine sizes ours 19.75×31 vs jar 15×17 (jar x=290 ⇒ rank centre 298.5 = 290+17/2. Ours 282.806+31/2). After M3: 1.000/2.662. After M3+M4: 0.419/2.662/dh1 | 7.194 / 8.954 / dh1 | M1, M2; dot-engine (sep.dot: real dot also gives 19.75 for an empty record field) |
| dometa-86-jepe218 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | same as debako (same tree; styling differs only) | as debako | node table identical to debako (all 6 nodes). After M3+M4: 0.419/2.662/dh1 | 7.194 / 8.954 / dh1 | as debako |
| kicati-76-guvi771 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | same as debako (`skinparam dpi 600` changes nothing positional) | as debako | node table identical to debako. After M3+M4: 0.419/2.662/dh1 | 7.194 / 8.954 / dh1 | as debako |
| letada-23-sisi815 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | same as debako (`shadowing true`) | as debako | node table identical. After M3+M4: 0.419/2.662/dh1 | 7.194 / 8.954 / dh1 | as debako |
| sevaji-38-xita618 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | same as debako (`backgroundcolor transparent`) | as debako | node table identical. After M3+M4: 0.419/2.662/dh1 | 7.194 / 8.954 / dh1 | as debako |
| vogeku-38-soxe333 | 7.19 | 9.0 | dh1 | M3+M4, then Smetana | same as debako (`!theme plain`, margin 5) | as debako | ours [] at (277.806,149.125) vs jar (285,149.5). After M3: [] at cx 151 (jar 152). After M3+M4: cx 152, node dx −0.194 (ROUND), remaining edges ≤2.66 | 7.194 / 8.954 / dh1 | as debako |
| jidata-48-kire666 | 7.55 | 7.6 | dw8 dh5 | M3+M4, then Smetana | three empty arrays (`[]`, `[[]]`), each declared 30×(19.75 label) instead of jar 15×17, which widens both ranks they sit in | as debako | after M3: 2.000/2.692/dh1. After M3+M4: 0.900/2.251/dh1 (remaining node dx −0.675/−0.9 = ROUND) | 7.550 / 7.557 / dw8 dh5 | M1, M2; dot-engine (D3-2 equal) |
| zasitu-09-lise302 | 8.54 | 14.1 | dw8 | M3, then Smetana | `"medications": []` in rank 1 makes rank-1 height 31 (ours) vs 23 (jar), pushing rank 2 by 8 | as debako | rank predictor with jar 17 for [] and ROUND elsewhere: 0.000 vs ours 8.544. After M3: 1.500/2.498/no dims. M4 no change | 8.544 / 14.135 / dw8 | M1, M2; dot-engine |
| bogiku-88-nano204 | 8.63 | 14.2 | dw8 | M3+M4, then Smetana | as zasitu (same `medications: []`) | as debako | after M3: 1.000/2.698. After M3+M4: 0.362/2.551/no dims | 8.631 / 14.223 / dw8 | M1, M2; dot-engine |
| gejena-99-veme626 | 12.00 | 12.0 | dw1 | Smetana | network-simplex x placement (diagram y) of the upper ranks differs between Smetana 2.38 and graphviz 16 (n4 102 vs 114, n13 379 vs 383; same order), plus ROUND drift on the rank axis | engine-internal: ours input `graph-layout-build.ts:147-149` = jar `SmetanaForJson.java:233-260` ↔ `gen/lib/dotgen/position__c.java` vs C `position.c` | D3-1: declared sizes equal, all engine-x cells integral (18·k), port x equal. D3-2: x 0/15 differ, y ≤0.005, edges 0/14 differ. Rank predictor 0.000 | 12.000 / 12.000 / dw1 | M1, M2, M3 (no empty node), M4 (no change), searchsize (no change) |
| gibego-39-pelu609 | 12.00 | 16.6 | dw1 | Smetana | same as gejena (same tree, one wider node) | as gejena | node deltas identical in pattern to gejena. Rank predictor 0.000. D3-2 x 0/15 | 12.000 / 16.586 / dw1 | as gejena |
| cilemo-38-fafi313 | 17.06 | 17.1 | dw3 | M3, then Smetana | one empty container (rank height mechanism as zasitu), then NS x differences (14–16 px on diagram y) | as debako, then as gejena | rank predictor (17 for [], ROUND) 0.000 vs ours 7.787. After M3: 14.220/14.832. After M3+M4: 16.039 (chaotic). D3-2 on the M3+M4 input: x 0/25, edges 0/24 | 17.058 / 17.058 / dw3 | M1, M2; dot-engine |
| civofu-04-loku952 | 47.10 | 47.1 | dh34 | Smetana | NS x placement spreads rank 2-4 34 px wider in the jar (canvas 1579 vs 1545), same node order. Rank axis is ROUND only (≤0.594). | as gejena | rank predictor 0.000. D3-2: x 0/32, y ≤0.005, edges 0/31 | 47.102 / 47.102 / dh34 | M1, M2, M3 (no empty node). M4 **flips the row to aligned:false** (a spline gains a bezier), so it is not a cause |
| kidoki-70-fala224 | 78.00 | 80.7 | dw6 | M3+M4, then Smetana | one empty container (diagram-x 7.x drift), then NS x differences up to 78 px (n7 627 vs 705, n8 366 vs 409) | as debako, then as gejena | rank predictor 0.000 vs ours 7.700. After M3: 33.000/62.550/dw2. After M3+M4: 78.000/80.711/dw2 (NS chaotic). D3-2 on the M3+M4 input: x 0/18, edges 0/17 | 78.000 / 80.711 / dw6 | M1, M2; dot-engine; searchsize |
| nopoku-31-cisi925 | 94.00 | 94.0 | dw6 | M3+M4, then Smetana | as kidoki (same document family, one empty container) | as kidoki | rank predictor 0.000 vs ours 7.488. After M3: 46.000/46.107/dw2. After M3+M4: 94.000/94.000/dw2. D3-2 (M3+M4 input): x 0/23, edges 0/22 | 94.000 / 94.000 / dw6 | as kidoki |
| nofuvo-36-muxe040 | 127.00 | 127.0 | dw1 | Smetana | NS x placement: root at diagram y 396 vs jar 520 and the upper ranks follow (−124, −39, −42). Leaf rank equal. | as gejena | rank predictor 0.000 (ours 1.269). D3-2: x 0/12 | 127.000 / 127.000 / dw1 | M1, M2, M3 (no empty node), M4 (no change), searchsize |
| timafu-94-bixe774 | 5.94 | 64.1 | – (37 structural) | Smetana | `scale max 100*100` divides by the unscaled document width. Ours is 193.087, the jar's 192.85, because the root's y-extent is ROUND(86.2375)+1 = 87 in Smetana and 87.2375 for us. All 37 structural diffs are one scale-factor ratio (1.00124). | ours scale resolved against `JsonGeometry.finalDimension` (`json/layout.ts:111-120`) ↔ `TextBlockExporter.java:165,205` fed by `shapes__c.java:1807-1808` | first structural divergence below. Unscaled: child rank left ours 133.237 vs jar 68.966/0.518571 = 133.0. D3-2: x 0/2, y ≤0.001, edge 0/1 | aligned:false 5.939 / 64.057 (unchanged) | M1, M2 (identical); M3 (no empty node); measurer (all text widths scale by the same 1.00124) |

**Per class:** Smetana only: **6** (devime, gejena, gibego, civofu, nofuvo, timafu).
M3+M4, then Smetana: **10** (debako, dometa, kicati, letada, sevaji, vogeku, jidata, bogiku,
kidoki, nopoku). M3, then Smetana: **2** (zasitu, cilemo). M1, M2, M1+M2 and dot-engine: 0.
Total 18. Rows whose probe residue is 0: **none**.

## Why M1/M2 move nothing (and why the conformant rows stay conformant)

- **M2 (origin)**: ours reads `getLayout({yAxis:'down'})`, i.e. `bbH − y`, then subtracts
  the node+edge min (`graph-layout.ts:273-304`). The jar uses `max − y` with
  `max = max(cy + h/2)` over nodes (`SmetanaForJson.java:97-102,160-164`). In a json tree the
  root is the only node of rank 0, so the graph bb top **is** the root's top:
  `bbH = max`. For vogeku, bb height 574.687564 = root cy 496.331 + 156.713/2. For devime,
  2731.587 = 2701.706 + 59.763/2. In both frames the root's top therefore lands at 0, and
  nothing lies above it, so the min-shift is 0. On the other axis, dot translates the bb
  LL to the origin (`bounds.x = 0` on every row), and no edge point is left of the leftmost
  node. So `shiftToOrigin` subtracts 0.
- **M1 (size echo)**: the echo (`graph-layout.ts:109-128`) fires only within 1e-3. The
  engine y-extent always comes back `declared + 1` (record kluge, `shapes.c` record_init
  `PS2INCH(info->size.y + 1)` = `shapes__c.java:1823`), so it is never echoed. The engine
  x-extent equals the declared value except on M3 nodes, where it is not echoed either
  (19.75 vs 15). Also, `placeJsonNodes` (`json/layout.ts:370-391`) draws with the
  *measured* `m.totalWidth/Height`, as the jar draws its own block. The echoed size is
  therefore never drawn and never moves a position.
- **Conformant json rows (step 6)**: 13 of 14 are single-node documents (census:
  babico, bidire, bitepo, cazuru, dapinu, giduve, karaju, lipuxo, lulofe, nujuke, rutofu,
  tacizo, xajini: `nodes=1 edges=0 emptyNodes=0`). nixaxa is the parse-failure page, which
  has no layout. With one node, `max − (cy + h/2) = 0` and `cx − w/2 = 0`. There is no rank
  spacing (so no ROUND drift), no NS, and no empty child (a root-level `{}` is normalized to
  `[""]`, `json/layout.ts:161-165`). Examples: cazuru engine 18×14.85 at cx 9, cy 7.425 →
  origin (0,0) under both formulas. lulofe 54×120.838 at (27, 60.419) → (0,0).
  **Measured**: under M1+M2 and under M3+M4, every json (14), yaml (7) and hcl (1)
  conformant row keeps nodeMax/pathMax/dw/dh = 0 (`residue.mts --all`, no conformant line
  in the diff). **Stop-4 risk from M1/M2/M3: none.** **M4 risk (non-conformant rows)**:
  M4 also moves rows it does not close: civofu becomes aligned:false (one path gains a
  bezier segment). kidoki 33→78 and nopoku 46→94 relative to M3 alone. cilemo 14.2→16.0.
  kusule (T1a) 1.0→0.862. Seven yaml rows move ±0.001. These are network-simplex ties
  flipping on 1e-5 inputs. They are not a regression in mechanism, but B4 must batch-measure
  before/after.

## M3 — `empty-container-size`

Rows: debako, dometa, kicati, letada, sevaji, vogeku, jidata, zasitu, bogiku, cilemo,
kidoki, nopoku (12; census `emptyNodes ≥ 1`).

Jar, `TextBlockJson.java:237-240` and `:322-330`. The engine is given
`calculateDimension`, not the drawn size:
```java
final double width = getWidthColA(stringBounder) + getWidthColB(stringBounder);   // 0 for []
final double height = getTotalHeight(stringBounder);                              // MIN_HEIGHT 15
```
`MIN_WIDTH` exists only at draw time (`:278-279`, `if (trueWidth == 0) trueWidth = MIN_WIDTH;`).
`SmetanaForJson.java:243-244` sends `height` = 0/72 (the swap) and `width` = 15/72.
`:253-254` `if (size > 0) agsafeset(... "label" ...)` sets **no label**, so the record's
label is the default `\N` (`input__c.java:346-348`). Smetana's `storeline` sizes any
non-`_dim_` text as `size.x = 0; size.y = (int)(lp.fontsize * 1.20)` = 16
(`labels__c.java:119-122`, "WE CHEAT", `Macro.java:1303` "Strange label"), with no PAD
(`shapes__c.java:1645`). `record_init` (`:1807-1808,1823`) gives
`sz = (max(0, POINTS(15)), max(16, POINTS(0.02in)))` = (15, 16) and
`ND_height = 16 + 1` = **15 × 17**.

Ours, `src/diagrams/json/TextBlockJson.ts:467`:
```ts
totalWidth: summedWidth === 0 ? JSON_CELL_MIN_WIDTH : summedWidth,
```
`json/layout.ts:304` sends `height: m.totalWidth` (= 30) to the engine.
`record-label.ts:58` (`if (m.rows.length === 0) return '';`) sends an explicit empty
label. graphviz parses it as a single " " field (`shapes.c:3675`), LUT-measured and padded
to 19.75 wide. Real `dot` gives the same 19.75 (scratch `sep.dot`: `width=0.27431`). Engine:
**19.75 × 31**.

Causal chain: the [] node is 14 pt taller on the rank axis, so (a) it is placed 7 pt
further left than the jar inside its rank, which is the 7.194 (7 + 0.194 ROUND). (b) If it
is the tallest node of its rank, it widens the rank and pushes every later rank
(zasitu/bogiku 8.5, kidoki/nopoku/cilemo ≈7.5). (c) It is 4.75 wider on the NS axis, which
moves its same-rank neighbours (0.375 on vogeku) and, on deep trees, re-solves NS (kidoki).

Counterfactual (uncommitted): for `rows.length === 0` declare engine height 16 with label
`_dim_0_0_`. The field is (0,0), so no PAD fires, and the engine solves with 15 × 17
(verified: `n1 | 15 16 | 15 17`). Then the rank-axis predictor that uses the jar's 17
matches every jar node x to 0.000 on debako, vogeku, zasitu, kidoki, nopoku and cilemo.
This is a measurement device, not a fix design: B4 must source the 16 from
`labels__c.java:121` + `DEFAULT_FONTSIZE` and decide how dot-engine gets a 0-x field.
`dot-engine-measurer.ts:54`'s regex rejects a negative `_dim_` group, which is why the
probe used `_dim_0_0_`.

## M4 — `inch-string-precision`

Rows (as a co-cause, closing the last 1 px): debako, dometa, kicati, letada, sevaji,
vogeku, jidata, bogiku, kidoki, nopoku.

Jar, `SmetanaForJson.java:235-236`: `final String width = "" + (dim.getWidth() / 72);`
is a Java shortest round-trip double ("0.20833333333333334" for 15 pt).
Ours, `src/core/svek-dot-emit-clusters.ts:33`:
`export const inches = (px: number): string => (px / PX_PER_INCH).toFixed(6);`,
used by `addRecordNode` (`src/core/graph-layout-build.ts:147-149`). 15 pt arrives as
14.999976. Same-rank separation is `ED_minlen = ROUND(rw(u) + lw(v) + nodesep)`
(`position.c:195,264` = `position__c.java:782,877`): 18 + 7.499988 + 18 →
43, where the jar gets 44. Real `dot` reproduces both: scratch `sepw.dot` with
`width=15/72` full precision gives `pos=152`, with `0.20833` gives `151`. Under the M3
counterfactual alone the [] node sits at cx 151 (jar 152). With M4 (full-precision string)
it sits at 152. Every other engine-x extent on these rows is a multiple of 9 pt and
round-trips exactly through 6 decimals. The fractional y-extents are rounded by Smetana
anyway (see Smetana), which is why M4 matters only through M3's 15. Side effects are under
step 6.

## Smetana (D3 shown)

Two arithmetic sources, both inside the engine that upstream calls:

- **(a) declared-size rounding, rank axis (diagram x).** Smetana 2.38
  `record_init`: `sz.x = POINTS(ND_width(n)); sz.y = POINTS(ND_height(n));`
  (`shapes__c.java:1807-1808`, `POINTS` = `ROUND(x*72)`). graphviz 16:
  `sz.x = INCH2PS(ND_width(n)); sz.y = INCH2PS(ND_height(n));` (`shapes.c:3688-3689`, no
  rounding). `set_ycoords` is otherwise identical (`ht2 = ND_ht(n) / 2`). Predictor: rank
  centre(r) = centre(r−1) + H(r−1)/2 + 36 + H(r)/2, with H = max over the rank of
  `ROUND(dim.width) + 1` (17 for M3 nodes), and x = margin + centre − h/2. It reproduces
  **every jar node x with max error 0.000** on devime, gejena, gibego, nofuvo, civofu,
  debako, zasitu, kidoki, nopoku, cilemo and vogeku. Ours deviates 0.594–1.269 on the
  M3-free rows.
- **(b) network-simplex x (diagram y).** Same node order, different coordinates: gejena
  n4 102/114, civofu canvas 1545/1579, nofuvo root 396/520, kidoki n7 627/705.

**D3 (1), effective input.** The declared sizes are equal: every jar rect w/h equals ours
(rect/@width residue ≤0.001, heights 0) and goes through the same swap
(`SmetanaForJson.java:243-244` ↔ `json/layout.ts:300-308`). Field geometry is equal on the
NS axis: jar field x = lineHeight (no PAD, `shapes__c.java:1645`), ours `(h − 16) + 16`
(`record-label.ts:52-56` + XPAD). Every engine-x cell is integral (census:
`cellX ⊂ {18,36,54,72,108,126,144,180,198,396}`, `fracEngineX = 0` on all 18 rows). On the
rank axis, jar field y = `w − 8` and ours `(w − 8) + 8`. `resize_reclbl` (`shapes.c:3547-3582`)
gives each of the two stacked children `+8` to reach the declared width, so the result is
equal up to (a). Node/edge creation order is equal (pre-order nodes, post-order edges,
`json/layout.ts:343-362` ↔ `SmetanaForJson.java:128-145`). The one input difference,
`searchsize=500` (`graph-layout-build.ts:67`, absent in `SmetanaForJson`), was measured:
removing it for json changes **no** T1b row (all 13 checked, identical residue).
On the M3 rows, (1) holds only after the M3+M4 counterfactual. That is why those rows read
"M3(+M4), then Smetana".

**D3 (2), dot-engine vs real `dot`.** Real `dot` cannot take our exact input: it measures
`_dim_..._` as text (scratch: bb width 1466 vs dot-engine 158.5 on vogeku). A node-x-exact
equivalent was therefore built: each record becomes `shape=none` with an HTML table, whose
TD widths are the record fields' engine-x extents (all integral, so exact) and whose port TDs
sit at the record ports. Empty-label nodes become fixedsize boxes at the engine's own size.
(i) dot-engine on the equivalent == dot-engine on our input: **0 differing node x on all 18
rows** (baseline input) and on the M3+M4 input (kidoki, nopoku, cilemo, vogeku).
(ii) dot-engine == real `dot` on the equivalent: **0 differing node x on all 18 rows**.
Edge `pos`: **0 differing coordinates** (vogeku 5, gejena 14, civofu 31, kidoki 17,
timafu 1, devime 31, nopoku 22, cilemo 24 edges). Rank axis: fixedsize boxes at dot-engine's
solved w/h give max |Δcy| ≤ 0.05 (`-Tdot` prints ~5 significant digits) on 11 rows.

Measured Smetana residue per row = the "after M3+M4" figure for M3 rows, the baseline for
the others (table). For the DIVERGENCES ADR-2b entry: rank axis ≤1.3 px per rank chain
(ROUND), NS axis up to 127 px (nofuvo), canvas ≤34 px (civofu dh).

## timafu-94-bixe774: first structural divergence

`svg/g[1]/rect[1]/@height`: ours 27.967, jar 28.001. All 37 structural diffs
(rect w/h, font-size, textLength, stroke-width, dasharray) are one ratio: 28.001/27.967 =
1.00122 and 7.26/7.251 = 1.00124. `scale max 100*100` resolves `min(100/W, 100/H)` against
the unscaled final dimension (`TextBlockExporter.java:165,205` ↔ `JsonGeometry.finalDimension`,
`json/layout.ts:111-120,482-489`). Unscaled, the child rank sits at x 133.237 (ours) vs
133.0 (jar, 68.966/0.518571). The root's rank-axis extent is ROUND(86.2375) + 1 = 87 in
Smetana and 87.2375 for us, which is source (a). So the width is 193.087 vs 192.85, and
the factor is 0.517929 vs 0.518571 (0.237/192.85 = 0.00123). Class Smetana: input equal
(declared 54 × 86.2375 both), D3-2 x 0/2, edge 0/1. The diffs count as structural only
because the gate classifies scaled sizes as non-positional.

## dot-engine draft

None. dot-engine equals real `dot` 16.1.0 on every comparison made (node x, node y within
print precision, edge `pos`).

## Ruled out (whole ledger)

- **M1/M2 as a cause on these rows**: probe residue identical on 70/70 rows (above).
- **dot-engine**: D3-2 equalities above, plus `sep.dot` (empty record field 19.75 in both,
  and the `.5` minlen rounding identical in both).
- **searchsize=500**: env-gated removal, 0 change on 13 rows.
- **node/edge order, port index**: same pre/post order and `tailport=P<i>` as
  `SmetanaForJson.java:139-141,224`.
- **record label text (XPAD compensation)**: equal field geometry after `resize_reclbl`
  (D3-1).
- **measurer**: node w/h residue ≤0.001 on every row. timafu's text widths all scale by
  the same factor.
