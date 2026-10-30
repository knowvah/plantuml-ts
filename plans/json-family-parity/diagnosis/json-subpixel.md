# T1a diagnosis ledger — json sub-pixel rows (18)

Measured 2026-10-29 in worktree `jfp-T1a` at `e159fd728` (jar-compatible mode,
`residue.mts`, `DeterministicMeasurer`, dot-engine 2.4.0, real `dot` 16.1.0).
Diagnosis only: every probe below was an uncommitted `src/` edit, reverted.

## Headline

1. **M1+M2 move nothing in the json family.** The probe (engine size with no
   echo; the jar's `getPosition`/`Mirror` on the y-up frame, max over nodes
   only, edges through the same mirror) changed node placement by at most
   **1.6e-5 px** on all 50 json rows (max |Δ| probe vs current, full
   precision). `residue.mts --all` was byte-identical before and after for all
   85 json+yaml+hcl rows. **No T1a row is closed by M1+M2.** Why: see
   "Why M1/M2 are inert" below.
2. **The node residue on all 18 rows is one mechanism (S1).** Smetana's
   graphviz-2.38 `record_init` rounds the declared size to whole points
   (`POINTS`). Graphviz removed that rounding in 8.0.4 (`INCH2PS`), and
   dot-engine follows current graphviz. A closed-form model that uses
   Smetana's node height `ROUND(W)+1` plus `set_ycoords`' exact half-height
   rank spacing reproduces **every jar node X on all 18 rows to 0.0000**. The
   same model with `W+1` reproduces ours to ≤0.0005, which is just 3-dp
   printing.
3. **The path residue is two graphviz 7.0.0 changes (S2, S3)** that Smetana
   2.38 predates:
   - S2: `bezier_clip` changed from clipping just outside the boundary to
     clipping just inside it.
   - S3: `arrow_length_normal` became penwidth-aware.

   Jar |ep − last| is 7.50–7.96 on every edge, which is 2.38's 7.5 plus the
   0.5 clip tolerance. Ours is 8.55–9.00.
4. **One new port-controlled mechanism, M3, on one row (kusule).** The
   record-size inches string is written at 6 dp. A 110 px node becomes
   110.000016, the tail-port offset drops just under 44, and C's `(int)`
   truncation sends the child to 43, a 1.000 px shift on diagram Y.
5. **The canvas `dims` on 5 rows are a consequence, not a mechanism.** With
   S1 emulated (plus M3), dw = dh = 0 on all 18 rows.

## Ledger

`n`/`p`/`dims` = baseline `residue.mts` (nodeMax / pathMax / canvas Δ).
"probe" = M1+M2 probe residue (identical to baseline on every row).
"S1-emu" = residue with Smetana's record size emulated (POINTS(declared),
label shrunk by Smetana's net 16 so the declared size wins, plus M3).
This is evidence only and is not a candidate fix (see Q1).
`len` = |ep − last spline point| per edge, jar / ours.

| row | n | p | dims | class | mechanism (one sentence) | origin (ours ↔ jar) | evidence | M1+M2 probe residue | ruled out |
|---|---|---|---|---|---|---|---|---|---|
| bavize-88-jumu158 | 0.225 | 1.938 | – | Smetana (S1+S2+S3) | Root height 88.775 → jar engine ht ROUND+1 = 90, ours 89.775; child X = ht_root+36 → 126 vs 125.775 (0.225); spline end clipped outside r=7.5 (jar) vs inside r≈9 (ours). | `graph-layout-build.ts:148` (record size as given) ↔ `shapes__c.java:1807-1808` (POINTS) / `splines__c.java:213-219` / `arrows__c.java:248` | model 0.0000; S1-emu n 0 p 1.596; len 7.649 / 8.993; D3 U≡R | n 0.225 p 1.938 | M1, M2, searchsize, M3 (0 Δ) |
| conigu-03-cuzu022 | 0.025 | 1.308 | – | Smetana (S1+S2+S3) | S1 rank-axis shift 0.025 (ROUND(W)−W of the root); path = S2/S3. | as bavize | model 0.0000; S1-emu n 0.475 (ellipse only = S2 start clip) p 1.505; len 7.739 / 8.927 | n 0.025 p 1.308 | M1, M2, searchsize, M3 |
| derele-19-poni229 | 0.112 | 1.826 | – | Smetana (S1+S2+S3) | S1 0.112; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.596; len 7.649 / 8.993 | n 0.112 p 1.826 | M1, M2, searchsize, M3 |
| gavomi-49-koco364 | 0.287 | 1.512 | – | Smetana (S1+S2+S3) | S1 0.287; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.349; len 7.610 / 8.959 | n 0.287 p 1.512 | M1, M2, searchsize, M3 |
| jaramo-16-doxa994 | 0.450 | 1.860 | – | Smetana (S1+S2+S3) | S1 0.450; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.345; len 7.656 / 9.001 | n 0.450 p 1.860 | M1, M2, searchsize, M3 |
| najixi-88-javo178 | 0.513 | 1.462 | – | Smetana (S1+S2+S3) | S1 0.013 on rects; ellipse 0.513 = S1 + S2 start-clip landing. | as bavize | model 0.0000; S1-emu n 0.013 p 1.113; len 7.720 / 8.837 | n 0.513 p 1.462 | M1, M2, searchsize, M3 |
| nanegu-88-boba399 | 0.450 | 1.272 | – | Smetana (S1+S2+S3) | S1 0.450; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.094; len 7.731 / 8.825 | n 0.450 p 1.272 | M1, M2, searchsize, M3 |
| noleta-28-nutu456 | 0.275 | 1.705 | – | Smetana (S1+S2+S3) | 5-rank chain; each step = ROUND(W_k)+1+36 (jar 94/100/84/355) vs W_k+1+36 (ours); S1 errors accumulate per rank (+.275, −.112, +.013, −.138). | as bavize | model 0.0000 on all 5 nodes; S1-emu n 0.375 (ellipse, S2) p 1.621; len 7.501–7.767 / 8.820–8.933; rect/@width 0.001 (Q3) | n 0.275 p 1.705 | M1, M2, searchsize, M3 |
| nuviro-48-sice969 | 0.112 | 1.826 | – | Smetana (S1+S2+S3) | S1 0.112; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.596; len 7.649 / 8.993 | n 0.112 p 1.826 | M1, M2, searchsize, M3 |
| pijume-87-gufu868 | 0.287 | 1.705 | – | Smetana (S1+S2+S3) | 5-rank chain, S1 accumulated; path S2/S3. | as bavize | model 0.0000; S1-emu n 0.375 (ellipse) p 1.621; len 7.501–7.755 / 8.820–8.985 | n 0.287 p 1.705 | M1, M2, searchsize, M3 |
| gagebi-92-vere937 | 0.720 | 1.980 | y (dw 1) | Smetana (S1+S2+S3) | 3 ranks / 6 nodes; S1 on rank half-heights (max per rank) moves X ≤0.662 and the canvas trunc by 1; path S2/S3. | as bavize | model 0.0000 on 6 nodes; S1-emu n 0.220 (ellipse) p 2.740 dw 0; len 7.502–7.961 / 8.879–9.002 | n 0.720 p 1.980 dw 1 | M1, M2, searchsize, M3 |
| kusule-69-jada088 | 1.000 | 1.021 | y (dw 1, dh 1) | **Mn:M3 (6-dp record inches)**, then Smetana (S1+S2+S3) | Y: 6-dp `inches()` makes the root 110.000016 wide > label 110, so port P4's offset from centre is 43.999992 and C `(int)` truncation (dot `position.c` port aux edges) puts the child at cx 98 vs jar 99; X: S1 0.362. | `svek-dot-emit-clusters.ts:33` via `graph-layout-build.ts:148` ↔ `SmetanaForJson.java:235-236` (`"" + (dim/72)`, full precision) | M3-only probe: rect/@y 1.000→0, dh 1→0, n 0.862 p 1.009; model 0.0000; S1-emu n 0.362 p 1.150; len 7.537 / 8.964 | n 1.000 p 1.021 | M1, M2, searchsize |
| moseba-10-naza079 | 0.675 | 1.875 | y (dw 1) | Smetana (S1+S2+S3) | 5-rank chain, S1 accumulated → canvas trunc +1; path S2/S3. | as bavize | model 0.0000; S1-emu n 0.250 (ellipse) p 1.333 dw 0; len 7.624–7.730 / 8.746–9.000 | n 0.675 p 1.875 dw 1 | M1, M2, searchsize, M3 |
| jekaju-28-gulo479 | 0.556 | 2.032 | – | Smetana (S1+S2+S3) | 2 ranks / 4 nodes; S1 on the root and on the rank-1 max half-height; path S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.450; len 7.629–7.817 / 8.750–8.977 | n 0.556 p 2.032 | M1, M2, searchsize, M3 |
| json-escaped | 0.556 | 2.032 | – | Smetana (S1+S2+S3) | Same graph geometry as jekaju (identical residue); S1 + S2/S3. | as bavize | model 0.0000; S1-emu n 0 p 1.450; len as jekaju | n 0.556 p 2.032 | M1, M2, searchsize, M3 |
| tivuru-65-vezu313 | 0.187 | 3.438 | – | Smetana (S1+S2+S3) | S1 0.187; the 3.4 path is one shallow 2-segment edge whose head clip lands 0.06 outside (jar, S2) vs 0.48 inside (ours) the node top, i.e. 2.29 px along the curve; first cubic identical to 3 dp. | as bavize | model 0.0000; S1-emu n 0.475 (ellipse) p 3.309; Δtip 2.291; len 7.623–7.768 / 8.682–8.932 | n 0.187 p 3.438 | M1, M2, searchsize, M3 |
| mudumo-73-foli040 | 0.725 | 2.369 | y (dw 1) | Smetana (S1+S2+S3) | 5 ranks / 10 nodes, S1 on rank max half-heights → canvas +1; path S2/S3. | as bavize | model 0.0000 on 10 nodes; S1-emu n 0.375 (ellipse) p 1.691 dw 0; len 7.523–7.858 / 8.552–8.999 | n 0.725 p 2.369 dw 1 | M1, M2, searchsize, M3 |
| zevaka-35-zova441 | 0.838 | 2.156 | y (dw 1) | Smetana (S1+S2+S3) | As mudumo (same tree shape, different widths). | as bavize | model 0.0000 on 10 nodes; S1-emu n 0.375 (ellipse) p 1.440 dw 0; len 7.523–7.858 / 8.626–8.999 | n 0.838 p 2.156 dw 1 | M1, M2, searchsize, M3 |

Class counts: Smetana 17 · Mn:M3 then Smetana 1 (kusule) · M1/M2/M1+M2 0 · dot-engine 0.

## Why M1/M2 are inert (all json rows)

- **M2 (origin).**
  - Jar: X = max − (cy + h/2), with max over nodes (`SmetanaForJson.java:97-102,160-164,203-210`).
  - Json is a tree whose rank 0 holds only the root. Every lower-rank node
    satisfies cy_k + h_k/2 ≤ cy_0 − h_0/2 − ranksep. So max is always the
    root's top, and that is exactly the min that `shiftToOrigin`
    (`graph-layout.ts:275-304`) subtracts on the y-down frame. Edges lie
    between ranks and never above the root, so including them in the min
    changes nothing.
  - Jar Y = cx − w/2, with no shift. Dot's `translate_drawing` already puts
    the node bounding box's LL at 0, so our min-shift subtracts 0.
- **M1 (size echo, `graph-layout.ts:109-128`).**
  - The engine height comes back as declared + 1 (the `record_init` Kluge,
    `shapes.c:3704`). That is outside ε, so the engine's value is already
    used.
  - The engine width differs from declared only by the 6-dp round trip
    (≤3.6e-5), which is the measured ≤1.6e-5 placement Δ.
  - The drawn size is `m.totalWidth`/`m.totalHeight` either way
    (`layout.ts:383-384`), as upstream draws the block at its own
    `calculateDimension`.

## Mechanisms

### S1 — record size rounded to whole points (Smetana 2.38) vs not (graphviz ≥ 8.0.4)
- Jar, Smetana transpile of 2.38, `gen/lib/common/shapes__c.java:1807-1808,1816-1817,1822-1823`:
  `sz.x = POINTS(ND_width(n)); sz.y = POINTS(ND_height(n));` …
  `sz.x = Math.max(info.size.x, sz.x);` … `ND_height(n, PS2INCH(info.size.y + 1));`
  (`POINTS` = `ROUND(a*72)`, `geom.h:62`).
- Graphviz C 16.1, `lib/common/shapes.c:3688-3689,3697-3698,3704`:
  `sz.x = INCH2PS(ND_width(n));` (no rounding). The change is graphviz commit
  `aee7eda7d` "record_init: Remove unnecessary rounding of width and height",
  first tag 8.0.4.
- Why Smetana's declared size always wins in the rounded axis:
  - Smetana adds no field padding (`shapes__c.java:1640-1643`, "Modification
    by Arnaud 18/03/2023 … we don't want to add any margin in Smetana").
  - Upstream encodes `colAwidth - 8`, `colBwidth - 8` (`SmetanaForJson.java:249-251`),
    so the label's y extent is W − 16, always < ROUND(W).
  - Jar engine height = ROUND(W) + 1.
- Ours:
  - `record-label.ts:52-55` compensates both pads, so the label is exactly
    (H, W).
  - `graph-layout-build.ts:148` passes the declared size, giving engine
    height W + 1.
- Rank-axis consequence: diagram X steps by `ht_k/2 + 36 + ht_{k+1}/2`
  (`position__c.java:1726-1730` ≡ `position.c:779`, exact doubles in both).
  The Smetana model (`ROUND(W)+1`) reproduces every jar node X on all 18
  rows to 0.0000, so set_ycoords contributes no other difference.
- The diagram Y axis is unaffected on these rows. Smetana's engine width is
  `max(H, POINTS(H))` against our H, but the measured rect/@y residue is 0
  on 17/18 rows. kusule's 1.0 is M3.

### S2 — `bezier_clip` lands just outside (2.38) vs just inside (≥ 7.0.0)
- Jar `gen/lib/common/splines__c.java:213-219`: `best` is saved in the
  NOT-inside branch, so the kept curve ends at the last outside point.
- C `lib/common/splines.c:136-140`: `best` is saved in the inside branch,
  graphviz commit `b03040389` "change to clip just inside instead of just
  outside the node", first tag 7.0.0.
- Both loops stop at 0.5 tolerance (`:144` / `:221`).
- This explains:
  - spline-start (spot) Δ ≤0.475 after S1 emulation;
  - tivuru's head clip (jar 0.06 outside vs ours 0.48 inside the node top,
    2.29 px along a shallow curve);
  - the arrow-circle clip direction in S3.

### S3 — arrow clip radius 7.5 (2.38) vs penwidth-aware ≈9.0 (≥ 7.0.0)
- Jar `gen/lib/common/arrows__c.java:248`:
  `return 10. * lenfact * late_double(e, zz.E_arrowsz, …)` gives 10·1·0.75 =
  7.5. Clipped just outside (S2): observed jar |ep − last| = 7.50–7.96 over
  all 55 T1a edges.
- C `lib/common/arrows.c:1190-1225` (`arrow_length_normal`, miter-extended
  tip via `arrow_type_normal0` `:516-`), graphviz commit `cfb1cc1a3`, first
  tag 7.0.0. Clipped just inside: observed ours 8.55–9.00.
- The difference moves the last spline point, both inner controls of the
  last cubic (re-subdivision), and the arrow polygon. `Arrow.java` scales the
  base by 0.4·|ep − last|: jar ±3.06 vs ours ±3.597 on bavize, ratio 0.400
  in both, so `JsonCurve.ts`/`Arrow` are faithful.

### Mn:M3 — record size serialised at 6 dp (ours) vs full precision (jar)
- Jar `SmetanaForJson.java:235-236`:
  `final String width = "" + (dim.getWidth() / 72);` (Java `Double.toString`, full precision).
- Ours `src/core/svek-dot-emit-clusters.ts:33`:
  `export const inches = (px: number): string => (px / PX_PER_INCH).toFixed(6);`,
  used by `addRecordNode` (`src/core/graph-layout-build.ts:148`). Its doc
  comment justifies 6 dp by the svek path ("jar's graphviz reads this
  text"), which does not apply to the Smetana path.
- Causal chain (kusule): 110/72 → "1.527778" → 110.000016 px > label 110.
  The record is 1.6e-5 wider, so field P4's centre offset is 43.999992. Dot
  takes the integer part of the port offset when it builds its x-position
  constraints, so the child goes to 43 instead of 44: engine cx 98 vs jar
  99, diagram Y 64 vs 65, and canvas dh 1.
  - Graphviz 2.38's `POINTS` hides the 6-dp error, which is why the jar is
    unaffected.
  - The truncation site was not instrumented: the integer outcome (98 vs 99)
    and the M3 probe are the evidence.
- Probe: `String(px/72)` in `addRecordNode` gives kusule rect/@y 1.000 → 0 and
  dh 1 → 0. Every conformant row is unchanged. Side effect: **json/civofu-04-loku952 (T1b) flips aligned:true → aligned:false** (structural), plus ±0.001
  wobble on 4 json + 8 yaml rows. B4 must look at civofu before porting M3.
- Json is the only `shape: 'record'` caller in `src/` (grep 2026-10-29), so
  an M3 fix on the record path is not a json-only branch in a non-record
  path. The design is the orchestrator's call.

## D3 experiment (rows classed Smetana: all 18)

**(1) Engine input equals the jar's, compared as geometry.**
- Node sizes:
  - The oracle's rect w/h equal our declared `totalWidth`/`totalHeight` on
    all 18 rows (rect/@width, rect/@height residue 0; noleta 0.001 is Q3).
  - Pushed through `createNode` (`SmetanaForJson.java:235-244`, w/h swap), the
    jar asks for (H, W). We ask for (H, W) at 6 dp, a ≤1.6e-5 px difference
    that matters only on kusule (M3, classed separately).
- Record fields:
  - Jar label after Smetana's no-pad sizing: (h_i, colA − 8) / (h_i, colB − 8).
  - Ours after PAD (`macros.h:27-29`, `shapes.c:3525-3527`): (h_i, colA) / (h_i, colB).
  - Both are ≤ the requested node size. The deliberate XPAD compensation is
    per D3's clarification.
  - The resulting record geometry differs only through S1, which is inside
    the engine's `record_init` and not in the input (Q1).
- Graph attrs: ours adds `searchsize=500` (`graph-layout-build.ts:67`),
  which `SmetanaForJson` never sets. Probe without it: residue byte-identical
  on all 85 family rows, so it is inert here.

**(2) dot-engine equals real `dot` 16.1.0.** Real `dot` cannot decode the
`_dim_` sentinel (it measures it as text), so the test used an isomorphic
input:
- same nodes, sizes (same `inches()` strings), ports, edge attrs and
  `searchsize`;
- field text `x` at `fontsize=1`, so the declared sizes dominate.

The same DOT text went to dot-engine (`parse`+`render 'dot'`) and to real
`dot -Tdot`.

| row | U≡R nodes | U≡R edges | exact-input E vs R rank axis max |Δy| / |Δheight| |
|---|---|---|---|
| bavize | 2/2 | 1/1 | 0.000 / 0 |
| conigu | 2/2 | 1/1 | 0.000 / 0 |
| derele | 2/2 | 1/1 | 0.000 / 0 |
| gavomi | 2/2 | 1/1 | 0.001 / 0 |
| jaramo | 2/2 | 1/1 | 0.000 / 0 |
| najixi | 2/2 | 1/1 | 0.000 / 0 |
| nanegu | 2/2 | 1/1 | 0.000 / 0 |
| noleta | 5/5 | 4/4 | 0.000 / 1e-5 in |
| nuviro | 2/2 | 1/1 | 0.000 / 0 |
| pijume | 5/5 | 4/4 | 0.000 / 1e-5 in |
| gagebi | 6/6 | 5/5 | 0.000 / 0 |
| kusule | 2/2 | 1/1 | 0.000 / 0 |
| moseba | 5/5 | 4/4 | 0.010 / 0 |
| jekaju | 4/4 | 3/3 | 0.000 / 0 |
| json-escaped | 4/4 | 3/3 | 0.000 / 0 |
| tivuru | 6/6 | 5/5 | 0.000 / 0 |
| mudumo | 10/10 | 9/9 | 0.000 / 1e-4 in |
| zevaka | 10/10 | 9/9 | 0.000 / 1e-4 in |

How to read the table:
- U≡R: the dot-engine and real-dot `-Tdot` output strings are identical
  (`pos`, `width`, `height`, edge `pos`) on every node and edge of every row.
- The rank axis carries all of S1. There our exact `_dim_` input through
  dot-engine (E) equals real dot (R) to `-Tdot`'s print precision.
- The cross axis of E vs U differs only by field partition: U's integer
  `amt` in `resize_reclbl` (`shapes.c:3574`) against our exact fields.
  dot-engine on an equalised partition (E′) matches E on 14/18 rows (not gavomi, noleta, jekaju, json-escaped).

So the residue is Smetana's 2.38 arithmetic (S1/S2/S3) against graphviz C
16.1. Named per ADR-2b and not chased.

## Step 6 — conformant rows

All 14 conformant json rows are single-node (13) or a parse failure (nixaxa,
no graph).
- **bidire-98-kege137** (1 node, 0 edges): jar X = max − (cy + h/2) = 0 by
  definition, and jar Y = cx − w/2 = 0 after `translate_drawing`. Ours
  min-shifts the only node to (0, 0). The M1+M2 probe Δ is 0, residue 0.
  S1 cannot act either: there is no second rank for the rounded height to
  offset.
- **dapinu-10-dida560** (1 node, 3 rects): same argument, probe Δ 0, residue 0.

All 14 (including babico's 0.001 rounding) and all yaml/hcl conformant rows
measured identical under the M1+M2 probe, the S1 emulation and the M3 probe.
- **Stop-4 risk: none** for M1+M2.
- **M3 flags civofu** (T1b, structural flip), not a conformant row.

## dot-engine draft (not a T1a row cause; found while instrumenting)

**Re-rendering the same graph object is not idempotent (dot-engine 2.4.0).**
Production is unaffected: `layoutGraph` renders once, then calls
`getLayout`.

- Input: builder `digraph { a -> b; }` (also with `a [shape=record,label="<P0>x|<P1>y"]; a:P1 -> b`, and with `parse()`).
- First `render(g,'dot')`, which matches real `dot -Tdot` 16.1.0 byte for byte:
  `bb="0,0,54,108"`, `a pos="27,90"`, `b pos="27,18"`, edge `pos="e,27,36.104 27,71.697 27,64.407 27,55.726 27,47.536"`.
- Second `render(g,'dot')` on the same object: `bb="0,0,126,36"`,
  `a pos="27,18"`, `b pos="99,18"` (both nodes on one rank), edge
  `pos="e,54,36.104 54,71.697 …"`. The edge keeps the stale first-pass
  route, shifted.
- Differing attributes: node `pos`, graph `bb`, edge `pos`.
- Repro: `diagnosis/scratch/rerender.mts` (not committed).
- For the orchestrator to file under `docs/graphviz-issues/` + TRACKER (my
  write-set is this file only).

## Open questions

- **Q1.** D3(1) holds on the engine input, but the record geometry *inside*
  `record_init` differs by S1. I classed S1 as Smetana because it is graphviz
  2.38 arithmetic that graphviz itself removed in 8.0.4. Matching the jar
  would mean the port pre-rounding sizes AND shrinking labels, i.e.
  re-implementing 2.38 inside our input (CLAUDE.md "never chase a
  Smetana-specific number"). The orchestrator should confirm, or reclass all
  18 as an `Mn`.
- **Q2.** The ADR-2b entry would name three graphviz-version changes (S1
  8.0.4 `aee7eda7d`; S2 7.0.0 `b03040389`; S3 7.0.0 `cfb1cc1a3`) with these
  measured magnitudes: node ≤0.838, path ≤3.44, canvas ±1.
- **Q3.** noleta rect/@width 0.001 (below the 0.01 compare tolerance): our
  width is `Math.fround` of the whole line (`measurer-deterministic.ts:96`),
  148.33749389648438, which prints .337. The jar prints .338, and it draws
  that line as separate word/space `<text>` segments. A per-segment
  float-sum in Java is the likely carrier, but it is not instrumented (same
  family as babico's known 0.001).
- **Q4.** The M3 port must first explain civofu's structural flip (T1b).
