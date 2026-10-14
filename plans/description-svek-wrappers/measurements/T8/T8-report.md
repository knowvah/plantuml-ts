# T8 - deroxu diagnosis (unknown/deroxu-29-gude369)

Two independent mechanisms; each alone leaves bb at 4958. Both together: layoutParity equal=true, native bb 3757, all 246 edge pos equal.

## Measured
- layoutParity, before (HEAD e94eb0a68): equal=false, firstDiff.component=clusterTree,
  detail "jar 19 vs ours 19; sorted[0] jar depth 0 wrappers -/-/-/- bb 1021,1698.000048,359,284.000024 vs ours depth 0 wrappers -/-/-/- bb 1125,743.0000399999999,613,458.00002400000005".
  clusterTree is the first component only because cluster bb strings sort lexicographically; wrappers are -/-/-/- on both sides, 19 base clusters (38 subgraphs) on both sides. It is NOT nodeSizes.
- bb jar 3757x1990 vs ours 4958x1990.
- Counterfactuals (scratch only, applied to the captured DotInputGraph; same builder path layoutParity uses):
  - A only (portPad EPC_PMH 76->29, PGT 128->61): equal=false, bb unchanged 4958.
  - B only (inverted:true on the 13 -u-/-up-/-l-/-left- edges): equal=false, bb moves, not 3757.
  - A+B: layoutParity = {"equal":true}.

## Native-dot cross-check (dot 16.1.0, /opt/homebrew/bin/dot -Tdot)
| input | bb | edge pos |
|---|---|---|
| jar svek-1.dot, native | 0,0,3757,1990 | 136 |
| jar svek-1.dot, dot-engine 2.4.0 | 0,0,3757,1990 | 136 |
| toSvekDot(ours), native | 0,0,4958,1990 | 136 |
| builder(ours), dot-engine | 0,0,4958,1990 | 136 |
| toSvekDot(ours + A), native | 4958 | |
| toSvekDot(ours + A + B), native | 0,0,3757,1990 | 136; sorted pos list == jar native, 246/246 |
Attribution agrees: the engine is not at fault; the difference is in our DOT input. (A native re-layout of the already laid-out builder dump gives 4391; that roundtrip is lossy - positions/sizes are fed back as input - and is not used as evidence.)

## Mechanism A: port label width measured as one line
`portTablePad`/`isPortLabelWide` take `Math.trunc(measurer.measure(node.display, fontSpec).width)`. `measure()` is single-line and treats the `\n` in a multi-line display as zero-width, so it returns the SUM of the line widths; Java returns the WIDEST line. Two ports in deroxu have 2-line labels.
- Origin: src/diagrams/description/layout-helpers-shape-endpoint.ts:`portLabelWidth2` (~line 176-178: `return Math.trunc(measurer.measure(node.display, fontSpec).width)`), consumed at :183 (`isPortLabelWide`), :190 (`portTablePad`), layout-dot-tree.ts:111-113.
- Java: svek/SvekNode.java:181-190 (`width2 = (int) getMaxWidthFromLabelForEntryExit(...)`; `width2 > 40`; `fullWidth = width2 - 40`, floor 10) <- svek/image/EntityImagePort.java:90-94 (`getDesc().calculateDimension(sb).getWidth()`) <- svek/image/AbstractEntityImageBorder.java:79-82 (`leaf.getDisplay().create(fc, CENTER, skinParam)`: a multi-line TextBlock, width = max line).
- Causal chain: EPC_PMH "PM API\n(Protected)": lines 47.425 + 69.125; jar width2 = trunc(69.125) = 69 -> `WIDTH="29"`; ours trunc(116.55) = 116 -> `WIDTH="76"`. PGT "PDF Generation\nSNS Topic": 101.15 / 67.025; jar 101 -> 61; ours trunc(168.2) = 168 -> 128. Wider PORT tables -> node sizes 144x36 and 92x36 instead of 77x36 and 54x36 -> layout differs. Jar SVG textLength values (47.425, 69.125, 101.15, 67.025) and a jar probe (/scratchpad t8: same two ports, with/without `skinparam dpi 60`, `componentStyle uml2`, `linetype polyline`) give TD WIDTH 29/61 in every variant, so dpi/skinparam is not involved. DeterministicMeasurer on the single lines returns 47.425/69.125 exactly, so the measurer itself is right; only the multi-line handling is wrong. The draw path (renderer-entity.ts `drawPortFallback`) already uses `buildTextBlock` (multi-line aware).
- All other 20 port tables are identical (TD WIDTH multiset jar {10x18,20,29,41,61} vs ours {10x18,20,41,76,128}).

## Mechanism B: description never marks inverted links
Java `Cluster.printCluster1` (svek/Cluster.java:515-523) emits the shapes returned by `getNodesOrderedTop` (:195-212) FIRST: the start-uid node of every `isInverted()` link (SvekEdge.java:1148-1150 <- Link.java:145-147 `getInv()`: `result.inverted = !this.inverted`), `firsts.add(0, sh)` so reversed. For the root, that precedes `lines0` (DotStringFactory.java:188-190); for a cluster, ClusterDotString.java:174-176. `CommandLinkElement.java:325-326` calls `link.getInv()` when `dir == LEFT || dir == UP`. So the tails of `-u-`/`-up-`/`-l-`/`-left-` links are declared ahead of everything else, which changes graphviz's node creation order and with it ranking/mincross (the jar DOT has sh0172, sh0170 ahead of all edges, and sh0136,134,130,129,128 ahead of the rest of their cluster; ours declares them in id order).
- Origin: src/diagrams/description/layout-dot-tree.ts:422-427 (`dotEdges.push({ id, from, to, attributes })` carries no `inverted`), because `DescriptiveLink` (src/diagrams/description/ast.ts, ~:296-312 region) never records it: `ParsedLink.inverted` (link-grammar.ts:408,454) is used once in command-table-links.ts:37,50 to order endpoint creation and burn a creation index, then dropped. The core already honours the flag in builder and emitter (svek-dot-order.ts:141-166 `firstEncounterOrder` -> `rootTops`/`topsFirstClusters` in svek-dot-top.ts:50; graph-layout.types.ts:176-183), whose doc comment says "Set by the class engine only".
- Causal chain: no `inverted` -> `rootTops`/cluster tops are empty -> node creation order differs from the jar's (diff of normalised DOT: 4 order hunks, all of this kind) -> graphviz rank/mincross start from a different order -> 4958 vs 3757 wide, 38 vs 38 clusters placed differently, 7/246 edge pos equal.
- The 13 inverted edges (from in.puml, ours edge from>to): APIGHTTP>APIG, PAPIGHTTP>PAPIG, PPDB>PPS, EPC_COGAPI>EPC_COG, EPC_PMH>EPC_PM, LH>LS, ClimateZones>RDS, Distributors>RDS, FuelType>RDS, ParentOrganisations>RDS, PostcodeExceptions>RDS, SIH>SI, RDS>EEI_PS. The core's isNormalPosition filter drops the port-tailed ones.

## Ruled out (evidence)
- "Port-table sizes alone" (bump-notes/TRACKER 28): true for 2 of 22 ports, but counterfactual A alone leaves bb at 4958.
- Cluster wrapper structure / cluster count (batches 2-3): clusterTree wrappers -/-/-/- and 19 vs 19 (38 subgraphs vs 38) on both sides; normalised-DOT diff after A+B has zero wrapper/title-table (zaent WIDTH/HEIGHT) differences.
- dot-engine defect: engine and native agree on both inputs (jar 3757, ours 4958 before the fixes; both 3757 after).
- Font / dpi / skinparam / measurer: jar probe 29/61 under every variant; DeterministicMeasurer single-line widths equal jar textLength.
- Edge attributes (minlen, labels, ports, label boxes), nodesep/ranksep/splines, rank=source groups, root rect node sizes: normalised-DOT diff (jar vs toSvekDot(ours+A)) shows only node-order hunks and one anchor-order hunk.
- Builder vs emitter divergence: builder-engine bb 4958 == native on toSvekDot 4958; with A+B the builder-based layoutParity is equal and the emitter-based native run matches the jar to the pixel on all 246 edges.

## Residual (layout-neutral here)
In a cluster nested in a port cluster, toSvekDot prints the outer cluster's `zaent` anchor before the child cluster; the jar prints it after the child (ClusterDotString.java:174-190, after printCluster2). Text-only (core emitter svek-dot-emit-clusters.ts); layoutParity and native pos are already equal, so it did not move this fixture. Not verified for the builder path.

## Verdict
inside src/diagrams/description/ -> T9. Write-set: layout-helpers-shape-endpoint.ts (A: per-line max width, mirroring `buildTextBlock`/TextBlock width); ast.ts + command-table-links.ts + layout-dot-tree.ts (B: persist the inversion on DescriptiveLink, emit `inverted: true` on the DotInputEdge). No core behaviour change (optional: update the "class engine only" doc comment at graph-layout.types.ts:176-183, a core-file doc edit = write-set extension). The same A-defect exists in state: src/diagrams/state/state-leaf-node.ts:61-64 (out of scope here).

Scratch: plans/description-svek-wrappers/measurements/T8/ (scripts + dumps). src/ unchanged.
