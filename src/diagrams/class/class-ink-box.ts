/**
 * Ink-extent accumulation (InkBox + per-shape ink adders + buildInkBox) for
 * class-diagram document sizing. Split out of `layout-ink-extent.ts` (line
 * cap). Shared margin/ink constants are exported here (single owner).
 */

import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import { edgeExtremityInk } from './renderer-arrowhead.js';
import { ROW_TEXT_LEFT_MARGIN } from './class-member-rows.js';
import { VISIBILITY_ICON_SIZE } from './class-visibility-icon.js';

export const DOCUMENT_MARGIN_TOP = 0;
export const DOCUMENT_MARGIN_RIGHT = 5;
export const DOCUMENT_MARGIN_BOTTOM = 5;
export const DOCUMENT_MARGIN_LEFT = 0;

/** `SvekResult#calculateDimension`'s `.delta(15, 15)` padding. */
export const INK_DELTA = 15;

/** `SvekResult#calculateDimension`'s own `moveDelta(6 - minMax.getMinX(),
 *  6 - minMax.getMinY())` constant (svek/SvekResult.java:133) — the SAME
 *  value as description's `layout-ink-shift.ts#JAR_INK_MARGIN` (G1b/J1,
 *  shared upstream `SvekResult` machinery). Duplicated here rather than
 *  imported per this module's own klimt-free-module convention (see file
 *  doc comment). */
export const JAR_INK_MARGIN = 6;

/** `LimitFinder#drawUPolygon`'s own `x`-only padding quirk
 *  (`HACK_X_FOR_POLYGON = 10` upstream, `LimitFinder.java:169`) --
 *  duplicated here rather than imported (`core/klimt/drawing/LimitFinder.ts`
 *  keeps the SAME constant private), per this module's own klimt-free-module
 *  convention (see `JAR_INK_MARGIN`'s doc comment above). */
const HACK_X_FOR_POLYGON = 10;

export interface InkBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function newInkBox(): InkBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

function addPoint(box: InkBox, x: number, y: number): void {
  if (x < box.minX) box.minX = x;
  if (y < box.minY) box.minY = y;
  if (x > box.maxX) box.maxX = x;
  if (y > box.maxY) box.maxY = y;
}

/**
 * B35/M40: a classifier's ink max-X is `max(x + w - 1, x + bodyInkWidth)`,
 * NOT a fixed `x + w`. Two independent shapes compete for it:
 *
 * - the bordered `URectangle`, inset by `LimitFinder#drawRectangle`'s own
 *   `-1` on BOTH corners (`klimt/drawing/LimitFinder.java:184-188`);
 * - an invisible `UEmpty` reservation, bounded by `LimitFinder#drawEmpty`
 *   with NO inset at all (`addPoint(x,y)`, `addPoint(x+w,y+h)`,
 *   `LimitFinder.java:159-162`), so it reaches 1px FURTHER when present.
 *
 * `TextBlockMarged#drawU`'s `ug.draw(UEmpty.create(dim))`
 * (`klimt/shape/TextBlockMarged.java:83`) is the ONLY `UEmpty` draw site in
 * the whole upstream tree, and `dim` is that block's OWN dimension — never
 * the box's. So the reservation reaches `x + bodyInkWidth`, and clears the
 * rect's inset corner only when the BODY is what set the box width.
 * `EntityImageObject#calculateDimensionSlow:150-153` takes `w =
 * max(dimFields.width, dimTitle.width + 2*xMarginCircle)`, so a title-driven
 * object box gets no body point out there and falls back to `x + w - 1`.
 * Jar-verified with two authored controls differing only in which term wins
 * the `max` (ledger M40): body-driven `x=74.36, w=180` → canvas 269
 * (`x+w`); title-driven `x=74.74, w=201.25` → canvas 289 (`x+w-1`).
 *
 * **This retires the pre-B35 attribution** (G2 N5) of the `+1` to a
 * full-box `UEmpty` over `(widthTotal, heightTotal)`: the shape is real and
 * the `+1` is real, but it is sized to the BODY, which is why the rule is
 * conditional rather than universal. It equally retires T7's counter-claim
 * that `UEmpty` is drawn nowhere on this path — T7 read the entity images,
 * where it indeed appears nowhere, and missed `TextBlockMarged`.
 *
 * `bodyInkWidth === undefined` keeps the pre-B35 fixed `x + w`, which is
 * correct for `class`/`interface`/`enum` for a DIFFERENT reason and is not
 * merely un-migrated: `HeaderLayout#drawU` centers the name block in
 * `suppWith = width - circleW - widthStereoAndName - genericW`
 * (`svek/HeaderLayout.java:89-109`), which is exactly 0 when the header
 * drove the width — so the name's own `TextBlockMarged` `UEmpty` lands on
 * `x + w`, and when the body drove it instead the body's does. Either way
 * `x + w`, which is why all 317 byte-exact class goldens hold under the
 * fixed rule. The object header cannot do this: it is placed by
 * `PlacementStrategyY1Y2#getPositions`'s strict `x = (width - blockWidth)/2`
 * (`klimt/geom/PlacementStrategyY1Y2.java:59`), leaving `xMarginCircle` (5px)
 * clear on each side. `map`/`json` are left unmeasured deliberately — their
 * bodies are `TextBlockMap`/`TextBlockCucaJSon`, not a marged body block, and
 * no jar control isolates them.
 */
function addRectInk(box: InkBox, c: ClassifierGeo): void {
  const shadow = c.shadowing ?? 0;
  addPoint(box, c.x - 1, c.y - 1);
  const bodyMaxX = c.x + (c.bodyInkWidth ?? c.width);
  // Y is deliberately untouched at `y + h`: the three-way object body-state
  // split on max-Y (B5/M6) is a separate question this rule does not model.
  addPoint(box, Math.max(c.x + c.width - 1, bodyMaxX), c.y + c.height);
  // mission skin-file-loading (deferred D3 item): `LimitFinder
  // #drawRectangle`'s own shadow term (`addPoint(x+w-1+2*shadow,
  // y+h-1+2*shadow)`, see `state/layout-ink-extent.ts#addStateBoxInk`'s
  // identical citation) -- applies to the visible bordered rect's OWN
  // corner only, NOT the invisible `UEmpty` reservation this function's
  // own doc comment establishes (a shape with no fill/stroke has nothing
  // to cast a shadow), so it is a THIRD `addPoint` call layered on top of
  // the existing net rule rather than a replacement -- `shadow=0` (every
  // pre-mission fixture) reduces to `addPoint(x+w-1,y+h-1)`, strictly
  // dominated by the existing `x+w,y+h` UEmpty point, so this is a
  // zero-behavior-change no-op for every shadow-off fixture.
  if (shadow > 0) {
    addPoint(box, c.x + c.width - 1 + 2 * shadow, c.y + c.height - 1 + 2 * shadow);
  }
}


/**
 * B5/M6: the THIRD object body state — an empty field list that is still
 * SHOWN. `EntityImageObject`'s ctor substitutes a placeholder body
 * `TextBlockLineBefore(LineThickness, TextBlockEmpty(10, 16))` for a real
 * `BodyFactory.create1` body whenever `getFieldsToDisplay().size() == 0 &&
 * showFields` (`svek/image/EntityImageObject.java:110-113`). NOTHING in that
 * placeholder reaches the classifier's max corner:
 *
 * - `TextBlockEmpty#drawU` is an empty method
 *   (`klimt/shape/TextBlockEmpty.java:63-64`);
 * - `TextBlockLineBefore#drawU` draws only `UHorizontalLine.infinite(
 *   thickness, 1, 1, separator)` (`klimt/shape/TextBlockLineBefore.java:84`),
 *   whose `ULine` runs from `startingX + 1` to `endingX - 1`
 *   (`klimt/shape/UHorizontalLine.java:99-108,148-151`) at the body's TOP
 *   edge, so it reaches neither `x + w` nor the bottom edge.
 *
 * The classifier's ink is therefore its own `URectangle` alone, taking
 * `LimitFinder#drawRectangle`'s native symmetric inset on BOTH corners —
 * `addPoint(x-1, y-1)`, `addPoint(x+w-1, y+h-1)`
 * (`klimt/drawing/LimitFinder.java:184-188`).
 *
 * This is NOT a widening of the general rule: the three object body states
 * carry three DIFFERENT max corners, established against the
 * pinned jar with untitled, edge-free, two-node controls (two nodes so the
 * degenerate-single-leaf sizer path is not taken, no title so the annotation
 * chrome cannot absorb a pixel):
 *
 * | body state                    | source                  | maxX    | maxY    | jar canvas |
 * |-------------------------------|-------------------------|---------|---------|------------|
 * | populated                     | `BodyFactory.create1`   | `x+w`   | `y+h`   | 148 x 62   |
 * | `showFields == false`         | `TextBlockUtils.empty`  | `x+w-1` | `y+h`   | 123 x 40   |
 * | empty list, shown (this rule) | `TextBlockEmpty(10,16)` | `x+w-1` | `y+h-1` | 123 x 55   |
 *
 * (`object foo {field1} / object bar {field2}`, the same with a leading
 * `hide object fields`, and a bare `object foo / object bar` respectively;
 * corpus confirmation on `jabote-02-rajo672` and `jotaga-99-fatu830`, whose
 * canvases were each 1px over on BOTH axes before this rule.)
 *
 * RESOLVED at B35/M40, on the max-X axis: the `+1` by which the first two
 * rows exceed `LimitFinder#drawRectangle` is the `UEmpty` that
 * `TextBlockMarged#drawU` reserves at its block's OWN width
 * (`klimt/shape/TextBlockMarged.java:83` — see {@link addRectInk}). This
 * state's `TextBlockEmpty(10, 16)` placeholder is not wrapped in one, so it
 * reserves nothing, and row 2's `TextBlockUtils.empty(0, 0)` reserves a
 * zero-width one; both therefore fall back to the bare rect on X. That
 * made row 2 a strict special case of the general rule, and its separate
 * helper is gone. THIS row survives on the max-Y axis alone (`y+h-1`, where
 * the general rule gives `y+h`) — the header's own `TextBlockMarged`
 * `UEmpty` supplies row 2's un-inset max-Y and this row's shorter header
 * cannot reach it, but that Y mechanism is not jar-isolated, so the rule
 * stays keyed on the upstream BRANCH rather than on a geometric predicate.
 * Tracked in `plans/object-close/ledger.md` M6.
 */
function addRectInkEmptyShownBody(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w - 1, y + h - 1);
}

/**
 * `LimitFinder#drawEllipse` (`klimt/drawing/LimitFinder.java:206-209`) —
 * `addPoint(x, y)`, `addPoint(x + w - 1, y + h - 1)`. Note the ASYMMETRY
 * versus {@link addRectInk}: an ellipse's min corner carries NO `-1` (only
 * `drawRectangle` insets its min corner), and its max corner IS inset —
 * the exact opposite of the rect rule on both corners.
 *
 * Reached by `kind: 'usecase'` leaves, which the class engine draws as a
 * real `<ellipse>` through the description engine's own usymbol path
 * (`renderer.ts`'s `geo.kind === 'usecase' ? 'usecase' : geo.usymbol`
 * dispatch), NOT as a classifier box. Before this, a usecase leaf fell
 * through to `addRectInk`'s `x + w`, overstating its right edge by exactly
 * 1px whenever the ellipse was the diagram's rightmost ink.
 *
 * Jar-verified on all three authored usecase-in-class fixtures, each of
 * which is bounded on the right by its usecase ellipse:
 * `class-usecase-inline-sprite` (jar `cx+rx = 224.496` → width 238, ours
 * was 239), `class-usecase-inline-img` (230.2848 → 244, was 245),
 * `class-allowmixing-usecase-mix` (241.635 → 255, was 256).
 *
 * NOT extended to the other ellipse-drawing kinds (`assoc-circle`,
 * `lollipop`): both are already byte-exact across the 310-fixture class
 * golden corpus under the rect rule, i.e. their ink is dominated by other
 * shapes in every fixture that exercises them, so there is no evidence to
 * decide the question and no fixture that would catch getting it wrong.
 * Named, not silently generalized.
 */
function addEllipseInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x, y);
  addPoint(box, x + w - 1, y + h - 1);
}

/** `LimitFinder#drawUPath` — plain bounding box, no inset. Used for
 *  namespace cluster outlines (rounded-corner `UPath`, not a `URectangle`
 *  upstream — `Cluster.java`/`svek/GroupPngMakerActivity`-family draw). */
function addPlainInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x, y);
  addPoint(box, x + w, y + h);
}

/**
 * G2 N60 (item 42): `LimitFinder#drawUPolygon` -- `x` padded by
 * `HACK_X_FOR_POLYGON` on BOTH sides, `y` unpadded. `USymbolFolder#asBig`
 * draws its outline as a `UPolygon` (not the default rounded-arc `UPath`)
 * whenever `roundCorner=0`, which `Cluster.java`'s own `strictUmlStyle()`
 * check forces unconditionally (`class-namespace-shape.ts#renderNamespaceFolder`'s
 * own `theme.strictUml === true` branch -- the `<polygon>` vs `<path>`
 * dispatch this ink rule must mirror). Jar-verified via a debug-instrumented
 * local oracle build (`SvekResult#calculateDimension`/`LimitFinder
 * #drawUPolygon` traced directly, `plans/g2-class-svg/ledger.md` N60):
 * `jinibe-02-tebi269`'s real `LimitFinder` ink walk gave `minX=6` (`16 -
 * HACK_X_FOR_POLYGON`), `maxX=74` (`64 + HACK_X_FOR_POLYGON`) against the
 * package cluster's own raw graphviz bbox `[16,64]` -- the SAME `[16,64]`
 * this port already computes correctly (this rule is a pure ink-EXTENT
 * correction; the namespace's own drawn `<polygon>` points are unaffected).
 */
function addFolderPolygonInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - HACK_X_FOR_POLYGON, y);
  addPoint(box, x + w + HACK_X_FOR_POLYGON, y + h);
}

/**
 * G2 N60 (item 42): `LimitFinder#drawRectangle` -- `addPoint(x-1,y-1)`,
 * `addPoint(x+w-1+2*shadow, y+h-1+2*shadow)` (no shadow modeled for
 * namespaces, matching every OTHER package-style corpus sample). NOT the
 * classic symmetric `-1`/`+1` inset (`addClassicRectInk`) -- the max corner
 * is `w-1`, not `w+1`. `USymbolRectangle#asBig` (`skinparam packageStyle
 * rect`) draws its outline as a plain `URectangle`, unlike FOLDER's
 * `UPolygon`/`UPath`. Jar-verified against `mucuxi-36-beku683`'s real
 * `LimitFinder` walk: `minX=15` (`16-1`), `maxX=63` (`16+48-1`) against the
 * SAME raw graphviz cluster bbox `[16,64]` jinibe's FOLDER variant shares
 * (`plans/g2-class-svg/ledger.md` N60) -- this is the "small universal
 * residual" N59 named and left unchased, now resolved as part of the SAME
 * `buildInkBox` namespace-ink gap this function's `addFolderPolygonInk`
 * sibling closes.
 */
function addNamespaceRectInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w - 1, y + h - 1);
}

/**
 * G2 N32: the "classic `-1`-inset `URectangle`" rule this module's own file
 * doc comment names (top, `addRectInk`'s doc comment) but never implements
 * standalone -- `addRectInk` is the classifier-specific NET rule (classic
 * min-inset, but the max corner cancels against the entity's own extra
 * `UEmpty` reservation, see that function's doc comment), which only holds
 * for an ACTUAL classifier box. A plain stroked `URectangle` with no such
 * reservation (`class Foo<T>`'s generic-tag box, `TextBlockGeneric.java
 * #drawU`'s bare `ug.draw(URectangle.build(w, h))`) gets the FULL symmetric
 * `-1`/`+1` inset on BOTH corners -- jar-verified `caboco-62-jula911`:
 * using `addRectInk`'s asymmetric rule for the tag undershoots the real
 * canvas width by exactly 1px (233 vs jar's 234); this rule matches exactly.
 */
function addClassicRectInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w + 1, y + h + 1);
}

/**
 * G2 N35: the lollipop's OWN display-label row
 * (`EntityImageLollipopInterface#drawU`'s `desc.drawU(...)`, G2 N20) is
 * horizontally CENTERED under the tiny fixed-size circle
 * (`class-layout-helpers.ts#measureLollipop`'s `indent: LOLLIPOP_SIZE/2 -
 * textWidth/2`) and overhangs it on both sides whenever the label is wider
 * than `LOLLIPOP_SIZE` (10px) — routinely true, since a real interface name
 * is rarely that short. This module's own file doc comment previously
 * named "edge-label/row `UText` ink" a documented simplification, "usually
 * dominated by the classifier boxes' own ink reach" — the lollipop is the
 * counter-example: its own box is the smallest fixed size in the corpus
 * and its label is routinely the diagram's own outermost ink on that side.
 * Jar-verified (`makoko-44-mapu988`: our canvas width undershoots jar's by
 * exactly the missing label's own half-overhang, `svg/@width` 246 vs 266;
 * `paluca-39-desa696` same shape). Plain-bbox rule (no `-1`/`+1` inset),
 * matching N14's own note-text precedent — text ink is never inset; `y`
 * bounds stay pinned to the circle's own `[c.y, c.y+c.height]` span
 * deliberately (the row's OWN vertical descent below the circle is a
 * SEPARATE, not-yet-jar-verified contribution — no fixture in this
 * iteration's corpus isolates it from other dominating ink, so it is left
 * unmodeled rather than guessed).
 */
function addLollipopRowInk(box: InkBox, c: ClassifierGeo): void {
  const row = c.rows[0];
  if (row === undefined) return;
  // G9/T14: the y bounds stay pinned to the circle's own span, as this
  // function's doc comment has always said — but that span is the ELLIPSE
  // rule's `[c.y, c.y + c.height - 1]`, not a box's `+ c.height`. Using the
  // latter made a labelled lollipop one pixel taller than an unlabelled one,
  // which is exactly the "row's OWN vertical descent" the doc comment says is
  // deliberately unmodeled.
  addPoint(box, c.x + row.indent, c.y);
  addPoint(box, c.x + row.indent + (row.width ?? 0), c.y + c.height - 1);
}

/** One classifier's own ink contribution — split out of `buildInkBox` (G2
 *  N35) to keep that function's own complexity under the repo's CCN cap. */
/**
 * The classifier's own bordered-rect ink, which is one of THREE rules for
 * `kind: 'object'` and one for everything else. Split out of {@link
 * addClassifierInk} solely to keep that function under the repo's CCN cap
 * (B5/M6 added the third object arm); no behavior change.
 *
 * Rule selection, all three jar-verified — see each helper's own doc
 * comment, and `addRectInkEmptyShownBody`'s for the control set that
 * distinguishes the two empty-body states from each other.
 */
function addClassifierBoxInk(box: InkBox, c: ClassifierGeo): void {
  // B5/M6: `kind: 'object'` whose field list is empty but still SHOWN --
  // upstream's `TextBlockEmpty(10, 16)` placeholder branch.
  if (c.kind === 'object' && c.emptyFieldPlaceholder === true) {
    addRectInkEmptyShownBody(box, c.x, c.y, c.width, c.height);
    return;
  }
  // B35/M40: the THIRD state -- G3/O2's separate `addRectInkEmptyBody` rule
  // for a `kind: 'object'` whose body is entirely suppressed (`showFields ==
  // false`, `dividerYs: []`) is GONE, because it is now a strict special
  // case of {@link addRectInk}: upstream hands that state a genuinely
  // zero-size `TextBlockUtils.empty(0, 0)` body
  // (`BodierLikeClassOrObject.java:225-229`), which draws no
  // `TextBlockMarged`/`UEmpty` at all, so `bodyInkWidth` is 0 and the
  // general rule yields exactly the `(x+w-1, y+h)` corner that rule
  // hard-coded. Verified empirically, not assumed: deleting it leaves the
  // object census's zero-diff SET byte-identical (35, `kexica-21-gega428`
  // and `janoma-30-dovo501` -- its own two jar-verified fixtures --
  // included). The empty-but-SHOWN arm above does NOT collapse (its max-Y
  // is `y+h-1`, not `y+h`); disabling IT drops the census 35 -> 29.
  addRectInk(box, c);
}

/**
 * G9/T12: a member row's PROTECTED (`#`) or PACKAGE (`~`) visibility icon is
 * a `UPolygon` upstream — `VisibilityModifier#drawDiamond`/`drawTriangle`
 * (`skin/VisibilityModifier.java:192-210`) — so `LimitFinder#drawUPolygon`
 * pads its ink by `HACK_X_FOR_POLYGON` on BOTH sides, exactly as this file
 * already does for a `strictuml` namespace outline. PUBLIC (`+`) draws a
 * `UEllipse` and PRIVATE (`-`) a `URectangle`, neither of which is padded.
 *
 * The icon sits INSIDE its classifier, so only that 10px left pad can escape
 * the box's own `x - 1` corner — and it does, by `ROW_TEXT_LEFT_MARGIN + 1 -
 * 10 - (-1)` = 2px. That is the whole of the uniform +2px x-offset four
 * cached fixtures carried against jar (`dejuse-14-pule208`, whose every
 * shape sat exactly 2px left of jar's; `picija-82-jebu272`;
 * `nukera-08-dige359` and `sorisi-53-xebi982` object-side).
 *
 * Geometry mirrors the renderer exactly: `renderer-classifier-rows.ts
 * #renderRow` draws the icon at `geo.x + ROW_TEXT_LEFT_MARGIN`, and both
 * polygon helpers span `[originX + 1, originX + 1 + (size - 2)]`.
 */
function hasPolygonIcon(rows: ClassifierGeo['rows']): boolean {
  return rows.some((r) => r.visibilityIcon === '#' || r.visibilityIcon === '~');
}

function addVisibilityIconInk(box: InkBox, c: ClassifierGeo, iconSize: number): void {
  // `enhancedBody` carries its own rows and is drawn INSTEAD OF `rows` for a
  // `BodyEnhanced` classifier (`class-body-enhanced-layout.ts`), so both
  // lists have to be scanned or a `{method} # …` member's icon is invisible
  // to this walk -- `filoxo-23-fafi328`'s `Doer` has exactly one entry in
  // `rows` (its header) and both its icon-bearing members in `enhancedBody`.
  const enhanced = (c.enhancedBody?.parts ?? []).some(
    (p) => p.kind === 'rows' && hasPolygonIcon(p.rows),
  );
  if (!hasPolygonIcon(c.rows) && !enhanced) return;
  const left = c.x + ROW_TEXT_LEFT_MARGIN + 1;
  const right = left + (iconSize - 2);
  // y is unpadded and always inside the box, so only the x extremes matter;
  // the box's own rule already supplies a dominating y for every row.
  addPoint(box, left - HACK_X_FOR_POLYGON, c.y);
  addPoint(box, right + HACK_X_FOR_POLYGON, c.y);
}

function addClassifierInk(box: InkBox, c: ClassifierGeo, iconSize: number): void {
  // G2 N33: a collapsed-empty package/namespace leaf draws the SAME
  // `USymbolFolder` `UPath` outline a namespace CLUSTER draws (`addPlainInk`
  // below), never `EntityImageClass`'s own rect+`UEmpty` composition -- the
  // asymmetric `addRectInk` rule below does not apply to it (jar-verified
  // `gatula-10-bifu561`: using `addRectInk` here shifts the WHOLE diagram
  // by a uniform (1,1) versus jar, since a `UPath`'s ink-min corner is its
  // own unshifted `x`/`y`, not `x-1`/`y-1`).
  if (c.folderTab !== undefined) {
    addPlainInk(box, c.x, c.y, c.width, c.height);
    return;
  }
  // A `usecase` leaf is drawn as a real `<ellipse>`, never as a classifier
  // box -- see `addEllipseInk`'s own doc comment for the jar evidence.
  if (c.kind === 'usecase') {
    addEllipseInk(box, c.x, c.y, c.width, c.height);
    return;
  }
  // G9/T14: a lollipop is an `EntityImageLollipopInterface` — upstream draws
  // a `UEllipse` and its label, never a box, so `LimitFinder#drawEllipse`'s
  // uninset min corner applies, NOT `addRectInk`'s `y - 1`. Taking the box
  // rule put our ink one pixel above the circle and pushed the whole diagram
  // down by 1 (`bososa-44-fipu544` and four siblings: our circles at cy=12
  // against jar's cy=11, every later shape following). Same shape as the
  // `usecase` branch above, which already dispatches away from the box rule.
  if (c.kind === 'lollipop') {
    addEllipseInk(box, c.x, c.y, c.width, c.height);
    addLollipopRowInk(box, c);
    return;
  }
  addClassifierBoxInk(box, c);
  addVisibilityIconInk(box, c, iconSize);
  // G2 N32: `class Foo<T>`'s generic type-parameter tag box is drawn
  // OUTSIDE the classifier's own rect (above-right, `class-stereotype.ts
  // #buildGenericTagGeo`'s doc comment) via a plain stroked `URectangle`
  // (`TextBlockGeneric.java#drawU`) -- the SAME ink rule as the
  // classifier's own box, contributing its OWN min/max corner
  // independently. Jar-verified `caboco-62-jula911`: the tag's 3px
  // top/right overhang is exactly what shifts the whole diagram's ink
  // origin (`computeClassInkShift`) and widens the canvas
  // (`computeClassDocumentDims`) by 3px each.
  if (c.genericTag !== undefined) {
    const tag = c.genericTag;
    addClassicRectInk(box, c.x + tag.rectX, c.y + tag.rectY, tag.rectWidth, tag.rectHeight);
  }
}

/**
 * G2 N60 (item 42): dispatches a namespace's own ink contribution on
 * `NamespaceGeo.inkShape` (see that field's own doc comment in `layout.ts`
 * for the full jar-verified mechanism) -- `undefined` keeps the PRE-N60
 * `addPlainInk` (`UPath`) behavior unchanged for the common default-FOLDER,
 * non-`strictuml` case.
 */
function addNamespaceInk(box: InkBox, n: NamespaceGeo): void {
  if (n.inkShape === 'polygon') {
    addFolderPolygonInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  if (n.inkShape === 'rect') {
    addNamespaceRectInk(box, n.x, n.y, n.width, n.height);
    return;
  }
  addPlainInk(box, n.x, n.y, n.width, n.height);
}

/**
 * The shared ink-point accumulation walk both `computeClassDocumentDims`
 * (dimension) and `computeClassInkShift` (N11, position) consume — one
 * `LimitFinder`-shaped pass over clusters/nodes/edges (`SvekResult#drawU`'s
 * own draw sequence: clusters, then nodes, then edges — order doesn't
 * matter for a min/max accumulator, only membership does).
 */
export function buildInkBox(
  classifiers: readonly ClassifierGeo[],
  namespaces: readonly NamespaceGeo[],
  edges: readonly EdgeGeo[],
  notes: readonly NoteGeo[],
  iconSize: number | undefined = VISIBILITY_ICON_SIZE,
): InkBox {
  // #lizard forgives -- pre-existing CCN violation, unchanged by the
  // usecase-ellipse ink task: a flat per-shape-family accumulation loop,
  // not branchy logic (each `if` is one independent ink source).
  const box = newInkBox();
  for (const c of classifiers) addClassifierInk(box, c, iconSize ?? VISIBILITY_ICON_SIZE);
  for (const n of namespaces) addNamespaceInk(box, n);
  // G2/N13: a dropped member-tip note (unresolved `::member`) draws
  // NOTHING at all -- jar's own ink extent excludes it (`fupope-12-zoku847`'s
  // canvas dims match a plain single-classifier render with no note space
  // reserved at all).
  // G2/N14 CORRECTION: notes use the PLAIN (no x-hack) ink rule, not the
  // polygon rule -- `Opale.java#drawU` draws its outline via `ug.draw
  // (polygon)` where `polygon` is a `UPath` (built through `UPath.none()` +
  // `moveTo`/`lineTo`/`arcTo`, EVERY branch: `getPolygonNormal`/`Left`/
  // `Right`/`Up`/`Down` all return `UPath`, never `UPolygon`) -- so
  // `LimitFinder` dispatches to `drawUPath` (plain bbox), not `drawUPolygon`
  // (`HACK_X_FOR_POLYGON`-padded). The PREVIOUS `addPolygonInk` choice here
  // was an unverified guess from before ANY note fixture had been jar-
  // checked (this module's own file-header doc comment already flagged it
  // as unverified) -- jar-verified wrong by exactly `HACK_X_FOR_POLYGON`
  // (10px) against `fezugi-39-fujo327` (canvas width 174 vs jar's real 164).
  for (const nt of notes) {
    if (nt.dropped === true) continue;
    addPlainInk(box, nt.x, nt.y, nt.width, nt.height);
  }
  for (const e of edges) {
    // G2/N16 Kind B: a consumed (never-drawn) freestanding-note connector
    // contributes no ink of its own -- `EdgeGeo.consumedByOpaleNote`'s doc
    // comment; the note's own box already covers its Opale outline.
    if (e.consumedByOpaleNote === true) continue;
    for (const p of e.points) addPoint(box, p.x, p.y);
    if (e.label !== undefined) addPoint(box, e.label.x, e.label.y);
    // G2 item 43: same "anchor point only, not full ink" simplification as
    // the single-line `e.label` branch above -- one line per multi-line
    // label.
    for (const line of e.labelLines ?? []) addPoint(box, line.x, line.y);
    // G2 item 44: the magic-arrow glyph's own 3 vertices -- unlike the
    // single-point simplification above, the WHOLE triangle is cheap to
    // bound exactly (only 3 points), so every vertex is added.
    if (e.arrowGlyph !== undefined) {
      for (const p of e.arrowGlyph.points) addPoint(box, p.x, p.y);
    }
    // G2 N54: arrowhead-polygon ink (`UPolygon`/`HACK_X_FOR_POLYGON=10` and
    // every other decor shape's own `LimitFinder` rule) -- see
    // `renderer-arrowhead.ts#edgeExtremityInk`'s doc comment for the full
    // jar-verified mechanism.
    const extremityInk = edgeExtremityInk(e);
    if (extremityInk !== undefined) {
      addPoint(box, extremityInk.minX, extremityInk.minY);
      addPoint(box, extremityInk.maxX, extremityInk.maxY);
    }
  }
  return box;
}
