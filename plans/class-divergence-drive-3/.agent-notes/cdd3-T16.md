# cdd3-T16 — printCluster1 / getNodesOrderedTop (E2-4 = C-16 = E3-15)

## Observation: printCluster1 runs in EVERY cluster, and repeats a tail per link
- **Context**: porting `Cluster#getNodesOrderedTop` / `printCluster1`.
- **Finding**: the diagnosis named only the root call (`DotStringFactory.java:188`), but `ClusterDotString.java:86,174` call `printCluster1` then `printCluster2` for every nested cluster too. `getNodesOrderedWithoutTop` (`Cluster.java:218-238`) removes the tails in every cluster. `firsts.add(0, sh)` runs once per inverted link, so a node that is the tail of two inverted links is declared TWICE. A jar render of `A o-up-> B; A -left-> C; D -up-> E (in package P); A -up-> C` gives `sh0014 [..]; sh0014 [..]; sh0013 [..];` before `lines0`, and `sh0011` (E) first inside `cluster6p1`. That DOT is now a unit test (`tests/unit/core/svek-dot-top.test.ts`). Kermor paths never call `printCluster1`.
- **Impact**: `src/core/svek-dot-top.ts` is the one definition. The emitter and `firstEncounterOrder` both reorder a cluster's `nodeIds` through `topsFirstClusters`. `assignSequence` keeps the original order, because sh numbers are construction order.
- **Confidence**: High

## Observation: `Link#isInverted` has a second class source, `Association#createInSecond`
- **Context**: deciding where the class engine sets `DotInputEdge.inverted`.
- **Finding**: `CommandLinkClass.java:364-365` is the obvious source (`Relationship.invertedLinkBurnsTick` = `upOrLeft`). `AbstractClassOrObjectDiagram.java:326-330` also re-adds the prior couple's class edge through `getInv()`. `bunuce-10-vere519`'s jar DOT declares that edge's tail `sh0006` before `lines0`. `invertPriorClassEdge` now sets the same flag. Unobserved in scoring: bunuce was already conformant. Its `lines0` batch order still differs from the jar's: our `lnode` invis edge comes before the second `pointToAssocied`. That residual is pre-existing and not scored.
- **Confidence**: High (jar DOT)

## Observation: two further mechanisms were hidden behind the E3-15 layout swap
- **Context**: after the top-block port, xamule stayed at 0/56 and vegubu at 0/3, although their DOT was byte-identical to the jar's (colors aside).
- **Finding 1 (xamule, magic arrows)**: `SvekEdge#getArrowDirectionInRadian` (`:201-217`) measures jar's `dotPath`. That path runs `getEntity1()`->`getEntity2()`, which is the DOT tail->head, and `Link#getLinkArrow` (`abel/Link.java:423-428`) reverses the token for an inverted link. We measured `rel.from`->`rel.to` (arrowhead-normalized) and never reversed. So `A <-- B : go >` and `A -up- B : go >` both drew the glyph backwards (jar-verified: tip y 97.5 / 87.5). Multi-guide-line labels are NOT flipped by inversion (`NONE_OR_SEVERAL.reverse()` is itself), but they do use the dotPath order.
- **Finding 2 (vegubu `1..1`, cukaze, joguva, zexaxa)**: `SvekEdge#manageCollision` (`:1205-1216`) pushes a tail/head label away from each overlapping node IN TURN over `Bibliotekon#allNodes()`. That collection is a LinkedHashMap in `createNode` order (= sh#### order) with no `za` anchors. We walked `DotLayoutResult.nodes` in graphviz creation order, and this task's own reorder changes that order. `class-node-map-order.ts#inNodeMapOrder` restores jar's collection.
- **Impact**: a DOT-level probe ("real dot on the fixed DOT = 0 node/edge diffs") does not prove SVG 0/0. Post-layout consumers can depend on node order too.
- **Confidence**: High (toggle experiments: collision order alone moves cukaze 109->0, joguva 2->0, zexaxa 4->0, vegubu text 2.2px->0)

## Observation: besepi's committed cache is the stale side (confirms T17)
- **Context**: besepi still at 10/660 against `test-results/dot-cache`.
- **Finding**: our `svek-1.dot` is byte-identical (colors aside) to a FRESH `scripts/oracle-render.sh` jar render. Against the committed cache it differs only in the orientation of the two couple edges (`sh0008->sh0025`/`sh0025->sh0018` vs ours `sh0018->sh0025`/`sh0025->sh0008`). Against the fresh jar SVG we are at S 1 / N 2 (`g[36]` childCount, height Δ5). The fresh jar is a newer version, so that number is context, not a target.
- **Confidence**: High

## Residual
- vegubu `g[16]/path/@d[4]` Δ0.012: DOT identical, and dot-engine and real dot agree on every edge pos/lp/head_lp/tail_lp for the jar DOT. Not attributed. Its size is in the D3 precision class.
