# B — dot-engine attribution verification (T5)

Tools: real graphviz 16.1.0 (`/opt/homebrew/bin/dot`), `@knowvah/dot-engine`
1.6.0 (pinned). Probes (gitignored) in `diagnosis/scratch/`:

| probe | what it compares | output file |
|---|---|---|
| `B-engine-cmp.mts <slug>` | real `dot -Tdot` vs dot-engine `render(parse(cached svek-1.dot),'dot')` — same bytes | `B-engine-cmp.txt` |
| `B-svg-cmp.mts <slug>` | real `dot -Tsvg` vs dot-engine `renderSvg` (the 2-dp text the jar reads), per `<title>`, shape-order-insensitive | `B-svg-cmp.txt` |
| `B-api-vs-real.mts <slug>` | the graph `layoutGraph()` BUILDS (our `applyGraphAttrs/addNodes/addClusters/addEdges`) laid out by dot-engine vs real dot on the jar's cached DOT | `B-api-vs-real.txt` |
| `B-api-dot.mts`, `B-input.mts`, `B-layout.mts`, `B-geo.mts` | dumps: API-built `-Tdot`, `DotInputGraph`, `layoutGraph()` result, `ClassGeometry` | — |
| `B-ink-cf.mts`, `B-collide.mts`, `B-los*.{mts,py}` | counterfactuals (ink walk, 2-dp label collision, LineOfSegments) | — |

**Headline.** Of 16 fixtures attributed to dot-engine, **5 are dot-engine
(issue 19)** and **11 are not**. `B-svg-cmp`: on the cached DOT, dot-engine's
`-Tsvg` equals real graphviz's to Δ=0.000 on every titled element of all 16
fixtures EXCEPT the 7 flat HTML-port edges of issue 19. Issues 20 and 21 are
disproved (both were measured on OUR graph, not the jar's DOT).

| mechanism-id | fixtures | files | est. size | owner |
|---|---|---|---|---|
| B-1 layout forwards `weight` upstream never emits | majuva | `src/diagrams/class/class-dot-edges.ts:191` | XS (1 line + test) | this mission |
| B-2 `together {}` never becomes a DOT cluster | boseba (+ together-bearing E rows, see note) | class parser state (`class-container.ts`), `class-dot-clusters.ts`, `graph-layout.types.ts` (cluster kind), `graph-layout-build.ts#addClusters`, `svek-dot-emit.ts` | M (~100-150 lines, 5 files) | this mission |
| B-3 ink walk uses the legacy raw-text port-label anchor, not the drawn quantifier lines | focaci | `src/diagrams/class/class-ink-box.ts:430` | XS (~5 lines + test) | this mission |
| B-4 flat HTML-port edge routing (`triangulation failed`) | coxose, mucoti, rifuzu, ririlu (g[11],g[13]), sefazi | none in plantuml-ts | — | dot-engine (gvi 19, refreshed) |
| B-5 jar reads 2-dp `-Tsvg`; we read exact doubles | bicabi, famizo, kicuna, konomi, kupetu, nixema, paluca, vebini | D3 task | per D3 | this mission — D3 (batch 5) |
| B-6 ported `LineOfSegments` stalls on 2.84e-14 float dust; jar does not | ririlu (g[14..16]) | `src/diagrams/class/class-kal-overlap.ts` (faithful) | unknown | this mission — D3-noted, UNRESOLVED |

Note on B-2 reach: 7 class fixtures carry `together {`: boseba (B), foxosa,
jakapi, nadono, voluca (E/T1 rows), buxuso (not in the 105), sipigu (its
cached DOT has no `t` cluster). Every one of the jar's `cluster<N>t<k>`
subgraphs is missing from ours. Description has the same gap
(`src/diagrams/description/command-table-directives.ts:297-313`: a
passthrough frame, no DOT cluster). T6 should re-measure the E rows against
B-2 before diagnosing them independently.

---

### majuva-44-luta965
- mechanism-id: B-1
- mechanism: `@3 Dog --|> Mammal` / `@3 Cat --|> Mammal` set `Relationship.weight = 3`, and the class DOT builder forwards it into the layout graph as `weight=3`. Upstream stores the weight on `Link` and never reads it back, so the jar's DOT has no `weight`. The extra weight pulls Cat right, which widens the graph by 40 pt and reroutes `Dog o-- Cat`.
- java: `classdiagram/command/CommandLinkClass.java:381-385` `private void addLink(...) { diagram.addLink(link); if (weight != null) link.setWeight(Double.parseDouble(weight));` and `abel/Link.java:320-322` `public final double getWeight() { return weight; }`. A grep of `src/main/java/net/` for `.getWeight()` finds no caller outside `Link.java` and the unrelated `UFontFace`. No cached class `svek-*.dot` in the corpus contains `weight`.
- ts: `src/diagrams/class/class-dot-edges.ts:191` `if (rel.weight !== undefined) attrs.weight = rel.weight;` → `src/core/graph-layout-build-edges.ts:79` `if (a?.weight !== undefined) attrs.weight = a.weight.toString();`. `svek-dot-emit.ts` never prints `weight`, so the DOT-parity report stays byte-identical while the layout graph differs.
- causal chain: weight=3 on both `--|>` edges → mincross/position keep Dog and Mammal on a heavier vertical chain → Mammal x 44.15→84.15, Cat 84.15→124.15, bb 111.04→151.04 → canvas 40 px wider (S=1 is the rerouted `Dog o-- Cat` path; the 114 N are the shift).
- ruled out: dot-engine. The engine and real dot agree exactly on the cached DOT (`B-engine-cmp`: maxΔ node/edge 0.0000, bb 111.04 both; `B-svg-cmp` Δ=0.000). Node sizes are also ruled out: `B-api-vs-real` matches on width/height.
- probe: `B-api-vs-real.mts majuva-44-luta965` → `bb real=0,0,111.04,278 api=0,0,151.04,278`. `B-api-dot.mts` shows `weight=3` on `Dog -> Mammal` and `Cat -> Mammal`. Controlled experiment: add `weight=3` to those two edges of the cached `svek-1.dot` (`scratch/majuva-weight3.dot`) and run real `dot -Tdot`. The result is `bb=0,0,151.04,278`, nodes `84.15,24`/`44.15,247`/`124.15,132`, and edge `49.628,215.73 57.694,171.17 72.599,88.82 79.898,48.493`. Every value matches our API graph to the digit.
- fix shape: remove the weight forwarding in `class-dot-edges.ts#buildDotEdgeAttrs`. Keep the parse (`Link.weight` is kept upstream). The lollipop path (`class-lollipop.ts:186`) feeds the same field and is covered by the same line.
- owner: this mission
- confidence: HIGH (probe-verified)

### boseba-99-zopo693
- mechanism-id: B-2
- mechanism: the `together { UserRole User Role }` block is parsed but never emitted as the jar's `subgraph cluster2t0 {...}`. Without that cluster, graphviz orders the rank differently, and the `User` children come out mirrored.
- java: `svek/Cluster.java:528-531` `private void printTogether(...) { sb.append("subgraph " + getClusterId() + "t" + togetherCounter + " {\n"); for (SvekNode node : nodesOrderedWithoutTop) if (node.getTogether() == together) node.appendShape(sb, stringBounder);`, called from `printCluster2` (`:551-575`). Membership is set by `atmp/CucaDiagram.java:232` `result.setTogether(currentTogether());`, with the stack entry pushed by `gotoTogether` (`:339-340`).
- ts: `src/diagrams/class/class-container.ts:158-169` `openTogetherBlock` records only the namespace, to pop the brace correctly. Its doc says the `t` cluster is one "the parity bar ignores", so no membership reaches `DotInputGraph`: `B-input.mts` prints `clusters: undefined`.
- causal chain: no `cluster2t0` → the minlen=0 edges `UserRole–User` and `Role–UserRole` no longer constrain the three nodes as one block → mincross picks the mirrored `User` child order (UserSpace < UserPro < UserPerso) and places Structure between them → bb 773.01×321.26 instead of 698.65×298 → S=1 (rerouted `UserRole -- User` path), 681 N.
- ruled out: dot-engine. It matches real dot exactly on the cached DOT (`B-engine-cmp` 0.0000, `B-svg-cmp` Δ=0.000). Node sizes are ruled out: every width/height matches (0.000001 in emitter print rounding only). Issue 21's "mirror" was measured on our graph, not the jar's.
- probe: controlled experiment. Delete only the `subgraph cluster2t0 {`/`}` lines from the cached DOT (`scratch/boseba-nocluster.dot`) and run real `dot -Tplain`. The result is graph width 10.736in (= 773.0 pt, our bb 773.01), sh0007 (UserPerso) x=10.055in (rightmost), sh0009 (UserSpace) 5.8464in, sh0006 (Structure) 5.9714in = 429.94 pt. Our API graph has UserPerso 723.94, UserSpace 420.94 and Structure 429.94. Real graphviz without the cluster therefore reproduces our layout. The cached DOT with the cluster gives 9.7035in and sh0007 < sh0008 < sh0009 (the jar's order).
- fix shape: port `Entity#setTogether` membership into the class parse (the `Together` parent chain), and emit per-container `together` subgraphs named `<clusterId>t<k>` with node members only and no label/style: `Cluster#printCluster2`/`printTogether`/`addTogetherWithParents` (`Cluster.java:528-583`). This needs a bare-cluster kind in `DotInputCluster`, handled by `graph-layout-build.ts#addClusters` AND `svek-dot-emit.ts`, and the class renderer must skip it. Also remove the parity-bar exemption for `t` clusters so the DOT gate sees it.
- owner: this mission
- confidence: HIGH (probe-verified)

### focaci-80-suzu938
- mechanism-id: B-3
- mechanism: the class ink walk bounds the edge's legacy `EdgeGeo.headLabel` anchor. That anchor uses the RAW quantifier string `"~* initiators"`, measured at 61.1 px. The renderer instead draws `quantifierLines` (`"* initiators"`, 53.4625 px). The phantom anchor reaches 1.732 px further left than any drawn ink, so the whole diagram is shifted +1.732 and the canvas is 2 px wider.
- java: `svek/SvekEdge.java:336-338` `endHeadText = Display.getWithNewlines(skinParam.getPragma(), link.getQuantifier2()).create(cardinalityFont, HorizontalAlignment.CENTER, skinParam);` and `:969-973` `this.endHeadText.drawU(ug.apply(new UTranslate(labelX, labelY)));`. `LimitFinder` sees only that drawn, creole-processed `UText` (`klimt/drawing/LimitFinder.java:217-225` `drawText`).
- ts: `src/diagrams/class/class-ink-box.ts:430` `for (const lbl of [e.label, e.tailLabel, e.headLabel, ...(e.labelLines ?? [])])`. `e.headLabel` is `portLabelAnchor(text, …)` over the unprocessed string (`class-edge-role-label-anchor.ts:151`, assigned `:257`). The drawn text is `quantifierLines` (`renderer-edge-extras.ts:237-247`).
- causal chain: ink minX = headLabel.x (phantom), 1.732 left of the leftmost drawn ink (`"1 initiating"`) → `svekInkShift` moves everything +1.732 → every x Δ1.732–1.738 (93 N) + `svg/@width`/`viewBox` 137 vs 135.
- ruled out: dot-engine / issue 20. On the cached DOT, real dot and dot-engine agree exactly (bb 107.58, both nodes x=55, `tail_lp` 27.5,101.24, `head_lp` 28.5,54.708), and our API-built graph matches too (`B-api-vs-real`: 0 mismatches). Issue 20's "5.81875 offset" is our post-`shiftToOrigin` frame (`graph-layout.ts` translates the 2.425 left label reservation away: `B-layout.mts` puts Transaction at x=0 where graphviz has 2.425). Label placement is ruled out: our drawn texts sit at the jar's graphviz-frame positions (`"1 initiating"` −7.046 vs jar −7.045).
- probe: `B-geo.mts focaci-80-suzu938` → `headLabel {"text":"~* initiators","x":6,…,"width":61.1}` vs `quantifierLines[1] [{"text":"* initiators","x":10.046…,"width":53.4625}]`. `B-ink-cf.mts` replaces the tail/head anchors with the drawn lines: `AS-IS ink minX 6 dim 131.35` → `DRAWN-QL ink minX 7.7317 dim 129.62 shift dx −1.7317`. That gives node x 17.2028 → 15.4711 (jar 15.465; the 0.006 residual is B-5 quantisation, node left 2.425 → 2.42), width floor(129.62+6)=135 = jar.
- fix shape: in `buildInkBox`, when `e.quantifierLines` is present, bound each drawn line (`addEdgeTextInk` per `QuantifierLineGeo`) instead of `e.tailLabel`/`e.headLabel`. Mirror the draw site (`SvekEdge.java:956-980`). Blast radius is every quantifier whose raw string ≠ drawn lines (creole escapes, `\n`), so it needs a class survey.
- owner: this mission
- confidence: HIGH (probe-verified)

### coxose-20-nifu136
- mechanism-id: B-4
- mechanism: dot-engine mis-routes the two flat (`minlen=0`) edges between HTML-table `PORT="h"` cells (`sh0010:h->sh0006:h`, `sh0006:h->sh0008:h`). It prints `triangulation failed` once per edge and returns a short 4-point stub from the box edge, where real graphviz routes cell-to-cell.
- java: n/a (graphviz); the DOT is the jar's own `svek-1.dot`.
- ts: none. `B-api-vs-real`: our API graph lays out exactly like the cached DOT on dot-engine (only these 2 edges differ from real graphviz).
- causal chain: the 2 flat-edge groups (g[7], g[9]) carry all 36 N: path, extremity polygons and Kal rect/text, which ride the edge endpoints (`Kal` translate = `dotPathInit` start/end, `SvekEdge.java:1069-1077`).
- ruled out: our input, because nodes 0/5 mismatch, bb 388×352 on both, and the remaining 2 edges match. Kal/Q-2/Q-3 are ruled out because every diff is inside the two flat-edge groups.
- probe: `B-engine-cmp` → `edge sh0010:h->sh0006:h real=56.983,176 78.33,176 110.68,176 138.69,176` / `eng=e,111.02,176 76.315,176 83.644,176 91.496,176 99.545,176`; `edge sh0006:h->sh0008:h real=253.42,176 … 331.29,176` / `eng=e,315.78,176 280.73,176 … 304.28,176`. The engine prints `triangulation failed` ×2; real dot prints none.
- fix shape: dot-engine (flat-edge spline routing with HTML-table ports; `dotsplines.c` flat-edge path / `routespl.c` shortest-path polygon).
- owner: dot-engine (gvi 19, refreshed with these numbers)
- confidence: HIGH (probe-verified)

### mucoti-34-seve858
- mechanism-id: B-4
- mechanism: as coxose, applied to the one flat edge `sh0007:h->sh0008`.
- java: n/a (graphviz).
- ts: none (`B-api-vs-real`: nodes 0/3, bb 336.21×56 both).
- causal chain: all 12 N are in g[4] (path, Kal rect/text on the tail) and shift with the edge start (Δ64.541).
- ruled out: our DOT (node pos/size match), Kal placement (moves exactly with the path start).
- probe: `B-engine-cmp` → `real=78.903,17.168 107.61,14.139 148.35,14.111 177.28,17.082` / `eng=e,177.38,28.788 143.44,28.588 150.95,28.632 158.46,28.676 165.98,28.72`, with `triangulation failed` ×1.
- fix shape: dot-engine.
- owner: dot-engine (gvi 19)
- confidence: HIGH (probe-verified)

### sefazi-02-defe499
- mechanism-id: B-4
- mechanism: as coxose, for the flat edge `sh0007->sh0008:h` (head port).
- java: n/a.
- ts: none (`B-api-vs-real`: nodes 0/3, bb equal).
- causal chain: all 12 N are in g[4]. The head Kal (`kal2` at the end point) shifts Δ76.097 with the path end.
- ruled out: our DOT, Kal math.
- probe: `B-engine-cmp` → `real=72.081,28 101.04,28 141.84,28 170.55,28` / `eng=e,105.91,27.412 71.915,27.212 78.871,27.253 86.49,27.298 94.453,27.345`, with `triangulation failed` ×1.
- fix shape: dot-engine.
- owner: dot-engine (gvi 19)
- confidence: HIGH (probe-verified)

### rifuzu-80-nixo780
- mechanism-id: B-4
- mechanism: as coxose, for the flat edge `sh0007:h->sh0009`. The engine's `head_lp` moves with the bad spline (Δy 11.589), and the quantifier text is placed from it.
- java: n/a.
- ts: none (`B-api-vs-real`: nodes 0/4, 2 of 3 edges match).
- causal chain: all 24 N are in g[7]. Kal rect/text and path follow the start (Δ57.546). The head quantifier text follows `head_lp` (Δx 0.042 = 260.99 vs 260.95; Δy 13.08 = 11.589 amplified by `moveAwayFrom`).
- ruled out: Q-11 as an independent cause (every diff is in the flat-edge group); the other 2 edges (exact).
- probe: `B-engine-cmp` → `real=184.94,15.164 216.21,14.424 250.19,15.104 276.49,17.205` / `eng=e,276.45,28.794 242.49,28.645 …`, `head_lp real=260.99,23.705 eng=260.95,35.294`, with `triangulation failed` ×1.
- fix shape: dot-engine.
- owner: dot-engine (gvi 19)
- confidence: HIGH (probe-verified)

### ririlu-13-zipi740
- mechanism-id: B-4 (g[11], g[13]: 36 N) + B-6 (g[14..16]: 12 N)
- mechanism: (1) the same two flat HashMap port edges as coxose (identical numbers). (2) MoreComplex's three DOWN `Kal` boxes: our faithful `LineOfSegments` spends its `all.size()`=3 passes on a −2.84e-14 overlap between y and z, so the x/y overlap is never solved. The jar's boxes come out abutting.
- java: `svek/LineOfSegments.java:89-111` (`for (int i = 0; i < all.size(); i++) if (oneLoop() == false) return;`, and `oneLoop` `if (overlap > 0)`), called from `svek/SvekNode.java:453-463` via `SvekResult.java:104-109`.
- ts: flat edges: none (dot-engine). Kal: `src/diagrams/class/class-kal-overlap.ts:73-89` (a faithful port).
- causal chain: x box stays at 466.31 (jar 440.54), y at 489.079 (jar 501.965), z at 528.717 (jar 541.602). The edge starts move with them (`Kal#moveX` → `moveStartPoint`, `Kal.java:204-211`), so the diffs are Δ25.77 on x and Δ12.885 on y/z.
- ruled out: dot-engine for g[14..16], because edges 4-6 match real graphviz exactly (`B-engine-cmp`, `B-svg-cmp`). Kal widths/positions are ruled out: box widths 51.425/29.637/64.725 equal the jar's, and the pre-fix mean of middles is 519.0 on both. 2-dp quantisation alone is ruled out as the fix: `B-los-trace2.py` feeds the jar's own inputs (−Tsvg starts 508.12/520/531.88, frame dx=−1 from mean preservation) and still gets `loop1: push 2.84e-14 | loop2: push 2.84e-14` → boxX [466.307, 489.081, 528.718], i.e. OUR output, not the jar's.
- probe: `B-los.mts` (ported `LineOfSegments`): exact boxX 459.3104/482.0792/521.7167 (+7 frame = ours); 2dp same stall. `B-los-trace.py`: `loop0 push 45.30625 | loop1 pair 1,2 diff=-2.842e-14 | loop2 diff=-2.842e-14`.
- fix shape: unresolved. D3-noted per the brief; do not chase here.
- owner: flat edges → dot-engine (gvi 19); Kal stall → this mission (D3 task), UNRESOLVED
- confidence: HIGH for B-4. B-6 mechanism in ours is HIGH (probe). Why the jar escapes it is UNKNOWN.

### kupetu-36-kive480
- mechanism-id: B-5
- mechanism: the jar builds each `DotPath` from graphviz's 2-dp `-Tsvg` `d=` text, then moves the start point and first control point by the extremity decoration (the `<|` triangle). We start from dot-engine's exact doubles. The 2-dp rounding of `ctrl1 − start`, plus the angle-derived move, gives Δ0.011.
- java: `svek/SvgResult.java:141` `toDotPath()` (parses the `d` text) at `SvekEdge.java:637`; `klimt/shape/DotPath.java:206-216` `moveStartPoint` (`beziers.get(0).x1 += dx; … ctrlx1 += dx;`); node positions from 2-dp `points=` (`svek/DotStringFactory.java:388-396`).
- ts: none wrong. We read exact layout doubles, which is D3's policy question.
- causal chain: jar `C44.943` = 44.01 (2-dp ctrl1) + 7 − 6.067 (move) and `M51.273` = 50.34 + 7 − 6.067. Ours: 44.006 + 7 − 6.074 = 44.932 and 51.268. `ctrl1 − start`: jar −6.33 (= 44.01 − 50.34), ours −6.336 (exact).
- ruled out: dot-engine. `B-svg-cmp` shows Δ=0.000 against real `-Tsvg` on all 7 elements, `B-engine-cmp` shows 0.0000, and `B-api-vs-real` shows 0 mismatches.
- probe: arithmetic above from `B-engine-cmp` (`sh0007->sh0006 pos=50.342,107.74 44.006,90.064 …`) and the jar/ours `d` strings in `measurements/out/kupetu-36-kive480.{jar,ours}.svg`.
- fix shape: D3 (2-dp quantisation of layout output), batch 5.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### nixema-71-tuke505
- mechanism-id: B-5
- mechanism: identical to kupetu (same A←B edge geometry, `<|:--`). Values: exp 44.943, act 44.932.
- java / ts / causal chain: as kupetu.
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 6/6, `B-api-vs-real` 0 mismatches).
- probe: as kupetu. The path `M51.273,72.207 C44.943,…` (jar) vs `M51.268,72.206 C44.932,…` (ours) is byte-equal to kupetu's.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### famizo-04-joxe063
- mechanism-id: B-5
- mechanism: as kupetu (moved start of an extension edge inside a namespace).
- java / ts: as kupetu.
- causal chain: jar `M95.514 C88.684`, where start − ctrl1 = 6.83 = the 2-dp graphviz difference (112 − 105.17). Ours: 6.836 (exact). Δ0.011 at d[2].
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 12/12, including both clusters; `B-api-dot` cluster bbs equal to real).
- probe: `B-svg-cmp.txt`, `B-engine-cmp.txt`, and the `d` strings above.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### vebini-34-gapu710
- mechanism-id: B-5
- mechanism: as kupetu: moved start points and extremity polygons derived from 2-dp endpoints.
- java / ts: as kupetu.
- causal chain: the unmoved graphviz points agree within 2-dp rounding (jar 92.94,308.4 vs ours 92.944,308.398). The moved start/decoration points (d[0], d[2], polygon[2,4]) carry Δ0.012–0.014: jar start − ctrl1 = 13.68/40.76 (2-dp) vs ours 13.682/40.741.
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 6/6).
- probe: `B-svg-cmp.txt`, and `measurements/out/vebini-34-gapu710.{jar,ours}.svg` path/polygon strings.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### bicabi-42-coto932
- mechanism-id: B-5
- mechanism: the one diff is a diamond decoration vertex (`polygon[1]/@points[2]` 254.911 vs 254.922), computed from the 2-dp end point and angle.
- java / ts: as kupetu (the decoration is built from the 2-dp `DotPath` end segment).
- causal chain: the anchor vertex matches 2-dp graphviz (jar 250.19,46.42 vs ours 250.199,46.424), and the derived vertex amplifies that into Δ0.011.
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 18/18, `B-engine-cmp` 0.0000 on 7 nodes and 10 edges).
- probe: `B-svg-cmp.txt`; polygon strings in `measurements/out/bicabi-42-coto932.{jar,ours}.svg`.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### paluca-39-desa696
- mechanism-id: B-5
- mechanism: 2-dp quantisation magnified by `skinparam dpi 300` (×3.125).
- java: as kupetu.
- causal chain: real `-Tsvg` `M10.41,-24` vs exact 10.414 → (10.414 − 10.41) × 3.125 = 0.0125, which is the observed d[0] Δ0.013 (70.806 vs 70.793).
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000, `B-engine-cmp` `10.414,24 …` both).
- probe: `dot -Tsvg` path above; `B-engine-cmp.txt`.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### kicuna-39-riki626
- mechanism-id: B-5
- mechanism: 2-dp quantisation of cluster and node corners, ×3.125 (`skinparam dpi 300`).
- java: `svek/DotStringFactory.java:388-396` (`extractList(SvgResult.POINTS_EQUALS)` → `getMinXY` → `moveDelta`). Clusters use the same 2-dp `points=` text.
- causal chain: cluster `A` exact x 214.075 → `-Tsvg` 214.08: +0.005 × 3.125 = +0.0156, the observed Δ0.015–0.016 on g[1]. Node B exact 251.075 − 20.68125 = 230.39375 → 230.39: −0.00375 × 3.125 = −0.0117, the observed Δ0.011–0.012 on g[2]. The edge groups g[7]/g[8] follow the same pattern. All 114 N are ≤0.016.
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 11/11, `B-engine-cmp` 0.0000, `B-api-dot` cluster bbs `214.08,92,288.08,189` = real).
- probe: `dot -Tsvg` polygons `214.08,-92 …`, `230.39,-156 …`; render-diff Δ values.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

### konomi-00-gico141
- mechanism-id: B-5
- mechanism: the tail quantifier `"1"` of `AfSession --> MediaComponent` is pushed off the AfSession box by `PositionableUtils#moveAwayFrom`, a 5-step bisection. Fed the jar's 2-dp inputs instead of exact doubles, the bisection lands one step further, 0.315 lower.
- java: `klimt/geom/PositionableUtils.java:86-118` (`max = 0.1; while (…) max *= 2; for (int i = 0; i < 5; i++) { … }`), from `svek/SvekEdge.java:1206-1214` `manageCollision`. The label position comes from 2-dp `getXY` (`SvekEdge.java:750-756`).
- ts: none wrong (`class-edge-label-anchor.ts:253-260` `manageCollision` is a faithful port).
- causal chain: the input differs by ≤0.005, and the bisection's discrete step turns that into y +0.315 (499.269 vs 498.954). x is equal.
- ruled out: dot-engine (`B-svg-cmp` Δ=0.000 on 27/27, `B-engine-cmp` 0.0000 on 12 nodes and 14 edges, `B-api-vs-real` 0 mismatches).
- probe: `B-collide.mts konomi-00-gico141 'AfSession->MediaComponent'`. Exact pos y 481.8425; quantising the centre and nodes to 2 dp in our frame (fx=fy=0, which equals graphviz's frame here because min node x/y = bb origin) gives Δpos `0.000,0.315`, the jar's Δ exactly. 90/100 frame offsets in the sweep give +0.311..+0.319.
- fix shape: D3.
- owner: this mission (D3)
- confidence: HIGH (probe-verified)

## Unresolved

- ririlu-13-zipi740 g[14..16] (B-6): our faithful `LineOfSegments` stalls on −2.84e-14 dust with both exact and jar-2dp inputs, but the jar's output abuts all three boxes. Ruled out: dot-engine (edges exact), Kal widths/mean (equal), 2-dp inputs (still stall). Instrument next: a debug-instrumented local jar build printing `Segment.middle`/`halfSize` bits and `oneLoop` overlaps for MoreComplex's DOWN list, compared bit-for-bit with `class-kal-overlap.ts` (candidates: the `Kal#setTranslate(tr, extremity)` compose order, `dim` width bits).
