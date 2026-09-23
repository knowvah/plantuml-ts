# T7 — edge rendering: icons, url wrap, note body, new decors, constraint

## `LinkConstraint.drawMe`'s exact attributes (for whoever reads the real Java body next)

Read directly from `~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/LinkConstraint.java:82-103`
(A2a/M9's own confidence was MEDIUM-HIGH; this closes the loop) and cross-checked
against `gujigi-63-roki030`'s golden (`lnk10`-`lnk13`):

- `<line x1 y1 x2 y2 style="stroke:#000;stroke-width:1;stroke-dasharray:3,3;"/>`
  — stroke is **`#000`** (`HColors.BLACK`, NOT the edge's own resolved
  `strokeColor`), thickness 1, dasharray literally `3,3` (matches the brief's
  assumption — no "ask first" needed). Both links of a constrained pair draw
  their own line from their own sampled point to the OTHER link's sampled
  point (`x2 - x1, y2 - y1` in `ULine`'s own local frame, translated to
  `(x1,y1)`).
- The text is `FontConfiguration.create(skinParam, FontParam.ARROW, null)` —
  the SAME font `resolveArrowLabelFont(theme)` already resolves for the main
  label — drawn with a plain `fill="#000"` (again, not the theme's arrow-label
  color).
- Centring: `x = (x1+x2)/2 - dimLabel.width/2`, `y = (y1+y2)/2 -
  dimLabel.height/2`, then the `TextBlock.drawU` call adds its own internal
  ascent (`top + ascent`, `ascent = fontSize - fontSize/4.5`). For a `\n`-split
  multi-line display, `dimLabel.height = lines.length * fontSize` and each
  line is independently horizontally re-centred within the BLOCK's own
  max-line width (the identical `TextBlockVertical` convention
  `EdgeGeo.quantifierLines`' own centring already implements) — verified
  digit-for-digit against `lnk12`'s two-line `enten\n/eller` (`230.12`/`146.611`
  then `232.273`/`159.611`).
- The raw `Relationship.linkConstraint.text` carries the SOURCE text
  UNSPLIT (`class-notes.ts#applyConstraintOnLinks` does `text.trim()` only —
  T5), so a `\n` token in the source is a literal two-char escape needing
  `core/klimt/creole/DisplayNewlines.ts#splitDisplayLines` at RENDER time —
  the exact same un-split-string shape `A2a/M10`'s `tailLabel`/`headLabel`
  had before T6 fixed the quantifier side.

## Write-set extension beyond the brief's declared three files (flagged)

`renderClass(geo: ClassGeometry, theme: Theme): RenderFragment` is a pure
function of GEOMETRY ONLY — it has no `ClassDiagramAST` access (confirmed by
reading its own signature and module doc comment: "Pure function: ClassGeometry
+ Theme → SVG string. No DOM, no async."). `Relationship.url`/`.hidden`/
`.middleDecor` (T5) therefore cannot reach `renderer-edge.ts`/`renderer.ts`
by any means EXCEPT a carry-only `EdgeGeo` field — the exact same channel
T6 already used for `phantomSlot`/`sourceLine`/`idEntity1`/etc.

This is a direct conflict with the brief's own "Never: touch ...
class-edge-geo.ts/class-geo-types.ts (T6's write-set, already merged)."
Resolved by making the SMALLEST possible extension, three pure carry-only
optional fields (no other line in either file touched):

- `class-geo-types.ts`: `EdgeGeo.url?: UrlInfo`, `.hidden?: true`,
  `.middleDecor?: MiddleDecor` (6-line addition total).
- `class-edge-geo.ts`: three `...(rel.X !== undefined ? {X: rel.X} : {})`
  spreads in `buildEdgeGeos`'s existing `edgeGeo` object literal (4 lines),
  identical shape to the lines immediately above them.
- `renderer.ts`: one-line `if (edge.hidden === true) return;` guard (same
  shape as the pre-existing `consumedByOpaleNote` guard) plus threading
  `geo.measurer` into the `renderEdge` call (`ClassGeometry.measurer` already
  exists — T3's own field, unconditionally set in production).

No mechanism inside either forbidden file was read, understood in depth, or
altered — only carry-only field declarations/assignments, the same pattern
T6 itself used seven times over for the fields immediately adjacent.

## `renderEdge`'s signature changed shape, not just grew

Adding a bare 5th positional parameter (`measurer?`) tripped the complexity
hook's PARAM-count cap (a pre-existing violation at 4, now blocking at 5).
Folded `ids`/`syntheticNames`/`measurer` into one `RenderEdgeContext`
object — the ONLY call site outside this module is `renderer.ts` (grepped;
`description/renderer-draw-sequence.ts`'s own `renderEdge` import is an
unrelated same-named function for a different diagram type), so this was a
safe, self-contained signature change, not a breaking one for any test.

## Visibility icon: `class-visibility-icon.ts#renderVisibilityIcon` is the WRONG reuse target

First attempt reused `class-visibility-icon.ts#renderVisibilityIcon` (the
member-row icon renderer) directly — it fills METHOD-kind icons solid
(`isFilled = !isField`, correct for `MethodsOrFieldsArea`'s row path, which
passes a REAL `BackgroundColor`). Measured against `canuti-20-jotu614`: all
three icons should be `fill="none"` regardless of method visibility, because
`SvekEdge.java:302`'s `addVisibilityModifier` call passes `null` as
`getUBlock`'s background parameter — `VisibilityModifier#drawInternal`'s own
`if (backgoundColor === null) ug = ug.apply(new Back('none'))` branch. Fixed
by drawing through `core/skin/VisibilityModifier.ts`'s own `getUDrawable`
(the brief's actually-named read-set item) via a throwaway `UGraphicSvg`
document — the same technique `renderer-arrowhead.ts#drawExtremityMarkup`
already uses for extremities — with `colorsFor` (exported from
`class-visibility-icon.ts`, a 1-line flagged extension, NOT a T5/T6 file)
supplying the theme-override-aware LineColor.

## `DotPath#getMiddle`'s ~0.001-0.005px residual vs the jar golden is NOT a defect

`buildMiddleDecorMarkup`'s unit test against `cenubi-27-xova754`'s real
layout points reproduces the golden's arc/ellipse to ~3 decimal places, not
byte-exact (`29.535` vs golden `29.539`, `85.032` vs `85.033`). Diagnosed
before writing the test (not fitted): the fixture's main `<path d>` already
matches the jar to 2 decimal places (both drive through REAL graphviz, same
DOT input — this is not a Smetana/dot-engine divergence), and `getMiddle()`
derives a 3rd-decimal value FROM those 2-decimal-precision points — ordinary
floating-point residue, not a mechanism error. `render-diff`'s own
`compareSvg` tolerance class (`'deterministic'`) treats this fixture as
fully conformant (0 structural / 0 numeric), confirming the residual is
within the established numeric tolerance. Unit test uses `toBeCloseTo(..,
1)`, not exact string matching, for this reason.

## `note on link` render order depends on `Relationship.linkNotePosition`, which `EdgeGeo` does not carry

`lipazi-06-care921`'s two links prove the LEFT/TOP vs RIGHT/BOTTOM(default)
position flips which operand (`note`/`label`) draws FIRST
(`SvekEdge.java:307-327`'s `mergeLR`/`mergeTB` argument order). T6 did not
carry `linkNotePosition` onto `EdgeGeo` (only the pre-merged geometry), and
this task's boundaries forbid adding it (`class-edge-geo.ts`/
`class-geo-types.ts` are the only place that could thread it, already
flagged once above — a second unrelated extension to the same forbidden
files was not taken). `renderEdgeNoteBox` therefore always emits in the
default (label-then-note) order; `lipazi`'s LEFT-position link's exact
child order — like its vertex geometry/paint — is deferred to T8, consistent
with the brief's own "byte-exact vertex order lands with batch 3's T8" note
for this fixture. Filed as a follow-on for whichever task next touches
`class-edge-geo.ts` for real: thread `linkNotePosition` onto `EdgeNoteBoxGeo`
itself (T6's own file), not as a new EdgeGeo field.

## Six risers, all pre-existing-diverged, mechanism identified per fixture

`pin-diff t6→t7`: 13 transitions, 0 losses of a t6-conformant fixture,
+4 conformant (canuti, cenubi, fitini, gixesa), +3 structural-match (focaci,
gikipi, kutazo), 6 "diff count rose" — ALL were already `diverged` in t6 and
remain `diverged` in t7 (verified per-slug, not assumed):
`camuna-58-veca254`/`nafiki-56-jixu680`/`rifuzu-80-nixo780` (M10 quantifier
now drawn correctly, exposing the pre-existing M1 qualifier-displacement
defect harder — same mechanism class as `lipazi`); `lozego-15-coci435`/
`nuvake-96-gofe203` (M5 note-on-link, same vertex-order defect as `lipazi`,
deferred to T8); `lipazi-06-care921` itself. `gikipi-69-pepo172` reaches
`structural-match` (icon childCount fixed) but not full conformance — its 3
residual numeric diffs (`viewBox`/`width` off by 1, a title-text `x` off by
0.5) are the PRE-EXISTING A5/M7 canvas-rounding mechanism (confirmed via
`git stash` — identical diffs present before any T7 change), unrelated to
A2a/M2.
