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
import { CARDINALITY_FONT_SIZE } from './class-layout-edge-labels.js';
import type { InkBox } from './class-ink-shapes.js';
import {
  newInkBox, addPoint, addRectInk, HACK_X_FOR_POLYGON, addRectInkEmptyShownBody, addEllipseInk,
  addPlainInk, addFolderPolygonInk, addNamespaceRectInk, addClassicRectInk,
} from './class-ink-shapes.js';
export type { InkBox } from './class-ink-shapes.js';

export const DOCUMENT_MARGIN_TOP = 0;
export const DOCUMENT_MARGIN_RIGHT = 5;
export const DOCUMENT_MARGIN_BOTTOM = 5;
export const DOCUMENT_MARGIN_LEFT = 0;

// `INK_DELTA`/`JAR_INK_MARGIN` now have a single owner, `core/svek/
// SvekResult.ts` — they are that method's constants, shared by every svek
// engine, and were previously declared four times across three engines.
// Re-exported here so this module's existing consumers are unaffected.
// The klimt-free-module convention below still holds for
// `HACK_X_FOR_POLYGON`, which `LimitFinder.ts` keeps private; it never
// applied to these two.
export { INK_DELTA, JAR_INK_MARGIN } from '../../core/svek/SvekResult.js';

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
  // A leaf DRAWN as a USymbol contributes the ink of its own shapes, not a
  // box rule. Upstream has one ink concept — walk what was drawn — and jar's
  // extent for an actor is the union of its `UEllipse` head, `UPath` body
  // and label `UText`. `addRectInk`'s `(x - 1, y - 1)` corner sits 1.5 above
  // the drawn head's real top of `y + 0.5`, which moved every shape in
  // `cacoma-43-poxu615` by that much (`.agent-notes/class-ink-shared-offset
  // -groups.md` item (b)).
  //
  // Placed AFTER the three branches above on purpose: `usecase` and
  // `lollipop` already dispatch away from the box rule with jar-verified
  // rules of their own, and this mission leaves their output byte-identical
  // (decision D2). Only leaves that would otherwise have fallen through to
  // the box rule reach here, so the change is additive by construction.
  //
  // The extent is measured at layout time, where the drawable and its
  // font/sprite context already exist — SI14's "share the measurement
  // OBJECT" shape. See `ClassifierGeo.symbolInk`.
  if (c.symbolInk !== undefined) {
    addPoint(box, c.x + c.symbolInk.minX, c.y + c.symbolInk.minY);
    addPoint(box, c.x + c.symbolInk.maxX, c.y + c.symbolInk.maxY);
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
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-225`) records a
 * `UText` from the BASELINE it is drawn at: `[y - (height - 1.5), y + 1.5]`
 * horizontally spanning `[x, x + width]`. A text block's own box instead spans
 * `[y - ascent, y - ascent + height]`, so the two disagree at both edges.
 *
 * G9/T16: every edge label used to contribute its ANCHOR POINT only — one
 * `addPoint` at the `<text>`'s own `(x, y)` — an explicit simplification this
 * module's header called "usually dominated by the classifier boxes' own ink
 * reach". `style-stereotype-on-arrow-3` and `zebufu-01-pevo013` are the case
 * where it is not: their label baseline sits at 17.111, so jar's ink reaches
 * `17.111 - 11.5 = 5.611`, which is 0.389 ABOVE the topmost classifier's own
 * `y - 1` at 6. Jar's whole drawing therefore sat 0.389px lower than ours,
 * uniformly, on an otherwise byte-identical 143x55 canvas.
 *
 * `renderer-edge.ts` draws `label`, `labelLines`, `tailLabel` and `headLabel`
 * through one identical `text(...)` call, so `LimitFinder` sees one identical
 * shape for each and all four get this rule. Line height is
 * `CARDINALITY_FONT_SIZE` by construction — `class-edge-label-anchor.ts
 * #multiLineLabelAnchor` steps successive baselines by exactly that.
 */
const TEXT_INK_BASELINE_DROP = 1.5;

function addEdgeTextInk(
  box: InkBox,
  label: { x: number; y: number; width: number },
): void {
  addPoint(box, label.x, label.y - CARDINALITY_FONT_SIZE + TEXT_INK_BASELINE_DROP);
  addPoint(box, label.x + label.width, label.y + TEXT_INK_BASELINE_DROP);
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
    // G9/T16: every drawn label gets `LimitFinder#drawText`'s own box -- see
    // {@link addEdgeTextInk}. This replaced a documented "anchor point only"
    // simplification that `style-stereotype-on-arrow-3` disproved.
    for (const lbl of [e.label, e.tailLabel, e.headLabel, ...(e.labelLines ?? [])]) {
      if (lbl !== undefined) addEdgeTextInk(box, lbl);
    }
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

