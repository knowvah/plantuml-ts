# T1b — cluster-box diagnosis (D6, read-only; debugger agent report, 2026-10-15)

Measured on the OLD census instrument (b0, before T1a re-routed the census through renderSync).
Scratch: `/private/tmp/claude-501/codd-T1b/` (`probe.ts`, `survey*.ts`, `wt/` = patched throwaway copy;
unpatched `wt` reproduces b0 exactly: Σ 21058, 61/30/38/46/90/1). Every hypothesis was a gated patch in
`wt`; the numbers are real census runs.

## M1 — the drawn group box is a padded union of child boxes, not the engine's cluster rect (HIGH, counterfactual)
- **Mechanism:** for every non-port container, `buildGeoNode` sets the box to
  `computeContainerBbox(children)`: min/max of the child boxes, extended by constants 16
  (left/right/bottom) and 28 (top). The layout already publishes the true cluster rect in
  `DotLayoutResult.clusters` (== the jar's `cluster<N>` subgraph bb) and nobody reads it for non-port
  clusters. The padded union ignores edge-label space, nested-wrapper margins and the title TABLE.
- **Origin (port):**
  - `src/diagrams/description/layout-dot-tree.ts:542-545`: `portInfo === undefined ? computeContainerBbox(children) : …`
  - `src/diagrams/description/layout-helpers.ts:120-140` (`computeContainerBbox`)
  - `src/diagrams/description/layout-helpers-types.ts:309-312` (`CONTAINER_PADDING = 16`,
    `CONTAINER_TOP_PAD = 28`; fitted, no upstream citation; no other consumer)
  - `layout.ts:119-125` (`clusterRectsByAstId`) is built only for port clusters
    (`buildPortClusterInfoByAstId`, `layout.ts:~96-113`).
- **Origin (Java):**
  - `DotStringFactory.java:432-441`: per cluster, `getClusterIndex(svg, cluster.getColor())` (the middle
    subgraph `color="#0000NN"`), min/max of its polygon points, `cluster.setPosition(min,max)` (`Cluster.java:511-512`).
  - `Cluster.java:299` hidden early return; `:344-345` frontier only when
    `entityPositionsExceptNormal().size() > 0`; `:367-373` `ClusterDecoration(…, rectangleArea, …)`.
  - `ClusterDecoration.java:78,89-90`: `asBig.drawU(ug.apply(rectangleArea.getPosition()))` and
    `symbol.asBig(…, rectangleArea.getWidth(), rectangleArea.getHeight(), …)` — drawn at exactly the graphviz rect.
  - `SvekResult.java:132-133`: `moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY())`.
- **Causal chain:** (1) the jar draws `cluster6` = bb `[16,16.07,161,97.07]` (145x81, bamami); (2) we draw
  min/max(children)+pads = 145x62; (3) rect/path/polygon x/y/w/h differ; (4) edges clip
  (`simulateCompound`) against the geo box, so link `path/@d` moves; (5) the ink-shift `placeBody`
  (`SvekResult.java:132-133`) takes its origin from the drawn extent, so a wrong box shifts every entity
  rect (the 25 entity-only rows).
- **bamami (acceptance):** jar draws the MIDDLE level `cluster6` `[16,16.07,161,97.07]` 145x81 — not
  `cluster6p0` `[8,8.07,169,105.07]` 161x97, not `cluster6p1` `[24,24.07,153,58.07]` 129x34.
  `layoutGraph().clusters` for ours is `cluster0 x=-16 y=-32.51 w=145 h=81`, the same middle level. We
  draw 145x62 because of `layout-dot-tree.ts:544`.
- **Counterfactual:** box = `result.clusters` rect for non-port containers: Σ 21058 → 13072; 81 rows fall,
  2 rise (cemutu 192→229 = M2; tuliba 44→70 = M3); zero-diff 61 → 89. bamami/bobixe/pugodi 154 → 87,
  rufopi 160 → 95; box 145x81 with y exact; residual x Δ3 and caption y Δ5.9 are T4 canvas/margins.
- **Implementation constraint (found by experiment):** carry the engine's `width`/`height` VERBATIM; do
  NOT recompute `maxX - minX`. `USymbolCloud.java:75` seeds `new Random((long) width + 7919L * (long) height)`.
  `x+width-x` gave 336.99999999999994 → `(long)` 336 instead of 337 → a different cloud. With verbatim
  width, rigoge 216→3 and zaraze 217→4 (Σ 12837 → 12411).
- **Ruled out:** dot-engine (native == `DE.render(parse)` on cluster bbs + graph bb, 105/105 fixtures with
  clusters); layout input (builder cluster bb multiset == jar native on 92/96; other 4 = M3; juvose = M2);
  wrapper choice (p0/p1/i/a are not what the engine publishes); FrontierCalculator (gated on ports,
  `Cluster.java:344`); TRACKER #14 (titles untouched); core (`core/graph-layout.ts:222-238` already
  publishes x/y/width/height).
- **Rows:** 72 fixtures where jar-drawn cluster w,h == engine rect and ours differs (141 clusters). Census
  falls under M1 alone: 81 (list below) incl. 35 with cluster rect diffs at b0 and 25 entity-only rows
  moved by ink-shift. Rect family (91 rows): M1+M2+M7 clear 60, 31 remain. `path/@d` 84 → 31 rows
  (cluster-class 40 → 1: zosuje, T4). `polygon/@points` cluster-class 26 → 3 (banatu 0.12, lesori/ravodu M3).

## M2 — `skinparam packagestyle` never reaches the cluster's USymbol (HIGH, counterfactual)
- **Mechanism:** the jar resolves the `package`/`namespace` keyword's USymbol at parse time as
  `skinParam.packageStyle().toUSymbol()` (node → NODE, rect → RECTANGLE, …), then uses it for label-TABLE
  supplements, SName style, drawing and title ordering. We always use the folder PACKAGE:
  `core/skinparam-key-handlers-table-a.ts:375-379` keeps only `rect|rectangle`; accumulator/theme type is
  `'rect'` only (`skinparam-accumulator.ts:95`, `theme.ts:169,414`); `core/decoration/symbol/usymbol-resolve.ts:96-103`
  (`resolveSymbol`) has no packageStyle input; `renderer-cluster.ts:191-196` passes `packageStyle: null`.
- **Origin (Java):** `CommandPackageWithUSymbol.java:194`, `CommandPackage.java:179`,
  `CommandNamespace.java:114` → `USymbols.fromString(…, packageStyle())` (`USymbols.java:103`);
  `SkinParam.java:820-826`; `PackageStyle.java:69-` `toUSymbol`; `USymbolNode.java:192-198` (supp height 5,
  width 60); `ClusterDecoration.guess` (symbol wins over style).
- **Causal chain (juvose):** jar cluster label TABLEs 109x28, 104x28, 115x28, 116x28, 87x14, 135x28 (6
  NODE-resolved `package`s); ours 49x23, 44x23, 55x23, 56x23, 27x9, 75x23 — exactly +60/+5 (NODE supp);
  cloud foo6 equal 52x23. So cluster bbs differ (jar 125x112 vs ours 114x107 …) and title/stereotype order
  differs (NODE draws the stereotype first). This IS the ledger's "ours-input" for juvose.
- **Counterfactual:** `rect` (AST remap package→rectangle): cemutu 229 → 1. `node` + M1: juvose 352 → 0, all
  7 clusters exact. (AST remap is a stand-in for parse-time resolution; it must mutate nodes in place —
  cloning broke zosaxo +12, a hack artifact.)
- **Ruled out:** dot-engine (D8 equal); `<<Node>>`/`<<Rect>>` stereotypes selecting the shape (resolved
  symbol wins in `ClusterDecoration.guess`); cloud keyword (equal already).
- **Rows:** component cemutu (rect); unknown juvose (node). Same mechanism by source grep, unmeasured:
  usecase fotisa-06-xipe681, fepuvo-06-rugi981, lirebi-26-voka556, saduja-80-goba120; unknown
  cikifu-97-pasu472, kacecu-90-pudi895, mijape-37-doka854, togijo-81-zako477.
- **Note:** other PackageStyle values (AGENT, STORAGE, COMPONENT1/2, ARTIFACT) have `toUSymbol() == null`;
  `ClusterDecoration.getTextBlock` then throws and `Cluster.drawU` catches it, so nothing is drawn
  (`Cluster.java:376`).

## M3 — census path parsed without sprite/emoji stores (instrument) — ALREADY FIXED by T1a (0b43dcfca)
Rows lesori, ravodu, ruciga, tuliba. `scripts/svg-conformance-census.ts:221` and
`render-fixture.ts:109` (old); production passes both stores. With stores: lesori 19→3, tuliba 70→11;
ravodu 19→97, ruciga 55→108 RISE because now-resolved sprites are drawn (sprite placement, stated mechanism).

## M4 — `set separator` phantom groups laid out but never put in the geo tree (HIGH)
- **Mechanism:** `layout.ts:437-438` classifies/lays out `groupedNodes` (`buildNamespaceGroups`) so the DOT
  has the clusters (5 engine clusters); `layout.ts:287` builds the geo tree from `ast.nodes` (ungrouped),
  so the renderer sees zero containers.
- **Origin (Java):** `CucaDiagram.java:325-336` `eventuallyBuildPhantomGroups`, called at `:464`, creates
  real `GroupType.PACKAGE` groups that `Cluster.drawU` draws.
- **Chain:** jar draws 5 `<g class="cluster">` (ent0121…ent0125); ours 0 → fidati/kofovu/tojitu ~3000 diffs each.
- **Counterfactual:** geo tree from `groupedNodes`: fidati/kofovu 3036 → 488, tojitu 2752 → 481; Σ 12411 → 5044.
- **Residual M4b (not isolated):** uid/draw order — the jar numbers phantom groups last (ent0121-0125,
  because `eventuallyBuildPhantomGroups` runs at `getTextBlock`), ours ent0001…; plus link `@id` pairing.
  Next instrument: `renderer-uid.ts` plan ordering vs jar `@id` sequence.
- **Rows:** fidati-41-kofe029, kofovu-01-niti223, tojitu-03-ruto643.

## M5 — a hidden container still contributes ink to the canvas origin (HIGH, counterfactual)
- `Cluster.java:299` `if (group.isHidden()) return;` — a hidden cluster draws nothing even inside the
  LimitFinder (`SvekResult.java:132`); only entity hiding goes through `UHidden`. Ours applies
  `respectHidden` to clusters too: `renderer-draw-sequence.ts:135`.
- mavuxi (`hide a`): every drawn x 15.92 too large (141 vs 125.08; width 265 vs 249). Unconditional skip
  for clusters: mavuxi 7 → 0, no other movers. **Row:** mavuxi-16-jafi782.

## M6 — kermor + ports skips the entry/exit-point frontier (MEDIUM: inspection + numbers, not flipped)
- `layout.ts:93-103` `buildPortClusterInfoByAstId` returns `{}` for kermor ("no kermor fixture exercises a
  port cluster"). `Cluster.drawU` runs `manageEntryExitPoint` whenever the group has ports
  (`Cluster.java:344-345`), kermor or not.
- fojamu: engine gamma 186x172; jar draws 186x146 (frontier shrink), ours 186x172. siseda and zubujo same
  26 px (`rect/@height` Δ26); all three `!pragma kermor on` with `portout`/`portin`. The y Δ60 in
  fojamu/siseda is the kermor TOP group note drawn before the cluster (`Cluster.java:301-307`) = T5.
- **Rows:** fojamu-08-veku866, siseda-71-napu395, zubujo-87-xaxa087.

## Unexplained / not box
- perapa-23-mobu798 (rect x Δ5.79/8.75 on two port clusters) and banatu-09-koce254 (polygon Δ0.125):
  non-kermor port-cluster FrontierCalculator x. Next instrument: dump `FrontierCalculator` inputs for
  perapa's `tempSensor` vs `SvekNode.getRectangleArea()` (`SvekNode.java:379-381`).
- zosuje: box 136x81 exact after M1; residual = `document { Margin 10 20 30 40 }` → T4.
- bamami/bobixe/pugodi/rufopi: after M1, x Δ3 and caption y Δ5.9 → T4.
- kizobu-64-rozo458, tacixe-99-gesi489: boxes exact after M1; `!define F H` makes two `circle` aliases
  collapse in the jar (one ent) while ours draws two (`ent0004` twice) → T3/childCount.
- 17 entity-level rect rows (not a box): bagoze, berelu, bozoju, dexigu, dujodu, gevozu, kanute, kenece,
  misube, murava, repoge, saveje, silito, sunuju, tujica, turasu, zifaji.
- Cluster title text x/y (25 rows after M1+M2+M5+M7, e.g. recurring 40.53 on fopako/gurive/perapa) → T6/T7.
- dirofi-81-cuga514: jar error page; ours draws 3 clusters — error-page ruling.

## Table
| mechanism | rows explained | origin | fixer write-set |
|---|---|---|---|
| M1 box = padded union (+ verbatim width) | 81 census falls; bamami group 154→87; rigoge/zaraze need verbatim width | `layout-dot-tree.ts:542-545`; `layout-helpers.ts:120-140`; `layout-helpers-types.ts:309-312`; Java `DotStringFactory.java:432-441`, `Cluster.java:511`, `ClusterDecoration.java:78,89` | description only: `layout-dot-tree.ts`, `layout.ts`, `layout-helpers.ts`, `layout-helpers-types.ts`, description unit tests asserting the padded union |
| M2 packagestyle symbol | cemutu; juvose (352→0); usecase 4, unknown 4 unmeasured | `skinparam-key-handlers-table-a.ts:375-379`; `skinparam-accumulator.ts:95`; `theme.ts:169,414`; `usymbol-resolve.ts:96-103`; `renderer-cluster.ts:194` | core (D5) + description; class engine consumes `theme.packageStyle === 'rect'` (`class-namespace-ink-shape.ts:29`, `MyElkCluster.ts:82,127`) |
| M3 census harness stores | lesori, ravodu, ruciga, tuliba | harness | DONE by T1a |
| M4 phantom groups not drawn | fidati, kofovu, tojitu (+M4b) | `layout.ts:287` vs `:437-438`; Java `CucaDiagram.java:325-336,464` | `layout.ts`, `layout-dot-tree.ts`, `namespace-groups.ts`, `renderer-uid.ts` (M4b) |
| M5 hidden-cluster ink | mavuxi | `renderer-draw-sequence.ts:135`; Java `Cluster.java:299`, `SvekResult.java:132` | `renderer-draw-sequence.ts` |
| M6 kermor ports | fojamu, siseda, zubujo | `layout.ts:93-103`; Java `Cluster.java:344-345` | `layout.ts`, `layout-dot-tree.ts`, `frontier-cluster-bbox.ts` |

M1 census falls (81): balipa-82-feto843, balomu-94-kegi822, bisedo-29-kone620, bukece-71-miku542, catari-10-xiza828, cuxeda-73-semi910, daxija-24-pozu867, detona-13-ziko113, dujodu-23-viba393, favega-89-rado990, fetefi-28-figu176, fijido-06-kapu656, foboxa-33-menu312, fojamu-08-veku866, fopako-15-labi027, garopu-71-riri890, gezemu-34-kamu453, gopomi-26-pome923, gucefa-91-pume734, gurive-62-ricu497, josoxo-49-taci997, junoxu-15-gori632, kacite-73-sobe773, kafopo-19-doxu941, kizobu-64-rozo458, kumefo-73-xodu411, lesori-32-zeve057, lotofa-28-rudo664, lufiba-62-dubi670, mavuxi-16-jafi782, mevupe-82-meva605, mucezi-78-ciki658, nibige-54-voki590, nidemo-97-domu132, nipoga-91-nole703, nuxebu-15-sixe797, pafefo-52-zeli644, pafoxe-99-xulo156, pepego-30-kati324, perapa-23-mobu798, purevo-74-pamo264, ravodu-50-siso430, renita-52-jazi848, repite-70-vabe533, rigoge-48-ziso050, riradu-09-xipo824, ruciga-77-ruja233, sacuso-94-gugi476, saveja-25-bezi839, saxosu-09-nodi002, seguci-13-zure968, sevage-80-seva382, siseda-71-napu395, tacixe-99-gesi489, tajuki-26-bime046, temufu-00-rira888, texacu-57-daci050, titona-45-jile471, tizuza-93-xeto109, tukipe-82-ziva562, vajaxu-62-poto986, venoti-11-seza115, vixeni-34-nici683, vosapi-62-mugu541, vosuxa-11-tapu784, vovuru-39-sula650, vunimi-85-xadu895, xadaji-25-cufe655, xagino-11-vazo768, xocodo-09-nuxi647, xusuxe-62-guba767, zabixa-22-tovi572, zajozi-04-dixu500, zaraze-24-vixi421, zeteze-09-kuno793, zibumo-62-rije152, ziniso-08-damu446, zotake-65-cabi912, zubujo-87-xaxa087, zugofa-47-risi694, zusota-76-jagu564.

Stacked ledger (old census, `wt`): b0 21058/61 → M1 13072/89 → +M2(rect) 12844 → +M5 12837/90 → +verbatim
width 12411/90 → +M4 5044/90 (1-3 bucket 30 → 47).

## D8
All 105 fixtures with clusters: native `dot -Tdot` on jar `svek-1.dot` == `DE.render(DE.parse)` (cluster bbs
+ graph bb). No stop-11 candidate in this family. Builder vs jar cluster bb multiset equal for bamami
group, zosuje, 92 component fixtures; differs for juvose (M2) and the 4 M3 rows (census wiring only).
