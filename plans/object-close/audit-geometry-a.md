# T5a — small-delta purely-geometric band (7 fixtures)

Read-only audit. No production file was modified.

**Headline: zero of the seven is an engine row.** Every one traces to a
difference in what we hand graphviz, or to a document-dimension rule applied
after layout. In four of the seven the emitted DOT is provably *not* identical
to the oracle's, which disqualifies `gvts-blocked` by this mission's own rule.

Method for every row: render through `renderFixtureClass` +
`DeterministicMeasurer` (the ratchet/census/baseline metric), capture the
`DotInputGraph` via `setLayoutInputObserver`, emit our DOT with
`toSvekDot`, and diff it against `oracle/goldens/object/<slug>/svek-1.dot`
before looking at any coordinate. Node `width`/`height` (inches x 72) were
compared first, per the "check the node sizes fed into it" rule.

Node-size result, all 7 fixtures: **every `shape=rect` node matches the oracle
to 0.0000 px on both axes.** The deltas therefore never originate in
classifier sizing.

---

### jabote-02-rajo672
- Mechanism: an object whose field list is empty but not *suppressed* draws a
  body of `TextBlockEmpty`, which draws nothing at all, so the box's max-corner
  ink is the bordered `URectangle`'s own symmetric `-1` inset — but our
  `addRectInk` models the max corner as `(x+w, y+h)`, inflating the canvas by
  exactly 1px on both axes.
- Origin side: upstream-of-layout (document dimension)
- Java origin: `svek/image/EntityImageObject.java:111-113` (`getFieldsToDisplay()
  .size() == 0 && showFields` ⇒ `fields = TextBlockLineBefore(thickness,
  new TextBlockEmpty(10, 16))`), whose payload's `drawU` is an empty body —
  `klimt/shape/TextBlockEmpty.java:79-80`. With no shape reaching `(x+w, y+h)`,
  the governing rule is `klimt/drawing/LimitFinder.java:184-187`
  (`drawRectangle`: `addPoint(x-1, y-1)`, `addPoint(x+w-1+2*shadow,
  y+h-1+2*shadow)`).
- Ours: `src/diagrams/class/class-ink-box.ts:68-73` (`addRectInk` →
  `addPoint(x+w, y+h)`), reached because the gate at
  `src/diagrams/class/class-ink-box.ts:278` (`c.kind === 'object' &&
  c.dividerYs.length === 0`) does not fire — the divider line IS drawn here
  (`TextBlockLineBefore`'s `UHorizontalLine`), so `dividerYs` is non-empty.
- Causal chain: max-ink corner overstated by (1,1) → `SvekResult
  #calculateDimension`'s `.delta(15,15)` box → `+5/+5` margins → `floor(v+1)`
  → `svg/@width`, `svg/@height`, `svg/@viewBox[2]`, `svg/@viewBox[3]`. Nothing
  else moves, because every drawn coordinate is computed from the box's own
  width/height, not from the ink bookkeeping.
- Ruled out: NOT the engine. Our emitted DOT is byte-equal to the oracle's
  modulo statement order and hex case (node widths 0.410764 x3, height
  0.472222 x3, both `style=invis` edges with matching `minlen`), and every one
  of the ~20 interior SVG coordinates matches the jar exactly — only the 4
  canvas attributes differ. NOT node sizing (0.0000 delta, above). NOT
  "canvas rounding": the arithmetic closes exactly both ways. Jar boxes
  `x=7 w=29.575` (max x+w = 101.575) and `y=101 h=34` (max y+h = 135), min
  corner `7-1 = 6`. With `(x+w-1, y+h-1)`: `(100.575-6+15, 134-6+15) =
  (109.575, 143)` → `+5/+5` → `(114.575, 148)` → `floor(+1)` = **115 x 149 =
  jar exactly**. With our `(x+w, y+h)`: `(110.575, 144)` → `(115.575, 149)` →
  `floor(+1)` = **116 x 150 = ours exactly**. No fitted constant: the `-1` is
  read off `LimitFinder.java:184-187`.
- Verdict: fixable
- Shared with: jotaga-99-fatu830

### jotaga-99-fatu830
- Mechanism: identical to `jabote-02-rajo672` — empty-but-unsuppressed object
  body ⇒ the bordered rect's own `-1/-1` inset is the whole max-corner ink,
  and `addRectInk`'s `(x+w, y+h)` overstates it by (1,1).
- Origin side: upstream-of-layout (document dimension)
- Java origin: `svek/image/EntityImageObject.java:111-113` +
  `klimt/drawing/LimitFinder.java:184-187`
- Ours: `src/diagrams/class/class-ink-box.ts:68-73`, gate at `:278`
- Causal chain: same four canvas attributes, same chain as above.
- Ruled out: **the inherited "pre-existing DOT canvas-rounding residual" claim
  is REPLACED, not confirmed.** There is no rounding involved: our DOT is
  byte-equal to the oracle's (nodes `1.068229 x 0.472222` and
  `1.825347 x 0.472222`, no edges at all), every interior coordinate matches,
  and the ink arithmetic closes exactly. Jar boxes `x=7 w=76.913` and
  `x=118.74 w=131.425` (max x+w = 250.165), `y=7 h=34` (max y+h = 41), min
  corner 6. With `(x+w-1, y+h-1)`: `(249.165-6+15, 40-6+15) = (258.165, 49)` →
  `(263.165, 54)` → `floor(+1)` = **264 x 55 = jar exactly**. With `(x+w,
  y+h)`: `(259.165, 50)` → `(264.165, 55)` → **265 x 56 = ours exactly**.
  A rounding-mode story cannot produce a difference that is exactly 1.0 on
  both axes for two fixtures with unrelated fractional parts; an inset can,
  and does. `skinparam style strictuml` is incidental — it changes no ink rule
  on a leaf classifier.
- Verdict: fixable
- Shared with: jabote-02-rajo672

> Fix-design note (not a fix): the correct gate is "the object's field list is
> empty" (`EntityImageObject.java:111`), which is a strictly wider condition
> than the existing `dividerYs.length === 0` (that one models `showFields ==
> false`). `addRectInkEmptyBody` (`class-ink-box.ts:122-125`) is also wrong on
> the Y axis for this case — it keeps `y+h`; `LimitFinder.java:186-187` says
> `y+h-1`. The g3/O2 writeup's "height is DELIBERATELY unaffected" conclusion
> was drawn from two title-bearing fixtures in which the Y term never surfaced;
> jabote/jotaga surface it. Whether the two rules should merge needs a run of
> the full object ratchet, not a local argument.

---

### nukera-08-dige359
- Mechanism: the main link label's DOT placeholder table is emitted at the raw
  text dimension; upstream wraps every link label in a 1px margin on all four
  sides before measuring it, so the oracle's table is 2px larger on each axis
  (`22x15` vs our `21x13`).
- Origin side: upstream-of-layout (emitted DOT attribute)
- Java origin: `svek/SvekEdge.java:372-373` — `final double marginLabel =
  startUid.equalsId(endUid) ? 6 : 1; return TextBlockUtils.withMargin(block,
  marginLabel, marginLabel);`, where `klimt/shape/TextBlockUtils.java:64-68`
  expands `withMargin(b, mx, my)` to `TextBlockMarged(b, my, mx, my, mx)` —
  i.e. `+2*mx` width, `+2*my` height. The margined block's dimension is what
  reaches the table via `SvekEdge.java:440-443` and is truncated at
  `SvekEdge.java:505-507` (`(int) dim.getWidth()`, `(int) dim.getHeight()`).
  `labelShield` is 0 here (`SvekEdge.java:353-356`, `-->` has
  `LinkMiddleDecor.NONE`), so it contributes nothing.
- Ours: `src/diagrams/class/class-layout-edge-labels.ts:221` (`labelWidth:
  m.width, labelHeight: m.height` — raw measurement, no margin), emitted via
  `src/core/svek-dot-emit.ts:46-48`.
- Causal chain: label table 21x13 instead of 22x15 → graphviz lays the label's
  virtual node out differently → every node x shifts by 2, the second rank's y
  by 1.5, the spline and arrowhead follow, and the label text's own x lands
  4.069 off (`svg/g[1]/g[3]/text[1]/@x`, the max delta).
- Ruled out: NOT the engine — the DOT is *not* identical: the edge's
  `label=<<TABLE ...>>` differs and is the ONLY differing line in the whole
  graph (both nodes byte-equal at `1.857118x1.138889` and
  `1.080382x0.472222`, same `minlen`, same colors). NOT node sizing (0.0000).
  NOT text measurement: the rendered `textLength="20.881"` and `font-size="13"`
  are byte-identical to the jar, so the width table agrees; the missing term is
  the margin, not the metric. NOT the icon-size mechanism below — this fixture
  sets no `classAttributeIconSize` and its glyphs match the jar exactly
  (6x6 rect, rx 3).
- Verdict: fixable
- Shared with: sorisi-53-xebi982, sibika-09-sipu286 (and, outside this task's
  7, at least nulixu-97-nofi684, vocute-12-suxa445, zebufu-01-pevo013,
  guzojo-14-muxa584, tujasu-04-nota700, style-stereotype-on-arrow-3/-7)

### sorisi-53-xebi982
- Mechanism: two independent causes. (1) the same missing 1px link-label
  margin as `nukera-08-dige359`; (2) `skinparam classAttributeIconSize 12` is
  parsed but never reaches the visibility-glyph geometry, which is hardcoded
  at the default — jar draws an 8x8 square / rx-4 circle, we draw 6x6 / rx-3.
- Origin side: upstream-of-layout (emitted DOT attribute + a render-side
  hardcoded constant)
- Java origin: (1) `svek/SvekEdge.java:372-373` +
  `klimt/shape/TextBlockUtils.java:64-68`. (2) `skin/VisibilityModifier.java
  :178-180` — `drawSquare` builds `URectangle.build(size - 4, size - 4)` from
  the `size` passed by `MethodsOrFieldsArea` as `skinParam
  .classAttributeIconSize()` (`VisibilityModifier.java:94-95`,
  `:134` `size = ensureEven(size)`), default 10 (`SkinParam.java:554-556`).
- Ours: (1) `src/diagrams/class/class-layout-edge-labels.ts:221`;
  (2) `src/diagrams/class/class-visibility-icon.ts:68` —
  `export const VISIBILITY_ICON_SIZE = 10;` with the comment "skinparam
  override not wired".
- Causal chain: (1) the same 2px/1.5px global shift and 4.069 label-x delta as
  nukera. (2) every `<rect>`/`<polygon>`/`<ellipse>` inside the member rows'
  `g[1]/g[1]/g[N]` groups is drawn 2px too small and 3px too far left
  (jar `8x8` at x 21..26; ours `6x6` at x 18..22).
- Ruled out: NOT the engine — DOT node sizes are 0.0000 and every DOT line
  except the label table is byte-equal to the oracle's; the glyph size does not
  reach the DOT at all (node width is `1.857118` in both, the member text
  dominates the row width at 12 as at 10), so cause (2) is render-only. NOT a
  measurement problem: at the DEFAULT icon size our glyphs are byte-exact
  (verified on nukera), which isolates the defect to the override path.
- Verdict: fixable
- Shared with: nukera-08-dige359 (label margin); sibika-09-sipu286 (both
  causes)

### sibika-09-sipu286
- Mechanism: the same two causes as `sorisi-53-xebi982`, with
  `classAttributeIconSize 14` making the glyph error larger — jar draws a
  10x10 square / rx-5 circle, we draw 6x6 / rx-3, which is what produces this
  fixture's 6.0 max delta.
- Origin side: upstream-of-layout (emitted DOT attribute + a render-side
  hardcoded constant)
- Java origin: `svek/SvekEdge.java:372-373` +
  `klimt/shape/TextBlockUtils.java:64-68`; `skin/VisibilityModifier.java
  :178-180` (`size - 4` after `ensureEven`, `:186-190`).
- Ours: `src/diagrams/class/class-layout-edge-labels.ts:221`;
  `src/diagrams/class/class-visibility-icon.ts:68`.
- Causal chain: label table 21x13 vs 22x15 → the same uniform 2px x shift and
  the canvas 155 vs 157 / 214 vs 212; the ignored icon size → glyph
  `@width`/`@height` 6 vs 10 and the package-private triangle's right vertex at
  22 vs 28 (delta 6.0, `svg/g[1]/g[1]/g[2]/polygon[1]/@points[2]`).
- Ruled out: NOT the engine (DOT differs only in the label table; node sizes
  0.0000). NOT a font-size interaction from `skinparam classAttributeFontSize
  12`: the member `<text>` x/y positions carry only the shared 2px/1.056px
  shift, and the DOT node width `1.857118` is identical to nukera's and
  sorisi's, so the attribute font size is already handled correctly. The
  `size - 4` relation is read from the Java, not fitted — it reproduces all
  three observed pairs (10→6, 12→8, 14→10).
- Verdict: fixable
- Shared with: nukera-08-dige359, sorisi-53-xebi982

---

### diveje-52-xefe514
- Mechanism: a `map` classifier is emitted through the wrong plaintext-node
  form. Upstream gives every map a per-entry port table — one `<TR>` per map
  row, each with its own `PORT="p<hash>"` — and attaches the incoming edge to
  the specific row's port. We emit the generic shielded 3x3 table with a single
  `PORT="h"` and attach the edge to the node centre.
- Origin side: upstream-of-layout (emitted DOT attribute)
- Java origin: `svek/image/EntityImageMap.java:245-247` — `getShapeType()`
  returns `ShapeType.RECTANGLE_HTML_FOR_PORTS` **unconditionally** for a map
  (contrast `svek/image/EntityImageObject.java:249-253`, which returns it only
  when the object has port short names). That routes the node through
  `svek/SvekNode.java:132-135` → `appendLabelHtmlSpecialForLink`
  (`SvekNode.java:269-303`), which walks `((WithPorts) image).getPorts(...)`
  (`EntityImageMap.java:116-118`) and emits `appendTr` rows
  (`SvekNode.java:304-318`) at the raw double `getWidth()`. The alternative
  form we emit is `appendHtml`/`appendLabelHtml` (`SvekNode.java:233-268`).
- Ours: `src/core/svek-dot-emit.ts:148-152` — only two plaintext forms exist
  (`portTable`, `shieldTable`); there is no `appendLabelHtmlSpecialForLink`
  analogue. `src/core/svek-dot-emit.ts:169` hardcodes `:h` as the only port
  suffix an edge endpoint can carry. Compounding: `shieldTable`
  (`src/core/svek-dot-emit.ts:92-105`) rounds the cell width (`151` vs the
  oracle's `151.425`, `round` at `:44`) and uses the placeholder shield
  constants `SHIELD_MARGIN_X = 1` / `SHIELD_MARGIN_Y = 16`
  (`src/core/svek-dot-emit.ts:89-90`, self-documented as "nominal constants
  stand in for the real measured shield"), which the oracle's form does not
  have at all.
- Causal chain: oracle DOT is `sh0007:p76423d83...->sh0006` off the 2nd of 4
  equal 18px rows; ours is `sh0007:h->sh0006` off the single centre port, and
  the surrounding 1px/16px shield cells change the node's laid-out extent →
  `svg/@width` and `svg/@viewBox[2]` 269 vs 275 (6px), the `object London`
  box's x 193.35 vs 201.14 (7.79px), and the whole spline + arrowhead, whose
  worst term is `path/@d[1]` 43 vs 34 (9.0px, the reported max).
- Ruled out: NOT the engine — the two DOTs are structurally *different*, not
  merely differently placed: the oracle's map node has 4 `<TR>`s and 3 named
  ports, ours has 3 `<TR>`s and 1. NOT node sizing for `sh0006` (`object
  London`, 0.843403 x 0.472222, 0.0000 delta) and not the map's total height
  (oracle 4 x 18 = 72, ours 72). NOT `!pragma svek_trace on` — it is a debug
  dump directive with no geometric effect, proven by `jaxere-74-cole479` below
  producing the identical delta without it. Note the object DOT gate scores
  this fixture EQUAL: `compareStructural` never reads inside a `label=<...>`
  value, so a structural pass is not evidence of identical DOT.
- Verdict: needs-maintainer-scoping — the mechanism is fully identified and
  citable, but the fix is a new node-emission form plus a per-port edge
  endpoint plumbed through `DotInputNode`/`DotInputEdge` and the map layout,
  and it changes the DOT for every `map` fixture, not just these two. That is a
  cross-module port of `SvekNode#appendLabelHtmlSpecialForLink`, not an edit.
  Explicitly NOT `gvts-blocked`: the input is not identical.
- Shared with: jaxere-74-cole479

### jaxere-74-cole479
- Mechanism: identical to `diveje-52-xefe514` — the map node is emitted as a
  shielded single-port table instead of upstream's per-entry port table.
- Origin side: upstream-of-layout (emitted DOT attribute)
- Java origin: `svek/image/EntityImageMap.java:245-247` →
  `svek/SvekNode.java:132-135` → `svek/SvekNode.java:269-303`
- Ours: `src/core/svek-dot-emit.ts:148-152`, `:169`, `:92-105`
- Causal chain: same as diveje — same oracle table (`WIDTH="151.425"`, 4 rows,
  3 ports), same ours (`WIDTH="151"`, 1 port `h`), same 6px canvas error, same
  7.79px shift of the `object London` box, same 9.0px worst spline term. The
  extra `svg/g[1]/rect[1]/@width` diff (269 vs 275) is the `<style> root
  BackgroundColor palegreen` full-canvas backdrop inheriting the canvas error —
  a consequence, not a second cause.
- Ruled out: NOT a `<style>`-block defect: the fixture's colours and font
  colours produce ZERO non-numeric diffs, and the map's DOT `BGCOLOR` slot
  differs only in placement (table-level in the oracle, cell-level in ours),
  which is a property of the emission form, not of the style cascade. NOT the
  engine (DOT structurally different, as above). NOT node sizing (`sh0006`
  0.0000).
- Verdict: needs-maintainer-scoping (same scoping item as diveje-52-xefe514)
- Shared with: diveje-52-xefe514

---

## Shared mechanisms

Ordered by reach.

**M1 — link labels are measured without upstream's 1px all-round margin**
(`svek/SvekEdge.java:372-373` + `klimt/shape/TextBlockUtils.java:64-68`;
ours `src/diagrams/class/class-layout-edge-labels.ts:221`).
Slugs in this task: `nukera-08-dige359`, `sorisi-53-xebi982`,
`sibika-09-sipu286`. A corpus-wide scan of every object fixture that emits a
`label=<<TABLE>>` found 16 such fixtures; the main-label table is wrong in
every one of them and correct in none. Additional slugs outside this task:
`nulixu-97-nofi684`, `vocute-12-suxa445`, `zebufu-01-pevo013`,
`guzojo-14-muxa584`, `tujasu-04-nota700`, `style-stereotype-on-arrow-3`,
`style-stereotype-on-arrow-7`, and (with further, separate mechanisms)
`fonulu-92-libi014`, `lecali-51-funo316`, `kiluja-96-pado371`,
`meloxo-38-jeti489`, `tusiri-92-catu943`. The observed delta is exactly
`+2` width and `+2` height in every plain case (`21x13`→`22x15`,
`28x13`→`29x15`, `91x13`→`92x15`, `199x39`→`200x41`), which is
`withMargin(block, 1, 1)` applied once to the whole block — including the
3-line case, where it is +2 total rather than +2 per line, exactly as
`SheetBlock1#calculateDimensionSlow` composes it. `tobuka-93-jale775` is the
control: it carries only `taillabel=`/`headlabel=` tables, which upstream
builds *without* `addVisibilityModifier`, and ours match the oracle byte for
byte.

*Second, latent defect on the same line:* we emit `Math.round`
(`src/core/svek-dot-emit.ts:44`) where upstream truncates
(`svek/SvekEdge.java:505-506`, `(int) dim.getWidth()`). No current fixture
distinguishes them, but adding the +2 margin without also switching to
truncation will overshoot by 1px on roughly half of the 16 — the two changes
must land together.

**M2 — `map` nodes use the generic shielded single-port DOT table instead of
upstream's per-entry port table**
(`svek/image/EntityImageMap.java:245-247` → `svek/SvekNode.java:132-135` →
`svek/SvekNode.java:269-303`; ours `src/core/svek-dot-emit.ts:148-152` and
`:169`).
Slugs: `diveje-52-xefe514`, `jaxere-74-cole479`. Reach is every `map`
classifier that is an edge endpoint, and the same emission form is what
`EntityImageObject`/`EntityImageClass`/`EntityImageJson` select when they have
port short names (`EntityImageObject.java:249-253`,
`EntityImageClass.java:255-258`, `EntityImageJson.java:241`) — so the missing
port table is a shared gap across four `IEntityImage` subclasses, not a
map-only one. Scoping item.

**M3 — an object with an empty-but-unsuppressed field list keeps the bordered
rect's own `-1/-1` ink inset**
(`svek/image/EntityImageObject.java:111-113` +
`klimt/shape/TextBlockEmpty.java:79-80` +
`klimt/drawing/LimitFinder.java:184-187`; ours
`src/diagrams/class/class-ink-box.ts:68-73`, gate at `:278`).
Slugs: `jabote-02-rajo672`, `jotaga-99-fatu830`. This is the whole
exactly-1.0px band, and it is the direct sibling of the g3 `LimitFinder`
precedent — same rule, one condition wider, and with the Y term that the
earlier iteration concluded was unaffected. Both fixtures' canvases are
reproduced to the digit by the corrected rule and by the current one, in
opposite directions.

**M4 — `skinparam classAttributeIconSize` never reaches the visibility-glyph
geometry**
(`skin/VisibilityModifier.java:178-180` + `:186-190`, glyph edge = `ensureEven
(size) - 4`; ours `src/diagrams/class/class-visibility-icon.ts:68`, a hardcoded
`10` self-documented as "skinparam override not wired").
Slugs: `sorisi-53-xebi982` (12→8, we draw 6), `sibika-09-sipu286` (14→10, we
draw 6). Render-only — it never reaches the DOT. Correct at the default, so the
defect is confined to the override path.

## Origin-side tally

| Origin side | Count | Slugs |
|---|---|---|
| upstream-of-layout | 7 | all |
| engine | 0 | — |
| unbuilt-subsystem | 0 | — |

No `gvts-blocked` row. In three fixtures (`jabote`, `jotaga`, and the DOT-body
of the label trio) the DOT input *is* identical or near-identical and the
engine still reproduces the jar's interior coordinates exactly — which is
positive evidence that the engine is not the source here, rather than merely an
absence of evidence against it.
