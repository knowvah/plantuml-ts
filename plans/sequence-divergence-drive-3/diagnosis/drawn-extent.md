# T5a diagnosis: the sequence canvas ignores every drawn primitive

Task T5a (diagnosis phase), mission sdd3, tip `501a162d0`. Targets
`kaluna-08-rubu301` (ws 2) and `gebeki-18-muci858` (ws 2). Both diffs are the
same two keys, `svg/@viewBox[2]` and `svg/@width`; height is already correct.

## Verdict

The jar sizes the canvas as a running maximum over EVERY drawn primitive's
`ensureVisible` call, seeded with the document dimension. The port sizes the
sequence canvas from the layout box alone (`trunc(dim + 1)`): the sequence
body is built as strings and nothing in that path folds the drawn primitives
into the canvas. The two target rows are the two (of 1143) whose drawn extent
exceeds the layout box: an SVG path arc (`SEG_ARCTO`) whose jar rule is
endpoint-plus-radius, which over-reaches the true ink. The filed mechanism
(journal row 34 for gebeki; the T5a lead for kaluna) is CONFIRMED for both rows,
and widened: the cause is the missing drawn-extent fold, of which the arc is
only the case that fires.

Confidence HIGH (see the end): the fold reproduces the jar's canvas on all
1143 rows, and a counterfactual patch took both targets to zero with no other
row moving.

## Java read (quoted)

`klimt/drawing/svg/SvgGraphics.java` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`):

- `:117-118` `private int maxX = 10; private int maxY = 10;`
- `:129-135`
  ```java
  final protected void ensureVisible(double x, double y) {
      if (x > maxX)
          maxX = (int) (x + 1);
      if (y > maxY)
          maxY = (int) (y + 1);
  }
  ```
- `:142-143` the constructor seeds it with the document dimension:
  `ensureVisible(minDim.getWidth(), minDim.getHeight());`. The dimension is
  `TextBlockExporter.java:284` `option = option.withMinDim(dim)`, with `dim` =
  `calculateFinalDimension()` (`:160`, `:198-203`): chrome plus margin, UNscaled.
- `:849-854` (inside `svgPath`, `:826-`):
  ```java
  } else if (type == USegmentType.SEG_ARCTO) {
      sb.append("A" + format(coord[0]) + "," + format(coord[1]) + " " + ... + format(coord[5] + x) + "," + format(coord[6] + y) + " ");
      ensureVisible(coord[5] + coord[0] + x + 2 * deltaShadow, coord[6] + coord[1] + y + 2 * deltaShadow);
  ```
  i.e. the arc's END point plus `rx` / `ry` (`coord[5]+coord[0]`, `coord[6]+coord[1]`),
  not the arc's true extent. It over-reaches the ink by up to `rx`.
- `:800-813` `finalizeRootAttributes`: `maxXscaled = (int)(maxX * option.getScale())`;
  `width` is `format(maxX) + "px"`, `viewBox` is `0 0 maxXscaled maxYscaled`;
  `:819-822` the pending background rect is resized to `format(maxX)`/`format(maxY)`.
- Every other drawing method calls it too; this is the complete table (a
  `grep -rn ensureVisible net/.../klimt/drawing/svg/` finds the calls ONLY in
  `SvgGraphics.java`; the `Driver*Svg` classes do not call it, they call the
  `SvgGraphics#svg*` method):

  | primitive | `SvgGraphics.java` | extent taken |
  |---|---|---|
  | `svgEllipse` | `:348` | `x + xRadius + 2*ds`, `y + yRadius + 2*ds` (x,y = centre) |
  | `svgArcEllipse` | `:361-362` | both end points |
  | `svgRectangle` | `:594` | `x + width + 2*ds`, `y + height + 2*ds` (NOT x, y) |
  | `svgLine` | `:620-621` | both end points, `+ 2*ds` |
  | `svgPolygon` | `:666` | every point `+ 2*ds` |
  | `text` | `:757-758` | `(x, y)` and `(x + textLength, y)` |
  | `svgPath` | `:827,834,837,841-842,846-848,854` | origin; MOVETO/LINETO/QUADTO/CUBICTO points; ARCTO end + radius |
  | `svgImage` png / svg | `:981-982`, `:997-998`, `:1033-1034` | `(x, y)` and `(x + w, y + h)` |

The sequence jar draws every one of these through the single `SvgGraphics` of
`TextBlockExporter#exportTo`, so the canvas is `max(document dim, every drawn
extent)`, folded with `ensureVisible`'s quirk (`maxX` only moves when
`x > maxX`, and then to `(int)(x + 1)`).

## Mechanism

`core/assemble-svg-sequence.ts#finalizeSequenceFragment` takes the canvas from
`trunc(fragment.width)`, and `fragment.width` is `renderer-document.ts#canvasOf`
= `totalWidth + 1`: the `ensureVisible(minDim)` seed ALONE. The primitives are
emitted as strings by `renderer*.ts` / `sequence-text.ts` through `core/svg*.ts`;
no `ensureVisible`-equivalent runs over them, so a primitive that reaches past the
layout box (kaluna: sprite ellipse arcs; gebeki: the rounded frame's corner arc)
never grows the canvas.

## Origin

- `src/core/assemble-svg-sequence.ts:167-176` (`finalizeSequenceFragment`,
  `:172` `width: Math.trunc(fragment.width)`, `:173` the same for height): the
  canvas is the layout seed with no drawn-extent fold.
- `src/diagrams/sequence/renderer-document.ts:55-57` (`canvasOf` =
  `geo.totalWidth + ENSURE_VISIBLE_DELTA`): where the seed value comes from. Its
  doc comment (`:12-37`) is right about the seed and silent about the draw calls.
- The same rule IS ported, faithfully, in the klimt driver
  (`src/core/klimt/drawing/svg/svg-graphics-elements.ts:119,132-133,149,176-177,
  192-193,207,212-213,278,299-331,353-377` and `svg-graphics-core.ts:178-181`),
  and it does run for sequence's SHAPE primitives, but its result is discarded
  (see Ruled out 4). The string-built sequence body never reaches it.

## Causal chain (closed forms, numbers from instrumentation)

The jar's canvas is `maxX = fold(ensureVisible, [dim.w, ...drawn x extents])`.
Ours is `trunc(dim.w + 1)`.

kaluna-08-rubu301 (`scale` none, factor 1). `exportedDimension` = (295.7875, 340).
- Ours: `trunc(295.7875 + 1) = 296` -> `width=296`, `viewBox[2]=296`.
- The sprite's ellipse path (`<path d="M32.894,153 A110,42 0 0 1 142.894,111
  A110,42 0 0 1 252.894,153 ...">`, jar `in.svg`): its second arc ends at
  x = 252.894 with `rx` = 110, so `SvgGraphics.java:854` calls
  `ensureVisible(252.894 + 110, ...) = ensureVisible(362.894, ...)`;
  `362.894 > 296`, so `maxX = (int)(362.894 + 1) = 363`. Jar `viewBox[2]` = 363. The
  true ink right edge is about 258 (252.894 plus the 5 px half-stroke); the jar
  over-reaches by `rx`, and the port must reproduce that, not fix it.
- Y: the same arcs give `153 + 42 = 195`..`290`; the largest y is 290.263 <
  340, so height stays at the layout's 341 (jar 341, ours 341, no diff).
- Port trace (temporary `console.error` in `SvgGraphicsCore#ensureVisible`,
  reverted): the one-shape `UGraphicSvg` of `sequence-text.ts#shapeSvg` DOES run
  `ensureVisible(362.8937..., 195)` and goes `maxX 253 -> 363`, then is thrown away
  with the document.

gebeki-18-muci858 (`scale 2`, RoundCorner 40). The page is drawn at factor 1
(`renderer.ts` `DRAW_SCALE`), numbers deferred, so the body holds unscaled
coordinates. `exportedDimension` = (228.625, 181).
- Ours: `trunc(228.625 + 1) = 229`, times factor 2 = 458.
- The `alt` frame's coloured band is a path whose corner arc is `A20,20 0 0 1
  209.625,71` (the jar's `A40,40 ... 419.25,142` divided by the factor 2; the
  `RoundCorner 40` is halved to a radius 20 by `DriverRectangleSvg`/`svgPath`).
  `SvgGraphics.java:854`: `ensureVisible(209.625 + 20, ...) = (229.625, ...)`;
  `229.625 > 229`, so `maxX = (int)(229.625 + 1) = 230`; the root writes
  `format(maxX)` scaled by the factor (`:800-813`): `230 * 2 = 460`. Jar 460.
- `computeScaleFactor` reads the dimension, not `maxX` (`TextBlockExporter.java:
  205-209`), so the factor (2) is unchanged and only the integer canvas differs.
  Y: the arc's `y` extent is 167 (< 181), so height 182 matches.

Instrumented values for both rows (`walk.mts`, folded over the body at the
`finalizeSequenceFragment` call site, pre-`exportTo`):

| row | factor | exportedDimension | ours canvas | fold canvas | jar canvas (viewBox / factor) |
|---|---|---|---|---|---|
| kaluna | 1 | 295.7875 x 340 | 296 x 341 | **363** x 341 | 363 x 341 |
| gebeki | 2 | 228.625 x 181 | 229 x 182 | **230** x 182 | 230 x 182 |

## Ruled out

1. **The `+1` constant / `canvasOf` arithmetic.** On 1141 of 1143 rows the
   seed-only canvas equals the jar's; `trunc(dim + 1)` is exactly
   `ensureVisible(minDim)`. Evidence: harness `walk.mts` over the whole corpus,
   `ours == fold` on 1141 rows, and `ours == jar` on every zero-cohort row.
2. **The T3b export tail / scale.** kaluna has factor 1 and still differs, and
   gebeki's factor (2) is right: `exportTo` computes `canvas.width * factor`
   from the integer it is handed (`TextBlockExporter.ts:358-371`). Both diffs
   close to the jar's value once the integer is fixed (counterfactual below).
3. **The blotter / frame colour as the cause of gebeki** (a lead in row 34's
   neighbourhood). Row 34's five-case oracle experiment (only colour plus
   `RoundCorner` together gives 230) is consistent with this mechanism: a
   rounded, coloured frame band is emitted as a `<path>` with ARCTO segments
   (gebeki's jar SVG has 3 such paths), whereas a plain rect frame hits
   `svgRectangle` (`:594`), which only adds `x + width`. So the band is the
   trigger, the missing fold the cause. (I did not rerun row 34's five cases;
   that part is its evidence, not mine.)
4. **"No ensureVisible runs on the sequence path."** Partly false. The klimt
   driver's `ensureVisible` runs for shapes drawn through `shapeSvg` (kaluna's
   sprite paths, temporary trace above) but each primitive has its own fresh
   one-shape `UGraphicSvg` (`maxX = 10` start), whose `maxX`/`maxY` are private
   and discarded. Rect, line, text and polygon never reach klimt. Harvesting
   `shapeSvg`'s maxX alone would fix these two rows but leave the table
   incomplete (see Proposed fix, alternatives).
5. **The arc rule being a port quirk of ours.** `SvgGraphics.java:854` is
   quoted above and the jar's own SVG confirms it: walking the jar's output
   with the table, no row's drawn extent exceeds its own canvas (1104
   scale-1 jar SVGs, 0 over-reach); kaluna's binding extent is exactly
   `252.894 + 110`.
6. **A rule table that would move other rows.** Folding the table over the
   body of all 1143 rows gives a canvas equal to today's on 1141 and to the
   jar's on the other two. Evidence below (Rows).
7. **The background / border rect inflating the fold.** The port's body at
   `finalizeSequenceFragment` is pre-background, but `finalizeSequenceBody`'s
   bg rect is sized to the canvas (`assemble-svg-sequence.ts:53-61`). With the
   rect included, its `x + width` equals the canvas, which cannot raise it;
   the proposal still folds the BARE body so the bg rect is built from the
   grown canvas (the jar resizes the pending background to the final `maxX`,
   `SvgGraphics.java:819-822`).

## Rows

Method: temporary gated hook at `finalizeSequenceFragment` writing, per fixture,
`exportedDimension`, the body, the scale factor and the produced canvas; a
scratch walker applies the table above to the body, with `ensureVisible`'s
exact fold; compared to the jar's `viewBox`. All 1143 corpus sequence rows
render (0 errors).

- **Targets that move:** `kaluna-08-rubu301` 363 (from 296), `gebeki-18-muci858`
  230 (from 229, x2 = 460).
- **Every other row: the fold equals today's canvas.** 1141 rows, including all
  1133 zero rows (a `zero rows where fold != ours` query
  returned `[]`), the 8 other non-zero rows, and the six chrome rows
  (`fazaba-22`, `ganefo-61`, `jogeto-89`, `solivu-37`, `taxude-25`, `zerovu-57`).
  Pins therefore stay byte-equal (width/height and the bg rect that derives
  from them are unchanged); the golden ratchet is untouched (stop 6).
- **No zero row would move.** 22 rows have a drawn point past the raw layout
  dimension; 20 of them are the bg rect itself or an element at exactly the
  `trunc(dim+1)` integer (`rect` right edge = canvas), which cannot raise
  `maxX` because `x > maxX` is false. The other two are the targets.
- **Counterfactual (temporary patch, reverted):** replacing
  `Math.trunc(fragment.width/height)` in `finalizeSequenceFragment` with the
  fold over `fragment.body` and re-running `classify.mts` against
  `measurements/b4-classify.json` gave exactly 2 movers: kaluna 2 -> 0,
  gebeki 2 -> 0; zero cohort 1133 -> 1135, sum ws 1082 -> 1078; no other row's
  `ws`, cohort or diff keys changed.
- **Canvas diffs this does NOT explain (named so nobody chases them here):**
  `jexavi-40-degi377` (jar 446, ours 337), `mefeke-43-xotu192` (300/167 vs
  188/139), `tifube-59-tezo313` (181 vs 135), `fifasu-62-pipo979` (187x223 vs
  453x158) and `gepuce-64-pivu656` (rect/line vs polygon/path). In each the fold
  equals ours, and the participants themselves sit at different x (layout
  width), so the canvas follows other mechanisms.
- **Shadowed rows (3: gepuce, matoka-21-jisu767, zupora-06-pazi006).** The jar adds
  `2*deltaShadow` to those primitives' extents; the SVG carries only
  `filter="url(#f...)"`, not the delta, which is the style's `Shadowing`
  (`sequence-shadow.ts` head). With `ds = 0` these rows match; with the
  sequence's `ds = 4` their shadowed extents plus 8 are still inside the
  canvas by a wide margin (matoka/zupora 75 of 133; gepuce 261 of 314 unscaled).
  No corpus row is sensitive; see Open questions.
- **Single-glyph text.** `SvgGraphics.java:703-705` omits `textLength` for a
  one-character `<text>`, so a body walk reads only `x` for it. Smallest
  corpus slack from a single-glyph `x` to the canvas edge: 24.4 px (> a 14 px
  glyph). No corpus row is sensitive.

## Proposed fix (not applied; the orchestrator journals it first)

Approach: port `SvgGraphics#ensureVisible` plus its per-primitive table once, as
a drawn-extent fold over the emitted body, and use it where the canvas is
decided. The jar's structure is "one running max fed by every draw"; the
string-built sequence body has no single UGraphic to feed it, so the fold reads
the emitted elements. It is not per-primitive special-casing in the emitters:
one table in one module, mirroring `SvgGraphics.java`'s own, quoted per row.

Write-set:
- NEW `src/core/svg-drawn-extent.ts` (about 110 lines): a small `VisibleExtent`
  (`maxX = maxY = 10`, `ensureVisible` exactly `SvgGraphics.java:129-135`) and
  `drawnExtent(body, minDim)` that seeds with `minDim` (`:142-143`) and applies
  the table above to `rect`, `ellipse`, `line`, `polygon`, `path`, `text`,
  `image` elements, path data M/L/Q/C/A per `:834-854` (ARCTO =
  `coord[5]+coord[0]`, `coord[6]+coord[1]`). Pure string in, `{width, height}`
  out; no Node built-ins.
- EDIT `src/core/assemble-svg-sequence.ts:167-176`: in
  `finalizeSequenceFragment`, `width`/`height` become
  `drawnExtent(fragment.body, exportedDimension)` instead of
  `Math.trunc(fragment.width/height)`, computed on the bare body BEFORE
  `finalizeSequenceBody` so the bg/border rects and `exportedDimension`-based
  scale are built from the grown canvas. `renderer-document.ts#canvasOf` stays
  (it still seeds the pre-chrome interim `fragment.width` the chrome code
  reads); its doc comment gets a one-line pointer.
- TESTS `tests/unit/core/svg-drawn-extent.test.ts` (new) and an added case in
  `tests/unit/core/assemble-svg-sequence.test.ts`; `docs/catalog.md`
  regenerated (`npm run catalog`, drift-gated).

Unit test to write first (red -> green), quoting the Java:
- ARCTO, `SvgGraphics.java:854`: `<path d="M32.894,153 A110,42 0 0 1 252.894,153"/>`
  with `minDim` (295.787, 340) -> width `363` (`252.894 + 110 = 362.894 > 296`,
  `(int)(362.894 + 1)`), height `340 + 1`; and the gebeki arc
  `A20,20 0 0 1 209.625,71` with `minDim` (228.625, 181) -> width 230.
- Quirk, `SvgGraphics.java:129-135`: a point exactly at the current `maxX`
  (e.g. `x = 230` after `maxX = 230`) does not bump; a seed of 5 stays 10
  (`:117-118`); rect uses `x + width` only (`:594`); text adds `textLength` only
  when present.
- `finalizeSequenceFragment` fixture: a fragment whose body has the kaluna arc
  yields `width 363` and a bg rect (non-white background) of width 363.

Expected movement: kaluna 2 -> 0, gebeki 2 -> 0, zero cohort 1133 -> 1135, sum
ws 1082 -> 1078, 0 risers, 0 pinned rows moved (byte-equal).

Core files touched: yes (`src/core/`). `finalizeSequenceFragment` is reached by
sequence only, plus nested `{{ }}` sequences embedded in other engines' notes,
so the all-engine hash gate (`tools/svg-hashes.mts --all`) is required to show
0 non-sequence movers; a survey of the other engines is not needed beyond it.

Alternatives considered and rejected: (a) harvesting the one-shape
`UGraphicSvg`'s `maxX` in `sequence-text.ts#shapeSvg` (fixes the two rows, but
rect/line/text/polygon never reach it, so the canvas rule stays half-ported and
the next primitive that reaches past the box is the next mission); (b) a fold at
each `core/svg-shapes.ts` emitter (19 sequence files import them; shared mutable
state across the string emitters, and not the jar's structure).

## Confidence

HIGH. Backed by: the Java quoted at the lines above; the jar's own SVG for both
targets reproduces to the integer (kaluna `252.894 + 110 -> 363`, gebeki
`209.625 + 20 -> 230 x 2`); instrumented ours-versus-fold agreement across all
1143 sequence rows; the table showing 0 over-reach against the jar's own output
on 1104 scale-1 SVGs; and a counterfactual patch that took both rows to zero
with no other classify row moving.

## Open questions

1. `deltaShadow` (`2*ds` in the table) is not recoverable from the emitted body
   (the filter is fixed, the delta is the style's `Shadowing`). The proposal
   uses `ds = 0` and is exact on all 1143 rows (the three shadowed rows have
   wide slack). If a future row needs it, the shadow helpers
   (`sequence-shadow.ts#withNoteShadow` / `sequenceShadowFilter`) hold the delta
   and would have to carry it; not needed now.
2. The body is read after the 3-decimal `format` when numbers are not deferred
   (factor 1 and no `scale`/`dpi`): a coordinate within 0.0005 below an integer
   boundary could round up and move `(int)(x + 1)` by one where the jar sees the
   raw double. Zero corpus rows hit it (1104 scale-1 rows agree); in the
   deferred (`scale`) path the body is unrounded.
3. Single-glyph `<text>` has no `textLength` in the output, so `x + textLength`
   is not foldable from the body (Rows, last item). Not a corpus effect.
