/**
 * `LimitFinder` shape rules for the class ink walk — the primitive
 * `InkBox` and one function per klimt shape the class engine draws, split
 * out of `class-ink-box.ts` when that module passed the 500-line cap.
 *
 * Every rule here is the jar's own, cited at its own definition;
 * `class-ink-box.ts` composes them into a classifier/namespace/edge walk and
 * owns the document-margin constants.
 */
import type { ClassifierGeo } from './layout.js';


/** `LimitFinder#drawUPolygon`'s own `x`-only padding quirk
 *  (`HACK_X_FOR_POLYGON = 10` upstream, `LimitFinder.java:169`) --
 *  duplicated here rather than imported (`core/klimt/drawing/LimitFinder.ts`
 *  keeps the SAME constant private), per this module's own klimt-free-module
 *  convention (see `JAR_INK_MARGIN`'s doc comment above). */
export const HACK_X_FOR_POLYGON = 10;

export interface InkBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function newInkBox(): InkBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function addPoint(box: InkBox, x: number, y: number): void {
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
export function addRectInk(box: InkBox, c: ClassifierGeo): void {
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
export function addRectInkEmptyShownBody(box: InkBox, x: number, y: number, w: number, h: number): void {
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
export function addEllipseInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x, y);
  addPoint(box, x + w - 1, y + h - 1);
}

/** `LimitFinder#drawUPath` — plain bounding box, no inset. Used for
 *  namespace cluster outlines (rounded-corner `UPath`, not a `URectangle`
 *  upstream — `Cluster.java`/`svek/GroupPngMakerActivity`-family draw). */
export function addPlainInk(box: InkBox, x: number, y: number, w: number, h: number): void {
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
export function addFolderPolygonInk(box: InkBox, x: number, y: number, w: number, h: number): void {
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
export function addNamespaceRectInk(box: InkBox, x: number, y: number, w: number, h: number): void {
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
export function addClassicRectInk(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w + 1, y + h + 1);
}

