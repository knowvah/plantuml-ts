# pseudo-state (T4)

Slice per `PARTITION.md#pseudo-state`: bitaxo-18-tamo974, bujuta-44-rovo666,
mefici-97-tudu030, mimaga-15-doze740, nijugi-19-jazi166, resido-15-reza040,
rinisi-79-peko570. Two of the seven fixtures (`bitaxo-18-tamo974`,
`resido-15-reza040`) have a mismatched row with NOTHING to do with
pseudo-states despite the `bucketLabel` — ADR-3 provenance-only, kept as-is,
`mechanism` states the real cause.

### bitaxo-18-tamo974

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | height | 2 | 0.694444 | 0.555556 | +10.000 |
- **status:** resolved
- **mechanism:** `hide empty description` is threaded to a leaf state's DOT
  size only on the flat top-level pipeline. State `A` (a plain leaf, no
  body) reaches DOT sizing via the composite-pipeline's `buildLeafNode`
  (it is a top-level sibling of composite `C`), which hardcodes
  `hideEmptyDescription=false`, so it gets `measureNormalState`'s full MIN
  50×50 instead of `measureEmptyDescription`'s MIN 50×40. NOT a
  pseudo-state effect: the entrypoint `d` and its `__zaent_C` port node
  (the reason this fixture matched the `<<entrypoint>>` classifier) are
  both exact (12×12px and 0.72×0.72px on both sides, no row).
- **originFileLine:** src/diagrams/state/state-leaf-node.ts:65
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GeneralImageBuilder.java:135-136 (uniform `isHideEmptyDescriptionForState` dispatch, no composite-sibling exception); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageStateEmptyDescription.java:45-46,53-58 (MIN 50×40)
- **causalChain:** `hide empty description` + no body ⇒ jar dispatches `A`
  through `EntityImageStateEmptyDescription`, MIN height 40px = 0.555556in.
  Our composite-pipeline `buildLeafNode` calls `measureState(s, false, …)`
  (state-leaf-node.ts:65), so `A` instead takes `measureNormalState`'s MIN
  height 50px = 0.694444in. Δpx = (50 − 40) = +10.000, the exact reported
  row. `B` (`state B {}`, an empty composite) is 50×50 both sides — exact,
  not reported — because jar never routes it through the EmptyDescription
  branch regardless of the pragma (probe-verified: `sh0012`
  width=0.694444,height=0.694444 = 50×50, matching our `B` node exactly).
- **ruledOut:** entrypoint/exitpoint pseudo-state sizing (`d`=12×12px,
  `__zaent_C`=0.72×0.72px both sides — exact, no row, ruled out by probe);
  a `ClusterHeader`/cluster-title formula effect (`A`/`B` render as plain
  `sh00xx` rect nodes in jar's raw `svek-1.dot`, not `subgraph cluster`, so
  that formula never applies to either).
- **pairingRisk:** possible — OUR two candidate leaf heights (`A`, `B`) are
  tied at 50px, so the harness's sorted-pairing idx2/idx3 slots cannot be
  told apart by number alone. `A` is inferred to be the wrong one from
  jar's raw-dot declaration order (`sh0011` before `sh0012`, matching
  `A`-before-`B` in the puml source), not from an id-aware re-pairing.
- **sharedCauseWith:** none — checked the `10.0`×5 repeated-|Δpx| row
  (dogeji-46-sapo750, resido-15-reza040, viguto-81-gana093); those are a
  DIFFERENT mechanism, the `<<O-O>>` symbol width gap (see
  `resido-15-reza040` below), confirmed by reading their `in.puml` (all
  three declare `<<O-O>>`; this fixture has no `<<O-O>>` state at all).
- **proposedWriteSet:** src/diagrams/state/state-leaf-node.ts (add
  `hideEmptyDescription` to `LeafNodeCtx`, thread it into the
  `measureState` call at :65); src/diagrams/state/state-composite-pass.ts
  (pass it through at the `buildLeafNode` call site, :115)
- **sizeEstimate:** 2 files, ~4-line diff; verify against
  `bilare-19-fufe539` (already-passing flat `hide empty description` case)
  plus `bitaxo-18-tamo974` (composite-sibling case) for no regression.
- **confidence:** high
- **nextStep:** n/a — resolved.

### bujuta-44-rovo666

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | height | 0 | 0.166667 | 0.277778 | -8.000 |
  | 1 | height | 1 | 0.166667 | 0.666667 | -36.000 |
  | 1 | height | 2 | 0.166667 | 0.666667 | -36.000 |
  | 1 | height | 3 | 0.277778 | 0.666667 | -28.000 |
- **status:** resolved
- **mechanism:** `buildLeafNode` sizes every non-port border point
  (`INPUT_PIN`/`OUTPUT_PIN`/`EXPANSION_INPUT`/`EXPANSION_OUTPUT`) as a
  fixed `BORDER_POINT_SIZE` (12×12px), independent of rankdir. Jar's
  `EntityPosition.getDimension(Rankdir)` gives `EXPANSION_INPUT`/
  `EXPANSION_OUTPUT` a rankdir-SWAPPED box (12×48 for `TOP_TO_BOTTOM`,
  48×12 for anything else) — only `ENTRY_POINT`/`EXIT_POINT`/`INPUT_PIN`/
  `OUTPUT_PIN` are truly 12×12 both ways. This fixture sets
  `left to right direction` (jar dot confirms `rankdir=LR;`), so
  `entry1`/`entry2`/`exitA` (all `<<expansionInput>>`/`<<expansionOutput>>`)
  should be 48px tall, not 12.
- **originFileLine:** src/diagrams/state/state-leaf-node.ts:44
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:120-128 (`getDimension(Rankdir)`)
- **causalChain:** true per-node heights (probe, id-aware, scope 1):
  `entry1`/`entry2`/`exitA` ours=12px, jar=48px (Δ=-36px × 3, real);
  `sin`/`sin2`/`Foo`/`Foo1` ours=jar=50px (exact); `__initial__`
  ours=jar=20px (exact). The reported 4 rows are a sorted-pairing artifact
  of a 3-way tie in OUR data (three 12s): ascending ours
  [12,12,12,20,50,50,50,50] vs ascending jar [20,48,48,48,50,50,50,50] →
  idx0 (ours 12 vs jar 20, the true `__initial__` value) reads -8; idx1/2
  (12 vs 48) read -36 each (the two REAL matches); idx3 (ours 20, the true
  `__initial__`, vs jar's remaining 48) reads -28. Sum of |Δ| is identical
  either way (108px) — sorted-pairing is a min-cost transport between two
  sorted lists, so the total is invariant, but the per-row attribution to
  `__initial__` vs the 3rd `EXPANSION_*` node is an artifact, not real.
- **ruledOut:** a per-fixture one-off (re-confirmed against
  `mimaga-15-doze740`/`rinisi-79-peko570`, same puml shape, and
  `nijugi-19-jazi166`, a single-node case with no tie — all four reduce to
  the identical `EntityPosition.getDimension` gap); the state-sizing.ts
  doc comment on `BORDER_POINT_SIZE` (state-entity-position.ts:110-112)
  that assumed "no state-diagram fixture in the corpus exercises
  [EXPANSION_*]" — false, this slice is the counter-example.
- **pairingRisk:** likely — see causalChain; the 3-way tie in OUR data
  means the harness's 4 reported rows do not correspond 1:1 to the 4
  distinct AST nodes with a height in this scope.
- **sharedCauseWith:** mimaga-15-doze740 (same puml, TOP_TO_BOTTOM instead
  of LR — same bug on the width axis), rinisi-79-peko570 (identical puml +
  `set separator none`, LR, same 4 rows byte-for-byte),
  nijugi-19-jazi166 (single-node instance of the same bug, TOP_TO_BOTTOM,
  no tie so a single clean row).
- **proposedWriteSet:** src/diagrams/state/state-leaf-node.ts (thread
  `ctx.rankdir` into the `!usesPortShape(pos)` branch at :40-45; swap
  width/height by `pos === 'expansioninput' || pos === 'expansionoutput'`
  and rankdir, mirroring `fixedPseudostateDim`'s existing `BAR_KINDS`
  rankdir-swap pattern at :125-132); state-entity-position.ts (retire the
  now-falsified doc comment on `BORDER_POINT_SIZE`, or split it into a
  `BORDER_POINT_SIZE` (12, ENTRY/EXIT/PIN) + rankdir-aware
  `EXPANSION_POINT` pair of constants, 12 and 48).
- **sizeEstimate:** 2 files, ~15-line diff (new dimension branch + shape
  helper reuse); verify against all 4 `sharedCauseWith` fixtures plus a
  fresh `<<inputpin>>`/`<<outputpin>>` fixture (unaffected kinds — must
  stay 12×12 both ways) to confirm the fix is EXPANSION_*-scoped only.
- **confidence:** high
- **nextStep:** n/a — resolved.

### mefici-97-tudu030

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 14 | 2.727778 | 2.426389 | +21.700 |
- **status:** resolved
- **mechanism:** composite `TReset` has no child states, only two
  `TReset: **entry** / …` body/attribute lines, so jar draws it as a plain
  leaf `EntityImageState` node (not a cluster) whose field-text width comes
  from a CreoleMode.FULL-parsed `TextBlock` — the literal `**…**` markers
  are consumed as bold formatting, not measured as characters. Our
  `measureLines`/`measureNormalState` measures the RAW body-line string
  (including the 4 literal `*` characters) with no creole stripping at
  all, unrelated to pseudo-states — the `[H]`/`[H*]` history circles this
  fixture was bucketed for (`*historical*Timer`/`*historical*Stopwatch`,
  22×22px) are exact both sides.
- **originFileLine:** src/diagrams/state/state-sizing.ts:209-210 (`bodyLines`/`fields` built from raw `state.description` text, no creole-token stripping, fed straight into `measureLines`:177-187)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:86,98-100 (`Display.create(rawBody).create8(…, CreoleMode.FULL, …)` — a parsed, bold-aware `TextBlock`, not the raw string)
- **causalChain:** probe-measured with the real `WidthTableMeasurer` at
  the fixture's font (14px sans-serif): `"**entry** / display(memTimer)"`
  (raw, ours) = 176.4px; `"entry / display(memTimer)"` (creole-stripped,
  jar's real behavior) = 154.7px — a 21.7px gap from the 4 literal
  asterisk glyphs alone. `measureNormalState` = `max(name, fields) +
  STATE_MARGIN_DELTA(20)`: ours = 176.4 + 20 = 196.4px = 2.727778in
  (matches the probe's own `TReset w=196.4` exactly); jar = 154.7 + 20 =
  174.7px = 2.426389in (matches the row's jar value to 4 decimals). Δpx =
  196.4 − 174.7 = 21.7, the exact reported row. Height is exact (both
  sides 62px = 0.861111in — the two-line field height term is unaffected
  by literal-vs-stripped width, only width).
- **ruledOut:** `[H]`/`[H*]` history-pseudostate sizing
  (`*historical*Timer`/`*historical*Stopwatch` both 22×22px both sides,
  `__init_Timer`/`__init_SActive`/`__initial__` all 20×20px both sides —
  all exact, confirmed by probe, no row); a `ClusterHeader`/title-table
  formula effect (`TReset` is a plain `sh0010` rect in jar's raw dot, not
  a `subgraph cluster` — it has no child states to cluster).
- **pairingRisk:** none — `TReset`'s width (196.4in-scaled) is the unique
  maximum in scope 1's width list on both sides (idx14 of 15 nodes), no
  tie.
- **sharedCauseWith:** unverified but suspected —
  `fibudu-53-bode309` (attribute-line bucket, T6) is the only OTHER slice
  fixture in the mission whose `in.puml` contains a literal `**` (grepped,
  not row-verified); flagging for T14 SYNTHESIS/T6 to confirm whether its
  mismatched row is the same raw-vs-stripped-creole gap. No exact-|Δpx|
  match in the repeated-|Δpx| table (21.7 is unique to this fixture), so
  SCHEMA rule 3 does not require reconciliation here.
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts
  (`measureLines`/`measureNormalState`/`measureEmptyDescription`/
  `measureSdlReceive` all share this raw-text gap — a creole-token-aware
  width measurer, or a `stripCreoleBold`/`stripCreoleMarkup` pre-pass, is
  needed at the ONE shared `measureLines` call site, not per-caller);
  likely a new `src/core/klimt/creole/` module for the strip/measure
  primitive, reused by every diagram engine with the same gap.
- **sizeEstimate:** cross-cutting — likely 1 new core module + 3-4
  state-sizing.ts call sites, but the TRUE blast radius depends on how
  many OTHER buckets/diagrams share the same raw-string measurement path;
  this record only confirms the state-diagram body-line instance.
- **confidence:** high
- **nextStep:** n/a — resolved (for this fixture's own row; the
  cross-bucket/cross-diagram extent is unresolved, see sharedCauseWith).

### mimaga-15-doze740

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 0 | 0.166667 | 0.277778 | -8.000 |
  | 1 | width | 1 | 0.166667 | 0.666667 | -36.000 |
  | 1 | width | 2 | 0.166667 | 0.666667 | -36.000 |
  | 1 | width | 3 | 0.277778 | 0.666667 | -28.000 |
- **status:** resolved
- **mechanism:** identical to `bujuta-44-rovo666` — `buildLeafNode`'s
  fixed 12×12 `BORDER_POINT_SIZE` for `EXPANSION_INPUT`/`EXPANSION_OUTPUT`
  ignores rankdir. This fixture has NO `left to right direction` (default
  `TOP_TO_BOTTOM`), so the mismatch lands on WIDTH instead of HEIGHT
  (jar's `EntityPosition.getDimension(TOP_TO_BOTTOM)` = 48×12, i.e. wide).
- **originFileLine:** src/diagrams/state/state-leaf-node.ts:44
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:120-128
- **causalChain:** probe-verified (id-aware): `entry1`/`entry2`/`exitA`
  ours width=12px, jar width=48px (Δ=-36px × 3, real); `sin`/`sin2`/`Foo`/
  `Foo1` width ≈50px both sides (exact); `__initial__` width=20px both
  sides (exact). Same sorted-pairing tie artifact as `bujuta-44-rovo666`
  (3-way tie at 12 in OUR width list vs jar's 20/48/48/48), producing the
  same -8/-36/-36/-28 row pattern, transposed to width. Total |Δ| = 108px
  either way.
- **ruledOut:** see `bujuta-44-rovo666` — same ruled-out list, transposed
  to width; `sin`/`sin2` (plain states referenced without explicit
  `state` declarations for `sin2`) are unaffected (both exact, MIN 50×50).
- **pairingRisk:** likely — identical 3-way tie mechanism as
  `bujuta-44-rovo666`.
- **sharedCauseWith:** bujuta-44-rovo666, rinisi-79-peko570,
  nijugi-19-jazi166 (all four: one root cause, `EntityPosition
  .getDimension`'s rankdir-swap not ported for EXPANSION_INPUT/OUTPUT).
- **proposedWriteSet:** same as bujuta-44-rovo666 — one fix.
- **sizeEstimate:** covered by the bujuta-44-rovo666 estimate (one fix
  closes all 4 fixtures in this group).
- **confidence:** high
- **nextStep:** n/a — resolved.

### nijugi-19-jazi166

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 0.166667 | 0.666667 | -36.000 |
- **status:** resolved
- **mechanism:** same `EntityPosition.getDimension` rankdir gap as
  `bujuta-44-rovo666`/`mimaga-15-doze740`. This fixture has exactly ONE
  border-point node (`expansionInput`, `<<expansionInput>>`, default
  `TOP_TO_BOTTOM`), so there is no tie and the row maps 1:1 to the real
  node — the cleanest instance of the bug in this slice.
- **originFileLine:** src/diagrams/state/state-leaf-node.ts:44
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:120-128
- **causalChain:** probe-verified: our `expansionInput` node = 12×12px;
  jar's `sh0010` = width 0.666667in=48px, height 0.166667in=12px (height
  exact, not reported). Δpx = 12 − 48 = −36.000, matching the row exactly.
- **ruledOut:** a scope/cluster-header effect (`expansionInput` is inside
  `subgraph cluster6` as a plain `rank=source` member node, not itself a
  cluster; its own `cluster6ee` title-table WIDTH=30 governs the
  CONTAINER, not this row, which is the child node's own declared size).
- **pairingRisk:** none — single node, no tie.
- **sharedCauseWith:** bujuta-44-rovo666, mimaga-15-doze740,
  rinisi-79-peko570.
- **proposedWriteSet:** same as bujuta-44-rovo666.
- **sizeEstimate:** covered by the bujuta-44-rovo666 estimate.
- **confidence:** high
- **nextStep:** n/a — resolved.

### resido-15-reza040

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 6 | 0.861111 | 1 | -10.000 |
- **status:** resolved
- **mechanism:** `state comp3 <<O-O>>` triggers jar's `Stereotype
  .isWithOOSymbol()` branch in `EntityImageState`, which adds `2 *
  smallRadius + smallMarginY` (=10px) to BOTH width and height via
  `XDimension2D#delta`'s single-value form (the small O-O circle-glyph
  reservation). Our `measureNormalState` has no `isWithOOSymbol`
  equivalent at all — NOT a pseudo-state effect: `en1`-`en4`
  (`<<entrypoint>>`/`<<exitpoint>>`, the reason this fixture matched the
  classifier) are exact 12×12px on both sides, no row.
- **originFileLine:** src/diagrams/state/state-sizing.ts:207-215 (`measureNormalState` — no OO-symbol term)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:71,74,85,108-110 (`smallRadius=3`, `smallMarginY=4`, `withSymbol`, `heightSymbol += 2*smallRadius+smallMarginY` added to `delta()`)
- **causalChain:** `comp3`'s name-only width (no body) is identical on
  both sides at ~42px (back-solved: 42 + `STATE_MARGIN_DELTA`(20) = ours'
  62px = 0.861111in, matching probe exactly; 42 + 20 + `heightSymbol`(10)
  = jar's 72px = 1.0in, matching the row's jar value exactly). Δpx = 62 −
  72 = −10.000, the exact reported row. Height is exact both sides
  (50px=0.694444in) because the name+body height term is already ≥
  `MIN_HEIGHT`(50) before the OO delta would matter, so the missing term
  is invisible on that axis, only on width.
- **ruledOut:** entrypoint/exitpoint sizing (`en1`-`en4` all 12×12px both
  sides, exact, confirmed by probe); a `ClusterHeader` formula effect
  (`comp3` is a leaf with NO braces — never a cluster on either side).
- **pairingRisk:** none — `comp3`'s width is the unique maximum in scope
  1's width list on both sides (idx6 of 7 nodes), no tie.
- **sharedCauseWith:** dogeji-46-sapo750, viguto-81-gana093 (both
  `stereotype` bucket, T7) — reconciling the `10.0`×5 repeated-|Δpx| row:
  their `in.puml` (read for verification) both declare `<<O-O>>` states
  too (`SCREEN_*` / `HandleFailure`), the SAME `isWithOOSymbol` gap. The
  5th member of that row, `bitaxo-18-tamo974` (this same T4 slice), is
  explicitly NOT this cause — see its own record's `sharedCauseWith`
  entry; a coincidental |Δpx|=10, not a shared mechanism (no `<<O-O>>` in
  that fixture at all).
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts
  (`measureNormalState`: read `state.stereotype?.toLowerCase() === 'o-o'`
  — or however `Stereotype.isWithOOSymbol()`'s real predicate resolves,
  not yet read in this record — and add the 10px `heightSymbol` term to
  the `delta` computation, both axes); state-entity-position.ts or a new
  small const module for `SMALL_RADIUS`/`SMALL_MARGIN_Y`; renderer-box.ts
  eventually needs the glyph draw too (out of this mission's scope,
  ADR-2/ADR-5 — sizing only).
- **sizeEstimate:** T7's territory (stereotype bucket owns the `<<O-O>>`
  mechanism proper) — 1-2 files, but `Stereotype.isWithOOSymbol()`'s exact
  predicate (which stereotype strings qualify beyond literal `O-O`) needs
  reading before a patch; flagged for T7/SYNTHESIS, not re-solved here.
- **confidence:** high
- **nextStep:** n/a — resolved (mechanism and arithmetic are pinned; the
  FIX itself belongs to T7's write-set per sharedCauseWith).

### rinisi-79-peko570

- **bucketLabel:** pseudo-state
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | height | 0 | 0.166667 | 0.277778 | -8.000 |
  | 1 | height | 1 | 0.166667 | 0.666667 | -36.000 |
  | 1 | height | 2 | 0.166667 | 0.666667 | -36.000 |
  | 1 | height | 3 | 0.277778 | 0.666667 | -28.000 |
- **status:** resolved
- **mechanism:** identical to `bujuta-44-rovo666` — same puml shape (plus
  `set separator none`, which has no size effect) and identical
  `left to right direction` — same `EntityPosition.getDimension` rankdir
  gap on the height axis. Probe-confirmed byte-identical `svek-1.dot`
  node shape/values to `bujuta-44-rovo666`.
- **originFileLine:** src/diagrams/state/state-leaf-node.ts:44
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:120-128
- **causalChain:** identical arithmetic to `bujuta-44-rovo666` (same
  fixture shape) — see that record's causalChain, unchanged.
- **ruledOut:** see bujuta-44-rovo666.
- **pairingRisk:** likely — identical 3-way tie mechanism as
  bujuta-44-rovo666.
- **sharedCauseWith:** bujuta-44-rovo666, mimaga-15-doze740,
  nijugi-19-jazi166.
- **proposedWriteSet:** same as bujuta-44-rovo666 — one fix.
- **sizeEstimate:** covered by the bujuta-44-rovo666 estimate.
- **confidence:** high
- **nextStep:** n/a — resolved.
