# T1c diagnosis ledger: yaml (32) + hcl (2)

Measured 2026-10-29 in worktree `jfp-T1c` at `e159fd728`, jar-compatible mode,
`DeterministicMeasurer`, `residue.mts` (T0b measure). Real graphviz `dot`
16.1.0. Residue is written `nodeMax/pathMax/dw/dh`; `U` means `aligned:false`.

## Summary

- **The M1+M2 probe moves no row.** With the probe applied (no size echo, the
  jar's `getPosition`/`Mirror` arithmetic on the engine's raw y-up frame, edges
  through the same mirror), `residue.mts --all` gives output byte-identical to
  HEAD on all 104 cached rows (json too). No T1c row is predicted closed by B3.
- **Every T1c row has the same main mechanism, M3 (record geometry).** We hand
  dot-engine records whose solved geometry differs from what Smetana solves
  with. Smetana rounds the declared node size to whole points
  (`POINTS(ND_width)`) and pads no field. We give exact sizes and pad-
  compensated fields. Emulating Smetana's record geometry in the port's input
  ("E" below) brings every node rect, text and line of 31 rows to ≤ 0.001 (rank
  axis exact on all 34 rows) and closes every `dw` that M3 owns.
- **What is left after M3 is Smetana arithmetic** (D3 both parts shown, below).
  It has three sub-mechanisms:
  - S1: arrow length (graphviz ≥ 7.0.0 `arrow_length_normal`);
  - S2: `bezier_clip` keeps the last inside point instead of the last outside
    one (graphviz ≥ 7.0.0);
  - S3: in-rank network-simplex positions (jozapu, bafemu only).
- **One more port mechanism, M4 (scale)**, on `yaml/nuzaje-74-kenu009` (shared
  with `json/timafu-94-bixe774`). `scale` is applied to the geometry inputs, so
  every length the renderer adds after scaling stays unscaled, and `ep` is
  never scaled.
- **dot-engine = real `dot`** on every row (34/34; method under D3 part 2). No
  dot-engine draft.
- **json shares M3, M4, S1 and S2.** M3 moves 35 json rows. Some of them get
  worse (stop-4-class risk for any M3 port; see "Risks").

Counterfactual columns used in the evidence cells:
- **E** = probe + M3 emulation: declared record size `Math.round`, column
  encodings `- 8` more, clamped ≥ 0.
- **E+S1** = E + edge `penwidth=0`, which makes graphviz 16's
  `arrow_length_normal` collapse to `10·lenfact·arrowsize` = Smetana's 7.5.
  This is a counterfactual instrument only, not a proposal.

## Ledger

| row | n | p | dims | class | mechanism (one sentence) | origin (ours ↔ jar) | evidence | M1+M2 probe residue | ruled out |
|---|---|---|---|---|---|---|---|---|---|
| yaml/ketunu-15-poli031 | 0.151 | 1.283 | – | M3, then Smetana (S1+S2) | Record solved at exact size (ours) vs POINTS-rounded, unpadded size (Smetana); residue after that is arrow length + clip side | record-label.ts:52-54, layout.ts:303-304 ↔ SmetanaForJson.java:235-251, shapes__c.java:1807-1808,1636-1644 | E 0.001/1.144/0/0; E+S1 0.001/0.287/0/0; D3(1) size 0.211→0.002 | 0.151/1.283/0/0 (unchanged) | M1, M2 (probe identical); dot-engine (D3-2 equal); measurer (node w/h residue 0) |
| yaml/kotize-70-nuze855 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.001/1.767; E+S1 0.001/0.344; D3(1) 0.150→0.002 | 0.207/1.930/0/0 | as ketunu |
| yaml/lelofi-17-cafo004 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.001/1.767; E+S1 0.001/0.344; D3(1) 0.150→0.002 | 0.207/1.930/0/0 | as ketunu |
| yaml/litife-43-novo083 | 0.237 | 1.410 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.000/1.524; E+S1 0.000/0.238; D3(1) 0.235→0.002 | 0.237/1.410/0/0 | as ketunu |
| yaml/medosa-24-jugi124 | 0.750 | 1.302 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.250(spot)/1.542; E+S1 0.250/0.275; D3(1) 0.485→0.003 | 0.750/1.302/0/0 | as ketunu |
| yaml/mudeno-46-rado553 | 0.263 | 1.277 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.412(spot)/2.030; E+S1 0.412/0.615; D3(1) 0.490→0.003, rects 0.038 | 0.263/1.277/0/0 | as ketunu |
| yaml/polela-38-mopu631 | 0.207 | 1.930 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.001/1.767; E+S1 0.001/0.344; D3(1) 0.150→0.002 | 0.207/1.930/0/0 | as ketunu |
| yaml/sozafu-05-xeka661 | 0.088 | 1.534 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.001/1.418; E+S1 0.001/0.325; D3(1) 0.275→0.001 | 0.088/1.534/0/0 | as ketunu |
| yaml/vugalo-43-mose807 | 0.713 | 0.829 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.212(spot)/1.217; E+S1 0.212/0.218; D3(1) 0.278→0.002 | 0.713/0.829/0/0 | as ketunu |
| yaml/xubife-72-runi076 | 0.470 | 1.720 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.412(spot)/2.030; E+S1 0.412/0.460; D3(1) 0.490→0.003 | 0.470/1.720/0/0 | as ketunu |
| yaml/zebapi-77-zasu051 | 0.869 | 0.910 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.038(spot)/1.480; E+S1 0.038/0.369; D3(1) 0.485→0.003 | 0.869/0.910/0/0 | as ketunu |
| yaml/YAML-attribute-hierarchy | 0.654 | 1.742 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.500/1.497/0/0 (dw closed); E+S1 0.500/0.500; D3(1) 0.450→0.001 (rects 1.000: emulation inch artefact, see M3) | 0.654/1.742/1/0 | as ketunu |
| yaml/YAML-list-key-value-pair | 0.451 | 1.011 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.001/1.412/0/0; E+S1 0.001/0.282; D3(1) 0.450→0.001 | 0.451/1.011/1/0 | as ketunu |
| yaml/gatuva-87-futo104 | 0.494 | 1.986 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.000/1.332/0/0; E+S1 0.000/0.333; D3(1) 0.450→0.003 | 0.494/1.986/1/0 | as ketunu |
| yaml/gobavi-45-guna544 | 0.451 | 1.011 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.001/1.412/0/0; E+S1 0.001/0.282; D3(1) 0.450→0.001 | 0.451/1.011/1/0 | as ketunu |
| yaml/lipoka-75-rigo326 | 0.494 | 1.986 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.000/1.332/0/0; E+S1 0.000/0.333; D3(1) 0.450→0.003 | 0.494/1.986/1/0 | as ketunu |
| yaml/najoba-05-nino350 | 1.000 | 1.409 | y (U) | M3, then Smetana (S1+S2) | The root record is solved 87.237 tall (ours) vs 87 (Smetana), so the child sits at 128.237 vs 128 and the ink edge crosses 183→184; the manifest's "Smetana integer rounding" names the right line but the wrong class (see "Manifest claims") | as ketunu | E aligned, 0.237(spot)/1.523/0/0; E+S1 0.237/0.237; child x 128.000 under E; D3(1) 0.235→0.002 | U 1.000/1.409/1/0 | as ketunu; dot-engine placement (real dot is byte-equal) |
| yaml/sudabi-56-dedu341 | 0.737 | 1.409 | y | M3, then Smetana (S1+S2) | as najoba | as ketunu | E 0.237/1.523/0/0; E+S1 0.237/0.237; D3(1) 0.235→0.002 | 0.737/1.409/1/0 | as ketunu |
| yaml/tadari-70-nare798 | 1.000 | 1.409 | y (U) | M3, then Smetana (S1+S2) | as najoba (najoba + title); the title offset is no longer measurable (residue equals najoba's) | as ketunu | E aligned, 0.237/1.523/0/0; E+S1 0.237/0.237 | U 1.000/1.409/1/0 | as najoba |
| yaml/vapoda-87-piku740 | 1.000 | 1.986 | y | M3, then Smetana (S1+S2) | The 21.55-wide root is solved 22.55 (+1 kluge) vs Smetana 23, so the child sits at 63.55 vs 64 and the canvas is 216 vs 215 | as ketunu | E 0.001/1.332/0/0 (rect[1] width closed); E+S1 0.001/0.333; D3(1) 0.450→0.003 | 1.000/1.986/1/0 | as ketunu |
| yaml/xacali-26-mazu431 | 0.400 | 1.433 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.013/1.396/0/0; E+S1 0.013/0.331; D3(1) 0.486→0.003 | 0.400/1.433/1/0 | as ketunu |
| yaml/zeduse-06-fidi174 | 0.654 | 1.742 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.500/1.497/0/0; E+S1 0.500/0.500; D3(1) 0.450→0.001 (rects 1.000 artefact) | 0.654/1.742/1/0 | as ketunu |
| yaml/zomime-61-sase339 | 0.087 | 1.505 | y | M3, then Smetana (S1+S2) | as ketunu; dw survives E (spot/arrow ink crossing an integer), so dw is S2 | as ketunu | E 0.001/1.519/1/0; E+S1 0.001/0.372/1/0; D3(1) 0.275→0.002 | 0.087/1.505/1/0 | as ketunu |
| yaml/gabalo-23-tefe408 | 0.413 | 2.152 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.350(spot)/1.759; E+S1 0.350/0.395; D3(1) 0.488→0.003 | 0.413/2.152/0/0 | as ketunu |
| yaml/jukejo-54-pope427 | 0.413 | 2.152 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.350/1.759; E+S1 0.350/0.395; D3(1) 0.488→0.003 | 0.413/2.152/0/0 | as ketunu |
| yaml/poxedu-72-bite327 | 0.413 | 2.021 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.350/1.662; E+S1 0.350/0.350; D3(1) 0.488→0.003 | 0.413/2.021/0/0 | as ketunu |
| yaml/YAML-space-indent | 0.750 | 2.146 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.000/1.531/0/0; E+S1 0.000/0.340; D3(1) 0.450→0.002 (rects 1.000 artefact) | 0.750/2.146/1/0 | as ketunu |
| yaml/xofilu-53-tazi162 | 0.750 | 2.146 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.000/1.531/0/0; E+S1 0.000/0.340; D3(1) 0.450→0.002 (rects 1.000 artefact) | 0.750/2.146/1/0 | as ketunu |
| yaml/jozapu-14-datu953 | 5.000 | 6.350 | – | M3, then Smetana (S1+S2+S3) | Rank axis: M3, sub-px. In-rank: Smetana's network simplex places a rigid 14-node subtree (n0-n11, n48, n49) 5 px higher than graphviz 16 does on equivalent record geometry | as ketunu ↔ + dot_position (Smetana 2.38 transpile) | Base: 88 nodes dy 0 and sub-px dx (M3); 14 nodes dy +5. E: every dx 0.000, the same 14 nodes dy +5.000 → 5.072/7.720; E+S1 5.072/5.552. Tie-sensitive: a +1e-4 pt perturbation of the E sizes gives 7.000/9.280 | 5.000/6.350/0/0 | M1/M2 (probe identical); dot-engine (102/102 nodes and 101 edges equal to real dot); record geometry (D3(1) 0.490→0.003) |
| yaml/vaceci-80-lezo436 | 1.100 | 2.583 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.001/1.778/0/0; E+S1 0.001/0.318; D3(1) 0.450→0.000 | 1.100/2.583/1/0 | as ketunu |
| yaml/nuzaje-74-kenu009 | 14.475 | 133.630 | y | M4 + M3, then Smetana (S1+S2) | najoba at `scale 2`, plus four lengths that `scale` misses: `ep`, `VERY_FIRST_LINE`, `CELL_MARGIN_X`, the `ensureVisible` bump | M4 sites (below) ↔ SvgGraphics.java:129-131,468-475,801-802; JsonCurve.java:119-121; SmetanaForJson.java:173 | Base arrowhead garbage (`M 270.769 63.793 L 214.114 93.5 …`); text x 25 vs 30; spot lead 13 vs 26; width 387 vs 386. M4-only 5.000/2.820/2 (text margin not yet probed); E+S1+M4 with all four sites 0.475/0.475/1/0. The residual dw 1 is M4's dims order: jar int(int(192.85+1)·2)=386, ours trunc(193.85·2)=387 | 14.475/133.630/2/0 | M1/M2; dot-engine; layout (node rects ×2 of najoba's) |
| yaml/bafemu-96-luji978 | 85.001 | 89.628 | y (U) | M3, then Smetana (S3, with S1+S2) | Rank axis: M3 (closes dw 1). In-rank: Smetana's network-simplex x positions differ (all nodes −3 uniform; n18 −11, n24 −27, n30 +85). n30's edge is re-routed as a result: the jar's path[57] is a 3-bezier spline with a 0.6-pt first piece, ours is 2 beziers (token mismatch ⇒ U). The jar spline's control point at y≈1134 drives dh 28 | as jozapu | E: all node dx 0.000, dy unchanged → U 85.001/88.837/0/28; D3(1) 0.490→0.008 (rects 1.037 artefact); D3(2) 32 nodes and 31 edges equal to real dot | U 85.001/89.628/1/28 | M1/M2; dot-engine; record geometry. The segment count was not isolated from S3: the tail node itself moves |
| hcl/jubete-32-sutu417 | 0.800 | 1.923 | – | M3, then Smetana (S1+S2) | as ketunu | as ketunu | E 0.425(spot)/1.641; E+S1 0.425/0.426; D3(1) 0.426→0.002 | 0.800/1.923/0/0 | as ketunu |
| hcl/vocago-35-xodu446 | 0.525 | 1.476 | y | M3, then Smetana (S1+S2) | as ketunu; dw is M3 | as ketunu | E 0.025/1.137/0/0; E+S1 0.025/0.305; D3(1) 0.410→0.002 | 0.525/1.476/1/0 | as ketunu |

Per class: M1 0 · M2 0 · M1+M2 0 · **M3 34** (all rows, as primary) · **M4 1**
(nuzaje) · Smetana 34 as a secondary class (S1+S2 on all 34; S3 on jozapu and
bafemu) · dot-engine 0. Rows with M1+M2 probe residue 0: **none**.

## Why M1 and M2 move nothing (probe, all 104 rows)

- **M1 (size echo, `graph-layout.ts:109-128`).** The echo applies only when
  |declared − engine| < 1e-3. Json uses the engine size only for the corner
  (`centre − size/2`, `mapNodes`), so the echo shifts a corner by < 5e-4.
  That is below the 3-dp emit. The DRAWN size is the block's own
  (`placeJsonNodes` uses `m.totalWidth`/`totalHeight`, layout.ts), exactly as
  the jar draws `block.drawU` at its own `calculateDimension`
  (SmetanaForJson.java:166-168). So the engine size never reaches a width.
- **M2 (frame, `graph-layout.ts:273-304` + layout.ts:200-204).**
  - Ours is `x = bbH − (cy + h/2) − minShift`. The jar's is
    `x = max − (cy + h/2)` with `max = max(cy + h/2)` over nodes
    (SmetanaForJson.java:97-102,160-164,207-209).
  - On every json-family row the graphviz bb in the rank axis is the node
    extent, because tree edges run between node boundaries. So `bbH == max`
    and `minShift == 0` (the bb LL is the leftmost node edge after
    `translate_drawing`).
  - The two formulas therefore coincide. The probe's `--all` output is
    byte-identical to HEAD.
  - B3 (the M1+M2 port) is predicted to be output-neutral on the current
    corpus.

## M3 — record geometry handed to the engine

**Mechanism.** Smetana and our dot-engine receive equal width/height
attributes, but the record geometry they solve with differs. Ours is the exact
`(H, W+1)`, with fields summing to `(H, W)`. Smetana's is
`(max(H, ROUND(H)), ROUND(W)+1)`, with fields `colA-8`, `colB-8` widened by
integer `resize_reclbl` amounts.

**Origin pair.**

Jar side:
- `createNode` hands `width = dim.height/72` and `height = dim.width/72`, and
  encodes `colAwidth - 8` and `colBwidth - 8` (`SmetanaForJson.java:235-251`).
- Smetana's `size_reclbl` adds NO padding: Arnaud's 2023-03-18 modification
  comments out `dimen.x += 4*4; dimen.y += 2*4;` (`shapes__c.java:1636-1644`).
  So fields are `(h_i, colX - 8)`.
- `record_init` then takes `sz = POINTS(ND_width/height)` =
  `ROUND(dim·)` (`shapes__c.java:1807-1808`; `Macro.ROUND` = `(int)(f+.5)`,
  `Macro.java:1157-1159`; `POINTS`, `Macro.java:1560-1562`), and
  `sz = max(fields, sz)` (`:1816-1817`).
- In the engine's y (diagram width), fields total `W-16 < ROUND(W)`, so the
  rounded size always wins. In x (diagram height) it wins only when
  `ROUND(H) > H`.
- `ND_height = size.y + 1` (`:1823`, the "Kluge").

Ours:
- `recordLabelFor` compensates both PADs (`record-label.ts:52-54`, the
  `heightPad` and `widthA`/`widthB` lines). Our fields therefore total exactly
  `(H, W)`.
- Declared size is `width: m.totalHeight, height: m.totalWidth`
  (`layout.ts:303-304`, sent as `toFixed(6)` inches,
  `svek-dot-emit-clusters.ts:33`).
- Graphviz 16 `record_init` uses `INCH2PS`, not `POINTS`
  (`~/git/graphviz/lib/common/shapes.c:3689-3690`). That rounding was removed
  in graphviz 8.0.4, commit `aee7eda7d` ("Remove unnecessary rounding of width
  and height").

**Causal chain.**
- Rank separation in the TB frame is `ht1 + ranksep + ht2`, with
  `ht = ND_height`. Each rank's diagram-x offset therefore differs by
  `(W+1) − (ROUND(W)+1)` per parent rank: najoba +0.237, vapoda −0.45.
- Every child's x and the ink right edge move by that amount. `dw` flips
  where the ink crosses an integer (`SvgGraphics.java:129-131` truncation).
- Edges follow their ports (S1/S2 then add their own residue).

**Classed Mn, not Smetana.** D3 part 1 compares the record geometry the engine
solves with ("dot-engine's -Tdot rects/width/height vs the jar's",
diagnosis-method step 5). Those are unequal at HEAD and become equal under E
(table below), so the delta is port-controllable at the engine input.

**Measured.**
- `size|Smetana − ours|` is 0.150 to 0.490.
- Under E, `size|Smetana − E|` is ≤ 0.008, at `-Tdot`'s 5-significant-digit
  print. `rects|Smetana − E|` is ≤ 0.038 on 29 rows.
- It is exactly 1.000 (1.037 on bafemu) on YAML-attribute-hierarchy, zeduse,
  YAML-space-indent, xofilu, jozapu and bafemu. Cause: `toFixed(6)` turns
  125 into 124.999992, so `resize_reclbl`'s `(int)(2·inc)` truncates to 15
  instead of 16. That is an emulation artefact, not part of the mechanism.

**Smetana reference geometry.** Computed by a scratch transcription of
`size_reclbl`, `resize_reclbl` and `pos_reclbl` (`shapes__c.java:1611-1660`,
`:1676-1712`). Graphviz 16's `resize_reclbl`/`pos_reclbl` are the same code
(`shapes.c:3547-3582,3589+`).

**Java ↔ ours, side by side.**
```
SmetanaForJson.java:243-251   height=dim.width/72, width=dim.height/72; label(colAwidth - 8, colBwidth - 8)
shapes__c.java:1807-1808      sz.x = POINTS(ND_width(n)); sz.y = POINTS(ND_height(n));
record-label.ts:52-54         heightPad = 16; widthA = keyColWidth - 8; widthB = valueColWidth - 8   (dot-engine PADs +16/+8 back)
layout.ts:303-304             width: m.totalHeight, height: m.totalWidth   (dot-engine: sz = INCH2PS, shapes.c:3689-3690)
```

**Shared with json: yes.** E moves 35 json rows:
- improved: bavize 0.225→0.000, devime 1.19→0.46 and every 7.194 row → 7.000;
- worse: civofu becomes U; jidata 7.55→8.0; kidoki and nopoku dw 6→8;
  conigu, noleta, pijume and tivuru nodeMax up to 0.475. These are T1b/T1a's
  to diagnose.

## M4 — `scale` misses lengths introduced after scaling (nuzaje; json/timafu shares)

**Mechanism.** `scaleJsonGeometry` multiplies the layout's coordinates. Upstream
multiplies at emit (`SvgGraphics#format`, `:468-475`), after every length has
been computed at 1x. Four lengths are therefore emitted at 1x or wrong:
1. `ep` is not scaled. `scaleEdge` copies only `points`
   (`scale-geo.ts:94-95`). The arrowhead is built from a 2x last point and a
   1x tip, which is the garbage arrowhead.
2. `VERY_FIRST_LINE` (13) is applied to the already-scaled points
   (`JsonCurve.ts:56`). Upstream applies 13 at 1x
   (`SmetanaForJson.java:173`, `JsonCurve.java:119-121`), which emits as 26.
   This moves the spot and the stub start by 13·(k−1).
3. `CELL_MARGIN_X` (5) is added after scaling (`renderer.ts:91-92`).
   Upstream's `TextBlockUtils.withMargin(…, 5, 2)` runs at 1x. Text x is
   off by 5·(k−1).
4. Document size. Ours is `trunc((final + 1)·k)`: `scale-geo.ts:110-111`
   scales a width that already carries `ENSURE_VISIBLE_BUMP`
   (`document-dimensions.ts:125-126`). Upstream's `ensureVisible` tracks
   UNSCALED coordinates: `maxX = (int)(x + 1)` (`SvgGraphics.java:129-131`)
   seeded by `withMinDim(dim)` (`TextBlockExporter.java:284`,
   `SvgGraphics.java:142-143`), then emits `(int)(maxX · scale)` (`:801-802`).
   That gives 386 vs our 387.

**Evidence.**
- Probe sites 1-3 (uncommitted): nuzaje 14.475/133.630/2/0 → 5.000/2.820/2/0
  (sites 1-2) → 0.475/0.475/1/0 (sites 1-3, with E+S1). The leftover 0.475 is
  2 × najoba's S2 0.237. The leftover dw 1 is site 4, by the arithmetic above.
- json/timafu, sites 1-3 alone: U 5.939/64.057 → U 0.329/0.810.
- No conformant row and no other row moves under M4. The k=1 path returns
  early (`scale-geo.ts` IDENTITY).
- The exhaustiveness claim in `scale-geo.ts`'s header ("any unscaled numeric
  fails the build") is false. These are positional, so the structural gate
  cannot see them.

## Smetana sub-mechanisms (D3 shown below)

- **S1 arrow length.**
  - Smetana: `arrow_length = 10 · lenfact · arrowsize` = 7.5
    (`gen/lib/common/arrows__c.java:231-248`).
  - Graphviz 16: `arrow_length_normal` adds the penwidth miter and subtracts
    the `penwidth/2` overlap (`~/git/graphviz/lib/common/arrows.c:1190-1227`),
    since 7.0.0 commit `cfb1cc1a3`.
  - Effect: the spline end and `ep` move about 1-1.5 px. Najoba under E: ours
    `|last−ep|` 8.973 vs jar 7.646.
  - Inputs are equal: `arrowsize=.75`, default penwidth
    (`SmetanaForJson.java:221-223` ↔ `layout.ts:325`).
  - Counterfactual: `penwidth=0` makes 16's length 7.5, and pathMax drops to
    ≤ 0.62 on 31 rows.
- **S2 clip side.**
  - Smetana's `bezier_clip` saves `best` on an OUTSIDE sample
    (`gen/lib/common/splines__c.java:213-220`). Graphviz 16 saves it on an
    INSIDE sample (`~/git/graphviz/lib/common/splines.c:136-142`), since 7.0.0
    commit `b03040389`, "clip just inside instead of just outside the node".
  - Both stop at the 0.5 tolerance (`:144`), so endpoints differ by < 0.5 + 0.5.
  - This is the ≤ 0.62 residue left after E+S1 (spot ellipse cx = tail
    endpoint shift).
- **S3 in-rank positions.**
  - Under E the rank axis is exact on jozapu and bafemu, but in-rank (engine x,
    diagram y) placements differ.
  - jozapu: one rigid 14-node subtree +5. bafemu: −3 uniform, plus three
    nodes at −11/−27/+85.
  - dot-engine equals real dot on both graphs. So this is Smetana 2.38's
    `dot_position`/network simplex vs graphviz 16's.
  - It is tie-sensitive: jozapu reads 5.000 / 5.072 / 7.000 under input
    perturbations of < 1e-4 pt.
  - Not traced to a single C commit. The class rests on D3 alone.

## D3 evidence

**Part 1 (effective input).** Per-row `size|Smetana − ours| → size|Smetana − E|`
is in the ledger's evidence column. Ours differs by 0.15-0.49 and E by
≤ 0.008. So S1/S2/S3 are measured with E's input, where D3(1) holds.

**Part 2 (dot-engine = real dot).**
- Real `dot` cannot decode the `_dim_` sentinel, which is decoded only by
  `src/core/dot-engine-measurer.ts:52-70`. Exact input is therefore not
  runnable natively.
- The experiment: each row's exact captured graph (same nodes, declared
  width/height inches, record ports, edge attrs, `searchsize=500`) with every
  `_dim_h_w_` field text blanked. An empty field has dimen 0 in both engines,
  so no text measurer participates.
- Run through dot-engine (`parse` + `render 'dot'`) and `dot -Tdot` 16.1.0,
  comparing bb, node pos/width/height/rects and edge pos.
- Result: **34/34 rows equal** (0 differing attributes; byte-identical `-Tdot`
  text checked on najoba). This includes jozapu (102 nodes, 101 edges) and
  bafemu (32/31).
- A `fontsize=1` variant differs. That is the native pango vs LUT measurement
  of the blank field's space glyph (native field 17.25 vs engine 18 wide on
  najoba), a measurer path our `_dim_` input never takes. It is ruled out as
  engine evidence.

## Manifest claims verified

- **najoba / tadari** (`json-family-structural.json` divergent):
  - The numbers are correct (child 128.237 vs 128, ink 177.087 vs 176.85,
    183→184).
  - "dot-engine places the child … where Smetana uses 128" names the wrong
    actor. Real dot places it identically to dot-engine. Given Smetana's
    record geometry (E), dot-engine places it at exactly 128.000 and the width
    is 183.
  - The cause is M3 (port-controllable engine input), not Smetana geometry.
  - tadari's title note is stale: its residue equals najoba's.
- **vapoda `SMETANA_ROUNDED_CANVAS`** (`json-family-structural.ts:86-98`):
  - "5+22+37 = 64 vs 63.55" is arithmetically right: `ht/2 + ht/2 + ranksep`
    = 11.5+11.5+36 vs 11.275+11.275+36.
  - The citation `shapes__c.java:253-254` is `poly_init`, not records. Only
    `:1807-1808` applies.
  - "rounds every node's width/height" is too broad. Rounding only takes
    effect through `max(fields, POINTS(declared))`. On diagram width it always
    wins because Smetana pads nothing and upstream pre-subtracts 8 per column.
    On diagram height it wins only when the fraction is ≥ .5.
  - Class is M3; E closes `rect[1]/@width`.
- **bafemu** `aligned:false`: the path[57] structure is S3 (above), and canvas
  dh 28 follows from it.

## Step 6 — conformant rows

- All 8 conformant yaml/hcl rows (bedega, coxima, finofu, gipoxa, lifuxe,
  vuzosu, xatato, hcl/citoda) are **single-node, edge-less** documents (one
  `fill="none"` rect, 0 `<path>`).
- M1/M2/M3 cannot move them:
  - With one node, the jar's `max` is that node's own `cy + h/2`, so
    `x = 0`, and `y = cx − w/2 = 0` after `translate_drawing`. Ours is 0 after
    `shiftToOrigin`.
  - The drawn size is the block's own, so neither the echo nor POINTS rounding
    reaches any attribute.
  - M4 needs `scale`; S1-S3 need edges.
- Measured: E, E+S1, E+S1+M4 and M4 each leave all 8 at 0/0/0/0.
- The 14 conformant json rows are also unmoved: babico stays at its
  baseline 0.001.
- These rows therefore carry no information about multi-node arithmetic. The
  open fixtures.md question ("why conformant while M1/M2 apply") is answered
  for yaml/hcl: they are degenerate.
- **No stop-4 risk from conformant rows for B3 or any M3/M4 port.** The risk is
  on non-conformant json rows (M3 section).

## Risks for the orchestrator

1. **B3 (M1+M2) is predicted output-neutral on every cached row.** Its value is
   structural (D1 frame), not residue.
2. **An M3 port regresses some json rows** (civofu → U, jidata, kidoki/nopoku
   dw +2) while closing 31 yaml/hcl rows' nodes.
3. **jozapu/bafemu in-rank positions are tie-sensitive.** An M3 port can move
   them by tens of px either way: E without the ≥0 clamp gave jozapu 172;
   +1e-4 gave 7.
4. **Emulating S1** (`penwidth=0`) would close most remaining path residue. That
   is the "fit to Smetana" CLAUDE.md forbids, and the input is already equal
   (D3). It is listed only as the counterfactual that proved S1.
