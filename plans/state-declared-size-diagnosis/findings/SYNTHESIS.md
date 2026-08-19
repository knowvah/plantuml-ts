# SYNTHESIS — the state declared-size tail re-partitioned by true mechanism

T14, 2026-08-18. Consumes T0–T13's 100 records over 94 fixtures and
re-partitions them by CAUSE, not by T0's first-match bucket label (ADR-3).
Schema gate at close-out: **`94 records, 0 violations`**. Harness re-run at
close-out is **byte-identical** to the T0 baseline (`cmp` silent).

## 0. Headline

| | resolved | unresolved | divergence-proposed | total |
|---|---|---|---|---|
| **records** | 81 | 15 | 4 | **100** |
| **fixtures** | 75 (+1 partial) | 14 | 4 | **94** |

`fovafu-44-mifu394` is the one partial: `#a` resolved (G10), `#b` unresolved
(G19). 172 of the 173 harness rows on the 90 mismatched fixtures are carried
by a record; the 4 unmatched fixtures carry 0 rows by construction (no jar
DOT exists — see G24). **One row is missing from a record** — see §7.3.

**24 true-cause groups.** Every fixture sits in exactly one group per record;
three fixtures (`fibudu-53`, `xeziki-47`, `fovafu-44`) span two groups via
their `#a`/`#b` split, which is what the split is for.

## 1. The groups

Max |Δpx| is the largest single row in the group — the fix-ordering key.

| G | mechanism (one line) | origin | recs | fx | rows | max Δpx | status |
|---|---|---|---|---|---|---|---|
| G1 | state text measured raw — never through `Display.create8` (creole, wrapWidth, tab stops) | `state-sizing.ts` | 16 | 16 | 23 | 445.200 | resolved |
| G2 | note bodies measured raw — `measureNote` has no creole/table model | `state-note-layout.ts:84-93` | 2 | 2 | 5 | 158.281 | resolved |
| G3 | trailing-backslash physical-line continuation unported | `ReadLineReader.ts:45-59` | 3 | 3 | 5 | 28.000 | resolved |
| G4 | `clusterPosMap: undefined` → `materializeCluster` boundingBox fallback | `state-composite-geo.ts:380` | 9 | 9 | 23 | 300.000 | 7 res / 2 unres |
| G5 | `RoundedSouth` south-cap ink absent from the composite ink dispatch | `layout-ink-extent.ts:305-321` | 4 | 4 | 8 | 1.000 | resolved |
| G6 | self-loop arrowhead ink excluded from the composite childImg | `layout-ink-extent.ts:522` | 3 | 3 | 3 | 1.340 | resolved |
| G7 | `EntityPosition.getDimension(Rankdir)` swap unported for EXPANSION_* | `state-leaf-node.ts:44` | 4 | 4 | 13 | 36.000 | resolved |
| G8 | `<<O-O>>` symbol reservation (+10 px both axes) missing | `state-sizing.ts:206-214` | 5 | 5 | 13 | 10.000 | resolved |
| G9 | `hide empty description` not threaded to the composite-pipeline leaf | `state-leaf-node.ts:65` | 1 | 1 | 1 | 10.000 | resolved |
| G10 | dotted-id declaration overwrites the per-segment display | `state-parse-resolve.ts:379` | 2 | 2 | 4 | 5.788 | resolved |
| G11 | `--` vs `\|\|` concurrent-separator orientation never recorded | `state-composite-sizing.ts:121-128` | 1 | 1 | 2 | 66.000 | resolved |
| G12 | `note on link` text never reaches `transitionLabelText` | `state-dot-graph.ts:114-120` | 1 | 1 | 2 | 12.785 | resolved |
| G13 | transition-label ink-box POSITION residual (label size is right) | `layout-ink-extent.ts:386-392` | 3 | 3 | 6 | 3.836 | 1 res / 2 unres |
| G14 | engine X/Y never echo-corrected (size is, position is not) | `graph-layout.ts:189-194` | 30 | 27 | 40 | 0.005 | resolved |
| G15 | cluster-drawn composite child: missing ClusterHeader/DotString ink term | `layout-ink-extent.ts:305-321` | 3 | 3 | 6 | 41.000 | **unresolved** |
| G16 | `tightContentDimension`'s plain `x+width` walk misses 1 px of ink | `state-composite-cluster.ts:197-210` | 1 | 1 | 1 | 1.000 | **unresolved** |
| G17 | note-only concurrent region stacking | `state-composite-concurrent.ts` | 1 | 1 | 6 | 9.000 | **unresolved** |
| G18 | 1 px shortfall on a bare single-node autonom wrapper | `state-composite-sizing.ts:64-90` | 1 | 1 | 2 | 1.000 | **unresolved** |
| G19 | nested-cluster wrapper margin (`measureAutonomWrapper` delta) | `state-composite-sizing.ts:77-87` | 1 | 1 | 2 | 10.594 | **unresolved** |
| G20 | composite ink box under `linetype polyline`/`ortho` (engine routing) | `state-composite-pass.ts:250` / `state-dot-graph.ts:238` | 2 | 2 | 2 | 2.460 | **unresolved** |
| G21 | our DOT is byte-identical to jar's; the geometry still differs | `state-composite-sizing.ts:121-128` (not the site) | 1 | 1 | 2 | 3.733 | **unresolved** |
| G22 | residual survives every ink-extent hypothesis | n/a | 1 | 1 | 1 | 2.033 | **unresolved** |
| G23 | creole TABLE in a composite's own description measured raw | `state-composite-sizing.ts:73-74` | 1 | 1 | 2 | 39.375 | resolved |
| G24 | jar ERROR renders — two parse guards absent (concurrent-state guard ×3, dotted-phantom gate ×1) | `state-parse-resolve.ts` | 4 | 4 | 0 | — | divergence-proposed |
| | | **totals** | **100** | **94** | **172** | | |

### G1 — state text is measured raw, never through `Display.create8`

- **mechanism.** Jar sizes every piece of a state's text through
  `Display.create8(..., CreoleMode.FULL, wrapWidth)`. This port measures the
  raw source string with `measurer.measure`, so creole markup is counted as
  literal glyphs, `wrapWidth` is never applied, and tab stops never snap.
  One architectural gap; four symptoms.
- **originFileLine.** `src/diagrams/state/state-sizing.ts` — four call sites of
  one primitive: `:176-186`/`:182` (`measureLines`, display name), `:199`
  (`measureEmptyDescription`), `:207` (`measureNormalState` name), `:209-210`
  (`bodyLines`/`fields`).
- **javaRef.** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86,98-99`;
  `.../EntityImageStateCommon.java:80-81`; tab stop
  `.../klimt/creole/atom/AtomText.java:183-260`.
- **fixtures (bucketLabel).** attribute-line: `corumi-91-mizo869`,
  `gupeto-19-mesa256`, `juvagu-33-dupa212`, `kubona-45-boso556`,
  `lokija-02-dipe348`, `fibudu-53-bode309#b` · creole-sprite-escape:
  `papifi-44-caxo706`, `rovado-96-boda672`, `xasoka-58-temi462` ·
  skinparam-style: `feziva-71-gufo538`, `mujipe-99-fume794`,
  `nixoja-06-guxe431`, `jafazu-60-leca675`, `rejike-58-rote606` ·
  pseudo-state: `mefici-97-tudu030` · note: `xeziki-47-zomo866#b`.
- **sub-groups.** 1a markup strip/render (`<math>`, `<sup>`, `<color>`,
  `<font>`, `**`, `[[url]]`, `[[alias]]`) — 12 fixtures; 1b `wrapWidth`
  threading — `kubona-45`, `jafazu-60`, `rejike-58`; 1c tab-stop snap —
  `juvagu-33`, `lokija-02` (an increment on 1a, not a separate write-set).
- **proposedWriteSet.** `src/diagrams/state/state-sizing.ts` + its renderer
  counterpart, reusing the existing `src/core/klimt/creole/*` /
  `leaf-sizing-text.ts#creoleVisibleText` machinery (reuse, not build).
- **sizeEstimate.** Moderate–large: ~4-6 files, sizer and renderer in
  lockstep, full-corpus re-verification. The single highest-value group in
  the mission (445.200 / 373.363 / 137.112 / 121.538 / 117.750 / 111.663 px).
- **confidence.** high (16/16 records `high`).
- **pairingRisk.** `possible` on `xeziki-47` only (idx0/idx1 tie at
  0.694444); the rest `none`.

### G2 — note bodies are measured raw

- **mechanism.** `measureNote` is a text-only model: each raw source line is
  one literal string, including pipe-table syntax and `<color:…>` markup.
- **originFileLine.** `src/diagrams/state/state-note-layout.ts:84-93`.
- **javaRef.** `.../svek/image/EntityImageNote.java:114-118` (`BodyFactory.create3`).
- **fixtures.** note: `fatupo-62-bemu777`, `xeziki-47-zomo866#a`.
- **proposedWriteSet.** `state-note-layout.ts` + `state-composite-edge-label.ts`
  (a byte-identical duplicate of the note body sizing — must move in lockstep).
- **sizeEstimate.** 2-3 files. Same creole primitive as G1, different owner
  function — kept separate because the write-sets are disjoint and can run in
  parallel.
- **confidence.** high. **pairingRisk.** `possible` (both fixtures tie).

### G3 — trailing-backslash line continuation unported

- **mechanism.** A source line ending in a bare `\` merges with the NEXT
  physical line before command dispatch. No pass in this port does it, so the
  continuation lines never join their `State : text` statement.
- **originFileLine.** `src/core/tim/ReadLineReader.ts:45-59` (where the filter
  would sit); the visible failure is `state-commands.ts:258-267` (rule 15).
- **javaRef.** `.../preproc2/ReadFilterMergeLines.java:57-81,69`.
- **fixtures.** composite: `duzazu-41-telu529`, `vixobo-14-jole910` ·
  attribute-line: `fibudu-53-bode309#a`.
- **proposedWriteSet.** `src/core/tim/ReadLineReader.ts` (or a new
  `ReadLineMergeFilter.ts`) wired into `src/core/BlockUmlBuilder.ts:101`.
- **sizeEstimate.** 1-2 files, **pipeline-wide blast radius** — this is a
  preprocessor feature affecting every `@start*` block, not state-only.
  Verification is a full-corpus manifest diff.
- **confidence.** high. **pairingRisk.** none.

### G4 — `clusterPosMap: undefined` at both ink-materialize call sites

- **mechanism.** `materializeCluster` falls back to `boundingBox(children)`
  when no `clusterPosMap` is supplied, dropping the real graphviz cluster box
  (title band + margin). Two call sites pass `undefined`.
- **originFileLine.** fallback `src/diagrams/state/state-composite-geo.ts:380`
  (within `materializeCluster`, `:352-385`); call sites
  `state-composite-autonom.ts:195` and `state-composite-concurrent.ts:129`.
- **javaRef.** `.../svek/Cluster.java:410-436`;
  `.../svek/ConcurrentStates.java:133-141`; `.../svek/InnerStateAutonom.java:186-210`.
- **ONE group, not two.** The two call sites are two instances of the same
  omitted argument reaching the same fallback line; `giniti-22-fexo000`
  requires the fix at BOTH sites, and the three files are one write-set — a
  fix mission cannot batch them separately.
- **fixtures.** composite: `bajelo-54-dixe684`, `cupesu-59-sajo991`,
  `lojeju-04-fadu517`, `nuvura-69-mafe604`, `fotuje-06-fifa085` (unresolved) ·
  concurrent-region: `giniti-22-fexo000`, `darime-88-moda428`,
  `lumamo-63-zupa263`, `jetuse-93-gopi146` (height only).
- **proposedWriteSet.** `state-composite-geo.ts`, `state-composite-autonom.ts`,
  `state-composite-concurrent.ts`.
- **sizeEstimate.** 3 files, two one-argument call-site changes plus the
  fallback; medium verification (re-run composite + concurrent slices).
- **confidence.** high on the 7 closed (bit-exact monkeypatch closure);
  `jetuse-93` height high / width residual (5 px) open; `fotuje-06`
  structurally confirmed, numerically open. **pairingRisk.** none.

### G5 — `RoundedSouth` south-cap ink absent

- **mechanism.** `addNodeInk`'s composite dispatch models a composite's outer
  box as the plain `-1`-inset rounded rect; jar also draws the `RoundedSouth`
  south cap uninset, reaching 1 px lower.
- **originFileLine.** `src/diagrams/state/layout-ink-extent.ts:305-321`.
- **javaRef.** `.../svek/image/RoundedContainer.java:89-92`;
  `.../klimt/shape/RoundedSouth.java:65-83`; `.../ugraphic/LimitFinder.java:159-162`.
- **fixtures.** composite: `pacami-67-dafe414`, `tofezi-64-koda860`,
  `xojudi-20-keco020`, `decede-10-buvu414`. Closed exactly (115 = 99+1+15).
- **proposedWriteSet.** `layout-ink-extent.ts`.
- **sizeEstimate.** 1 file, one conditional ink point gated on `rounded>0`;
  blast radius is every composite that appears in a parent's ink walk.
- **confidence.** high. **pairingRisk.** none.

### G6 — self-loop arrowhead ink excluded

- **mechanism.** `computeSvekResultGeometry` is called with
  `includeArrowheadInk: false`, so a self-loop's arrowhead never widens the
  composite childImg. Union with the arrowhead gives 85.338 vs jar's 85.34.
- **originFileLine.** `src/diagrams/state/layout-ink-extent.ts:522`.
- **javaRef.** `.../svek/SvekResult.java:130-135`.
- **fixtures.** composite: `pebepi-32-cati486`, `taxile-56-goca422`,
  `tigibi-80-zidi137` (three different styling mechanisms — styling ruled out
  three independent ways).
- **proposedWriteSet.** `layout-ink-extent.ts:522`.
- **sizeEstimate.** medium — `includeArrowheadInk` is shared machinery; every
  composite containing a transition moves.
- **confidence.** high. **pairingRisk.** none (1 node per scope).

### G7 — `EntityPosition.getDimension(Rankdir)` unported for EXPANSION_*

- **mechanism.** `buildLeafNode` sizes every non-port border point as a fixed
  12×12 `BORDER_POINT_SIZE`; jar gives `EXPANSION_INPUT`/`EXPANSION_OUTPUT` a
  rankdir-swapped 12×48 / 48×12 box.
- **originFileLine.** `src/diagrams/state/state-leaf-node.ts:44`.
- **javaRef.** `.../abel/EntityPosition.java:120-128`.
- **fixtures.** pseudo-state: `bujuta-44-rovo666`, `mimaga-15-doze740`,
  `nijugi-19-jazi166`, `rinisi-79-peko570`.
- **proposedWriteSet.** `state-leaf-node.ts` (thread `ctx.rankdir` into the
  `!usesPortShape(pos)` branch).
- **sizeEstimate.** 2 files, ~15-line diff.
- **confidence.** high. **pairingRisk.** `possible` on bujuta/mimaga/rinisi
  (3-way tie at 0.166667/0.666667); `nijugi-19` is the tie-free instance and
  pins the mechanism 1:1.

### G8 — `<<O-O>>` symbol reservation missing

- **mechanism.** `Stereotype.isWithOOSymbol()` adds `2*smallRadius +
  smallMarginY` = 10 px to both axes. `measureNormalState` has no such term.
  Where the missing 10 px would cross `MIN_WIDTH`/`MIN_HEIGHT` (50), the clamp
  turns the flat −10 into −2.575 / −8.
- **originFileLine.** `src/diagrams/state/state-sizing.ts:206-214`.
- **javaRef.** `.../svek/image/EntityImageState.java:71,74,85,104-113`.
- **fixtures.** stereotype: `dogeji-46-sapo750`, `mosigo-88-rove013`,
  `rijoki-89-teno556`, `viguto-81-gana093` · pseudo-state: `resido-15-reza040`
  (independently diagnosed by T4 to the same `javaRef`).
- **proposedWriteSet.** `state-sizing.ts` (shared file with G1 — batched
  together).
- **sizeEstimate.** 1 file, ~6-line diff (one const pair + one branch).
- **confidence.** high. **pairingRisk.** none per METRIC-AUDIT (dogeji's own
  record self-labels `likely`; see §7.2).

### G9 — `hide empty description` not threaded to the composite leaf

- **mechanism.** The flag reaches a leaf's DOT size only on the flat top-level
  pipeline; `buildLeafNode` hardcodes `hideEmptyDescription=false`.
- **originFileLine.** `src/diagrams/state/state-leaf-node.ts:65`.
- **javaRef.** `.../svek/GeneralImageBuilder.java:135-136`.
- **fixtures.** pseudo-state: `bitaxo-18-tamo974`.
- **proposedWriteSet.** `state-leaf-node.ts`, `state-composite-pass.ts`.
- **sizeEstimate.** 2 files, ~4-line diff; regression-verify against
  `bilare-19-fufe539` (already-passing flat case).
- **confidence.** high. **pairingRisk.** `possible` (our two leaf heights tie
  at 50 px).

### G10 — dotted-id declaration overwrites the per-segment display

- **mechanism.** `state B.A.X` with no `as` alias defaults the throwaway
  declaration's `display` to the full dotted id, which `applyDeclaredContent`
  then writes unconditionally over the correctly-split leaf's own `"X"`.
- **originFileLine.** `src/diagrams/state/state-parse-resolve.ts:379`.
- **javaRef.** `.../statediagram/command/CommandCreateState.java:181-183`.
- **fixtures.** other: `fovafu-44-mifu394#a`, `tubojo-49-tudu915`.
- **proposedWriteSet.** `state-parse-resolve.ts`, `state-parse-helpers.ts`
  (thread an explicit-vs-defaulted flag).
- **sizeEstimate.** 2 files, small diff; blast radius = every dotted composite
  leaf declared without an alias.
- **confidence.** high. **pairingRisk.** none.

### G11 — `--` vs `||` concurrent separator orientation never recorded

- **mechanism.** Upstream's `Separator.fromChar` makes `--` stack regions
  vertically and `||` horizontally. This port records neither and always
  stacks vertically (`width=max`, `height=sum`).
- **originFileLine.** `src/diagrams/state/state-composite-sizing.ts:121-128`.
- **javaRef.** `.../svek/ConcurrentStates.java:63-89`.
- **fixtures.** concurrent-region: `fimivu-15-vogi904`.
- **proposedWriteSet.** `ast.ts`, `state-commands.ts`,
  `state-composite-sizing.ts`, `state-composite-concurrent.ts`.
- **sizeEstimate.** 5 files, a real feature gap (horizontal `||` stacking is
  entirely unimplemented). Grep the corpus for other `||` users before
  scoping.
- **confidence.** high. **pairingRisk.** `possible` — `A` and `D` are
  identically sized in our port, so the sorted pairing at scope 5 is
  arbitrary; the mechanism is source-evidenced, not row-evidenced.

### G12 — `note on link` text never reaches `transitionLabelText`

- **mechanism.** `transitionLabelText` reads only `t.label`/`t.guard`/
  `t.action`; with no `t.linkNote` branch, `attachTransitionLabel` returns
  `undefined`, `addTransitionInk` folds nothing, and the note is not drawn.
  Back-solves the whole row (12.785 px).
- **originFileLine.** `src/diagrams/state/state-dot-graph.ts:114-120`.
- **javaRef.** `.../svek/SvekEdge.java:741-747`.
- **fixtures.** note: `tumaba-64-tosu281`.
- **proposedWriteSet.** `state-dot-graph.ts`, `state-transition-label.ts`.
- **sizeEstimate.** 2-3 files, medium — a missing feature (note-on-link is
  neither sized nor drawn).
- **confidence.** high. **pairingRisk.** none.

### G13 — transition-label ink-box POSITION residual

- **mechanism.** The label's own measured size is jar-faithful since
  `transition-label-ink` T3; what remains is the label BOX's computed
  position feeding the composite's ink walk.
- **originFileLine.** `src/diagrams/state/layout-ink-extent.ts:386-392`.
- **javaRef.** `.../klimt/shape/TextBlockMarged.java:79-87`.
- **fixtures.** composite: `nimana-36-veco708` (resolved by adoption) · other:
  `bunade-42-fudu910`, `nimise-04-jove070` (unresolved).
- **The RE-PIN group is THREE, not six** — see §3.1.
- **proposedWriteSet.** `layout-ink-extent.ts`, `state-composite-edge-label.ts`.
- **sizeEstimate.** low blast radius per fixture (Δ ≤ 3.836 px), but the
  origin formula is not yet isolated — diagnose before fixing.
- **confidence.** medium. **pairingRisk.** none.

### G14 — engine X/Y never echo-corrected

- **mechanism.** `mapNodes` echoes a node's WIDTH/HEIGHT back to the exact
  pre-quantization value within `ROUND_TRIP_EPSILON`, by design. X/Y is never
  echoed, so each child carries a ≤0.000072 px-per-node quantization residual
  into the parent's ink walk. Confirmed against the raw double
  (`199.99996799999999553`, not display rounding). The width-table hypothesis
  was instrumented and REFUTED; clusters A and B are one mechanism.
- **originFileLine.** `src/core/graph-layout.ts:189-194`.
- **javaRef.** `.../svek/SvekResult.java:130-136`.
- **fixtures.** precision (27, ADR-7), 30 records, 40 rows, all |Δ| ≤ 0.005 px.
- **proposedWriteSet.** `src/core/graph-layout.ts` (`mapNodes` echo scope).
- **sizeEstimate.** 1 file at a shared chokepoint, but the blast radius is
  **every graph diagram type** (class/component/state/usecase/dot/json) and
  position changes also move spline routing.
- **RECOMMENDATION: the fix mission should NOT take G14.** The whole group is
  under 0.005 px — below the harness's own `lastDigit` band and far below any
  visible threshold — while the change sits at the one seam every diagram
  type crosses. The risk/benefit is inverted. Record it as a known, fully
  diagnosed, deliberately unscheduled residual.
- **confidence.** high. **pairingRisk.** `possible` on 5 (exact ties only).

### G15 — cluster-drawn composite child ink (UNRESOLVED)

- **mechanism (narrowed).** When a composite's child is emitted as a real
  graphviz `subgraph cluster*` with its own reserved title band, our ink walk
  models it with `addStateBoxInk`'s plain `-1`/`+0`-inset rect. The
  "missing cluster-margin path" hypothesis was REFUTED (`materializeCluster`
  already uses the real cluster box) — the remaining candidate is a
  `ClusterHeader`/`ClusterDotString` draw term neither side has read yet.
- **originFileLine (candidate).** `src/diagrams/state/layout-ink-extent.ts:305-321`.
- **javaRef.** `.../svek/SvekResult.java:130-135`; `ClusterHeader.java` /
  `ClusterDotString.java` (**the unread files — this is the next step**).
- **fixtures.** composite: `rovese-43-tadu368`, `zoriza-41-rege543`,
  `zizemo-86-gisa766`. Cross-linked by the 8.6 px pair (§3).
- **nextStep.** Open `ClusterHeader.java`/`ClusterDotString.java` and find
  whether a cluster's title bar or border draws beyond the plain inset rect;
  then fix the probe's label wiring for rovese/zoriza and use zizemo (no
  label) to isolate the label-free component.
- **sizeEstimate.** medium-large — likely a new ink code path.

### G16 — `tightContentDimension` 1 px (UNRESOLVED)

- **mechanism (narrowed).** A plain `n.x + n.width` walk with no shape-aware
  ink rule; the `clusterPosMap` mechanism is DEFINITIVELY ruled out here (zero
  intercepted calls under monkeypatch).
- **originFileLine.** `src/diagrams/state/state-composite-cluster.ts:197-210`.
- **javaRef.** `.../svek/SvekResult.java:126-136`.
- **fixtures.** concurrent-region: `jijuze-43-ceva131`.
- **nextStep.** `tightContentDimension` is called from within its own module,
  so it cannot be monkeypatched externally — the next instrument is gated
  in-source tracing (or extracting the function) to print its walk.

### G17 — note-only concurrent region stacking (UNRESOLVED)

- **mechanism (narrowed).** A concurrent region containing only a note is
  stacked wrong; `clusterPosMap` ruled out (`realCpm.size=0` everywhere), and
  the earlier `fatupo-62` link is RETRACTED (confirmed non-match).
- **originFileLine.** `src/diagrams/state/state-composite-concurrent.ts`
  (`stackConcurrentRegions`/`combineConcurrentPasses`).
- **javaRef.** `.../svek/ConcurrentStates.java:133-141`.
- **fixtures.** concurrent-region: `joleju-94-maru748` (6 rows, −3/−9 px).
- **nextStep.** Recreate the already-oracle-rendered minimal repro under
  `scripts_scratch/` and monkeypatch `computeSvekResultGeometry` (cross-module,
  confirmed patchable) to isolate the note-only region's ink.

### G18 — bare single-node autonom wrapper, 1 px (UNRESOLVED)

- **mechanism.** NOT a stereotype effect (`<<statechart>>` etc. are plain
  display text baked into the name). A 1 px shortfall in the reconstructed
  wrapper for a pass whose every scope has exactly one node.
- **originFileLine (candidate).** `src/diagrams/state/state-composite-sizing.ts:64-90`.
- **javaRef.** `.../svek/InnerStateAutonom.java:186-197`.
- **fixtures.** stereotype: `gokife-89-boja382`.
- **nextStep.** Instrument `@knowvah/dot-engine`'s layout of a synthetic
  single-bare-node graph and compare its bounding box against the
  `.delta(15,15)`-only prediction — isolates engine vs our arithmetic.
- **Not G5.** See §3.2.

### G19 — nested-cluster wrapper margin (UNRESOLVED)

- **mechanism (narrowed with worked arithmetic, 4.594 + 6 = 10.594).**
  `measureAutonomWrapper`'s `nameHeight`/`delta` formula for a composite that
  wraps an already-sized composite cluster as its sole child.
- **originFileLine (candidate).** `src/diagrams/state/state-composite-sizing.ts:77-87`.
- **javaRef.** `.../svek/InnerStateAutonom.java:186-197`.
- **fixtures.** other: `fovafu-44-mifu394#b`.
- **nextStep.** Probe `childImg`/`wrapper` intermediates for `B`'s pass and
  compare against `calculateDimensionSlow` fed with `A`'s own `SvekResult`.

### G20 — composite ink box under `linetype polyline` / `ortho` (UNRESOLVED)

- **mechanism.** The inner pass's routed spline (polyline) or xlabel anchor
  (ortho) feeds the composite's ink box; the candidate root is
  `@knowvah/dot-engine`'s routing / xlabel placement, external to this repo.
- **originFileLine.** `state-composite-pass.ts:250` (kejabo, `label=` path) /
  `state-dot-graph.ts:238` (pavuzo, `moveLabelToXlabel` fork).
- **javaRef.** `.../svek/SvekEdge.java:433-437`.
- **fixtures.** skinparam-style: `kejabo-83-vinu490`, `pavuzo-79-zodu430`.
- **nextStep.** Extract each inner scope's DOT fragment and diff dot-engine
  against real graphviz on the identical fragment. **If confirmed external,
  the deliverable is a `docs/graphviz-issues/*.md` + `TRACKER.md` line, not a
  `src/` change** (repo CLAUDE.md). Related family, two mechanisms — not one.

### G21 — identical DOT, different geometry (UNRESOLVED)

- **mechanism.** Our emitted Svek DOT for the region is **byte-identical** to
  jar's cached `svek-*.dot`, and `stackConcurrentRegions` is confirmed correct
  — so the divergence is downstream of the DOT, i.e. in the layout engine.
- **fixtures.** concurrent-region: `zacajo-09-tamu628`.
- **nextStep.** As recorded: establish the engine/version provenance of the
  cached jar DOT vs our engine. **Correction to the record's framing:** this
  port never shells out to graphviz — every graph type routes through
  `@knowvah/dot-engine` (`src/core/graph-layout.ts:15`,
  `src/diagrams/state/layout.ts:27`). So the comparison is dot-engine vs the
  graphviz that produced the pinned oracle, which is precisely a
  `docs/graphviz-issues/` filing, not a version bump on our side.

### G22 — residual survives every ink-extent hypothesis (UNRESOLVED)

- **mechanism.** UNRESOLVED. 2.033 px short on every ink-extent-level
  hypothesis tried; the T2 self-loop mechanism was checked and rejected.
- **fixtures.** composite: `dapunu-39-kava045`.
- **nextStep.** Diff jar's own `svek-3.dot` node line for `Main_Connected`
  against the DOT INPUT (not the ink-extent output) this port emits — the
  cause may sit upstream of the ink pass entirely.

### G23 — creole TABLE in a composite's own description

- **mechanism.** `|= h |= h |` table syntax measured as literal text by
  `measureAutonomWrapper`'s `attr` term; jar lays out a real bordered table.
  Same architectural root as G1/G2 at a third function.
- **originFileLine.** `src/diagrams/state/state-composite-sizing.ts:73-74`.
- **javaRef.** `.../abel/Entity.java:610-631` (`getStateDescription`).
- **fixtures.** composite: `kinuca-03-nice683`.
- **proposedWriteSet.** `state-composite-sizing.ts` + `state-sizing.ts`.
- **sizeEstimate.** non-trivial (a missing feature), but it rides the same
  creole primitive as G1 — batch them together.
- **confidence.** high. **pairingRisk.** none.

### G24 — jar ERROR renders (divergence-proposed, ADR-6)

All four "unmatched" fixtures have **zero cached `svek-N.dot`** because the
jar itself errored on the source — there is no oracle geometry to pair
against, at any index. **Two** distinct mechanisms (corrected at close-out;
the orchestrator re-verified both non-guard records against the jar and the
port and found the T12 readings wrong — see `findings/unmatched.md`, the
"Corrected at close-out" paragraphs, and the decision journal):

| fixture | mechanism | our site | javaRef |
|---|---|---|---|
| `cagego-53-vemo516`, `xacona-99-peze211`, **`zecivu-62-pagu681`** | `StateDiagram#checkConcurrentStateOk` guard absent — a state whose real parent differs from the current concurrent-region group is accepted here, rejected there. zecivu: line 1 creates root `XA13`, `state XA13` inside XA6's `--` region trips the guard; the jar's "assumed sequence" banner is `PSystemErrorUtils#mergeV2` showing the highest-scoring factory error, NOT dispatch order (jar tries every factory; the same source without `--` renders as state) | `state-parse-resolve.ts:358-363` | `StateDiagram.java:70-90`, `PSystemBuilder.java:258-282`, `PSystemErrorUtils.java:140-147` |
| `fugedo-34-fice721` | jar's `quarkInContextSafe` walks a non-root first segment from the CURRENT group and `Quark#child` manufactures a phantom `ChildMode2 > ChildMode1 > A`; then `getEntity`'s `parent.getData()==null` gate errors. **We build the identical phantom** (`resolveOrCreateDottedPath` walks from the current scope too) but lack the gate, so we DRAW it — the SVG contains `ChildMode1`/`A` twice. Not a successful resolution; a walking error | `state-parse-resolve.ts:153` (walk) + `ensureState`/`CommandLinkStateCommon.java:277-278` gate missing | `net/atmp/CucaDiagram.java:250-288`, `Quark.java:116-132`, `CommandLinkStateCommon.java:277-278` |

**Maintainer rulings (2026-08-18):**
1. `checkConcurrentStateOk` — **RULED: port the guard** (we error as the jar
   does). Covers cagego, xacona and zecivu; one write-set
   (`state-parse-resolve.ts#ensureState`). Goes into the fix mission.
2. fugedo dotted phantom — **RULED: port the gate.** It is a walking error
   (duplicate phantom rendered); mirror `CommandLinkStateCommon.java:277-278`'s
   `parent.getData()==null` gate so the diagram errors as the jar does.
   Same write-set as ruling 1 (`state-parse-resolve.ts`); the
   resolve-diagram-wide alternative was considered and rejected (fidelity
   over improvement).
3. dispatch order — **withdrawn**: not a mechanism for any fixture in this
   corpus. The port's first-match `accepts()` registry vs the jar's
   try-all-factories-then-best-error loop remains a real structural
   difference (`src/index.ts:66-69`), but no fixture here turns on it; the
   sequence engine (`src/diagrams/sequence/`) exists and is registered last,
   so "add sequence" is not what these fixtures need.

## 2. Repeated |Δpx| reconciliation (exit bar 2)

Every repeated value in `PARTITION.md` §"Repeated |Δpx|", one row each.
"one group" = shared cause. "split" = numerically equal, causally distinct.

| \|Δpx\| | rows | verdict | groups |
|---|---|---|---|
| 0.0 | 13 | **split (sub-pixel companions)** — last-digit rows riding on 13 real fixtures; every one is G14's position residual expressed on a fixture whose OTHER row is a real defect | G14 mechanism, 13 host fixtures across G4/G5/G8/G13/G12/G18/G20/G21 |
| 1.0 | 8 | **split, 5 causes** — `decede`/`pacami`/`tofezi`/`xojudi` = RoundedSouth; `juvagu` = creole/tab; `fatupo` = note creole; `jijuze` = tightContentDimension; `gokife` = open | G5 / G1 / G2 / G16 / G18 |
| 36.0 | 7 | **one group** — all four EXPANSION_* fixtures, rankdir swap | G7 |
| 28.0 | 6 | **split, 2 causes** — `duzazu`/`vixobo`/`fibudu#a` = backslash continuation; `bujuta`/`mimaga`/`rinisi` = EXPANSION_* (28 = 40−12, the same swap seen from the other side) | G3 / G7 |
| 3.0 | 6 | **split, 2 causes** — `joleju` ×5 (note-only region); `fatupo` ×1 (note creole). T3 retracted the fatupo link explicitly | G17 / G2 |
| 10.0 | 5 | **split, 2 causes** — `resido`/`dogeji` ×2/`viguto` = `<<O-O>>` +10; `bitaxo` = `hide empty description` | G8 / G9 |
| 2.6 | 5 | **split, 2 causes** — `feziva`/`mujipe`/`nixoja` = **+2.550** (`[[S1]]` measured raw); `mosigo`/`rijoki` = **−2.575** (`<<O-O>>` clipped by MIN_WIDTH). Opposite signs, different magnitudes | G1 / G8 |
| 8.0 | 4 | **split, 2 causes** — `bujuta`/`mimaga`/`rinisi` = EXPANSION_*; `viguto` = `<<O-O>>` clipped by MIN_HEIGHT | G7 / G8 |
| 5.8 | 4 | **one group** — `fovafu#a`/`tubojo`, 2 rows each, byte-identical | G10 |
| 40.0 | 3 | **one group** — `kubona`/`jafazu`/`rejike`, all `skinparam wrapWidth 150` never consumed. Two call sites (fields vs display name) of one missing `create8(..., wrapWidth)` | G1 (sub-group 1b) |
| 21.0 | 3 | **split, 2 causes** — `lojeju`/`nuvura` = clusterPosMap (byte-identical fixtures, closed exactly); `zizemo` = open cluster-header ink. Not shared: lojeju/nuvura close to the pixel on a mechanism that is ruled out of zizemo's shape | G4 / G15 |
| 12.0 | 3 | **one group** — `bajelo` (−12.030 w, −12.000 h) and `jetuse` (−12.000 h), both clusterPosMap | G4 |
| 3.8 | 3 | **split, 2 causes** — `nimana`/`nimise` = **−3.836** label position; `xeziki` = **+3.812** display-name creole. Opposite sign, different value | G13 / G1 |
| 1.3 | 3 | **one group** — `pebepi`/`taxile`/`tigibi`, self-loop arrowhead | G6 |
| 445.2 | 2 | **one group** — `jafazu`/`rejike`, wrapWidth | G1 |
| 79.7 | 2 | **one group** — `corumi`/`gupeto`, `<math>` unrendered (same puml ± `scale 5`) | G1 |
| 42.0 | 2 | **one group** — `corumi`/`gupeto`, same fixtures' height rows | G1 |
| 39.1 | 2 | **one group** — `cupesu`/`lumamo`, clusterPosMap at the two call sites | G4 |
| 24.0 | 2 | **one group** — `cupesu`/`lumamo`, same | G4 |
| 25.0 | 2 | **split** — `darime` = clusterPosMap (closed exactly); `rovese` = open cluster-header ink | G4 / G15 |
| 14.5 | 2 | **one group** — both rows are `giniti`'s own (scope 5 and 6), clusterPosMap | G4 |
| 14.0 | 2 | **one group** — `duzazu`/`vixobo`, backslash continuation | G3 |
| 8.6 | 2 | **one group** — `rovese` (−8.600) / `zizemo` (−8.637), the open cluster-header family | G15 |
| 7.7 | 2 | **split** — `dogeji` = **−7.725** (`<<O-O>>` clipped); `fovafu` = **+7.714** (dotted-id display). Opposite sign | G8 / G10 |
| 4.4 | 2 | **one group** — `lojeju`/`nuvura`, clusterPosMap | G4 |
| 4.0 | 2 | **split** — `darime` = clusterPosMap; `kinuca` = creole table | G4 / G23 |
| 0.2 | 2 | **split** — `bunade` = **−0.164448** label position; `mosigo` = **−0.164** `<<O-O>>` clamp residual | G13 / G8 |

## 3. Cross-bucket contradictions, settled

### 3.1 The RE-PIN label-position group is three, not six

`size-backlog.json`'s 2026-08-15 RE-PIN note named six fixtures (`bunade`,
`nimise`, `bajelo`, `fotuje`, `nimana`, `pavuzo`); T10 carried that list into
its records and T1 disputed it. **Settled from the rows:** the group's
signature row is a small label-position residual on the composite's own
declared width. `nimana-36` (−3.836) and `nimise-04` (−3.836016) carry it;
`bunade-42` (−0.164448) carries the same mechanism at a smaller magnitude.
`bajelo-54`'s only rows are +0.003 / −12.030 / −12.000 and `fotuje-06`'s are
−68.393 / −38.373 / −25.793 / −19.373 — **neither has any row in this band**,
and both close (bajelo exactly, fotuje structurally) on G4's clusterPosMap
instead. `pavuzo-79`'s single row is −2.460 and its own record puts it on the
`ortho` xlabel path (G20), a different mechanism. **G13 = {`nimana-36`,
`bunade-42`, `nimise-04`}.** T1 is right; T10's list is inherited, not
re-derived (ADR-4's exact failure mode).

### 3.2 The −1 px composite family is four, plus one lookalike

T2 closed `pacami`/`tofezi`/`xojudi` exactly on the `RoundedSouth` south cap
(115 = 99+1+15) via a probe driving the real `computeSvekResultGeometry`. T1
adopted it for `decede-10`, which has the identical `state A{B,C}`
substructure and byte-identical Δ (+0.002 / −1.000) — a legitimate adoption:
same shape, same numbers, same file. **G5 = four fixtures.**
`gokife-89` also shows −1.000, and T7 cross-referenced the family, but it is
**not** the same cause: every scope in gokife has exactly ONE node and there
is no composite outer box in the ink walk for a south cap to be missing from.
It stays **unresolved as its own group (G18)** with a bare-node engine probe
as its next step. An identical Δ was the prior (SCHEMA rule 3); the shape
refutes it.

### 3.3 "No creole strip before measure" is ONE architecture, THREE write-sets

T9, T8, T6, T4, T5, T1 and T2 each found "text measured raw". They are all the
same architectural gap — **state sizing never routes text through the creole
pipeline** — but they enter it at three different owner functions with
disjoint write-sets:

| owner | file:line | group | fixtures |
|---|---|---|---|
| leaf/state text (name, description, fields) | `state-sizing.ts:176-186 / :199 / :207 / :209-210` | **G1** | 16 |
| note bodies | `state-note-layout.ts:84-93` | **G2** | 2 |
| composite `attr` term | `state-composite-sizing.ts:73-74` | **G23** | 1 |

Grouping them as one would produce a 19-fixture batch touching four files with
two independent renderer counterparts; splitting by owner function gives
disjoint write-sets that can run in parallel and still share one creole
primitive. G1 and G23 are batched together (both write `state-sizing.ts`);
G2 is independent. `wrapWidth` and tab stops are **arguments of the same
missing `create8` call**, not separate subsystems — they are G1 sub-groups.

### 3.4 `clusterPosMap: undefined` is one group with two call sites

T1 found `state-composite-autonom.ts:195`; T3 found
`state-composite-concurrent.ts:129`. Both reach the same fallback at
`state-composite-geo.ts:380`. `giniti-22` needs BOTH fixed, and both fixes
plus the fallback live in the same three-file write-set. **One group (G4).**

### 3.5 `<<O-O>>` is four plus one; `bitaxo`'s +10 is different

T7's `dogeji`/`mosigo`/`rijoki`/`viguto` and T4's `resido` are one group (G8) —
independently diagnosed to the same `javaRef`. `bitaxo-18`'s +10 is the
`hide empty description` threading gap (G9), a different file and a different
direction of error that happens to land on the same magnitude.

### 3.6 The four unmatched fixtures are jar ERROR renders

T12 established this from the sources; T13 §5/§6-item-2 describes them as an
"absent-oracle caching gap" and proposes re-running the oracle dump. Both
observations are consistent (there is no DOT **because** the jar errored), but
**T12's framing is the correct one and re-caching would produce nothing.**
T13's proposed harness improvement #2 should be dropped. See §7.3.

## 4. Fix-mission proposal — `state-declared-size-fix`

Five batches. Write-sets are **pairwise disjoint within each batch**; batches
serialize where a later write-set intersects an earlier one. Ordered
biggest-delta-first within each batch. Every exit is stated as harness rows
going exact.

### Batch 0 — harness attribution (T0)

| task | write-set | what | exit |
|---|---|---|---|
| F0 | `scripts/measure-composite-declared-size.ts` | Adopt METRIC-AUDIT Candidate B: declaration-order pairing after a `shape === 'point'` filter applied identically to both sides (real-node counts agree 1:1 on all 205 scope-instances) | summary counters stay byte-identical (272 / 2654 / 2481 / 144 / 29 / 4 / 79) while `idx` becomes a declared-node position, not a sort rank |

Run first so every later batch's rows name a real state. ~40-60 lines, one
file, no `src/` change. **Cannot change any reported delta** (METRIC-AUDIT §2
proves sorted pairing is already the error-minimizing bijection everywhere).

### Batch 1 — text measurement and leaf sizing (six parallel tasks)

| task | groups | write-set | fixtures | max Δpx | exit |
|---|---|---|---|---|---|
| F1 | G1 + G8 + G23 | `state-sizing.ts`, `state-composite-sizing.ts`, state renderer counterpart, new creole-visible-text seam reusing `src/core/klimt/creole/*` | 22 | 445.200 | all 23+13+2 rows on those 22 fixtures exact |
| F2 | G2 | `state-note-layout.ts`, `state-composite-edge-label.ts` | 2 | 158.281 | `fatupo-62`, `xeziki-47` rows exact |
| F3 | G7 + G9 | `state-leaf-node.ts`, `state-composite-pass.ts` | 5 | 36.000 | 14 rows on the 4 EXPANSION_* fixtures + `bitaxo-18` exact |
| F4 | G3 | `src/core/tim/ReadLineReader.ts`, `src/core/BlockUmlBuilder.ts` | 3 | 28.000 | `duzazu-41`, `vixobo-14`, `fibudu-53` rows exact **and** the full-corpus manifest otherwise unmoved |
| F5 | G12 | `state-dot-graph.ts`, `state-transition-label.ts` | 1 | 12.785 | `tumaba-64` rows exact, note-on-link drawn |
| F6 | G10 | `state-parse-resolve.ts`, `state-parse-helpers.ts` | 2 | 5.788 | `fovafu-44` (#a rows), `tubojo-49` rows exact |

F1 is the mission's centre of mass: 22 of 94 fixtures and every delta above
100 px except G4's 300. F4 is the one pipeline-wide change — gate it on a
full-corpus manifest diff, not the state slice.

### Batch 2 — composite geometry (two parallel tasks)

Serialized after Batch 1: F1/F3 change the declared leaf sizes that feed every
composite ink walk, so measuring composite geometry before them measures the
wrong input.

| task | groups | write-set | fixtures | max Δpx | exit |
|---|---|---|---|---|---|
| F7 | G4 | `state-composite-geo.ts`, `state-composite-autonom.ts`, `state-composite-concurrent.ts` | 9 | 300.000 | 7 closed fixtures' rows exact; `jetuse-93` height exact (width residual re-measured and re-recorded); `fotuje-06` used as the nested-chain regression |
| F8 | G5 + G6 | `layout-ink-extent.ts` | 7 | 1.340 | all 11 rows on the 4 RoundedSouth + 3 self-loop fixtures exact |

### Batch 3 — the overlapping tail (two parallel tasks)

Each intersects a Batch-1/2 write-set, so it cannot run earlier.

| task | groups | write-set | fixtures | max Δpx | exit |
|---|---|---|---|---|---|
| F9 | G11 | `ast.ts`, `state-commands.ts`, `state-composite-sizing.ts`, `state-composite-concurrent.ts` | 1 | 66.000 | `fimivu-15` rows exact; grep the corpus for other `\|\|` users first and fold any in |
| F10 | G13 | `layout-ink-extent.ts`, `state-composite-edge-label.ts` | 3 | 3.836 | `nimana-36`, `bunade-42`, `nimise-04` rows exact — **diagnose the position formula first** (2 of 3 are unresolved) |

F9 intersects F1 (`state-composite-sizing.ts`) and F7
(`state-composite-concurrent.ts`); F10 intersects F8 (`layout-ink-extent.ts`)
and F2 (`state-composite-edge-label.ts`).

### Batch 4 — re-diagnosis, not fixes (eight parallel tasks)

No write-set exists yet for these; each task's deliverable is a `resolved`
record with a real `originFileLine`, which then feeds a follow-on fix batch.
Every one already carries probe evidence and a concrete next instrument.

| task | group | fixtures | max Δpx | next instrument |
|---|---|---|---|---|
| D1 | G15 | `rovese-43`, `zoriza-41`, `zizemo-86` | 41.000 | read `ClusterHeader.java` / `ClusterDotString.java` |
| D2 | G19 | `fovafu-44#b` | 10.594 | probe `measureAutonomWrapper` intermediates |
| D3 | G17 | `joleju-94` | 9.000 | minimal repro + `computeSvekResultGeometry` monkeypatch |
| D4 | G21 | `zacajo-09` | 3.733 | dot-engine vs oracle graphviz on the identical DOT |
| D5 | G20 | `kejabo-83`, `pavuzo-79` | 2.460 | extract the inner DOT fragment; polyline and xlabel separately |
| D6 | G22 | `dapunu-39` | 2.033 | diff jar's `svek-3.dot` node line against our DOT **input** |
| D7 | G18 | `gokife-89` | 1.000 | dot-engine bounding box on a synthetic bare node |
| D8 | G16 | `jijuze-43` | 1.000 | in-source gated trace of `tightContentDimension` |

D4 and D5 are likely `docs/graphviz-issues/*.md` + `TRACKER.md` filings rather
than `src/` changes (repo CLAUDE.md: verified dot-engine findings are filed,
not carried in a ledger).

### Not scheduled — G14

30 records / 27 fixtures / 40 rows, all ≤ 0.005 px, one file
(`graph-layout.ts:189-194`), blast radius = every graph diagram type. Fully
diagnosed, deliberately unscheduled. Revisit only if a visible defect is ever
traced to it.

## 5. Unresolved groups and their next steps

15 records / 14 fixtures (+1 partial). Grouped by `nextStep` family:

| family | groups | fixtures | shared next instrument |
|---|---|---|---|
| unread upstream cluster draw | G15 | `rovese-43`, `zoriza-41`, `zizemo-86` | `ClusterHeader.java` / `ClusterDotString.java` |
| in-module tracing needed (not externally patchable) | G16 | `jijuze-43` | gated in-source trace |
| minimal-repro + cross-module monkeypatch | G17, G19 | `joleju-94`, `fovafu-44#b` | a scratch repro driving the real exported function |
| engine-vs-oracle comparison (likely external) | G20, G21, G18 | `kejabo-83`, `pavuzo-79`, `zacajo-09`, `gokife-89` | run the same DOT through dot-engine and the oracle's graphviz |
| upstream-of-ink DOT input diff | G22 | `dapunu-39` | our DOT input vs jar's `svek-N.dot` node line |
| residual after a known fix lands | G4 | `jetuse-93` (width 5 px), `fotuje-06` | re-measure immediately after F7 |
| position formula not isolated | G13 | `bunade-42`, `nimise-04` | instrument `transition.label.inkBox.x/y` vs jar's label anchor |

**README stop 6 not triggered:** no bucket has >10 % unresolved with the SAME
`nextStep` — the seven families above are distinct instruments, and each is
runnable with tools already in the repo.

## 6. Proposed divergences for maintainer ruling (ADR-6)

Four fixtures, all from G24, all "the jar errors and we render". None is a
size delta. **Rulings recorded 2026-08-18 (see G24 for the evidence):**

1. **`checkConcurrentStateOk` guard** (`cagego-53-vemo516`,
   `xacona-99-peze211`, `zecivu-62-pagu681`) — **RULED: port the guard.**
   `StateDiagram.java:70-90` → `state-parse-resolve.ts#ensureState`. Fix
   mission task (small; three fixtures become jar-identical errors).
2. **Dotted-path phantom** (`fugedo-34-fice721`) — we manufacture the same
   phantom as `Quark#child` and draw it (duplicate `ChildMode1 { A }`).
   Recommended: port `CommandLinkStateCommon.java:277-278`'s
   `parent.getData()==null` gate (error, fidelity). Alternative: resolve
   diagram-wide to the real nested state (improvement, needs
   `DIVERGENCES.md`). **RULED: port the gate** (fidelity); fix-mission
   task alongside ruling 1, one write-set.
3. ~~Diagram-type dispatch order~~ — **withdrawn**; zecivu is ruling 1.

No other record proposes a divergence. Notably, T6 considered and **rejected**
routing `skinparam tabSize` to a divergence: the tab stop is part of the same
missing creole pipeline (G1 sub-group 1c), so it is a port gap, not an
inherent difference.

## 7. Harness assessment

### 7.1 T0 candidate for the fix mission

METRIC-AUDIT §3 Candidate B, restated as Batch 0 above. Candidate A
(label-text pairing) is infeasible — jar's cached DOT carries `label=""`.

### 7.2 pairingRisk: two rubrics, one conclusion

METRIC-AUDIT rates all 90 mismatched fixtures **none 73 / possible 17 /
likely 0** on an explicit rubric (`likely` = an alternative bijection with
≤ the current summed error exists; proven zero by an exhaustive `O(n²)` test
over all 205 scope-instances). Eight individual records self-label `likely`
and seven `possible` on a looser, narrative reading of "a tie could have
mis-attributed which node this row names". **METRIC-AUDIT's rubric is
authoritative for exit bar 3.** The mapping:

- self-`likely` → audit `possible`: `fimivu-15`, `xeziki-47` (#a and #b),
  `bujuta-44`, `mimaga-15`, `rinisi-79`.
- self-`likely` → audit `none`: `fatupo-62`, `dogeji-46`.
- self-`possible` → audit `none`: `jijuze-43`.

Both rubrics agree on the load-bearing point: **no reported Δpx can be wrong
under any pairing.** What a tie costs is attribution — which real state's box
the row names — and that is exactly what Batch 0 buys back. Three mechanisms
(G7, G9, G11) rest on source evidence rather than row identity for that
reason, and each has a tie-free confirming fixture or an A/B: `nijugi-19` for
G7, `bilare-19-fufe539` for G9, the `--`/`||` source read for G11.

### 7.3 Two corrections the orchestrator should make (T14 does not edit other tasks' files)

1. **`skinparam-style.md` → `kejabo-83-vinu490` is missing a row.** The
   baseline carries two rows for this fixture — `scope 2 / width / idx 2 /
   +0.750` (recorded) and `scope 2 / height / idx 2 / −0.000` (**absent from
   the record**). `PARTITION.md` lists kejabo in its `0.0 ×13` group, so the
   row was available. Its cause is almost certainly G14 (position residual);
   the record's own mechanism and status are unaffected. This is the only
   row-level gap: the other 89 mismatched fixtures' row tables match the
   baseline exactly, 172 of 173 rows.
2. **`METRIC-AUDIT.md` §5 / §6-item-2 should be re-framed.** It calls the four
   unmatched fixtures "a caching gap … worth re-running the oracle dump" and
   proposes re-caching as harness improvement #2. T12 read the sources: the
   jar ERRORS on all four, so there is no `svek-N.dot` to cache. Re-running
   the dump produces nothing. §6 item 2 should be struck; items 1, 3, 4 stand.

### 7.4 Row accounting

173 harness rows on 90 mismatched fixtures = 144 mismatched + 29 last-digit.
Of those, 40 sit on the 27 precision-bucket fixtures (G14) and 133 on the 63
real-delta fixtures — of which 13 are themselves sub-pixel companions riding
on a real fixture (PARTITION's `0.0 ×13`), which is how README's "53 sub-pixel
rows / 27 fixtures" reconciles with T11's "27 fixtures / 40 rows": 40 + 13.
The 4 unmatched fixtures contribute 0 rows.

## 8. Observations to file (orchestrator files these; four are already in
`.agent-notes/si28-state-declared-size-observations.md`)

**Already filed** (commit `1b9c2498`): the `BORDER_POINT_SIZE` comment
claiming EXPANSION_* is unexercised (falsified by 4 fixtures); the
`__init_`/`__zaent_` id filter being asymmetric with jar's DOT (jar's `[*]` is
`shape=circle`, its anchors are bare `zaent0003` — filter by `shape==='point'`
instead); two "jar-verified" doc comments in `state-composite-autonom.ts`
contradicted by current numbers; state sizing never routing text through the
creole pipeline.

**Still to file:**

1. **`CLAUDE.md`'s "everything else shells out to real graphviz" is stale.**
   Verified read-only this task: `src/core/graph-layout.ts:15` imports
   `@knowvah/dot-engine` and `src/diagrams/state/layout.ts:27` calls it —
   state layout never invokes graphviz. `plans/burn-graphviz-engines` (all six
   graph types on dot-engine) is what is true today. This matters directly to
   G21/G20: their comparison is dot-engine vs the graphviz that produced the
   pinned oracle, i.e. a `docs/graphviz-issues/` filing.
2. **`layout-ink-extent.ts:82-85`'s arrowhead over-reach comment is not
   reproduced** by T2's exact geometry for the self-loop case (G6), where
   including the arrowhead is what matches jar (85.338 vs 85.34).

## 9. Provenance — bucket label → true group (the ADR-3 verdict)

| T0 bucket | fixtures | true groups it turned into |
|---|---|---|
| composite (20) | 20 | G3 (2), G4 (5), G5 (4), G6 (3), G13 (1), G15 (3), G22 (1), G23 (1) — **8 groups** |
| concurrent-region (8) | 8 | G4 (3+1), G11 (1), G16 (1), G17 (1), G21 (1) — **5 groups** |
| pseudo-state (7) | 7 | G1 (1), G7 (4), G8 (1), G9 (1) — **4 groups** |
| skinparam-style (7) | 7 | G1 (5), G20 (2) — **2 groups** |
| attribute-line (6) | 6 | G1 (6 records), G3 (1 record via `fibudu#a`) — **2 groups** |
| stereotype (5) | 5 | G8 (4), G18 (1) — **2 groups** |
| other (4) | 4 | G10 (2), G13 (2), G19 (1 record via `fovafu#b`) — **3 groups** |
| note (3) | 3 | G1 (1 record), G2 (2 records), G12 (1) — **3 groups** |
| creole-sprite-escape (3) | 3 | G1 (3) — **1 group** |
| precision (27) | 27 | G14 — **1 group** |
| unmatched (4) | 4 | G24 — **1 group, 2 mechanisms** (corrected at close-out) |

Only `creole-sprite-escape`, `precision` and `unmatched` survived as
single-mechanism buckets. `composite` fanned out into eight. Conversely G1
draws from six different buckets and G8 from two. ADR-3 earned its keep: a
fix mission batched on T0's labels would have collided on
`state-sizing.ts` from five directions and split `layout-ink-extent.ts`
across three.

## 10. Outcome (SI29)

The fix mission proposed in §4, **`state-declared-size-fix`** (mission-index
**SI29**), executed all five batches and closed 2026-08-18 on branch
`fix/state-declared-size`. Corpus **2481 → 2555 exact** declarations
(mismatched 144 → 62, unmatched fixtures 4 → 0); **74 harness rows went
exact**, 2 grew and both are ruled, journaled exceptions. Groups closed: G1,
G2, G3, G4 (7 of 9 fixtures), G6, G7, G8, G10, G11, G12, G23, G24, plus G15
and G22 closed incidentally and G19 resolved as engine-side. Still open: G5,
G9, G13, G16, G17, G20a/G20b, G21, and **G14 — still deliberately
unscheduled**, exactly as §4 stated.

Full scoring, per-task results, ratchet totals and the follow-up list:
**`plans/state-declared-size-fix/findings/CLOSE-OUT.md`**.
