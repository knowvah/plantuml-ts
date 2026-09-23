# T20 — box chrome

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 · parallel with
T19/T21/T22/T23 (disjoint write-sets).

## Context

Four independent mechanisms live in the classifier box's chrome. (1)
E1: when a resolved header BackGroundColor differs from the body fill,
upstream draws four shapes (`EntityImageClass.java:216-234`); this port's
existing split (`renderer-classifier-box.ts:140-186 headerBackgroundPath`)
is gated to `object|map|json`, so `class` never reaches it —
`nisune-86-faji869` (10 vs. our 7 children) reproduces the geometry by
hand exactly. (2) A3 M1's border/dash half: `classBorder()`/
`classBorderStrokeWidth()` (`renderer-classifier-colors.ts:175-209`,
T18-owned for fill, this task's for stroke/dash) never consult
`line:`/`line.bold|dashed|dotted`/`##[style]` (`LinkStyle.java:97-108`:
DASHED→`(7,7,w)`, DOTTED→`(1,3,w)`, BOLD→solid width 2). (3) A5 M6: the
`+`/`-` visibility icon centres on one line instead of the wrapped
member block (`PlacementStrategyVisibility.java:63-69` vs.
`class-visibility-icon.ts:104,336-342`'s single-line `rowHeight`) — a
21px delta on `pakemi-72-cani346`. (4) The generic-corner box: `zubevi-
64-fume582`'s `<T>` generics show the jar drawing 3 `<text>` after a
corner `rect[#FFF]` where this port draws 1 — TS origin unlocated
(`diagnosis/A2b-entity-groups.md` Unclassified). The report is a lead:
re-read the cited bodies before editing.

## Task

1. Tests first, one per mechanism, using the named fixtures.
2. E1: widen the `geo.kind` gate in `renderer-classifier-box.ts:140-186`
   to include `class`/`enum`/`interface`/`abstract`, adding the
   class-flavoured three-rect form (rect2 header fill, rect3
   `roundCorner/2`-tall square-cornered at `dy = headerHeight -
   roundCorner/2`, outer rect re-stroked `none`) beside
   `headerBackgroundPath`'s existing `URectangle.halfRounded` form — do
   not merge the two shapes, they differ genuinely. Also handle the
   `HColorGradient` no-`equals` quirk (any gradient background triggers
   the split even with no header skinparam, per E1's "second trigger").
3. M1 border/dash: read the `line?`/`lineStyle?` fields T18 added to
   `extractDecorations` (do not edit the extractor). Thread `line` into
   `classBorder()` (mirroring `resolveBareOrBackColor`'s precedent) and
   `lineStyle` into `classBorderStrokeWidth()` plus a new dasharray
   resolver mirroring `LinkStyle.getStroke3`'s three literal cases, in
   `renderer-classifier-colors.ts`'s border functions (T18 already
   landed the fill/gradient half of this file — read its merged state
   first, edit only the two border functions).
4. M6: `class-visibility-icon.ts:336-342`'s `visibilityIconOriginY` takes
   a per-line `rowHeight`; change the call in `class-member-rows.ts` to
   pass the wrapped member's full block height and top (mirroring
   `PlacementStrategyVisibility.java`'s `maxHeight12`), not the icon
   file itself — the icon math stays in `class-visibility-icon.ts`
   (T19's), only its caller's inputs change.
5. Generic-corner box: instrument `zubevi-64-fume582` first — read
   `EntityImageClassHeader`'s generic-corner block (Java) and find which
   TS render path emits the corner `rect[#FFF]` for a generic classifier
   (search `renderer-classifier-box.ts` for the generics/type-parameter
   corner). Confirm the mechanism with a `file:line` before editing.
6. `.agent-notes/cdd-T20.md`: the E1 gradient-quirk reproduction; the
   generic-corner box's located TS origin.

## Read-set

`src/diagrams/class/renderer-classifier-box.ts:97-186,255,307-317`;
`src/diagrams/class/renderer-classifier-colors.ts:175-209` (post-T18);
`src/diagrams/class/class-declaration-extractors.ts:72-107`;
`src/diagrams/class/class-visibility-icon.ts:104,336-342`;
`src/diagrams/class/class-member-rows.ts` (whole). Java:
`svek/image/EntityImageClass.java:192-234`;
`style/FromSkinparamToStyle.java:196`;
`klimt/color/HColorGradient.java:43` vs. `HColorSimple.java:85-89`;
`klimt/color/Colors.java:95-124`; `decoration/LinkStyle.java:97-108`;
`style/Style.java:322-327`; `klimt/geom/PlacementStrategyVisibility.java:
63-69`; `cucadiagram/MethodsOrFieldsArea.java:395-410`;
`svek/image/EntityImageClassHeader.java` (generic-corner block).
Diagnosis: `diagnosis/A2b-entity-groups.md` E1, Unclassified (zubevi row);
`diagnosis/A3-style.md` M1 (border half); `diagnosis/A5-geometry.md` M6.

## Write-set

`src/diagrams/class/renderer-classifier-box.ts`,
`src/diagrams/class/class-member-rows.ts`,
`src/diagrams/class/renderer-classifier-colors.ts` (border/dasharray
functions only — T18 owns the fill/gradient half, do not touch it),
their `*.test.ts` files, `.agent-notes/cdd-T20.md`, `decision-
journal.md` (append-only).

## Interface in (from T18, T19) / out (to T19)

In: `classBorder()`/`classBorderStrokeWidth()` post-T18 (`Paint`-typed
fill already landed); extractor fields `line?`/`lineStyle?` from T18.
Out: none.

## Acceptance criteria

- Given `nisune-86-faji869`, when rendered, then the four-shape header
  split is present (10 children, matching the jar byte-for-byte geometry)
- Given `gojatu-01-jibo986`, then `line.bold` yields stroke-width 2
  solid; given `sosono-24-vuro518`, then `line.dashed`/`line.dotted`
  yield dasharray `7,7`/`1,3`
- Given `pakemi-72-cani346` and `vubofi-17-dedi529`, then both are
  conformant (icon centred on the wrapped block, not the first line)
- Given `zubevi-64-fume582`, then the generic-corner box's child count
  and text sequence match the jar, or the mechanism is journaled with
  its `file:line` if not fixed this task

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

Four gates green. `npx tsx tools/render-diff.mts nisune-86-faji869
gojatu-01-jibo986 sosono-24-vuro518 pakemi-72-cani346 vubofi-17-dedi529
zubevi-64-fume582` before/after. Files ≤500 lines, functions ≤30 NLOC,
CCN ≤10, ≤5 params.

## Boundaries

Always: read T18's merged `renderer-classifier-colors.ts` before editing
its border functions — do not re-touch the fill/gradient half. Ask
first: any stop condition in `../README.md`. Never: edit
`class-visibility-icon.ts`'s icon math (T19's file — this task only
changes the caller's inputs); edit `skinparam-key-handlers*.ts`; fit a
value without a citation.

## Commit

`feat(cdd-T20): class header split, border/dash and icon centring`

Body: why — four box-chrome mechanisms (header split, inline
line-style, wrapped-icon centring, generic-corner) each had a named
`file:line` gap; this lands the four independently, noting the
generic-corner box's TS origin if it could not be located in time.
