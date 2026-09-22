# cdd-T18 — `Paint` at the class colour seam

## Observation: the class colour seam's consumer set is 11 files, all in-bounds

- **Context**: step 1's mandatory audit, before any edit — `grep -rn` across
  the WHOLE repo for `classifierFill|classBorder(` and for
  `classBackground|classBorder|icon{Private,Package,Protected,Public}Color`.
- **Finding**: every consumer is inside `src/core` or `src/diagrams/class`.
  The single hit outside both — `src/diagrams/packetdiag/renderer.ts:13` —
  is a doc comment referencing `defaultTheme.colors.graph.classBackground`
  as a naming precedent; it reads no field and emits nothing.
  `classifierFill()`/`classBorder()` call sites:
  `renderer-classifier-box.ts:98,150,166,183,231,256,279,283,318` (plus the
  two indirect ones the spec named, `renderer-body-enhanced.ts:136` and
  `class-visibility-icon.ts:313`). Field consumers that the widening forced
  to change: `skinparam-accumulator.ts`, `skinparam-key-handlers-shared.ts`,
  `class-visibility-icon.ts`, `class-namespace-shape.ts`,
  `class-namespace-folder-outline.ts`, `class-namespace-usymbol-shape.ts`,
  `renderer-body-enhanced.ts`. `skinparam-theme-builder.ts` needed NO change
  (its `FieldGetter` returns `unknown`), nor did `renderer.ts:104`,
  `renderer-edge-extras.ts:242-243`, or `style-map-simple-fields.ts:58`.
- **Impact**: stop 12 did not fire. The audit's real value was the negative
  result: three files the widening looked certain to touch did not need
  touching, and four nobody listed did.
- **Confidence**: High (typechecker-enumerated, not grep-guessed).

## Observation: the divider-line exception is a SHAPE-KIND branch, not a colour test

- **Context**: D8 called the `capode-04-jeka075` divider-line case "a NAMED
  branch"; the obvious reading is "if the Paint is a Gradient, flatten it".
  That reading is wrong.
- **Finding**: upstream splits at the DRIVER, by shape.
  `klimt/drawing/svg/DriverLineSvg.java:76-82` — a `ULine` whose stroke is
  an `HColorGradient` takes `svg.setStrokeColor(gr.getColor1().toSvg(mapper))`:
  no `createSvgGradient`, no def, no `url(#…)`. Its sibling
  `DriverRectangleSvg.java:97-111 #applyStrokeColor` does the opposite for
  the identical colour, and `DriverPolygonSvg.java:63-64` delegates straight
  to it. So ONE resolved `LineColor` paints the box outline as a gradient
  and every inner divider line flat — jar-verified `capode-04-jeka075`:
  `stroke="url(#…)"` on the rect, `stroke="#FFBD42"` on both `<line>`s.
  Ported as `renderer-classifier-colors.ts#classBorderLine`, which is
  `noGradient(classBorder(...))` (`HColors#noGradient`, java:139-146 —
  upstream's own name, kept). **The exact condition: every `line(...)` call
  site reads `classBorderLine`, every `rect(...)`/`path(...)` call site
  reads `classBorder`.** Nothing inspects the Paint's shape to decide.
- **Impact**: a future task adding a class-engine `line()` call must pick
  `classBorderLine`, and the choice is mechanical (what am I emitting?), not
  a judgement about the colour. The same split will apply verbatim to
  state/activity when their colour seams widen.
- **Confidence**: High.

## Observation: `dacixi`'s namespace gradient needed T11's field AND a parse

- **Context**: AC4 asked whether `dacixi-46-lina038`'s `#yellow\gold`
  namespace case needed batch-4 T11's `Namespace.color` field.
- **Finding**: T11's field IS on main and IS what carries the token
  (`class-namespace-shape.ts#namespaceFill` reads `geo.color`, and cdd-T12's
  doc comment there already records "already resolved to its bare/`back:`
  half at parse time (T11)"). But the field alone was not sufficient: the
  value was handed to `fill=` unparsed, so the fixture rendered
  `fill="#yellow\gold"`. The missing half was `parseColor` at the render
  site. Applied to the WHOLE expression, both tiers — upstream's
  `Cluster#getBackColor` yields one `HColor` from one parser whichever tier
  supplied the token, so parsing only the inline tier would have been the
  unfaithful choice. No fixture moved from widening the skinparam tier too.
- **Impact**: "the parse-time field exists" is not the same as "the value is
  parsed". Both halves of a T11-style hand-off need checking.
- **Confidence**: High (fixture now `fill="url(#…)"`; only the def id differs).

## Observation: the visibility-icon path was emitting raw colour NAMES

- **Context**: two corpus movers (`tagofo-84-nuti362` 36 -> 0 CONFORMANT,
  `rakopi-21-sufa571` 20 -> 17) fell without carrying any gradient — both
  set only flat `icon*Color` keys (`black`, `DarkGoldenRod`).
- **Finding**: not a gradient effect. Routing `colorsFor`'s result through
  `resolvePaint` put the icon colours through `resolveColorToSvgHex` for the
  first time; previously the raw skinparam token went straight into
  `fill=`/`stroke=`, so the jar's `#000`/`#B8860B` met our `black`/
  `DarkGoldenRod`. Every other colour path in this port already resolved;
  the visibility-icon path was the outlier.
- **Impact**: a colour that renders correctly in a browser can still be a
  parity defect — a name and its hex are the same pixel and a different
  attribute. Worth grepping for other raw-token `fill=` sites.
- **Confidence**: High (two independent fixtures, one to full conformance).

## Observation: gradient def IDs are a permanent, per-def parity cost

- **Context**: two movers ROSE (`taceve-49-mezi408` 7 -> 11,
  `mexaka-52-gati860` 37 -> 42) while their colour VALUES became correct.
- **Finding**: every `<linearGradient>` this port emits costs exactly one
  `@id` diff. The jar builds ids as `"g" + Long.toString(Math.abs(seed), 36)
  + gradients.size()` (`SvgGraphics.java:162,393`), seeded per document;
  `core/paint.ts#paintToSvg` uses an FNV content hash instead (a deliberate
  invention, mission-render-fidelity D3). taceve's +4 is exactly
  `5 new def-id diffs - 1 retired defs-childCount diff`. Note the port DOES
  already have the jar's scheme ported for the klimt renderer family
  (`svg-graphics-core.ts:185-186` + `svg-seed.ts#getSeed`) — the two id
  schemes simply have not been unified.
- **Impact**: any future class task that correctly ADDS a gradient will
  raise its fixture's diff count. Write exit bars as "zero UNEXPLAINED
  rises". Unifying `paintToSvg`'s id with `svg-seed.ts#getSeed` is a
  tracked, separable follow-on that would retire this cost corpus-wide.
- **Confidence**: High (arithmetic reconciles exactly on taceve).
