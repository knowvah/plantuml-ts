# stereotype findings (T7)

Slice per `PARTITION.md#stereotype`: dogeji-46-sapo750, gokife-89-boja382,
mosigo-88-rove013, rijoki-89-teno556, viguto-81-gana093. Four of the five
(`dogeji`, `mosigo`, `rijoki`, `viguto`) share ONE real cause — the `<<O-O>>`
symbol-size gap, cross-confirmed against `pseudo-state.md`'s
`resido-15-reza040` record (independently diagnosed by T4, same mechanism,
same javaRef). `gokife-89-boja382` has NOTHING to do with `<<O-O>>` or any
stereotype (ADR-3 provenance-only) — it is a 3-level single-child composite
nesting height gap, the SAME family T1/T2 already flagged unresolved on
`decede-10-buvu414`/`pacami-67-dafe414`/`tofezi-64-koda860`/
`xojudi-20-keco020`.

### dogeji-46-sapo750

- **bucketLabel:** stereotype
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 6 | 3.092361 | 3.194444 | -7.350 |
  | 1 | width | 7 | 3.123958 | 3.23125 | -7.725 |
  | 1 | width | 8 | 3.170139 | 3.262847 | -6.675 |
  | 1 | width | 9 | 3.194444 | 3.309028 | -8.250 |
  | 1 | width | 10 | 3.50191 | 3.640799 | -10.000 |
  | 1 | width | 11 | 4.184896 | 4.323785 | -10.000 |
- **status:** resolved
- **mechanism:** the 5 states declared `<<O-O>>`
  (`SCREEN_REGISTER_AUTHENTIFICATION`, `SCREEN_FIRMWARE_CHOICE`,
  `SCREEN_FLASHER_CONNECT`, `SCREEN_PROGRAMMER_CHOICE`,
  `SCREEN_FLASHING_REPORT`) should each gain +10px width AND height in jar
  (`Stereotype.isWithOOSymbol()` → `EntityImageState`'s `heightSymbol`
  term). Our `measureNormalState` has no such branch, so none of the 5
  widen. Because 5 of 7 named states in scope 1 are affected and the
  6th named state (`SCREEN_HOME`, not `<<O-O>>`) is unaffected, jar's
  sorted-width array shifts relative to ours: `SCREEN_HOME` moves from
  OUR position idx9 to JAR's position idx6, so the harness's sorted-index
  pairing (idx6-idx9) compares DIFFERENT real states across the two
  sides — only idx10/idx11 pair the true SAME state on both sides.
- **originFileLine:** src/diagrams/state/state-sizing.ts:206-214 (`measureNormalState` — no O-O/withSymbol branch)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:85,107-112 (`withSymbol`, `heightSymbol += 2*smallRadius+smallMarginY`, `dim.delta(...)` applies the SAME term to both axes); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotype.java:119-121 (`isWithOOSymbol` — exact-match, case-insensitive, literal `"<<O-O>>"`)
- **causalChain:** probe (`scripts_scratch/T7/probe1.ts dogeji-46-sapo750`,
  id-aware) gives OUR scope-1 width-sorted array (px, non-tiny nodes only):
  `SCREEN_FLASHING_REPORT=222.65, SCREEN_FIRMWARE_CHOICE=224.925,
  SCREEN_FLASHER_CONNECT=228.25, SCREEN_HOME=230.0,
  SCREEN_PROGRAMMER_CHOICE=252.1375, SCREEN_REGISTER_AUTHENTIFICATION
  =301.3125, SCREEN_FLASHING_VALIDATION=439.125` (positions 6-12).
  Adding jar's +10px to the 5 `<<O-O>>` members only, predicted JAR
  sorted array: `SCREEN_HOME=230.0(unchanged), FLASHING_REPORT=232.65,
  FIRMWARE_CHOICE=234.925, FLASHER_CONNECT=238.25,
  PROGRAMMER_CHOICE=262.1375, REGISTER_AUTH=311.3125,
  FLASHING_VALIDATION=439.125(unchanged)`. Position-by-position
  Δpx=(ours−predicted-jar): pos6 222.65−230.0=−7.35; pos7
  224.925−232.65=−7.725; pos8 228.25−234.925=−6.675; pos9
  230.0−238.25=−8.25; pos10 252.1375−262.1375=−10.000; pos11
  301.3125−311.3125=−10.000 — matches all 6 reported rows EXACTLY (to
  3 decimals), confirming the single +10px-per-`<<O-O>>`-state model
  fully explains the row set with no residual. No height rows: every
  named state here is well above `MIN_HEIGHT`(50) before AND after the
  missing +10, so the height term never surfaces (unlike `viguto`,
  below, where a clamp interaction does surface it).
- **ruledOut:** a genuine 6th `<<O-O>>` state (only 5 are declared,
  confirmed by reading `in.puml`); a text-measurement width defect on any
  individual name (the position-by-position reconstruction above needs
  ONLY the flat +10px term to reproduce every row, no additional slack);
  `SCREEN_FLASHING_VALIDATION`/`SCREEN_HOME` contributing rows of their
  own (both fall outside the mismatched set, consistent with them being
  unaffected by the missing term).
- **pairingRisk:** likely — idx6-idx9 do not pair the same real state on
  each side (see mechanism); idx10/idx11 are 1:1 correct (unique maxima,
  no other node close in size).
- **sharedCauseWith:** mosigo-88-rove013, rijoki-89-teno556,
  viguto-81-gana093 (this bucket, same missing-term); resido-15-reza040
  (`pseudo-state.md`, T4 — independently diagnosed, same `javaRef`,
  explicit cross-reference in that record). Reconciling the `10.0`×5
  repeated-|Δpx| row (`PARTITION.md`): this fixture's idx10/idx11 rows
  and `viguto-81-gana093`'s width row are the SAME cause;
  `bitaxo-18-tamo974`/`resido-15-reza040` (pseudo-state) — per that
  bucket's own record, `resido` IS this cause (see above) but `bitaxo` is
  NOT (a `hideEmptyDescription`-threading bug, unrelated, confirmed by
  reading that record).
- **proposedWriteSet:** src/diagrams/state/state-sizing.ts
  (`measureNormalState`: add `state.stereotype?.toUpperCase() === 'O-O'`
  branch — matches `Stereotype.isWithOOSymbol()`'s exact predicate, now
  confirmed by reading `Stereotype.java:119-121` directly — adding a
  10px `SMALL_RADIUS*2+SMALL_MARGIN_Y` term to both axes before the
  `atLeast(MIN_WIDTH, MIN_HEIGHT)` clamp); a new small const pair
  (`SMALL_RADIUS=3`, `SMALL_MARGIN_Y=4`) alongside `STATE_MARGIN_DELTA`.
  Renderer-side circle-glyph draw (`EntityImageState.drawSymbol`,
  `EntityImageState.java:174-181`) is a SEPARATE, unverified gap — not
  probed this task, sizing-only per ADR-2/ADR-5.
- **sizeEstimate:** 1 file, ~6-line diff (one const pair + one branch in
  `measureNormalState`); verify against all 4 `sharedCauseWith` fixtures
  plus `resido-15-reza040` for no regression; corpus-wide grep for
  `<<O-O>>` needed to size the full blast radius (not run this task).
- **confidence:** high
- **nextStep:** n/a — resolved.

### gokife-89-boja382

- **bucketLabel:** stereotype
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 0 | 2.694445 | 2.694444 | +0.000 |
  | 3 | height | 0 | 4.027778 | 4.041667 | -1.000 |
- **status:** unresolved
- **mechanism:** NOT a stereotype effect — `<<statechart>>`/
  `<<statemachine>>`/`<<initialstate>>` here are plain user-authored
  display text (baked into `state "..." as X <<stereotype>>`'s NAME
  string via `&#171;...&#187;`), never reaching `Stereotype
  .isWithOOSymbol()` or any stereotype-conditioned formula (confirmed:
  `titleAndAttributeHeight`'s `stereoLines` term is hardcoded 0 for
  state diagrams regardless — `state-composite-cluster.ts:301-327`'s own
  doc comment — and this fixture's structure doesn't even reach that
  cluster-header code path; see below). This fixture is 3 levels of
  SINGLE-CHILD composite nesting (`statechart{statemachine{initialstate
  {}}}`), each rendered as a plain autonom-wrapped node (no graphviz
  `subgraph cluster` in any `svek-N.dot` — confirmed by reading all 3
  cached dot files). The scope-3 node (outermost, `statechart`, 3 body
  lines via literal `\n`) is 1px short in height; scope-2 (`statemachine`,
  no body) is correct to float noise. Root cause not fully isolated —
  same unresolved family as `composite-b.md`'s `pacami-67-dafe414` (and
  its `sharedCauseWith` list), differing only in nesting SHAPE
  (single-child chain here vs. sibling `A{B,C}` there).
- **originFileLine:** src/diagrams/state/state-composite-sizing.ts:64-90 (`measureAutonomWrapper`); candidate sub-site src/diagrams/state/layout-ink-extent.ts:514-529 (`computeSvekResultGeometry`, the `childImg` term)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/InnerStateAutonom.java:186-197 (`calculateDimensionSlow` — `text.mergeTB(attr,img).delta(MARGIN*2+2*MARGIN_LINE+marginForFields)`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135 (`calculateDimension`, `delta(15,15)` — the recursive `im`/`childImg` term)
- **causalChain:** probe (`scripts_scratch/T7/probe1.ts`) gives our scope3
  node (`8E437FA1B6DC905`) = 629.2625×290.000008px, scope2 node
  (`6D4FA3B201978C`) = 588.2625×194.000008px (jar: 588.2625×194.0px,
  sub-pixel only — NOT the signal). Reconstructing `measureAutonomWrapper`
  term-by-term with the SAME `WidthTableMeasurer` the real render uses
  (`scripts_scratch/T7/probe2.ts`): title "«statechart» Master Switchgear
  Model - Logic" = 1 line × 14px = 14; attribute "Rule:/if(...)/
  'switchgearStatus':=$OPEN$" (3 lines via literal `\n`) = 3×14 = 42;
  `delta` = MARGIN*2+2*MARGIN_LINE+marginForFields = 10+10+5 = 25.
  14+42+25 = 81; 290.000008−81 = 209.000008 ⇒ THIS is the `childImg`
  (im/computeSvekResultGeometry) term the formula actually used. Verified
  via `scripts_scratch/T7/probe3.ts` (calling `computeSvekResultGeometry`
  directly on a synthetic single-child node sized like scope2's real
  output): returns exactly `{width:603.2625, height:209.000008}` — i.e.
  588.2625+15 / 194.000008+15, the SAME `.delta(15,15)` jar's
  `SvekResult.calculateDimension` (`SvekResult.java:135`) applies. So OUR
  formula, OUR text/attr sums, and OUR `+15,+15` ink padding are ALL
  independently confirmed correct against the cited Java; the residual
  1px must be in what jar's `im`/scope-2-equivalent VALUE actually is
  going INTO its own parent's `im.calculateDimension()` — not yet probed
  further (would require instrumenting `@knowvah/dot-engine`'s own
  sub-layout of a single bare node, out of a docs-only probe's reach).
- **ruledOut:** text/attribute line-height formula (jar's real
  deterministic-mode bounder, `StringBounderFromWidthTable.java:67-79`,
  returns `height=size` flat — IDENTICAL to our `measurer.ts:88,192`'s
  `height: font.size`, confirmed by reading both; no per-line leading/
  bold adjustment on either side, so the 14/42/56 sums are exact
  matches, not the source); the `delta`/margin constants (MARGIN=
  MARGIN_LINE=5 both sides, confirmed identical values,
  `state-composite-sizing.ts:22-26` vs `IEntityImage.MARGIN`); the
  `.delta(15,15)` ink-padding constant itself (confirmed identical,
  `SvekResult.java:135` vs our probe3 reproduction); a `<<O-O>>`/
  stereotype-conditioned term (none of the 3 nested states declare
  `<<O-O>>`, and jar's own `stereoLines` term for state clusters is
  unconditionally 0 regardless per `state-composite-cluster.ts:301-327`,
  which this fixture doesn't even reach — no `subgraph cluster` in any
  cached `svek-N.dot`).
- **pairingRisk:** none — every scope here has exactly ONE node, no
  sorting/tie ambiguity possible.
- **sharedCauseWith:** pacami-67-dafe414, tofezi-64-koda860,
  xojudi-20-keco020 (`composite-b.md`, T2), decede-10-buvu414
  (`composite-a`, T1, per T2's own cross-reference) — SAME unresolved
  family (a 1px shortfall in the recursive composite `childImg`/`im`
  term for a composite wrapping ANOTHER composite), same `javaRef`
  pair (`InnerStateAutonom.java:186-197` + `SvekResult.java:130-135`).
  Flagging the SHAPE difference for T14: T2's 4 fixtures are all
  `A{B,C}` (composite wraps a LEAF sibling + a composite sibling); this
  fixture is a 3-deep single-child CHAIN with no leaf sibling at all —
  worth confirming at SYNTHESIS whether it is truly the identical
  mechanism or a same-symptom cousin. NOT shared with
  `dogeji`/`mosigo`/`rijoki`/`viguto` above (this bucket's OTHER 4
  records) — different code path entirely (composite/autonom wrapper vs.
  leaf-state `<<O-O>>` sizing), confirmed by reading both call sites; the
  `1.0`×8 repeated-|Δpx| row's other 3 members
  (`fatupo-62-bemu777`/`jijuze-43-ceva131`/`juvagu-33-dupa212`, in
  `note`/`concurrent-region`/`attribute-line`) are NOT checked here —
  `juvagu-33-dupa212`'s own fixture (`one: \t<sup>1</sup>`, a single leaf
  state with a creole superscript+tab body) is structurally unrelated to
  a nested-composite `childImg` term, so a shared cause is unlikely, but
  this is a judgment call, not a probe-verified ruling — left for T14.
  The `0.0` group's `+0.000` row here is float noise (<0.001px,
  formatting-level), not a real signal — not reconciled against the
  `0.0`×13 group (`mosigo-88-rove013`'s own `-0.000` included; see that
  record — coincidental, both are independent sub-pixel artifacts).
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
  (`computeSvekResultGeometry`/`buildInkBox`, pending confirmed origin);
  src/diagrams/state/state-composite-autonom.ts (`childImg` assembly,
  :198-203) — same candidate pair T2 already named for `pacami-67-dafe414`.
- **sizeEstimate:** small per-fixture blast radius if isolated (1
  function), but the shape difference from T2's 4 fixtures means the fix
  needs verification against BOTH nesting shapes (`A{B,C}` sibling AND
  this 3-deep single-child chain) before being called closed.
- **confidence:** low
- **nextStep:** instrument `@knowvah/dot-engine`'s own layout of a
  synthetic single-bare-node DOT graph (no edges) and compare its
  returned bounding box against the `.delta(15,15)`-only prediction our
  `computeSvekResultGeometry` uses — isolates whether the missing 1px is
  in the dot-engine's own node-placement margin/rounding for a
  single-node subgraph, vs. elsewhere in the ink-box math. Same
  instrumentation would also resolve T1/T2's parallel open item.

### mosigo-88-rove013

- **bucketLabel:** stereotype
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 1 | 0.694444 | 0.730208 | -2.575 |
  | 2 | width | 2 | 2.14434 | 2.146624 | -0.164 |
  | 2 | height | 2 | 3.555555 | 3.555556 | -0.000 |
- **status:** resolved
- **mechanism:** same missing `<<O-O>>` size term as `dogeji-46-sapo750`,
  on state `Idle` (`state Idle <<O-O>>`). `Idle`'s own name-only width is
  short enough that jar's real (base+10) width (52.575px) sits just
  ABOVE `MIN_WIDTH`(50), so jar reports it unclamped, while OUR
  (base, no +10) width sits BELOW 50 and gets clamped UP to exactly 50 —
  the clamp partially masks, but does not hide, the missing term. The
  scope-2 row (`NotShooting`, the composite wrapping `Idle`) is a
  DOWNSTREAM propagation of the same `Idle`-width shortfall through the
  composite's own ink-box/layout pass, not an independent cause.
- **originFileLine:** src/diagrams/state/state-sizing.ts:206-214 (`measureNormalState`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:85,107-112; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotype.java:119-121
- **causalChain:** probe (id-aware) gives scope-1 sorted widths
  `[20(__init), 50(Idle), 91.6625(Configuring)]` — `Idle` is the unique
  idx1 match (0.694444in=50.0px, exactly `STATE_MIN_WIDTH`, i.e.
  clamped). Back-solving: jar's row value 0.730208in×72=52.575px is
  `Idle`'s pre-clamp width(42.575)+10; since 52.575>50, jar does NOT
  clamp. Ours: pre-clamp width(42.575, name+margins only, matching jar's
  same base since text measurement is otherwise identical)+0(missing
  term)=42.575<50, so `atLeast` clamps to 50.0. Δpx=50.0−52.575=−2.575,
  matching the row exactly. Scope-2 idx2 (`NotShooting`, width
  154.3925px/72=2.14434, height 255.99996/72=3.555555) — jar's width
  2.146624in=154.557px is 0.164px more, a small propagated effect of
  `Idle`'s own width shortfall through the composite's child-ink layout
  (not independently re-derived to the single-pixel level — see
  `ruledOut`). Height row is sub-pixel noise (<0.001px), not the signal.
- **ruledOut:** a second, independent scope-2 defect — `NotShooting`'s
  own title/attribute/margin terms are unaffected by `<<O-O>>` (it is
  not itself stereotyped), and 0.164px is far too small to be a whole
  missing term (10px, 20px, etc. — the only constants this codebase's
  state-sizing formulas use); `Configuring`/`Shooting`/`__initial__` all
  exact on both sides (confirmed by probe, no row).
- **pairingRisk:** none — `Idle` (50.0) is uniquely separated from its
  scope-1 neighbors (20, 91.6625), no tie; `NotShooting` likewise unique
  in scope 2.
- **sharedCauseWith:** dogeji-46-sapo750, rijoki-89-teno556,
  viguto-81-gana093 (same missing `<<O-O>>` term); reconciling the
  `2.6`×5 repeated-|Δpx| row: `feziva-71-gufo538`/`mujipe-99-fume794`/
  `nixoja-06-guxe431` (`skinparam-style.md`, T5, all `+2.550`) are NOT
  this cause — opposite sign (ours LARGER, not smaller) and a different
  row shape (`1 width 0`, a skinparam-driven state, not an `<<O-O>>`
  clamp interaction) — coincidental magnitude match only, confirmed by
  reading `PARTITION.md`'s skinparam-style rows.
- **proposedWriteSet:** same as `dogeji-46-sapo750`.
- **sizeEstimate:** covered by the `dogeji-46-sapo750` estimate — one fix
  closes both, plus `rijoki-89-teno556`/`viguto-81-gana093`.
- **confidence:** high
- **nextStep:** n/a — resolved.

### rijoki-89-teno556

- **bucketLabel:** stereotype
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 3 | 0.694444 | 0.730208 | -2.575 |
- **status:** resolved
- **mechanism:** identical to `mosigo-88-rove013` — same puml shape
  (`state Idle <<O-O>>` inside a `NotShooting` composite; this fixture
  additionally sets `set separator none` and uses `{ }` instead of
  `begin`/`end state`, no size effect) and the SAME `Idle`/`MIN_WIDTH`
  clamp interaction. Scope-1 here has 6 nodes (an extra `__zaent_*` point
  node vs. `mosigo`'s 3), so `Idle` lands at sorted idx3 instead of idx1,
  but the value pair (0.694444/0.730208, Δ−2.575) is byte-identical.
- **originFileLine:** src/diagrams/state/state-sizing.ts:206-214 (`measureNormalState`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:85,107-112; ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotype.java:119-121
- **causalChain:** probe (id-aware) scope-1 sorted widths
  `[0.72(__zaent), 20(__init), 20(__initial__), 50(Idle), 75.3(Shooting),
  91.6625(Configuring)]` — `Idle` is the unique idx3 match. Same
  arithmetic as `mosigo-88-rove013`'s `Idle` row: pre-clamp
  base(42.575)+10(jar)=52.575, unclamped; ours 42.575+0, clamped to 50.
  Δpx=50.0−52.575=−2.575, matching the row exactly. No scope-2 composite
  row here (unlike `mosigo`) — `NotShooting`'s own declared size is
  exact on both sides for this fixture, ruling out the propagation this
  bucket's `mosigo` record flags as a possible downstream effect (it is
  NOT always present, confirming it is fixture-dependent layout noise,
  not a second defect).
- **ruledOut:** the extra `__zaent_NotShooting` point node
  (0.72×0.72px both sides, exact, confirmed by probe — a border-point
  marker unrelated to `<<O-O>>`); a scope-2 propagation effect (absent
  here, unlike `mosigo-88-rove013` — see causalChain).
- **pairingRisk:** none — `Idle` (50.0) has no tie among the 6 scope-1
  nodes.
- **sharedCauseWith:** dogeji-46-sapo750, mosigo-88-rove013,
  viguto-81-gana093 (same missing `<<O-O>>` term; `mosigo` in particular
  shares this EXACT Δpx value and root state name — `Idle` — confirming
  a single shared cause, not a coincidence).
- **proposedWriteSet:** same as `dogeji-46-sapo750`.
- **sizeEstimate:** covered by the `dogeji-46-sapo750` estimate.
- **confidence:** high
- **nextStep:** n/a — resolved.

### viguto-81-gana093

- **bucketLabel:** stereotype
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 1 | width | 5 | 1.954861 | 2.09375 | -10.000 |
  | 1 | height | 5 | 0.694444 | 0.805556 | -8.000 |
- **status:** resolved
- **mechanism:** same missing `<<O-O>>` term, on `state HandleFailure
  <<O-O>>`, which ALSO has a body (`HandleFailure : FailureSubmachine`).
  `HandleFailure`'s width (140.75px) is well above `MIN_WIDTH`, so the
  width row is a CLEAN, unclamped −10.000 (the full missing term). Its
  height, however, sits just below `MIN_HEIGHT`(50) once the missing
  +10 is subtracted, so OUR height gets clamped UP to 50 while jar's
  (correctly +10'd) height of 58 is unclamped — the clamp absorbs 2 of
  the missing 10px on this axis, leaving a residual −8.000, not −10.000.
- **originFileLine:** src/diagrams/state/state-sizing.ts:206-214 (`measureNormalState`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageState.java:85,104-113 (`calculateDimensionSlow` — `dim = name.mergeTB(fields)`, `heightSymbol`, `atLeast(MIN_WIDTH,MIN_HEIGHT)`); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotype.java:119-121
- **causalChain:** probe (id-aware) gives `HandleFailure`=140.75×50px,
  the unique scope-1 width maximum (idx5 of 6). Width: jar
  2.09375in×72=150.75px; ours 140.75px; Δ=140.75−150.75=−10.000, exact
  match, no clamp interaction (140.75 and 150.75 both far above
  `MIN_WIDTH`=50). Height: jar's `EntityImageState.calculateDimensionSlow`
  = `name.height(14)+fields.height(14)` (1-line name + 1-line body
  "FailureSubmachine") `+STATE_MARGIN_DELTA(20)+heightSymbol(10)` = 58px
  = 0.805556in, matching the row's jar value exactly. Ours =
  14+14+20(no +10) = 48px, below `MIN_HEIGHT`(50), so `atLeast` clamps to
  50px=0.694444in, matching the row's ours value exactly. Δpx=50−58=
  −8.000, matching the row exactly — fully explained by the SAME missing
  term interacting with the height clamp, no second cause needed.
- **ruledOut:** a body/description-specific formula gap (`fields`
  measures identically on both sides — the arithmetic above needs ONLY
  the flat name+fields+margin sum, no adjustment, to reproduce jar's
  pre-`<<O-O>>` height of 48); `State1`/`test`/`Foo`/`Foo2`/`__initial__`
  all exact on both sides (confirmed by probe, no rows).
- **pairingRisk:** none — `HandleFailure` is the unique scope-1 width
  maximum on both sides; height axis pairs it at the same idx5 (jar's
  sorted heights: 5 states at 50 + 1 at 58 — `HandleFailure` is the
  unique non-50 value, unambiguous).
- **sharedCauseWith:** dogeji-46-sapo750, mosigo-88-rove013,
  rijoki-89-teno556. Reconciling the `10.0`×5 row: this fixture's width
  row and `dogeji-46-sapo750`'s idx10/idx11 rows are the SAME cause
  (flat, unclamped +10 gap); `bitaxo-18-tamo974`/`resido-15-reza040`
  (pseudo-state) are a MIX — `resido` IS this same `<<O-O>>` cause (its
  own record cites this bucket explicitly), `bitaxo` is NOT (unrelated
  `hideEmptyDescription` bug, per that record). Reconciling the `8.0`×4
  row: `bujuta-44-rovo666`/`mimaga-15-doze740`/`rinisi-79-peko570`
  (pseudo-state) are NOT this cause — their own record attributes all
  three to a `EntityPosition.getDimension` rankdir gap on
  `EXPANSION_INPUT`/`EXPANSION_OUTPUT` border points, an entirely
  different entity kind (border-point pseudostates, not a named `<<O-O>>`
  state) — coincidental magnitude match only, confirmed by reading that
  bucket's record.
- **proposedWriteSet:** same as `dogeji-46-sapo750`.
- **sizeEstimate:** covered by the `dogeji-46-sapo750` estimate.
- **confidence:** high
- **nextStep:** n/a — resolved.
