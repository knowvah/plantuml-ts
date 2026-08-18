# T10 — other bucket findings

### bunade-42-fudu910

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 2.144340 | 2.146624 | -0.164448 |
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000072 |
- **status:** unresolved
- **mechanism:** The composite `NotShooting`'s own declared box (scope 2,
  idx 2) is fed by `computeSvekResultGeometry`'s ink walk over its two
  `EvConfig` transition labels. `transition-label-ink` mission T3 (2026-08-15)
  made the label-BOX fold jar-faithful (folds `TextBlockMarged`'s own
  `UEmpty`, not the floored DOT reservation), which unmasked a SEPARATE,
  already-present, smaller residual: a label-POSITION divergence (the box's
  `x`/`y` anchor, not its width/height) between our `transition.label.inkBox`
  and jar's actual drawn position. Root position formula not yet isolated —
  UNRESOLVED per that mission's own note.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:386-392 (the
  `addTransitionInk` ink-box fold consuming `transition.label.inkBox`; the
  wrong VALUE is computed upstream of this fold, not at this line)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:79-87 (`drawU`'s `UEmpty.create(dim)` at the reserved-box corner) + ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162 (`drawEmpty`, the ink walk that folds it)
- **causalChain:** jar's own SVG puts its rightmost label box at
  90.464+54.8125=145.2765, ink min at 25.72, extent 119.5565in vs the
  119.557 our declared 154.557-35 implies (oracle/goldens/state/size-backlog.json
  `_doc`, TRANSITION-LABEL-INK RE-PIN note, 2026-08-15) — a ~0.165px gap.
  Re-measured today via `npx jiti scripts/measure-composite-declared-size.ts
  bunade-42-fudu910`: current Δpx = -0.164448 (2.14434-2.146624)*72,
  matching the pinned ratchet value 0.002284in*72=0.164448px exactly (byte-
  identical to the ratchet, confirming the residual is UNCHANGED since the
  RE-PIN and not a new regression).
- **ruledOut:** NOT the leaf-box sizing bug (bunade-42 has no dotted
  composite ids); NOT the +15/+15 SvekResult wrapper term
  (`layout-ink-extent.ts:515-530`, already jar-verified elsewhere, and this
  fixture has no nested-cluster-in-cluster shape); NOT a pairing
  mis-attribution — scope 2's three nodes are far apart in size
  (0.277778/1.045833/2.14x), sort order is unambiguous on both sides.
- **pairingRisk:** none — no two nodes in this scope are close in size.
- **sharedCauseWith:** nimise-04-jove070 (this bucket); bajelo-54-dixe684,
  fotuje-06-fifa085, nimana-36-veco708, pavuzo-79-zodu430 (other buckets) —
  all six named together in the size-backlog.json RE-PIN note as sharing
  this exact label-position mechanism, unmasked by the same T3 commit.
- **proposedWriteSet:** src/diagrams/state/state-composite-edge-label.ts
  (label inkBox x/y computation) or layout-ink-extent.ts (fold site) —
  exact file pending the position-formula isolation.
- **sizeEstimate:** 6 fixtures share this residual (cross-bucket); each
  Δ ≤ 0.165px. Low blast radius per-fixture; verification cost is the
  ~0.165px-scale arithmetic already worked out for bunade-42 in the ratchet
  doc, replicable for the other 5.
- **confidence:** medium — mechanism class (label-position, not label-size)
  is jar-verified by a prior mission's own hand-derivation; the exact wrong
  formula site is not yet isolated.
- **nextStep:** Instrument `transition.label.inkBox.x/y` for bunade-42's
  `EvConfig` label (composite → composite direction) against jar's SVG
  `<text>`/label anchor for the same edge; diff the two positions to find
  which upstream offset (DOT label anchor vs `TextBlockMarged` origin) our
  port omits.

### fovafu-44-mifu394#a

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 0.774826 | 0.694444 | 5.787504 |
  | 1 | width | 2 | 0.774826 | 0.694444 | 5.787504 |
- **status:** resolved
- **mechanism:** `state B.A.X` / `state B.A.Y` (no `as` alias) declare leaf
  states via a dotted id. `declareState` (state-parse-resolve.ts:423-431)
  splits the id into segments and correctly resolves each leaf's own
  `display` to its LAST segment ("X"/"Y") via `resolveOrCreateDottedPath`'s
  `makeState(seg, seg, ...)` (state-parse-resolve.ts:165) — but then
  unconditionally overwrites it: `applyDeclaredContent` (state-parse-
  resolve.ts:379) does `target.display = source.display`, where `source` is
  the THROWAWAY declaration object built with `display = id = "B.A.X"` (the
  FULL dotted string — state-parse-helpers.ts:41's `display ?? bareId`
  fallback, run before any dotted-path split). The leaf's label ends up
  rendered as `"B.A.X"`/`"B.A.Y"` instead of `"X"`/`"Y"`, and the wider text
  forces a wider box.
- **originFileLine:** src/diagrams/state/state-parse-resolve.ts:379
  (`applyDeclaredContent`'s unconditional `target.display = source.display`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/command/CommandCreateState.java:181-183
  (`display = arg.getLazzy("DISPLAY", 0); if (display == null) display =
  quark.getName();` — upstream re-derives the default from the QUARK's own
  local name, taken AFTER dotted-path resolution, not from the raw typed id)
- **causalChain:** Confirmed via probe (`scripts_scratch/T10/probe1.ts`):
  our layout-input nodes for `X`/`Y` report `width: 55.7875` (0.774826in);
  our own rendered SVG shows `<text ... textLength="35.787">B.A.X</text>`
  (the full dotted id as the label) where jar's SVG shows `<text>X</text>`
  at box width 50 (0.694444in). Δpx = (0.774826-0.694444)*72 = 5.787504,
  matching the pinned ratchet value (fovafu-44-mifu394: 0.147142in max —
  see #b) component-wise on the leaf axis.
- **ruledOut:** NOT a graphviz/dot-layout sizing bug — the leaf box shape/
  height (50px, exact match on both sides) is untouched; only WIDTH, which
  tracks with a longer measured string, is off. NOT an auto-created-entity
  artifact — the SAME delta appears in tubojo-49-tudu915, whose transition
  (`B -> Y`) never triggers auto-creation of a distinct top-level entity
  (`B` matches the existing composite directly), ruling out any mechanism
  tied to the `A -> Y` / bare-identifier-resolution path specifically.
- **pairingRisk:** none — both leaves (`X`,`Y`) carry the identical wrong
  value on both sides; sort order cannot misattribute equal values.
- **sharedCauseWith:** tubojo-49-tudu915 (this bucket, identical mechanism
  and identical Δpx, byte-for-byte). No cross-bucket match found for this
  specific "dotted-leaf-declared-without-`as`" shape.
- **proposedWriteSet:** src/diagrams/state/state-parse-resolve.ts
  (`applyDeclaredContent`) and/or state-parse-helpers.ts
  (`extractDisplayAndId`) — thread an "explicit vs defaulted" flag through
  `declareState` so a defaulted display never overwrites a dotted leaf's
  already-correct per-segment display.
- **sizeEstimate:** 2 files, small diff. Blast radius: EVERY dotted
  composite leaf declared without an explicit `as "..."` alias anywhere in
  the corpus (not sampled beyond these 2 fixtures) — a fix here needs a
  full corpus re-measure, not just these two.
- **confidence:** high — mechanism directly observed in both our own SVG
  output and the layout-input probe; Java citation is the exact method
  upstream uses for the same default.
- **nextStep:** n/a (resolved).

### fovafu-44-mifu394#b

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 0 | 3.023809 | 2.916667 | 7.714224 |
  | 2 | height | 0 | 2.760914 | 2.908056 | -10.594224 |
- **status:** unresolved
- **mechanism:** `A -> Y` targets the MIDDLE-nested composite `A` (not the
  outermost `B`), so jar's structure needs 2 graphviz scopes: scope 1 lays
  out `A`'s own interior (leaves `X`,`Y` + the entry-point pseudostate);
  scope 2 is `B`'s own `InnerStateAutonom` pass, wrapping the already-sized
  `A` cluster as its sole child. `A`'s own rendered cluster box is IDENTICAL
  in height on both sides (115px, confirmed via probe SVG rect), so the
  scope-2 height shortfall (-10.594px) is NOT a downstream consequence of
  #a's leaf-width bug (which only touches width, never height). Hand
  arithmetic on both SVGs: our top gap (header separator → `A` cluster top)
  is 52.786px vs jar's 57.38px (short by 4.594px); our bottom margin
  (`A` cluster bottom → `B`'s own box bottom) is 7px vs jar's 13px (short by
  6px); 4.594+6=10.594, matching the full height Δ exactly. This points at
  `measureAutonomWrapper` (state-composite-sizing.ts:65-91) computing a
  smaller MARGIN/MARGIN_LINE-derived allowance specifically when its
  `childImg` came from a NESTED cluster (a `SvekResult`-shaped child) rather
  than plain leaf ink — but the exact formula divergence is not yet
  isolated to a line.
- **originFileLine:** src/diagrams/state/state-composite-sizing.ts:77-87
  (`measureAutonomWrapper`'s `nameHeight`/`delta` formula — the candidate
  site; not yet proven the origin)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/InnerStateAutonom.java:186-197
  (`calculateDimensionSlow`, the formula `measureAutonomWrapper` ports) +
  ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-136
  (`calculateDimension`'s `delta(15, 15)` term — the nested-cluster-as-child
  case `im.calculateDimension()` invokes when `im` is itself a `SvekResult`)
- **causalChain:** see mechanism — top-gap shortfall 4.594px + bottom-margin
  shortfall 6px = 10.594px = |Δ height|. Width Δ (7.714224px) is consistent
  in direction and rough magnitude with the SAME leaf-width inflation from
  #a propagating through B's own recursive width computation (A's cluster
  itself measured 186px wide in ours vs 174px in jar's SVG, a downstream
  consequence, not fixed independently here).
- **ruledOut:** NOT the `+15/+15` SvekResult term in isolation — that path
  is already jar-verified byte-exact elsewhere for 2-level nesting
  (`layout-ink-extent.ts:480-513`'s own doc comment, `coteta-47-mare883`,
  `lonuti-97-voko521`). This fixture's structure (composite-B-wraps-
  composite-A via a bare-identifier transition into the MIDDLE segment) is
  narrower/rarer than those two jar-verified cases, so the divergence is
  specific to this shape, not a regression of that fix. NOT explainable by
  #a's leaf-width bug alone (height axis unaffected there).
- **pairingRisk:** none — scope 2 has exactly one node on each side.
- **sharedCauseWith:** none found. tubojo-49-tudu915 does not reach this
  code path at all (its `B -> Y` transition matches the OUTERMOST composite
  directly, collapsing to a single scope with no separate wrap pass — jar's
  own `svek-1.dot` for tubojo-49 has no equivalent of this scope 2).
- **proposedWriteSet:** src/diagrams/state/state-composite-sizing.ts
  (`measureAutonomWrapper`) and/or state-composite-autonom.ts (the
  `childImg` construction feeding it) — pending isolation.
- **sizeEstimate:** Narrow shape (composite-wraps-composite via a bare
  middle-segment reference); likely 1 fixture in the current corpus sample.
  Small diff once isolated; verification cost is re-deriving jar's own
  margin constants for the nested-cluster-child case by hand, as done here.
- **confidence:** low — mechanism NARROWED to the wrapper-margin formula for
  a nested-cluster child, with worked arithmetic, but not yet pinned to a
  single origin line.
- **nextStep:** Add a probe printing `childImg`/`wrapper` intermediate
  values from `measureAutonomWrapper` for `B`'s own pass on fovafu-44, and
  compare against a hand-computed jar target derived from
  `InnerStateAutonom.calculateDimensionSlow` fed with `A`'s own `SvekResult
  .calculateDimension()` (`delta(15,15)`) output, to find which additive
  term differs.

### nimise-04-jove070

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 1 | 2.549670 | 2.602948 | -3.836016 |
  | 2 | height | 1 | 3.555555 | 3.555556 | -0.000072 |
- **status:** unresolved
- **mechanism:** Same label-POSITION divergence as bunade-42-fudu910 — the
  composite `Active`'s own declared width (scope 2, idx 1) is fed by the
  ink walk over its single self-loop `EvReset` transition label
  (`Active --> Active : EvReset`). Named alongside bunade-42-fudu910 in the
  same size-backlog.json RE-PIN note (2026-08-15) as sharing the identical
  residual mechanism.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:386-392 (same
  fold site as bunade-42-fudu910; wrong value computed upstream of it)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:79-87 + ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:159-162
- **causalChain:** Re-measured today via the harness: Δpx =
  (2.549670-2.602948)*72 = -3.836016, matching the pinned ratchet value
  0.053278in*72=3.836016px exactly (unchanged since the RE-PIN, confirming
  this is the tracked residual, not a new regression). The self-loop shape
  (single edge, both endpoints on the same composite) differs from
  bunade-42's two cross-substate edges, but the Δ magnitude and the shared
  RE-PIN note both point at the same label-position formula.
- **ruledOut:** NOT the fovafu-44/tubojo-49 leaf-display bug (nimise-04
  declares `Stopped`/`Running` without dotted ids — `Active begin ... end
  state` uses plain, non-dotted state names; leaf widths (scope 1) all
  match jar exactly). NOT a pairing mis-attribution — scope 2 has 2 nodes,
  a small circle (0.277778) and the composite (2.5x), far apart in size.
- **pairingRisk:** none.
- **sharedCauseWith:** bunade-42-fudu910 (this bucket); bajelo-54-dixe684,
  fotuje-06-fifa085, nimana-36-veco708, pavuzo-79-zodu430 (other buckets) —
  same size-backlog.json RE-PIN group of six.
- **proposedWriteSet:** src/diagrams/state/state-composite-edge-label.ts /
  layout-ink-extent.ts — same as bunade-42-fudu910; one fix should close
  both.
- **sizeEstimate:** See bunade-42-fudu910 — shared fix, shared verification.
- **confidence:** medium — same basis as bunade-42-fudu910.
- **nextStep:** Same instrumentation as bunade-42-fudu910, applied to
  nimise-04's self-loop `EvReset` label — confirm the position formula gap
  holds for a self-loop edge (both endpoints on the same node), not just
  cross-substate edges, before proposing a single shared fix.

### tubojo-49-tudu915

- **bucketLabel:** other
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 0.774826 | 0.694444 | 5.787504 |
  | 1 | width | 2 | 0.774826 | 0.694444 | 5.787504 |
- **status:** resolved
- **mechanism:** Identical to fovafu-44-mifu394#a: `state B.A.X` / `state
  B.A.Y` declared without an `as` alias default their throwaway
  declaration's `display` to the FULL dotted id ("B.A.X"), which then
  overwrites the correctly-split leaf's own per-segment display ("X") in
  `applyDeclaredContent`. `B -> Y` (vs fovafu-44's `A -> Y`) changes WHICH
  entity the transition targets (the outermost composite `B` here, so jar
  collapses to a single graphviz scope with no separate wrap pass) but does
  not touch this leaf-display code path at all — same bug, same Δ.
- **originFileLine:** src/diagrams/state/state-parse-resolve.ts:379
  (`applyDeclaredContent`'s unconditional `target.display = source.display`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/command/CommandCreateState.java:181-183
- **causalChain:** Same as fovafu-44-mifu394#a — Δpx =
  (0.774826-0.694444)*72 = 5.787504, byte-identical between the two
  fixtures, confirming one shared cause independent of transition shape.
- **ruledOut:** NOT tied to the transition's auto-creation/resolution path
  — `B -> Y` resolves `B` directly to the existing outermost composite (no
  auto-created top-level entity, unlike a hypothetical bare-id miss), and
  the leaf-width bug is present regardless.
- **pairingRisk:** none — see fovafu-44-mifu394#a.
- **sharedCauseWith:** fovafu-44-mifu394#a (this bucket, identical
  mechanism and Δpx). No cross-bucket match found.
- **proposedWriteSet:** Same as fovafu-44-mifu394#a — one fix closes both.
- **sizeEstimate:** See fovafu-44-mifu394#a.
- **confidence:** high — same basis as fovafu-44-mifu394#a.
- **nextStep:** n/a (resolved).
