# Group R diagnosis — canvas 1px (T3)

| mechanism-id | fixtures | files | est. size |
|---|---|---|---|
| R-1 | jixamu-89-ribo225 | `src/diagrams/class/class-ink-box.ts` (`addClassifierInk`) | ~5 lines |
| R-2 | gatula-10-bifu561 | `src/diagrams/class/class-ink-shapes.ts`/`class-object-sizing.ts`-style flag extended to class kind | ~15-25 lines |
| R-3 | jubobo-22-fapu993, bejeli-39-sina124 | `src/diagrams/class/class-ink-shapes.ts` (`addRectInk`) + a "fully-suppressed body" flag threaded from `class-layout-generic-classifier.ts` | ~20-30 lines |
| R-4 | xosiza-60-sobu480 | `src/core/layout-epsilon.ts` (or callers) | boundary case, no epsilon/rounding fix allowed per D6 — needs mission decision, not a line estimate |
| R-5 | julixi-10-jide878, rulite-35-muno361 | unresolved (candidate: `src/core/svek-dot-emit.ts` inches round-trip, or dot-engine) | unresolved |
| R-6 | cacoma-43-poxu615 | unresolved | unresolved |
| R-7 | daxeno-00-kasu166 | unresolved (candidate: `class-ink-shapes.ts#addNamespaceDatabaseInk`) | unresolved |
| R-8 | lojiga-09-meka859 | new file needed, e.g. `class-namespace-stack-shape.ts` + `class-container.ts` dispatch | ~60-100 lines (new USymbol shape) |
| R-9 | sijisi-94-ripu606 | inherited attribution, not re-derived (`allow_mixing` nested `rectangle` clusters, ENT3/GEO1/B4 in `fixtures.md`) | unresolved this session |

All 8 pure-canvas fixtures were probe-verified to have ZERO other diffs (`render-diff.mts`, structural=0, numeric=2, both always the paired `svg/@width`+`@viewBox[2]` or `svg/@height`+`@viewBox[3]`). The prior T35 attribution of "~0.005 px position rounding tipping `ensureVisible`" for gatula/jixamu/xosiza (decision-journal.md row 232) is **REFUTED by direct measurement** for all three: gatula's gap is a clean, exact 1.000000 px (not sub-pixel); jixamu's is ~1.0 px from a real missing ink term (R-1); xosiza's is 8e-6 px but from a *different, identifiable* mechanism (R-4), not generic "position rounding."

---

### gatula-10-bifu561, jixamu-89-ribo225, xosiza-60-sobu480, jubobo-22-fapu993, bejeli-39-sina124, cacoma-43-poxu615, julixi-10-jide878, rulite-35-muno361 — shared instrumentation

Probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-raw-dims.mts <slug...>` — calls `layoutClass` directly (same `WidthTableMeasurer` the parity survey uses) and prints `geo.rawWidth`/`geo.rawHeight` (pre-margin, full float precision, **not** passed through `absorbLayoutEpsilon`) plus the derived `marginedW = rawWidth + 5` / `marginedH = rawHeight + 5` (`CUCA_DOCUMENT_MARGIN_LEFT+RIGHT` = `0+5`; `TOP+BOTTOM` = `0+5`, `core/atmp/CucaDiagram.ts`). Results:

```
bejeli   marginedH=153.000000  (need <153, exact-integer excess)
cacoma   marginedW=259.606250  (need <259, ~0.6px excess)
gatula   marginedW=224.000000  (need <224, exact-integer excess)
jixamu   marginedW=326.531250  (need <326, ~0.53px excess — resolved, see R-1)
jubobo   marginedH=153.000000  (need <153, exact-integer excess)
julixi   marginedH=420.000056  (need <420, ~5.6e-5px excess)
rulite   marginedH=420.000056  (need <420, ~5.6e-5px excess — byte-identical to julixi)
xosiza   marginedH=186.999992  (need <187 — SATISFIED pre-absorb; see R-4)
```

---

### jixamu-89-ribo225
- mechanism-id: R-1
- mechanism: the synthetic association-point circle (`kind: 'assoc-circle'`, upstream `EntityImageAssociationPoint`) falls through `addClassifierInk`'s dispatch to the generic classifier-box rule (`addClassifierBoxInk` → `addRectInk`), which gives it the box's asymmetric "min inset / max un-inset" corner (`x-1,y-1` / `x+w,y+h`) meant for a *bodied* `EntityImageClass`. The real shape is a bare `UEllipse`, whose `LimitFinder#drawEllipse` rule is the opposite asymmetry (`x,y` un-inset / `x+w-1,y+h-1` inset). On this fixture the circle is the diagram's rightmost ink, so the wrong rule overstates the right edge by exactly 1px.
- java: `svek/image/EntityImageAssociationPoint.java:53-60` (`private static final int SIZE = 4;` ... `final UShape circle = UEllipse.build(SIZE, SIZE);`) — no header/body composition, no `URectangle`, just a bare ellipse.
- ts: `src/diagrams/class/class-ink-box.ts:211-270` (`addClassifierInk`) — `usecase` (line 232) and `lollipop` (line 243) are already dispatched to `addEllipseInk`; `assoc-circle` is not checked anywhere in this function and falls through to `addClassifierBoxInk(box, c)` at line 270. `class-ink-shapes.ts:178-185`'s own doc comment on `addEllipseInk` explicitly names this as a known, deliberate gap: *"NOT extended to the other ellipse-drawing kinds (`assoc-circle`, `lollipop`): both are already byte-exact across the 310-fixture class golden corpus under the rect rule... Named, not silently generalized."* jixamu is the counter-example the comment anticipated.
- causal chain: `addClassifierInk` applies `addRectInk`'s `Math.max(c.x+c.width-1, bodyMaxX)` where `bodyInkWidth` is undefined for this kind → `bodyMaxX = c.x+c.width` wins → ink maxX = `c.x+c.width` (312.53125). The correct ellipse rule gives `c.x+c.width-1` = 311.53125. That 1px difference propagates through `svekDimension` (`maxX-minX+15`) → `applyCucaDocumentMargin` (`+5`) → `ensureVisible`'s `floor(v+1)`, flipping the truncated width from 326 to 327.
- ruled out: nothing else on this fixture — `Station`/`StationCrossing` rects (`addRectInk`, unaffected by this bug) contribute `maxX` of 106.06/273.775, both far short of the circle's 312.53; the circle is unambiguously dominant. Confirmed by direct probe of `geo.leaves` (below).
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-jixamu-leaves.mts jixamu-89-ribo225` printed:
  ```
  kind=assoc-circle id=__assoc0 x=308.53125 y=101.63411464816723 w=4 h=4 bodyInkWidth=undefined
  rawWidth 321.53125 ... totalWidth 327
  ```
  Manual recompute with the ellipse rule (`x+w-1` instead of `x+w`): new maxX=311.53125, `rawWidth = 311.53125 - 6 + 15 = 320.53125`, `marginedW = 325.53125`, `floor(325.53125+1) = 326` — **matches jar's expected 326 exactly**.
- fix shape: in `addClassifierInk`, add a branch `if (c.kind === 'assoc-circle') { addEllipseInk(box, c.x, c.y, c.width, c.height); return; }`, placed alongside the existing `usecase`/`lollipop` branches (before line 248's `symbolInk` check, matching their placement). Update `class-ink-shapes.ts:178-185`'s doc comment to retire the "not extended" claim for `assoc-circle` (keep it for `lollipop`, which is untouched here). Add a regression test in `layout-ink-extent.test.ts`.
- owner: this mission (T3 write-set: `class-ink-box.ts`, `class-ink-shapes.ts`)
- confidence: HIGH (probe-verified arithmetic reproduces jar's exact expected width)

---

### gatula-10-bifu561
- mechanism-id: R-2
- mechanism: `class qux {}` declares an explicit, empty body (not hidden by a directive) — reaches `BodierLikeClassOrObject#getBody`'s final `else` branch (`TextBlockUtils.mergeTB(bb1, bb2, ...)` over two *empty* `MethodsOrFieldsArea`s), a **different** Java branch from the `TextBlockUtils.empty(0,0)` fully-suppressed case (R-3), but candidate for the same class of defect: `bodyInkWidth` (the already-jar-verified G3/O2 exception that drops `addRectInk`'s X-axis `UEmpty`-reservation term when a classifier's body reserves no real ink) is wired **only** for `kind: 'object'` (`class-object-sizing.ts:248`), never for `kind: 'class'`/other `LIKE_CLASS_KINDS`. `package foo{}`/`namespace bar{}` are ruled out (see below), leaving `qux`'s own box as the only remaining width contributor with excess ink.
- java: `cucadiagram/BodierLikeClassOrObject.java:254` (`return TextBlockUtils.mergeTB(bb1, bb2, HorizontalAlignment.LEFT);`) — reached because `showFields`/`showMethods` are both `true` (no `hide` directive) yet `getFieldsToDisplay()`/`getMethodsToDisplay()` are both empty (no member lines declared).
- ts: `src/diagrams/class/class-ink-shapes.ts:81-102` (`addRectInk`'s `bodyMaxX = c.x + (c.bodyInkWidth ?? c.width)` — undefined for `qux`, so the fallback `c.width` wins, same as the un-fixed G3/O2 state); `class-object-sizing.ts:248` is the only site that ever sets `bodyInkWidth`.
- causal chain: `rawWidth=219.000000` exactly (`qux` at `x=155.425,w=54.575` → `addRectInk` maxX = `210.0` = `x+w`), `marginedW=224.000000` exactly → `floor(224+1)=225`; jar's expected 224 requires a raw maxX 1px short, i.e. `x+w-1=209.0`, exactly the `bodyInkWidth: 0` exception's effect.
- ruled out: the two namespace/package leaves (`foo`, `bar`, `kind: 'descriptive'`, collapsed-empty via `folderTab`) — `class-ink-box.ts:219-225`'s own doc comment cites **gatula itself** as the fixture that jar-verified `addPlainInk` (not `addRectInk`) for a collapsed-empty package/namespace leaf ("jar-verified `gatula-10-bifu561`: using `addRectInk` here shifts the WHOLE diagram by a uniform (1,1)"). Since compareSvg shows every drawn element's position matching jar (0 other diffs) and the namespace ink rule for this exact fixture is already confirmed correct elsewhere, the residual must be in `qux`'s own ink, not the namespaces'.
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-jixamu-leaves.mts gatula-10-bifu561`:
  ```
  kind=descriptive id=foo x=6 y=7 w=39.425 h=48
  kind=descriptive id=bar x=80.60625 y=7 w=40.2125 h=48
  kind=class id=qux x=155.425 y=7 w=54.575 h=48
  rawWidth 219 rawHeight 64 totalWidth 225
  ```
  Not yet probed: a debug trace confirming jar's real `qux` ink corner is `x+w-1` (209.0) rather than `x+w` (210.0) for this specific (shown-but-empty, non-suppressed) body state — the G3/O2 precedent is for the *hidden* (`TextBlockUtils.empty(0,0)`) state, a different Java branch, so this is an analogy, not a direct citation.
- fix shape: extend zero-body detection to `LIKE_CLASS_KINDS` (not just `object`) wherever `MethodsOrFieldsArea` collapses to zero width for BOTH compartments (fields AND methods empty, whether via `mergeTB` of two empty areas or via suppression) — likely in `class-layout-generic-classifier.ts#buildNormalClassifierResult`, setting `bodyInkWidth: 0` when `memberSections.fieldsH === 0 && memberSections.methodsH === 0` (need to confirm this predicate matches jar's *width*-zero condition, not just height).
- owner: this mission
- confidence: MEDIUM (arithmetic match is exact given the hypothesis, but the specific Java branch — shown-but-empty via `mergeTB`, distinct from R-3's hidden branch — has not been independently jar-traced; recommend a debug trace before implementing, per the mission's own "no fix before stated mechanism" and to avoid conflating two distinct empty-body states under one flag)

---

### jubobo-22-fapu993, bejeli-39-sina124
- mechanism-id: R-3
- mechanism: both fixtures have **every** classifier's members fully suppressed (`hide members` for jubobo; `hide empty members` for bejeli, where all 4 declared classes have zero real members so the directive removes the whole compartment) — reaching `BodierLikeClassOrObject#getBody`'s `showFields==false && showMethods==false` branch, which returns a genuinely zero-size `TextBlockUtils.empty(0,0)` (draws nothing, per `TextBlockEmpty#drawU`). This port's `measureGenericClassifier` already models the resulting box HEIGHT correctly (`stereoGeo.headerRowHeight` exactly, `dividerYs: []`) — but the **ink** walk (`addRectInk`) still applies its unconditional, un-inset `c.y + c.height` max-Y corner (the "UEmpty full-box reservation" rule, correct for a *bodied* class whose body wraps a `TextBlockMarged`) to a classifier that has NO such wrapping at all. The candidate fix mirrors G3/O2 (already-verified, X-axis-only, `object`-kind-only) extended to the Y axis and to non-object `LIKE_CLASS_KINDS`.
- java: `cucadiagram/BodierLikeClassOrObject.java:249-250` (`else if (showFields == false && showMethods == false) return TextBlockUtils.empty(0, 0);`); `svek/image/EntityImageClass.java:240-244` (`if (body != null) { ...; body.drawU(ug2.apply(translate)); }` — body is non-null but draws nothing).
- ts: `src/diagrams/class/class-ink-shapes.ts:81-102` (`addRectInk`, unconditional `c.y + c.height` on the max corner, no analog of the X-axis `bodyInkWidth ?? c.width` gate on Y); `src/diagrams/class/class-layout-generic-classifier.ts:318-323` (the `suppress.fields && suppress.methods` branch that already correctly measures `height: stereoGeo.headerRowHeight, dividerYs: []`, but doesn't surface this state to the ink walk).
- causal chain: both fixtures place 4 disconnected classifiers in a 2×2 dot grid (see probe below); the bottom-row's taller box (`h=36`) sits at `y=103` in both fixtures (identical DOT node heights, `svek-1.dot`: `sh0007`/`sh0009` both `height=0.500000` = 36px, `sh0006`/`sh0008` both `0.444444` = 32px — byte-identical between the two fixtures). `addRectInk`'s unconditional rule gives ink maxY = `103+36 = 139`; `rawHeight = maxY - minY(6) + 15 = 148` exactly; `marginedH = 153` exactly → `floor(153+1) = 154`. Jar's expected 153 requires `floor(v+1)=153` i.e. `v<153`, i.e. an ink maxY of 138 (the inset `y+h-1`), exactly the G3/O2-style correction.
- ruled out: (1) a DOT-engine rank-separation discrepancy — ruled out because `render-diff.mts` shows 0 diffs on every visible `<rect>`/`<text>`/`<line>` element, meaning the bottom row's rect Y position already matches jar's exactly; if dot-engine's rank gap differed, the visible rects would have moved too. (2) `INK_DELTA`/`CucaDiagram` margin constants — ruled out, both are shared, extensively jar-verified constants used correctly by 500+ other conformant fixtures; the fixture-specific per-shape ink term is the only remaining variable. (3) the G3/O2 "rawHeight unaffected" comment (`class-ink-box.ts:120-121`) initially looked like a contradiction (it documents the *same* `TextBlockUtils.empty(0,0)` state keeping Y unconditional for `object` kind) — re-read closely, that comment only asserts the WIDTH-axis fix (`bodyInkWidth: 0`) leaves the HEIGHT number *unchanged in that test*, not that HEIGHT was independently jar-verified for the empty-body case; no test in `layout-ink-extent.test.ts` exercises a `kind: 'object'` empty-body fixture where Y-ink is the dominant term, so this is not actually a contradicting data point, but it is also not confirming evidence — flagged for the implementer to check `object`-kind fixtures aren't broken by extending the rule to Y.
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-jixamu-leaves.mts jubobo-22-fapu993` / `bejeli-39-sina124`:
  ```
  jubobo: Dummy1 y=9,h=32  Dummy2 y=7,h=36  Dummy3 y=105,h=32  Dummy4 y=103,h=36
  bejeli: NamedStereotype y=7,h=36  ColoredCircle y=9,h=32  PlainCircle y=105,h=32  PlainCircleStereotype y=103,h=36
  both: rawHeight=148, marginedH=153.000000 exactly
  ```
  Manual recompute with `y+h-1` (138 instead of 139): `rawHeight=147`, `marginedH=152`, `floor(153)=153` — matches jar for both fixtures.
- fix shape: in `addRectInk`, add a Y-axis analog of the `bodyMaxX` gate — e.g. a new `bodyInkHeight?: number` field (or reuse a boolean "fully suppressed" flag) set wherever `measureGenericClassifier`'s `suppress.fields && suppress.methods` branch fires (`class-layout-generic-classifier.ts:321-323`), threaded through `MeasuredClassifier` → `ClassifierGeo` the same way `bodyInkWidth` already is, for ALL `LIKE_CLASS_KINDS`, not just `object`. Requires a Java debug trace against a real `hide members` object fixture (or one of these two) before landing, to confirm the Y-inset value and rule out a THIRD term this diagnosis hasn't considered.
- owner: this mission
- confidence: MEDIUM-HIGH (exact arithmetic match on two independent fixtures sharing nothing but the "fully suppressed body" state; not yet confirmed against a live jar debug trace, so held below HIGH per the mission's own bar)

---

### xosiza-60-sobu480
- mechanism-id: R-4
- mechanism: **not** a missing ink term — `absorbLayoutEpsilon` (`src/core/layout-epsilon.ts`) rounds a value that is legitimately, correctly *just under* an integer (186.999992, only 8e-6 shy of 187) UP to the exact integer 187.000, because it falls inside the function's blind 3-decimal-place rounding window. Before this rounding, `floor(186.999992+1) = floor(187.999992) = 187` — the **jar-matching, correct** answer. After rounding, `floor(187.000+1) = 188` — wrong. `absorbLayoutEpsilon` was built to fix the opposite case (a value that should be a clean integer arriving slightly *under* it due to this port's own inches-string round-trip, per that file's own doc comment) — it cannot distinguish "noise that should round up" from "genuine sub-integer geometry that should floor down," because both look identical (a value within 0.0005 of an integer).
- java: n/a — this is not a jar-divergence at the Java level; jar's real `SvgGraphics#ensureVisible` (`klimt/drawing/svg/SvgGraphics.java:129-135`) never sees this port's in-process float noise at all (see `layout-epsilon.ts`'s own doc comment: jar scrapes `dot -Tsvg`'s 2-decimal text serialization, which absorbs the noise before jar's own truncation math runs).
- ts: `src/core/layout-epsilon.ts:33-35` (`absorbLayoutEpsilon`); called from `src/core/TextBlockExporter.ts:72-73` (`applyCucaDocumentMargin`).
- causal chain: `computeClassRawInkDims` → `rawHeight = 181.99999200000002` (no absorption applied at this stage) → `applyCucaDocumentMargin` computes `height = dims.height + 0 + 5 = 186.99999200000002`, then `Math.floor(absorbLayoutEpsilon(186.99999200000002) + 1)`. `absorbLayoutEpsilon` computes `Math.round(186999.992...)/1000 = 187000/1000 = 187.000`, landing exactly on the boundary the un-rounded value was safely under, flipping `ensureVisible`'s truncation up by one.
- ruled out: an ink-term gap (like R-1/R-2/R-3) — ruled out because the raw, pre-absorption value (186.999992) *already* produces jar's correct expected height (187) when floored directly; there is nothing to fix in the ink walk itself, only in the epsilon-rounding step that runs after it. Confirmed by direct arithmetic on the probed `rawHeight`/`marginedH` values (no code changes needed to demonstrate this — pure recomputation of the existing formula with and without the rounding step).
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-raw-dims.mts xosiza-60-sobu480`:
  ```
  rawHeight=181.99999200000002  marginedH=186.99999200000002  fracH=0.999992
  totalHeight=188  (jar expects 187)
  ```
  `Math.round(186.99999200000002*1000)/1000` (Node REPL) = `187` — confirms the rounding step is what flips the outcome; `Math.floor(186.99999200000002+1)` (no absorb) = `187` — confirms the un-rounded path already matches jar.
- fix shape: **none proposed.** Per this mission's own boundary ("No epsilon or rounding tie-break is an acceptable fix shape (mission decision D6)"), tightening `absorbLayoutEpsilon`'s threshold or adding a direction-aware variant would itself be exactly the forbidden fix shape — any change here trades xosiza's false-positive for some other fixture's true-positive undershoot case that the original mechanism (documented in `layout-epsilon.ts`'s own header) was built to catch, with no way to distinguish the two cases from the value alone. This is a genuine tension between two real, opposite-direction float artifacts that a single rounding rule cannot resolve; flagging for a mission-level decision (D6 already covers this shape of problem for ink terms, but this is a rounding-*policy* defect, not an ink term, so it may need its own ruling).
- owner: this mission (boundary case — see fix shape)
- confidence: HIGH (the mechanism is fully reproduced by hand arithmetic on the port's own numbers, no jar access needed since it's provably NOT a jar-divergence at the raw-value level)

---

### julixi-10-jide878, rulite-35-muno361
- mechanism-id: R-5
- mechanism: unresolved. Both fixtures (near-identical `CuttingStockPrb` template-name content, `skinparam svek true`/commented `'skinparam svek true'`) show `rawHeight = 415.00005600000003` — an excess of only ~5.6e-5 px over the 415.0 boundary that `applyCucaDocumentMargin`'s margined value (420.000056) then truncates past. Unlike R-4, `absorbLayoutEpsilon` does *not* change the outcome here: `round(420000.056)/1000 = 420.000`, and `floor(420.000+1) = floor(420.000056+1) = 421` either way — so this is not the same absorb-epsilon bug. The magnitude (5.6e-5) is consistent with `layout-epsilon.ts`'s own documented "worst accumulated artifact (~1e-4)" class of noise (this port's inches-string round-trip through the dot-engine call), but that has not been isolated to a specific node/coordinate for this fixture.
- java: not yet identified — no debug trace or `svek-N.dot` cross-check performed.
- ts: candidate `src/core/svek-dot-emit.ts` (`inches` formatting, per `layout-epsilon.ts`'s own citation) or `@knowvah/dot-engine`'s own solver; not distinguished.
- causal chain: unconfirmed — plausible chain is the same "our own 6-decimal inches round-trip vs jar's lossy `dot -Tsvg` 2dp scrape" mechanism `layout-epsilon.ts` already documents, but manifesting as a tiny *overshoot* rather than the documented *undershoot*, on a fixture large enough (9 classifiers, multiple ranks) to accumulate error in either direction depending on which node's fractional inches value tips which way.
- ruled out: (1) `absorbLayoutEpsilon` mis-rounding (R-4's mechanism) — ruled out by direct computation above, the rounding step is a no-op here. (2) an ink-term gap of the R-1/R-2/R-3 kind — not ruled out or confirmed; not investigated this session due to time budget (large fixture, no single dominant shape identified).
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-raw-dims.mts julixi-10-jide878 rulite-35-muno361` — both print byte-identical `rawHeight=415.00005600000003`, `marginedH=420.00005600000003`. Not yet probed: which node/edge/label contributes the dominant maxY, and whether `svek-N.dot`'s corresponding inches value round-trips exactly through `svek-dot-emit.ts#inches`/`graph-layout-build.ts#addNodes` (per `layout-epsilon.ts`'s own citation of these two files as the pair that "MUST agree").
- fix shape: unresolved. If confirmed as the inches round-trip artifact, no fix is proposed for the same D6 reason as R-4. If confirmed as a genuine `@knowvah/dot-engine` coordinate difference (≤0.01px, per D6), owner is dot-engine — draft issue text (not filed): *"@knowvah/dot-engine: a node/rank position on `CuttingStockPrb`-shaped multi-rank aggregation diagrams (see plantuml-ts fixtures julixi-10-jide878/rulite-35-muno361) differs from real Graphviz by ~5.6e-5 px on the Y axis, crossing an integer-truncation boundary in PlantUML's own canvas-sizing formula. Magnitude only; exact node not yet isolated."*
- owner: unresolved — see fix shape (either "this mission, no fix" like R-4, or "dot-engine" — needs the node-level probe below to decide)
- confidence: LOW (mechanism class is a reasonable guess by analogy to R-4/`layout-epsilon.ts`'s own documented artifact, but not verified against the specific coordinate; explicitly not claimed HIGH)
- next instrumentation: add a `setLayoutInputObserver`/`DotInputNode` probe (pattern from `tests/unit/class/class-allowmixing.test.ts`) to dump every node's `(x,y,w,h)` in inches alongside `svek-1.dot`'s own node lines for julixi, and find which one's height/position carries a fractional-inches value whose 6dp round-trip could produce ~5.6e-5 px of accumulated error.

---

### cacoma-43-poxu615
- mechanism-id: R-6
- mechanism: unresolved. `rawWidth = 254.60625`, `marginedW = 259.60625` (need `<259`, so a real, non-trivial ~0.6px excess). Fixture content: `allow_mixing`, `class foo1`, `usecase foo2`, `actor foo3` (edge `foo1 -- foo2`), `component comp3` (no edges).
- java: not identified this session.
- ts: not identified this session.
- causal chain: not established.
- ruled out: the `actor` (`foo3`) USymbol shape ink — `class-ink-box.ts:248-260`'s own doc comment on the `symbolInk` dispatch explicitly cites **cacoma-43-poxu615 itself** as one of the jar-verified fixtures for actor-shape ink (*"jar's extent for an actor is the union of its `UEllipse` head, `UPath` body and label `UText`... moved every shape in `cacoma-43-poxu615` by that much"*) — this mechanism is already fixed and jar-verified against this exact fixture, so `foo3` is not the source of the residual width gap.
- probe: `plans/class-divergence-drive-2/diagnosis/scratch/probe-jixamu-leaves.mts cacoma-43-poxu615`:
  ```
  kind=class id=foo1 x=7 y=18.5 w=59.2125 h=48
  kind=usecase id=foo2 x=14.364 y=139.5 w=44.484 h=25.799
  kind=descriptive id=foo3 x=101 y=5.5 w=27.2125 h=74
  kind=descriptive id=comp3 x=163.60625 y=20.5 w=82 h=44
  ```
  `comp3` (kind `descriptive`, a `component`) is the rightmost box (`x+w=245.6`), not obviously dominant over `foo3`'s own symbol-ink reach — not yet cross-checked against `symbolInk` bounds for `component`'s own USymbol (which may have its own ink formula, unverified this session).
- fix shape: unresolved.
- owner: unresolved
- confidence: unresolved (no mechanism claimed)
- next instrumentation: dump `symbolInk`/`bodyInkWidth` for `comp3` and `foo2` (usecase — already has `addEllipseInk` per the general rule, but its OWN symbolInk extent for the `usecase` USymbol variant used here is unconfirmed); compare against `in.svg`'s visible `comp3`/`foo2` element geometry to find which one's ink formula the current code under- or over-shoots on.

---

### daxeno-00-kasu166
- mechanism-id: R-7
- mechanism: unresolved, but not a simple uniform shift — the diff signature is **non-uniform**: most numerics on the first (`<<Database>>` cylinder-styled, empty-body) package are off by exactly `Δ1.005` (X-axis path/text coordinates), a second group is off by exactly `Δ1.0`, and one `text/@y` is off by `Δ0.889` only — three different magnitudes, suggesting at least two overlapping mechanisms rather than one. `svg/@width` is off by 1 (271 vs 270).
- java: not identified this session.
- ts: candidate `src/diagrams/class/class-ink-shapes.ts:288-291` (`addNamespaceDatabaseInk`, un-inset min corner `addPoint(box, x, y)`) — plausible given the fixture's `<<Database>>` cylinder shape, but not confirmed to be the dominant term versus the title text's own Δ0.889 (different magnitude, likely a separate title-placement issue for the styled multi-line package title `"<size:18>styled</size>\nshould be styled"`).
- causal chain: not established.
- ruled out: nothing definitively — insufficient time this session to isolate which of the three magnitudes (1.005, 1.0, 0.889) is causal versus downstream of another.
- probe: `render-diff.mts daxeno-00-kasu166` output captured (92 numeric diffs, first ~30 shown, three distinct delta magnitudes as above). No targeted geometry probe run.
- fix shape: unresolved.
- owner: unresolved
- confidence: unresolved (no mechanism claimed)
- next instrumentation: probe `geo.leaves` for daxeno's two namespace clusters (styled/styled2) to get their own `x`/`y`/`w`/`h` and cross-reference against `addNamespaceDatabaseInk`'s call site to see which axis/corner the ~1.005 shift originates from; separately investigate the `<size:18>...</size>\n...` multi-line styled title's own Y-placement (the isolated Δ0.889 on `text[1]/@y`) as likely a distinct, pre-existing multi-font-size title-height mechanism.

---

### lojiga-09-meka859
- mechanism-id: R-8
- mechanism: the `stack` container keyword (`stack a as a { ... }`) is recognized by the parser (mapped to a container kind) but has **no dedicated shape renderer** — it falls back to this port's default namespace/folder shape (drawn as a `<path>`), where jar's real `USymbolStack#drawQueue` draws a distinctive inset "queue/stack" bracket shape: an inner `URectangle` (`width - 2*border, height`, `border=15`) **plus** a separate outline `UPath` with two 15px-wide "ear" notches on the left/right. `render-diff.mts`'s first structural diff (`exp=rect | act=path` for the container's first child element) is direct evidence of this — jar draws a `<rect>` first, this port draws a `<path>` first, for the SAME element slot. The cascading 158 `Δ1.0` numeric diffs (row/edge positions below the container) and the `svg/@height` off-by-1 are downstream consequences of the container's own wrong height/shape, not an independent canvas-truncation mechanism.
- java: `decoration/symbol/USymbolStack.java:51-88` (`drawQueue`: `final double border = 15; final URectangle rect = URectangle.build(width - 2*border, height)...; final UPath path = UPath.none(); ... path.lineTo(border, 0); path.lineTo(border, height); path.lineTo(width-border, height); ...`) — registered at `decoration/symbol/USymbols.java:92` (`public final static USymbol STACK = record("STACK", new USymbolStack());`).
- ts: `src/diagrams/class/class-container.ts:333` (`['STACK', 'stack'],` — keyword-to-kind mapping only); no `class-namespace-*-shape.ts` file implements a `stack`/queue-bracket outline (confirmed via grep across `class-namespace*.ts`/`renderer*.ts`, only comment mentions of the unrelated English word "stack" — call-stack, stacked rows/stereotypes — turned up).
- causal chain: the container renders with the wrong (generic) shape and, evidently, the wrong effective height by 1px (the fixture's ONLY structural container), which shifts everything drawn below/after it (the two edges `a-->b`/`a<--b` and `component b`) down by 1px, producing the `Δ1.0` cluster; the `Δ1.0049999999999955` values (e.g. `path[1]/@d[0]`) are curve-fit spline coordinates for those same shifted edges (non-integer because splines aren't drawn from integer anchors), consistent with being downstream of the SAME 1px vertical shift rather than a second, independent mechanism.
- ruled out: a generic canvas-truncation/ink-term bug (the R-1..R-4 family) — ruled out because the FIRST diff is structural (element tag mismatch: rect vs path), which can only arise from a genuinely different shape being drawn, not from an ink-extent miscalculation over the same shape.
- probe: `render-diff.mts lojiga-09-meka859` (structural=3, numeric=160, shown above); `grep -rn "'stack'" src/diagrams/class/class-container.ts` (only the keyword mapping); `grep -rn "stack" src/diagrams/class/class-namespace*.ts src/diagrams/class/renderer*.ts` (no shape-drawing hits, only unrelated comments).
- fix shape: a new `USymbolStack`-equivalent shape module (e.g. `class-namespace-stack-shape.ts`, mirroring `class-namespace-usymbol-shape.ts`'s existing pattern for other `USymbol` cluster shapes) implementing `drawQueue`'s inset-rectangle-plus-notched-outline geometry, wired into the namespace/container renderer's shape dispatch alongside the existing folder/rect/database dispatch, plus a matching ink-walk rule in `class-ink-box.ts`/`class-ink-shapes.ts` for the new shape (not yet derived — `USymbolStack` has no separate `LimitFinder` citation isolated this session; likely the plain-bbox `addPlainInk` rule other `UPath`-based namespace outlines use, but unconfirmed).
- owner: this mission, but out of the ink-extent (`layout-ink-extent.ts`/`class-ink-box.ts`) write-set this task was framed around — it is a renderer/shape-family gap, a materially larger and differently-scoped piece of work (new USymbol implementation) than R-1..R-4's ink-rule corrections.
- confidence: HIGH on the mechanism identification (direct Java citation + structural diff is unambiguous evidence of a missing shape), MEDIUM on the causal chain fully explaining all 158 numeric diffs (plausible but not independently re-verified numeric-diff-by-numeric-diff)

---

### sijisi-94-ripu606
- mechanism-id: R-9
- mechanism: inherited from the task brief, not re-derived this session: `allow_mixing` with nested `rectangle` clusters (childCount 2 vs 3, 2 vs 4, plus a missing `@textLength`), already attributed to ENT3/GEO1/B4 in `fixtures.md` per T3's own task description and decision-journal row 222 ("`sijisi-94-ripu606` 3+132 (`allow_mixing` + nested `rectangle` clusters, childCount 2 vs 3 and 2 vs 4 plus a missing `@textLength`; already attributed ENT3/GEO1/B4 in `fixtures.md`)").
- java: not re-cited this session — see ENT3/GEO1/B4 in `fixtures.md` for the original citations.
- ts: not re-cited this session.
- causal chain: not re-derived.
- ruled out: nothing re-verified this session — this fixture's 3 structural + 132 numeric diffs are far larger/more complex than the other 7 "pure canvas" fixtures in this group and were explicitly pre-attributed by the task brief itself; re-deriving from scratch was deprioritized in favor of the unattributed fixtures given the session's time budget.
- probe: not run this session.
- fix shape: not derived this session — see the existing ENT3/GEO1/B4 attribution.
- owner: other engine or this mission (per existing ENT3/GEO1/B4 attribution — not re-confirmed)
- confidence: LOW (inherited attribution, not independently re-verified this session — flagged per the mission's own instruction that group assignment/prior attribution is "a lead, not a finding")

---

## Instrumentation used

- `plans/class-divergence-drive/tools/render-diff.mts <slug...>` — structural/numeric diff dump against the cached jar oracle, per-line `S`/`N` output.
- `plans/class-divergence-drive-2/diagnosis/scratch/probe-raw-dims.mts <slug...>` — calls `layoutClass` directly (parser via `tests/unit/class/parse-helper.ts`, `WidthTableMeasurer`, `defaultTheme`), prints `rawWidth`/`rawHeight`/derived margined values at full float precision (bypasses `absorbLayoutEpsilon`, which the production path applies later).
- `plans/class-divergence-drive-2/diagnosis/scratch/probe-jixamu-leaves.mts <slug>` — same layout call, dumps every `ClassifierGeo` leaf's `kind`/`x`/`y`/`width`/`height`/`bodyInkWidth`.
- Both scratch scripts are throwaway (not committed); neither touches `src/`, `tests/`, or `test-results/`.

## Corrections to the task brief's own framing

- The brief's history section frames gatula/jixamu/xosiza's residual as one shared "~0.005 px position rounding" mechanism. Measurement shows three **distinct** mechanisms: jixamu is a ~1px missing ink-rule term (R-1, HIGH), gatula is a clean ~1px missing ink-rule term on a different axis (R-2, MEDIUM), and xosiza is an 8e-6px rounding-direction bug in `absorbLayoutEpsilon` unrelated to any ink term (R-4, HIGH) — none is "~0.005 px position rounding."
- jubobo was previously named as "a third mechanism" (decision-journal row 218/232) without further attribution; this session identifies it as sharing R-3 with bejeli (both were not in the original T3 fixture-content overlap, since bejeli was added to this group independently).
