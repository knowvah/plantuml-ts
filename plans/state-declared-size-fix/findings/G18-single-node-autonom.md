# G18 — D7: 1 px shortfall on a bare single-node autonom (gokife-89)

Re-measured first (`npx jiti scripts/measure-composite-declared-size.ts
gokife-89-boja382`): unchanged by Batches 1-3. `gokife-89-boja382` IS in
`expected-moves.txt` (T6's `**bold**`/creole-seam text fix moved its
rendered SVG), but the declared-size rows are byte-identical to SI28's
original record — T6 changed how the bold text renders, not this
fixture's composite width/height arithmetic.

### gokife-89-boja382

- **bucketLabel:** G18 (SI28 `stereotype.md`; SYNTHESIS.md §3.2 split it
  out of G5 as its own group — see mechanism below, which reunites it)
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | height | 0 | 2.694445 | 2.694444 | +0.000072 |
  | 3 | height | 0 | 4.027778 | 4.041667 | -1.000008 |
- **status:** resolved
- **mechanism:** the scope-2 row is float noise (0.000072 px, below
  `EXACT_EPSILON`), not a signal. The scope-3 row IS mechanism 8 / G5
  (`RoundedSouth` south-cap uninset ink) — the SAME cause T9 already
  diagnosed and deferred for `pacami-67-dafe414`/`tofezi-64-koda860`/
  `xojudi-20-keco020`/`decede-10-buvu414` — **not** a distinct dot-engine
  effect, contradicting SI28 SYNTHESIS.md §3.2's refutation. `statechart`
  (`8E437FA1B6DC905`, scope 3) sizes itself via `measureAutonomWrapper`
  with `childImg = computeSvekResultGeometry(inkStates=[materialized
  statemachine node], [])` — statechart's own children-pass graph has
  exactly ONE graphviz node, `statemachine` (`6D4FA3B201978C`). SYNTHESIS
  §3.2 refuted the G5 cause here because "every scope... has exactly ONE
  node and there is no composite outer box... for a south cap to be
  missing from" — but that ONE node IS itself a composite: `statemachine`
  wraps `stInit` (1 child), so `GroupMakerState.getImage`
  (`GroupMakerState.java:113-136`, `countChildren()==0` is the ONLY
  leaf-image branch) returns `InnerStateAutonom(image, statemachineGroup)`
  for it, not a plain leaf. When `computeSvekResultGeometry`'s ink walk
  recurses into this node (`addNodeInk`'s `children.length > 0` branch,
  `layout-ink-extent.ts:316-321`, matching jar's real
  `TextBlockUtils.getMinMax` walk of `SvekResult.drawU` → `image.drawU()`
  per node), the REAL jar draw is `InnerStateAutonom.drawU` for
  `statemachine` → `RoundedContainer.drawU`
  (`RoundedContainer.java:89-97`) → `RoundedSouth(width=588.2625,
  height=194.000008-24-0=170.000008, backColor=LightYellow(opaque),
  rounded=25).drawU(dy=24)`. `statemachine`'s stereotype
  `<<statemachine>>` resolves to an OPAQUE `LightYellow` south background
  (`in.puml`'s own `skinparam state { backgroundColor<<statemachine>>
  LightYellow }`), so `RoundedSouth.drawU`'s `if
  (backColor.isTransparent()) return;` guard (`RoundedSouth.java:47-49`)
  does NOT early-return, and `RoundCorner` defaults to 25 (nonzero,
  `plantuml.skin:268`, `stateDiagram.state.RoundCorner 25`), so it draws
  the `UPath` (arc-cornered) variant, not a plain `URectangle`.
  `LimitFinder#drawUPath` (`LimitFinder.java:164-166`) applies ZERO inset
  on either corner (`addPoint(x+minX,y+minY); addPoint(x+maxX,y+maxY)`),
  unlike `LimitFinder#drawRectangle` (`:184-187`, `-1` on both). The south
  cap's local bbox is `[0,588.2625]x[0,170.000008]`, translated by
  `dy=24`, so its ink reaches `y=24+170.000008=194.000008` — the
  composite's FULL height, uninset — 1px past the outline rect's own
  inset max (`y+h-1=193.000008`, `RoundedContainer.java:94`'s `ug.draw
  (rect)`). Our port's `addStateBoxInk` (composite branch, `hasStateBoxInk
  (box, node, true)` at `layout-ink-extent.ts:321`) has no south-cap term
  at all — it only applies the plain rect-ink rule (`-1`/`+w`/`h-1`),
  so it never reaches the extra pixel. Width is unaffected because
  the composite ink rule already uses the UNINSET `x+w` (the
  divider-line rule, itself zero-inset) for X — this is why the width
  row stays exact while only height is short.
- **originFileLine:** src/diagrams/state/layout-ink-extent.ts:316-321
  (`addNodeInk`'s composite branch — `addStateBoxInk(box, node, true)`,
  no south-cap uninset term; the same site the module's own doc comment,
  lines 75-93, already names as "mechanism 8", deferred by T9)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedContainer.java:89-97 (RoundedNorth/drawCenter/RoundedSouth construction + draw, divider lines); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/RoundedSouth.java:47-83 (`drawU`: `backColor.isTransparent()` early-return gate; `rounded!=0` UPath arcTo variant); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:164-166 (`drawUPath`, zero inset) vs :184-187 (`drawRectangle`, `-1` inset both corners); ~/git/plantuml/src/main/resources/skin/plantuml.skin:268 (`stateDiagram.state.RoundCorner 25`, default nonzero); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GroupMakerState.java:113-136 (`getImage` — `countChildren()==0` is the only leaf-image branch; a 1-child group is ALWAYS `InnerStateAutonom` wrapping a real `GraphvizImageBuilder` pass, no "single-child shortcut" exists jar-side, confirming our own always-run-a-pass architecture is correct); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135 (`calculateDimension` → `TextBlockUtils.getMinMax(this,...)`, walking `SvekResult.drawU`'s per-node `image.drawU()`)
- **causalChain:** `statemachine`'s own declared height = 194.000008 px
  (exact both sides, scope-2 row). Title text = 14px (1 line), no
  attribute (`descriptionHeight=0`), `nameHeight=MARGIN(5)+14+MARGIN_LINE
  (5)=24`. `statechart`'s title = 14px (1 line), attribute (3 `\n`-split
  lines) = 42px, `delta=MARGIN*2+2*MARGIN_LINE+MARGIN(marginForFields)=25`
  — all independently exact (back-solved from OUR actual output: 290.00002
  −25−14−42 = 209.000008 = our `childImg.height`, which is exactly
  `194.000008+15` — the naive, no-south-cap prediction). Jar needs
  `childImg.height = 291.000024−81 = 210.000024`; the south-cap mechanism
  predicts `(194.000008+1)+15 = 210.000008` — matches to 0.000016 px,
  the same 6-decimal truncation noise this mission's own harness already
  flags as sub-signal (`EXACT_EPSILON`). Δpx = ours−jar =
  209.000008−210.000008 (in the wrapper's height term) propagates 1:1
  into the final declared height, reproducing the reported −1.000008 px
  row exactly.
- **ruledOut:** dot-engine's own node echo/rounding (SI28 G18's own
  nextStep) — `scripts_scratch/T18/probe1.ts` fed `layoutGraph` a
  synthetic single fixed-size node (588.2625×194.000008 px, no edges) and
  it returned the SAME width/height byte-for-byte, positioned at (0,0);
  the missing pixel is not in `@knowvah/dot-engine`'s layout at all,
  disproving G18's own recorded next step. A `<<O-O>>`/stereotype term
  (none of `statechart`/`statemachine`/`initialstate` declare `<<O-O>>`,
  confirmed by reading `in.puml`). The `.delta(15,15)` constant and the
  text/attr/margin sums (all independently re-verified exact above,
  leaving only the `childImg` term itself as the residual). SI28
  SYNTHESIS.md §3.2's own refutation ("no composite outer box… for a
  south cap to be missing from") — checked directly against
  `GroupMakerState.java:113-136`: the single graphviz node in scope 3's
  own children-pass (`statemachine`) is NOT a leaf: it has 1 child
  (`stInit`), so jar's `getImage()` returns `InnerStateAutonom`, which
  DOES draw a `RoundedContainer`/`RoundedSouth` during the SAME recursive
  ink walk that sizes `statechart`. "One graphviz node in the scope" is
  not the same fact as "no composite substructure" — the refutation
  conflated sibling count with the node's OWN drawn shape.
- **pairingRisk:** none — every scope has exactly one node, no
  sorting/tie ambiguity.
- **sharedCauseWith:** pacami-67-dafe414, tofezi-64-koda860,
  xojudi-20-keco020, decede-10-buvu414 (mechanism 8 / G5,
  `layout-ink-extent.ts:75-93`'s own doc comment; T9 decision-journal
  2026-08-18) — **this record reclassifies `gokife-89-boja382` INTO G5**
  (five fixtures, not four), reopening SI28 SYNTHESIS.md §3.2's "G18,
  its own group" ruling. Flagged for the orchestrator/T14-equivalent to
  reconcile: the shape (3-deep single-child chain vs. `A{B,C}` siblings)
  does not gate the mechanism — mechanism 8 is a property of the AFFECTED
  composite's OWN south cap, independent of how many siblings share its
  parent's ink walk.
- **proposedWriteSet:** src/diagrams/state/layout-ink-extent.ts
  (`addNodeInk`'s composite branch / a new south-cap uninset ink term,
  gated on a resolved non-transparent south background + nonzero
  `RoundCorner`); src/diagrams/state/state-geo-types.ts (thread a
  resolved south-opacity bit onto `StateNodeGeo`, per the module's own
  existing "a follow-on should thread a resolved south-opacity bit"
  note, `layout-ink-extent.ts:90-93`) — same footprint T9 already scoped
  and declined; NOT a ≤5-line fix (cross-cutting: ink-extent + geo type +
  a still-unidentified color-resolution thread from the renderer side),
  consistent with T9's own reason for deferring it.
- **sizeEstimate:** same as T9's deferred mechanism-8 estimate — 2+ files,
  needs a resolved-color signal threaded from wherever the renderer
  resolves `southBackcolor`/`northBackcolor` per stereotype (not yet
  identified); verify against the G5 quartet (4 fixtures) PLUS
  `gokife-89-boja382` (now a 5th) without regressing the 9 default-styled
  fixtures T9's unconditional trial regressed (`layout-ink-extent.ts:84-88`
  lists them).
- **confidence:** high — arithmetic reproduces the reported −1.000008 px
  row to within the harness's own documented 6-decimal truncation noise,
  and every constant in the chain (`RoundCorner 25`, the opaque
  `LightYellow` skinparam, the `LimitFinder` inset/no-inset split, the
  `GroupMakerState` no-shortcut rule) is cited to a real upstream
  `file:line`.
- **nextStep:** n/a for this diagnosis (resolved). For the deferred FIX:
  route to the SAME fix task as the G5 quartet (mechanism 8), not a
  separate bare-node/dot-engine probe — that avenue is now ruled out by
  `probe1.ts` above.
