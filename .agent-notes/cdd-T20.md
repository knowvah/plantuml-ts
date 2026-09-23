# cdd-T20 — box chrome (header split, border/dash, icon centring)

## Observation: E1's gradient-quirk trigger is gated on "no inline colour
AT ALL", not "gradient fill"

- **Context**: implementing E1's "second trigger" (`HColorGradient` has no
  `equals` override) for `dizuse-83-dabi909`/`taceve-49-mezi408`.
- **Finding**: `EntityImageClass.java:192-208` resolves `headerBackcolor =
  backcolor == null ? getStyleHeader()... : backcolor` — when an INLINE
  `back:`/bare colour IS present (even with no inline `header:` token),
  `headerBackcolor` becomes the SAME REFERENCE as `backcolor`, which is
  trivially `.equals()`-true to itself regardless of whether it's a
  gradient. The "independently re-resolved, therefore never-equal-even-
  when-identical" quirk fires ONLY when NEITHER inline `back:` nor inline
  `header:` exists — i.e. `resolveBareOrBackColor(geo.color) ===
  undefined`. My first implementation checked only `typeof bodyFill !==
  'string'`, which incorrectly split `taceve-49-mezi408`'s Test1-4
  (`#yellow\FFFFFF` etc., inline gradient, no header token) — jar draws
  childCount 6 there (no split); my first pass drew 9. Caught by running
  `render-diff` against taceve/mexaka/dizuse together, not by algebra
  alone.
- **Impact**: `resolveClassHeaderFill` (`renderer-classifier-header-
  split.ts`) now short-circuits to `undefined` whenever `resolveBareOr
  BackColor(geo.color) !== undefined` and no inline header narrowed it —
  reproduces dizuse (split, shared gradient def id with body — matches
  jar's OWN accidental id-dedup, since `SvgGraphics#createSvgGradient`
  dedupes by VALUE not instance) and taceve Test1-4 (no split) exactly.
- **Confidence**: High (both fixtures render-diff'd before/after; taceve
  moved 40→14 structural, ALL residual diffs are the pre-accepted gradient-
  def-id divergence + the pre-existing `text:` font-colour gap).

## Observation: M6's caller-only fix is a closed-form baseline shift, not a
`rowHeight` substitution

- **Context**: `visibilityIconOriginY(rowBaselineY, rowHeight, theme)`
  couples TWO different upstream quantities into one `rowHeight` param —
  the single-line ascent/descent basis AND the `maxHeight12` centering
  term (`PlacementStrategyVisibility.java:56-62`). The file is T19-owned
  (locked); only the caller's inputs may change.
- **Finding**: substituting the WRAPPED block's total height as `rowHeight`
  directly moves the icon the WRONG direction (verified algebraically:
  the function's expansion is linear in `rowHeight` with a NEGATIVE
  coefficient, so a bigger `rowHeight` moves the icon further UP, when
  jar's real icon (`pakemi-72-cani346`, 4-physical-line wrap, cy=80.5)
  needs it to move DOWN from the pre-T20 cy=59.5). Symbolic derivation
  (keeping `rowHeight` fixed at `fontSize`, solving for the needed
  `rowBaselineY`) reduces to a clean closed form: `effectiveBaselineY =
  firstLineBaselineY + (blockHeight - fontSize) / 2` — shift the baseline
  DOWN by half the block's excess height over one line, keep `rowHeight =
  fontSize` unchanged. This uses ONLY caller-visible quantities (no
  duplication of `class-visibility-icon.ts`'s internal `/4.5` descent
  divisor or its `+2`/`iconBlockHeight` constants).
- **Impact**: `pakemi-72-cani346`/`vubofi-17-dedi529` both reach byte-exact
  conformance (`pass=true`) with a THREE-LINE caller change
  (`renderer-classifier-box.ts#wrappedIconOriginY`), zero edits to the
  locked file. The SAME bug also lives in `renderer-classifier-rows.ts:81`
  (`renderRow`, T19-owned) — reached by `renderer.ts:108`'s single-row
  path and `renderer-body-enhanced.ts:90,116`'s enhanced-body rows — NOT
  fixed this task (outside write-set), and by `class-member-rows.ts` NOT
  itself calling `visibilityIconOriginY` (the brief's own text was
  imprecise here — the call sites are in `renderer-classifier-box.ts`/
  `renderer-classifier-rows.ts`, not `class-member-rows.ts`; that file
  only gained the NEW `visibilityBlockHeight` geometry field this task
  reads).
- **Confidence**: High (byte-exact on both target fixtures; derivation
  re-verified by direct computation against jar's real cy, not curve-fit).

## Observation: generic-corner box (zubevi) — located, not fixed (write-set
boundary)

- **Context**: AC4 / step 5's instrumentation requirement.
- **Finding**: `class MyClass<S extends SomeClass,\nA extends
  AnotherClass,\nY YetAnotherClass>` (`zubevi-64-fume582`) — jar's
  `EntityImageClassHeader.java:144` passes the generic clause through
  `Display.getWithNewlines(...)`, which SPLITS on `\n` into one line per
  `<text>` (3 lines here, jar childCount 10). TS origin: `class-stereotype-
  layout.ts:299-345+` (`GenericTagGeo`/`buildGenericTagGeo`) builds
  `text: string` as ONE joined string, and `renderer-classifier-badge-
  tag.ts:150-173` (`renderGenericTag`) draws exactly ONE `<text>` for it —
  never splitting on `\n`. Both files are OUTSIDE this task's write-set
  (not T20's, not named as any concurrent agent's either) — the fix needs
  a `GenericTagGeo.text` → `lines: string[]` (or similar) geometry change
  PLUS a render-side one-`<text>`-per-line loop (mirrors `EdgeGeo
  .labelLines`'s existing multi-line precedent, `class-geo-types.ts:305-
  321`). Not attempted this task; a clean follow-on task, single-file-pair
  scope.
- **Confidence**: High (mechanism quoted with `file:line` on both sides;
  not measured further since no edit was made).

## Observation: two pre-existing, out-of-write-set colour bugs surfaced by
`render-diff`, not caused by T20

- **Context**: `gojatu-01-jibo986`/`mexaka-52-gati860` still show
  `rect/@fill` mismatches after M1 landed.
- **Finding**: (1) `class X #yellow;line:red;...` — a BARE leading colour
  token in a COMPOUND spec (no explicit `back:` keyword) is not extracted
  by `core/color-override.ts#resolveBareOrBackColor` (its own doc comment:
  "a compound token needs its explicit `back:` part" — a bare-then-`;`
  form isn't that). (2) `class FooBold #line.bold` (a KEYWORD-ONLY spec,
  no `;`/`:` at all) hits that SAME function's "no `;` and no `:`" bare-
  color fallback and returns the literal string `line.bold` as if it were
  a colour name (`mexaka`'s `rect/@fill` shows the literal garbage
  `#line.bold`). Both are pre-existing (confirmed present in the T18-HEAD
  baseline `render-diff` runs at the START of this task, before any T20
  edit) and live in `core/color-override.ts` (T18's fill-half, outside
  this task's write-set) — not fixed, not regressed.
- **Impact**: neither blocks M1 (the stroke/dasharray fields I own resolve
  correctly regardless — `parseDeclarationColors` is a SEPARATE, correct
  extraction of the same raw string); both are candidate follow-on fixes
  for whoever owns `color-override.ts` next.
- **Confidence**: High (identical in the pre-T20 and post-T20 render-diff
  output; `text:` font-colour is a third, separate, likewise pre-existing
  gap on the same fixtures — no consumer of `DeclarationColors.text` yet
  exists anywhere in the render path).

## Observation: `nisune-86-faji869`'s `classHeaderBackgroundColor`
skinparam is genuinely unreachable from this task's write-set

- **Context**: AC1.
- **Finding**: `skinparam classHeaderBackgroundColor #444` maps to
  `element.class.header BackGroundColor` (`style/FromSkinparamToStyle
  .java:196`). `class`/`enum`/`interface`/`abstract` are NOT in
  `ELEMENT_BUCKET_SNAMES` (`skinparam-element-buckets.ts`'s own doc
  comment: "the flat-scoped keywords... keep their own explicit
  resolveSkinparam cases") so `resolveElementHeaderBackground` never
  populates for them. Reaching this needs a NEW `theme.colors.graph`
  field (`theme-graph-colors-a.ts`, owned by a live T18-follow-up agent
  this batch) and its skinparam-key-handler wiring
  (`skinparam-key-handlers-table-*.ts`, T19-owned this batch) — both
  explicitly locked. `resolveClassHeaderFill`'s doc comment names this
  gap with its exact citation.
- **Impact**: `nisune-86-faji869` stays at structural=3 (unchanged from
  before this task) — a legitimate, journaled stop, not an oversight.
- **Confidence**: High (traced the full upstream resolution chain and the
  TS bucket-membership check that blocks it).
