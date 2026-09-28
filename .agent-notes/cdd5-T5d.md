## Observation: Java HashMap iteration order already has a port
- **Context**: cdd5-T5d, tim-guessfunctions-pair-order (xuloxo-85-vibu502).
- **Finding**: `src/core/java-hash-set.ts#javaHashSetOrder` replays a
  default `HashMap`'s bucket order (resize + small-table treeify). For a
  `HashMap<Integer, …>` pass `(k) => k` as hashCode; `keySet()`/`entrySet()`
  walk the same table. Ascending order holds only while every key is below
  the table capacity (16 until 12 entries): key 17 sorts before key 15.
- **Impact**: reuse it for any upstream code iterating a HashMap/HashSet;
  do not hand-roll an ascending sort.
- **Confidence**: High (JDK 21 HashMap.java read; `java H.java` printed
  `[18, 3, 4]` and `[1, 33, …, 40, 8, …, 17]`).

## Observation: removed groups burn uid ranks the port does not re-inject
- **Context**: cdd5-T5d, remove-group-not-cascaded (xamive-55-lipi586).
- **Finding**: `class-directives-remove-ranks.ts#computeRemovedRanks` pushes
  removed classifiers', notes' and links' ranks, never a removed NAMESPACE's
  `creationIndex`. With group removal ported, xamive's remaining diff is
  `g[2]/@id ent0003 vs ent0004`. Adding
  `for (const ns of ast.namespaces) if (removed.has(ns.id)) pushRank(ranks, ns.creationIndex);`
  made xamive conformant (probe, reverted: file outside T5d's write-set).
- **Impact**: the follow-on is that one line in that file.
- **Confidence**: High (measured with render-diff).

## Observation: an all-removed graph renders 0x0, jar renders 21x21
- **Context**: cdd5-T5d, jititi-15-maxe512 after group removal.
- **Finding**: `src/core/graph-layout.ts:318-320` returns `width: 0,
  height: 0` for a node-less graph. Upstream still runs graphviz and
  `SvekResult#calculateDimension` returns `minMax.getDimension().delta(15, 15)`
  (`svek/SvekResult.java:130-135`). Pre-existing: `class A / class B /
  remove *` shows the same 0x0 vs 21x21 (oracle-rendered).
- **Impact**: jititi's last 4 numeric diffs (svg width/height/viewBox).
- **Confidence**: High (jar and port both rendered).

## Observation: xuloxo has two further mechanisms after the TIM fix
- **Context**: cdd5-T5d, xuloxo-85-vibu502 after guessFunctions ordering.
- **Finding**: (1) The class parser refuses
  `A -->> B` (instrumented: refusal at the `-->>` line), so the block routes
  DESCRIPTION, not the jar's CLASS: `>>` (LinkDecor.ARROW_TRIANGLE,
  `decoration/LinkDecor.java:87`) is missing from
  `class-relationship-parser.ts:116` HEAD2_CHARS. (2) The C4 colours are
  lost: `$defineSkinparams` emits several `skinparam … { … }` blocks joined by
  `$bl()` (= `%breakline()`, BLOCK_E1_BREAKLINE) on ONE output line. The
  port's `StyleAndSkinparamCollector` (`src/core/preprocessor.ts:306-308`)
  consumes that line before any breakline split; upstream splits it first
  (`BlockUml.java:153` `Jaws.mutateExpands1`, `jaws/Jaws.java:65-120`).
  Instrumented: skinparam key `rectangle<<person>>` holds the literal
  `…}skinparam database<<person>> {…` text.
- **Impact**: two separate follow-ons (class grammar; preprocessor).
- **Confidence**: High for (1), High for (2)'s port side, Medium for the
  claim that it explains every fill diff (not fixed and re-measured).

## Observation: render-diff cannot see data-diagram-type
- **Context**: xuloxo renders DESCRIPTION, jar CLASS, yet render-diff lists
  no diagram-type diff.
- **Finding**: `tests/oracle/svg-conformance/normalize.ts:143` strips every
  `data-*` attribute before `compareSvg`.
- **Impact**: check routing with the routing gate or by grepping the SVG,
  never from render-diff counts.
- **Confidence**: High.
