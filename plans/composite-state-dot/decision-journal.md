# Decision journal — composite-state-dot

Append one row per non-trivial judgement call: anything a reasonable developer
might have decided differently. Log it either way — pushed forward or stopped.

| date | decision | why | needs review? |
|---|---|---|---|
| 2026-08-14 | Branched `feat/composite-state-dot` off `feat/port-label-placement` (this brief's own HEAD), not off `main` as the README says | `main` is 15 commits behind and carries neither this brief nor the `fd079b88` diagnosis it is built on. Branching off `main` would have executed a mission whose own text was absent from the tree | yes — the merge target is now that branch, not `main` |
| 2026-08-14 | Executed the tasks directly rather than dispatching the named `typescript-pro`/`debugger` agents | This session is configured not to call the Agent tool unless the user asks. Each task is single-file and needs the Java read in-context, which a fresh subagent would re-pay for | no |
| 2026-08-14 | T1 census wall-clock recorded: **4.27 s** before, **4.40 s** after (component+usecase+state, 629 fixtures, `--per-fixture`) | The brief asked for a first-run baseline because nested subgraphs were the one plausible cost regression. There is none — the emitter is not on the layout path | no |
| 2026-08-14 | T1 split `svek-dot-emit.ts` into `+ svek-dot-emit-clusters.ts` and `+ svek-dot-wrappers.ts` | The wrapper emission pushed the file to 539 lines against the hook's 500 cap. Push-forward condition: split the module. The wrappers module is deliberately shared with the builder so T2 has one definition to check both paths against | no |
| 2026-08-14 | T1 left `niveno-60-tiro789` (the last subgraph-count miss, -2) alone | Mechanism found and it is NOT the emitter: `state-composite-cluster.ts:379,414` gates `innerMarginLevels` on `titleTableEligible` (`ctx.theme.fontSize === 14`), so `skin debug` suppresses the wrappers the builder would otherwise build. Jar's `protection0`/`protection1` (`ClusterDotString.java:107-115`) depend on neither the title table nor the font size. Fixing it is a BUILDER change that moves geometry — ADR-2 says stop, and it belongs in a census-gated batch | yes — needs its own task; not in any batch's scope today |
| 2026-08-14 | Recorded, not fixed: for a border-point cluster with `borderPointAncestorWrap`, both paths put the `za` anchor INSIDE `i`, where jar puts it inside `ee` and outside `i` (`ClusterDotString.java:148-152`, verbatim in `viroxo-69-fito663`'s oracle) | `unwrappedNodeId` is set only for the plain family (`state-composite-cluster.ts:415`). Mirroring the builder is what ADR-2 asked of T1; diverging from it would have failed T2. Relevant to batch 3 — it is a pin-family placement gap | yes — candidate input to T5 |
| 2026-08-14 | T3: the `za` anchor takes a synthesized `zaent####` suffix, numbered in cluster-walk order, which does NOT reproduce jar's | Jar's suffix is the group's entity uid (`EntityBase#getUid`, numbering leaves too — hence `zaent0004` where the first cluster's anchor would be `0001`), and `DotInputGraph` carries no entity uids. Only the id's FORM is structural; the comparator never compares id text. Threading real uids would be a state-pipeline change, not an emitter one | no |
| 2026-08-14 | T4's premise re-measured before writing code, and it was NOT already satisfied | `firstEncounterOrder` (G7 T16) was already wired into `addNodes`, which reads as "T4 is done". A three-way order survey (jar oracle text / our emitted text / builder registration) said otherwise: the builder's first node differed from jar's on 172 of 1365 graphs. The brief's "extend it rather than adding a parallel mechanism" was the right instruction for the wrong reason — the gap was clusters, not `lines0` | no |
| 2026-08-14 | T4 also fixed `printRanks` in the EMITTER (`svek-dot-emit-clusters.ts`), which is T3's file and not T4's write-set | The three remaining builder≠emitter graphs were all the emitter's fault, and T4's own contract is "the same order T3 emits". Fixing the builder to match a wrong emitter would have encoded the wrong order in both. Emitter-only ⇒ provably census-neutral, so the risk is zero | no |
| 2026-08-14 | T4 added `tests/oracle/declaration-order-parity.test.ts`, outside its declared write-set | Same remedy T2 established for the same two-consumer failure mode, and the order function is now duplicated logic by necessity (the emitter derives its order by emitting; the builder has no text to parse). Without it the two drift again | yes — write-set extension |
| 2026-08-14 | T4 keeps the `lines0`-first EDGE registration despite measuring zero census effect on all 1365 graphs | It is what `DotStringFactory:187-198` does and what T4's task text asks for; G7 T16 declined it on blast-radius grounds, and the blast radius is now measured at exactly zero. Leaving the builder registering in an order the emitter does not write is the divergence class this mission exists to close | yes — reverting it alone is safe if a later regression points here |
| 2026-08-14 | **STOP-condition 6 discharged, not waived**: `state/rijoki-89-teno556` rose 118→139 diffs. Mechanism: our `[*]` pseudostate nodes are appended to `acc.nodes`/`cluster.nodeIds` AFTER every real state in their scope (`state-composite-pseudo.ts#addLocalPseudoNodes`, called at `state-composite-pass.ts:284`), where jar creates the entity at first textual mention — jar's leaf order is `Idle, [*], Configuring`, ours is `Idle, Configuring, [*]`. G4 S7's `sortSpecsByDocumentOrder` already fixes this for `GeoSpec`s; it was never applied to the DOT node list. Secondary: our `Idle <<O-O>>` is 50px wide against jar's 52.575px | T4 made the SEQUENCE of positions match jar exactly (verified), so what rose is a pre-existing entity-to-position mapping defect the old, also-wrong order had been masking — the `buniva` precedent. Fixing it is a state-parser change, outside batch 2 | yes — own task; the fitness test cannot see this class, by construction |
| 2026-08-14 | **STOP-condition 6 discharged**: `class/pukuzu-30-zode181` rose 457→468 diffs while its total positional error FELL 13% (39020→33745 px) and its document size was unchanged (256x226, jar 320x308, both before and after) | The rise is the diff-count metric, not the geometry: nodes that previously coincided with jar by accident now differ slightly while the set as a whole moved closer. The frame-level defect (nested-namespace cluster margins) is untouched by this batch | no |
| 2026-08-14 | **T5 mechanism (see the write-up below this table). STOP-condition 4 fires: it lands in `graph-layout-build*.ts`, not `state-composite-*.ts`/`state-dot-graph.ts`.** T6 is NOT started | The brief reserves that decision for a human, and the blast radius is every diagram type with nested clusters — which is exactly what the condition guards | yes — T6 needs an explicit go-ahead |
| 2026-08-14 | Recorded: under `!pragma kermor on` the builder never creates jar's `${id}empty`/root placeholder point node at all (`Cluster.java:595-609`, `ClusterDotStringKermor`) | The emitter writes it, the builder cannot — it is not a `DotInputGraph` node. It is the DFS root in jar's own text (`siseda-71-napu395`, `fojamu-08-veku866`, `zubujo-87-xaxa087`), so it reaches geometry. Kermor-only and outside this mission | yes — own task |

## T5 — the composite pin-span gap

### Mechanism

Jar's DOT sets `label=<TABLE …>` on `cluster<N>ee` **before** declaring the
child clusters nested inside it, and DOT attribute inheritance gives every one
of those children that same label. Graphviz therefore reserves a label band at
the top of each inheriting child cluster. Our layout builder constructs the
graph programmatically, where no such inheritance exists — each subgraph gets
only the label explicitly set on it — so the band is missing and the ranks
below close up.

### Origin

`src/core/graph-layout-build.ts:287-289` (`handlesFor`'s border-point branch)
and `src/core/graph-layout-build-borderpoint.ts:67,81-92`: `main` is created
with `{}` and only `ee` is ever given `setHtmlAttr('label', …)`. Nothing
propagates an enclosing `ee`'s label to a nested `cluster<M>`, which is what
`ClusterDotString.java:135-141` does implicitly by writing `label=` on `ee`
before `Cluster.java:580` recurses into the children.

### Causal chain

1. In `temuxi-28-cega322`, `cluster0ee` (module) carries a 45x9 title table and
   `cluster1`/`cluster2`/`cluster3` are declared inside it. Graphviz reports
   `lp` and `lheight=0.12` for all three — inherited, not their own.
2. That band widens exactly one rank gap: the one between the last rank inside
   a `…ee` and the rank of the border points just outside it — **62.5px → 89px,
   the 26.5px** the mission set out to explain.
3. A composite's drawn frame is the span of its own pin centres
   (`FrontierCalculator`, already verified faithful), and those pins bracket
   that gap, so the frame loses the same 26.5px: `Somp` 143.5 against jar's 170.
4. The shortfall compounds through the nesting to the document height, 316
   against 418.

### Ruled out

- **Our emitted DOT text.** Real graphviz 15.1.1 lays out our DOT and jar's
  cached `svek-1.dot` to byte-identical coordinates for all 19 nodes
  (`dot -Tplain`, paired). The text is not the defect.
- **The batch-1 wrappers and the batch-2 ordering.** temuxi's numbers are
  316/418 before and after both batches.
- **Cluster membership and rank grouping** — the brief's leading candidate.
  Dumped the builder's actual subgraph tree: it matches the DOT's structure and
  rank groups exactly.
- **Node sizes.** Every node box in our SVG already matches jar's exactly
  (73.288x50, 99.8x50, 12x12, 50x50, 20x20).
- **The frontier calculator and border-point recognition** — re-confirmed: the
  frame equals the span of pin centres on both sides.

### Verified by experiment, then reverted

A throwaway 12-line emulation of the inheritance (border-point cluster nested
in a border-point parent takes the parent's `ee` title table as its own label)
made the engine's cluster boxes **identical to graphviz's** — cluster0 1082x397,
cluster1 166x178, cluster2 258x232, cluster3 543x348 — and every drawn frame
identical to jar's: module 1086x316, Somp 258x170, counter 529x300, flop
170x130, with all node boxes at jar's offsets.

Document height reached 343, not 418. The residual 75px is **not** the pin span
and not a size at all: it is a uniform vertical offset — jar's outermost frame
sits at y=88, ours at y=13, with every element below it identically spaced.
That is a separate top-margin/origin defect, and it is the reason exit-bar 4's
"418" is not met by this mechanism alone.

### Scope

The fix belongs in `graph-layout-build.ts` / `graph-layout-build-borderpoint.ts`
— **outside** the write-set stop-condition 4 names, and it would change every
diagram type that nests a labelled cluster inside another. T6 is not started.

## T6 — outcome

Landed at the origin T5 named: `graph-layout-build-borderpoint.ts
#inheritedEeLabel`, applied in `graph-layout-build.ts#handlesFor`. No fitted
constant — the 26.5px never appears in the code; the label itself is what
graphviz measures.

**Met:** every drawn frame on `temuxi-28-cega322` matches jar exactly (module
1086x316, counter 529x300, Somp 258x170, flop 170x130), and the engine's raw
cluster boxes now match real graphviz on the same graph.

**Not met:** document height 343, not 418.

**Measurement note.** The census is BLIND to this fix — `temuxi`'s diff count
is pinned at 5 by a `childCount` recursion stop (`svg/g[1]`, 31 vs 40), so the
metric cannot move whatever the geometry does. Gated on total positional error
instead, over all 271 cached state fixtures: **one fixture changes and it
improves** (206 -> 152px), zero worse. `temuxi` is the only cached fixture with
a border-point composite nested inside another — the fix is correct and its
corpus reach is one fixture. Class/object and component/usecase censuses are
byte-identical.

### Residual — the last 75px, and why it is not a size

With T6 in, our whole diagram is a RIGID 75px translation of jar's: every frame
and every node box matches, and every gap between them matches. Jar draws a
border point's own name label ABOVE its 12x12 box and reserves that band at the
top of the document; we draw it below the box top and reserve nothing.

- jar: `sig_in` label baseline y=66.889, its box top y=82 → label ABOVE, by 15.1
- ours: same label baseline y=22.889, its box top y=7 → label BELOW the box top,
  by 15.9
- x is identical on both sides (127.669), so only the vertical rule differs
- consequence: jar's outermost frame starts at y=88, ours at y=13

That is a leaf-label placement rule in the border-point node's own geometry
(`state-leaf-node.ts:35-62` builds these nodes from `getEntityPosition`; the
label y comes from the shared leaf text geometry, with no border-point-specific
case), not cluster construction — outside T6's write-set and its own task.

## T7 — border-point label placement (follow-on, authorized after T6)

### Mechanism

A border point kept `StateKind:'normal'` (`state-entity-position.ts`'s own doc
comment records why: `Stereogroup` has no entry/exit case), so
`renderer.ts#renderShape` had no case for it and it fell through to
`renderNormal` — the ordinary state box. Upstream instantiates a different
image class, `EntityImageStateBorder`, whose `drawU` (`:79-89`) draws the
symbol at the node origin and the label OUTSIDE it.

Every divergence followed from that one missing dispatch: a rounded rect at
stroke 0.5 instead of a circle/square at 1.5, a divider `<line>` upstream never
draws, and the label at `node.y + MARGIN + ascent` (`renderer-box.ts:246-250`)
instead of above or below the symbol.

### Measured, before and after

| | ours before | ours after | jar |
|---|---|---|---|
| `lulozu` `en1` label baseline | 22.889 (dy +15.889) | 18.5 | 18.5 |
| `temuxi` pins, top half | dy +15.889 | dy -15.111 | dy -15.111 |
| `temuxi` pins, bottom half | dy +15.889 | dy +22.889 | dy +22.889 |
| `temuxi` document height | 316 | 368 | 418 |

Corpus, all 271 cached state fixtures, by total positional error: 12 better, 0
worse, four to exactly zero. Census: 5 fall, 0 rise. Class/object unchanged.

### Residual 1 — a 1.611px text-ink band, NOT fitted

`lulozu` is 134 against jar's 136, and every element in it is a rigid 1.611px
translation of jar's. The label's own ink in jar starts 1.611px above the box
top this port computes, i.e. jar's text ink spans `[baseline - 12.5, baseline +
3.111]` where ours spans `[baseline - 10.889, baseline + 3.111]`. Our
`DeterministicMeasurer` reports height 14 and descent 3.111 for that string —
ascent 10.889, the same value `textAscent` models and the same one that
reproduces jar's BASELINE exactly. So the 12.5 is not derivable from anything
this port measures, and 1.611 is not going into the code as a constant.
The remaining 0.389px of the 2px gap is at the bottom and is unexplained.

### Residual 2 — temuxi's last 50px

Not a size and not the label: the document extent itself. Jar's canvas is
`SvekResult`'s dimension, which is graphviz's own graph bounding box and
therefore includes each cluster's RESERVED box; ours is the drawn ink. On
temuxi graphviz's `cluster0` bb is 397 tall where the frontier-corrected frame
we draw is 316, and `dot -Tplain` puts the whole graph at 413 against our
engine's reported 302. Its own task.

### Recorded, not fixed

`<<entrypoint>>`/`<<exitpoint>>` now draw jar's circle, which is a shape change
this task made because it lives in the same missing dispatch. `EXPANSION_INPUT`
/`EXPANSION_OUTPUT` keep the plain square: upstream draws a four-cell bar of a
different size (`EntityPosition.java:100-115,120-128`) and no corpus fixture
exercises them, so the shape stays unverified rather than guessed.

## T8 — temuxi's last 50px (follow-on, authorized after T7)

### Mechanism

`Cluster#drawU` calls `manageEntryExitPoint` on EVERY invocation, and that
method REASSIGNS `this.rectangleArea` from a `FrontierCalculator` seeded with
`in.getRectangleArea()` of each child cluster (`Cluster.java:344-345,410-436`,
specifically `:419-423`). `drawU` runs at least twice — once through
`TextBlockUtils.getMinMax` (`TextBlockUtils.java:138-142`, which simply calls
`drawU` on a `LimitFinder`) inside `SvekResult#calculateDimension`
(`SvekResult.java:130-136`), then again for the real render — and
`SvekResult#drawU` walks `allCluster()` in creation order, parents first.

So the INK pass frontiers a parent against its children's RAW graphviz boxes,
and the DRAW pass against their already-corrected ones. With raw children the
union of `insides` reaches above every border point, no point sits on that
edge, and the frontier's touch rule (`state-composite-frontier.ts` step 3)
resets the boundary to the cluster's own raw box.

### Origin and causal chain

`src/diagrams/state/state-composite-geo.ts#materializeCluster` ran the frontier
exactly once, bottom-up, and handed the single resulting box to both the
renderer and `layout-ink-extent.ts`. On `temuxi-28-cega322` the module's raw
box is 81px taller at the top than the frame it draws; jar's ink minimum lands
at `rawTop - 1`; our canvas was 368 where jar's is 418.

### Ruled out

- **The earlier "jar's canvas is graphviz's graph bbox" guess — WRONG, and the
  reason for reading the Java first.** `calculateDimension` is a `LimitFinder`
  walk over `drawU`; it never sees graphviz's bb.
- **Missing or extra elements.** Element inventories are identical (75 each);
  only `<g>` nesting differs.
- **A drawing-position defect.** Before this fix every one of temuxi's 75
  shapes was exactly +50 from jar's — a rigid translation, so the drawing was
  already right and only the canvas was short.
- **A universal constant.** 119 state fixtures have a document-size gap, most
  with no border point at all; the border-point ones split cleanly into a
  ~2px group (the recorded text-ink band) and a 48/50 group, which is what
  pointed at a nesting-dependent mechanism rather than a fixed offset.

### Result

temuxi: 418x1109, exactly jar's. Corpus, by total positional error: one
fixture changes, to ZERO; none regress. Census: one falls, none rise;
class/object byte-identical.

### Two residuals this exposed

- **1px composite-title baseline.** Four of temuxi's 75 shapes remain off:
  the composite titles, ours at y=102.889 against jar's 103.889, same x. The
  comparator cannot see them — `svg/g[1]`'s `childCount` (31 vs 40) stops the
  recursion first, which is also why temuxi now reports 1 diff and 0
  positional error while this is still open.
- **`jucori-40-cevo136`'s 48px is NOT this mechanism.** Its composites hold
  only leaves, so both passes agree; its frames are each 12px shorter than
  jar's — a pin-span layout gap, closer in kind to what T6 fixed. Its own task.

## T9 — jucori's 12px pin span (follow-on, authorized after T8)

### Mechanism

A fifth instance of this mission's central failure mode: the emitter and the
layout builder disagreed about one node.

`SvekNode#appendLabelHtmlSpecialForPort` emits an entry/exit point whose own
display text is wider than 40px as a `shape=plaintext` HTML port table, and
graphviz sizes the NODE from that table plus its `PAD`ded 54x36 minimum. Our
emitter wrote that table faithfully; `graph-layout-build.ts#addOneNode` handed
the ENGINE a fixed 12x12 box, because `layoutShape` maps `plaintext` to `box`
and nothing carried the table across. Every rank beside such a port therefore
sat `(36 - 12) / 2 = 12`px too close.

### Origin, and the second half nobody would have guessed

`src/core/graph-layout-build.ts#addOneNode` — it had a branch for the OTHER
port table (`portRows`, `addRowPortNode`) and none for this one.

Handing the engine the table fixes the spacing and breaks the drawing: the
node becomes 54x36 where the symbol is 12x12. Jar reconciles that when it
reads the layout back — `DotStringFactory#solve:382-389` takes a
`RECTANGLE_PORT`/`RECTANGLE_HTML_FOR_PORTS` node's position from the
`points="…"` polygon beside its `<title>` in graphviz's own SVG, which is the
PORT CELL's polygon rather than the outer table's, and graphviz centres that
cell in the padded table.

That second half went to the LAYOUT SEAM (`graph-layout.ts#mapNodes`, which
already centres on the engine's centre) rather than into the state engine.
The first attempt put it in `state-composite-geo.ts`, and the census caught it
immediately: two COMPONENT fixtures rose, because that engine was then drawing
the raw 54x36 table as its port rect. `solve` is diagram-type-agnostic and so
is this.

### Ruled out

- **The DOT.** Our emitted DOT is byte-equivalent to jar's for this fixture,
  and real graphviz 15.1.1 lays out both to identical `-Tplain` coordinates.
- **The frontier.** It reports the span of the pin centres faithfully; the pin
  centres themselves were 12px apart from jar's.
- **T6's cluster-label inheritance and T8's ink pass.** jucori's composites
  hold only leaves, so neither mechanism can fire — which is why its 48px
  looked like temuxi's 50 but was not.

### Result

`jucori-40-cevo136`: every rect and ellipse matches jar to the digit; total
positional error 96 -> 0. `fukexa-85-cuvi894` and `vujuru-50-toku619` also
reach zero, `dobexo-69-zeki749` goes 448 -> 4. Census: 7 fixtures fall
(3 state, 3 component, 1 more state), NONE rise; class/object byte-identical.

## T10 — the 1px composite title baseline (follow-on, authorized after T9)

### Mechanism

Two upstream paths set a cluster's title position, and this port used the
plain one for both families.

A plain composite gets it from graphviz's own cluster label, which
`DotStringFactory` hands to `Cluster#setTitlePosition` — empirically
`y + 4 + textAscent`, and that 4 is jar-verified on `decede-10-buvu414`'s `E`,
`bajelo-54-dixe684`'s `Track_FSM.Run` and a 98-sample corpus probe.

A composite whose title moved onto its `${id}ee` subgraph never gets a
graphviz cluster label to read, so `Cluster#manageEntryExitPoint` computes the
position itself: `xyTitle.y = rectangleArea.getMinY() + IEntityImage.MARGIN`
(`Cluster.java:435`; `IEntityImage.java:45` defines MARGIN as 5), and
`drawUState` draws the title block's TOP at that y (`:496-498`). Baseline
therefore `frameTop + 5 + textAscent(14)` = `frameTop + 15.889`, against the
plain family's 14.889.

### Origin

`src/diagrams/state/state-composite-cluster.ts` applied
`CLUSTER_TITLE_BASELINE_MARGIN` (4) to every title-table-eligible composite.
G7 T14b measured this exact split and left it on purpose — its own comment
says the WithLabel family's "=5 correction is OUT of the confirmed ten-item
edit list (render-position-only, doesn't affect box width/height)". This is
that correction, and the constant is jar's `IEntityImage.MARGIN` rather than a
fitted value.

### Measurement — both gates are blind here

The census and the total-positional-error metric BOTH report zero change: on
these fixtures `compareSvg` stops at `svg/g[1]`'s `childCount` and never
descends to the titles. Gated instead on a direct count of drawn primitives
sitting exactly where jar's do, over all 271 cached state fixtures:

- 17 fixtures gain exactly-placed shapes, **none lose any**
- corpus 3516 -> 3539 of 6007
- `temuxi-28-cega322` 71/75 -> **75/75** — every rect, ellipse, text, line and
  path in that fixture is now within 0.02px of jar's

That harness is worth keeping in mind: two of this mission's last three fixes
were invisible to both standing gates, and only a shape-level comparison saw
them.
