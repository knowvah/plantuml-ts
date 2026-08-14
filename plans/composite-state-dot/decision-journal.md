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
