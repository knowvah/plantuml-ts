/**
 * Ink-extent accumulation (InkBox + per-shape ink adders + buildInkBox) for
 * class-diagram document sizing. Split out of `layout-ink-extent.ts` (line
 * cap). Shared margin/ink constants are exported here (single owner).
 */

import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import { edgeExtremityInk } from './renderer-arrowhead.js';

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

/** `LimitFinder#drawRectangle`'s own `-1`-inset corners are NOT the true
 *  boundary here — `EntityImageClass`'s header/body `TextBlockUtils
 *  .withMargin` composition also draws an invisible full-box `UEmpty`
 *  reservation over the SAME `(widthTotal, heightTotal)` the visible
 *  bordered rect uses. `LimitFinder#drawEmpty` has NO `-1` inset
 *  (`addPoint(x,y)`, `addPoint(x+w,y+h)` — plain bbox), and since its
 *  max corner is exactly 1px past the bordered rect's own `-1`-inset max
 *  corner, it strictly dominates on the max side while the rect's `-1`
 *  inset still dominates on the min side. Net effect, jar-verified with
 *  zero residual against 6+ edge-free multi-classifier fixtures
 *  (`jalexi-21-xoje231`, `vaxaza-84-gune985`, `mexaka-52-gati860`,
 *  `bipudo-23-xavu432`; debug-instrumented local oracle build tracing
 *  `SvekResult#calculateDimension`'s raw `LimitFinder` walk directly —
 *  see `plans/g2-class-svg/ledger.md` N5): ink box = `[x-1, x+w] ×
 *  [y-1, y+h]` — nominal box size plus exactly 1px on the min side only,
 *  not the classic symmetric `-1`-inset URectangle rule. */
function addRectInk(box: InkBox, x: number, y: number, w: number, h: number, shadow = 0): void {
  // #lizard forgives -- pre-existing 6-PARAM violation, unchanged by the
  // usecase-ellipse ink task; signature matches every sibling ink rule in
  // this module.
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w, y + h);
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
  if (shadow > 0) addPoint(box, x + w - 1 + 2 * shadow, y + h - 1 + 2 * shadow);
}

/**
 * G3/O2: `EntityImageObject#drawU`'s outer bordered `URectangle` when the
 * classifier's field/body compartment is ENTIRELY suppressed (`showFields
 * == false` -- "hide members"/"hide empty members" on an object with no
 * visible members left, `class-object-map-sizing.ts#measureObjectClassifier`'s
 * `dividerYs: []` case). {@link addRectInk}'s own "+1px past the rect's
 * own inset" dominance comes from a SEPARATE invisible-`UEmpty` reservation
 * that `EntityImageObject`'s populated-fields branch draws alongside the
 * name/stereo header (`BodierLikeClassOrObject#getBody`'s `LeafType.OBJECT`
 * arm: `BodyFactory.create1(...)` when `showFields`, vs a genuinely
 * zero-size `TextBlockUtils.empty(0, 0)` when NOT) -- with NO body
 * compartment drawn at all, that reservation never exists, so the
 * classifier's ink comes SOLELY from the visible rect's own native
 * `LimitFinder#drawRectangle` inset: `addPoint(x-1,y-1)`,
 * `addPoint(x+w-1,y+h-1)` (`klimt/drawing/LimitFinder.java:184-188`) --
 * symmetric `-1` on BOTH corners, 1px narrower than {@link addRectInk} on
 * the WIDTH axis specifically.
 *
 * Height is deliberately UNCHANGED here (`y+h`, not `y+h-1`) -- jar-verified
 * against 2 independent title-bearing samples (`kexica-21-gega428`: global
 * `hide members`, BOTH classifiers empty-bodied; `janoma-30-dovo501`: `hide
 * empty members`, only the genuinely-empty sibling affected) -- both show
 * the SAME 0.5px horizontal chrome-centering residual (`core/annotations
 * /chrome.ts#decorateEntityImage`'s `xImage = (dimTotal.width -
 * original.width) / 2` split a 1px `rawWidth` delta in half) with ZERO
 * accompanying height/y diff, meaning whatever ELSE reaches the box's max-Y
 * corner (the header name/stereo text's own ink, drawn unconditionally
 * regardless of `showFields`) already supplies the un-inset max-Y bound
 * this rule's own asymmetry leaves alone. Object-kind-gated only (not
 * class/interface/enum): `EntityImageClass`'s equivalent hidden-fields path
 * returns `null` (skipped draw entirely, `BodierLikeClassOrObject#getBody`'s
 * `isBodyEnhanced()` arm), a structurally different upstream mechanism this
 * rule does not model.
 */
function addRectInkEmptyBody(box: InkBox, x: number, y: number, w: number, h: number): void {
  addPoint(box, x - 1, y - 1);
  addPoint(box, x + w - 1, y + h);
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
 * This is NOT a widening of {@link addRectInkEmptyBody}: the three object
 * body states carry three DIFFERENT max corners, established against the
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
 * OPEN, and deliberately not modeled here: the `+1` by which the first two
 * rows exceed `LimitFinder#drawRectangle` has no identified drawing shape.
 * `addRectInk`'s own doc comment attributes it to an invisible `UEmpty`
 * reservation, but `UEmpty` is drawn nowhere on any class/object path
 * (only `USymbolNode`/`USymbolDatabase`/`LaneDivider`/the activity ftiles),
 * so that attribution cannot be right. Whatever supplies it, it is
 * downstream of the body block those two states build and this one does
 * not — which is what makes the three-way split observable, and which is
 * why this rule is keyed on the upstream BRANCH rather than on a predicate
 * over the geometry. Tracked in `plans/object-close/ledger.md` M6.
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
  addPlainInk(box, c.x + row.indent, c.y, row.width ?? 0, c.height);
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
  // G3/O2: `kind: 'object'` with its field/body compartment entirely
  // suppressed (`dividerYs: []` -- see `addRectInkEmptyBody`'s own doc
  // comment for the jar-verified mechanism and why this is gated to
  // `object` specifically, not class/interface/enum).
  if (c.kind === 'object' && c.dividerYs.length === 0) {
    // mission skin-file-loading (deferred D3 item): shadow NOT modeled
    // here -- no fixture in this mission's corpus combines a shadowed
    // skin with a suppressed-body object/map/json classifier; see
    // `addRectInkEmptyBody`'s own doc comment for the (separately jar-
    // verified) unshadowed rule this leaves unchanged.
    addRectInkEmptyBody(box, c.x, c.y, c.width, c.height);
    return;
  }
  addRectInk(box, c.x, c.y, c.width, c.height, c.shadowing ?? 0);
}

function addClassifierInk(box: InkBox, c: ClassifierGeo): void {
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
  addClassifierBoxInk(box, c);
  if (c.kind === 'lollipop') addLollipopRowInk(box, c);
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
): InkBox {
  // #lizard forgives -- pre-existing CCN violation, unchanged by the
  // usecase-ellipse ink task: a flat per-shape-family accumulation loop,
  // not branchy logic (each `if` is one independent ink source).
  const box = newInkBox();
  for (const c of classifiers) addClassifierInk(box, c);
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
