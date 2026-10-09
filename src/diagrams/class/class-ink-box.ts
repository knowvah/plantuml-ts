/**
 * Ink-extent accumulation (InkBox + per-shape ink adders + buildInkBox) for
 * class-diagram document sizing. Split out of `layout-ink-extent.ts` (line
 * cap). Shared margin/ink constants are exported here (single owner).
 */

import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';
import { addNoteInk } from './class-ink-note.js';
import { addNamespaceInk, addLocalInk } from './class-ink-namespace.js';
import { edgeExtremityInk } from './renderer-arrowhead-ink.js';
import { drawnEdgePoints } from './class-ink-dot-path.js';
import { ROW_TEXT_LEFT_MARGIN } from './class-member-rows.js';
import { VISIBILITY_ICON_SIZE } from './class-visibility-icon.js';
import { CARDINALITY_FONT_SIZE } from './class-layout-edge-labels.js';
import { addEdgeLabelMarginInk, addMultiLineLabelMarginInk } from './class-ink-edge-label-margin.js';
import type { InkBox } from './class-ink-shapes.js';
import {
  newInkBox,
  addPoint,
  addRectInk,
  HACK_X_FOR_POLYGON,
  addRectInkEmptyShownBody,
  addEllipseInk,
  addPlainInk,
  addNamespaceRectInk,
  addClassicRectInk,
  addJsonBodyInk,
} from './class-ink-shapes.js';
import { protectedInnerBox } from './class-dot-graph.js';
export type { InkBox } from './class-ink-shapes.js';

// `CucaDiagram#getDefaultMargins()` — single owner at
// `core/atmp/CucaDiagram.ts`; the class, description and state engines all
// inherit this one method. Re-exported under the pre-existing names so this
// module's consumers are unaffected.
export {
  CUCA_DOCUMENT_MARGIN_TOP as DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT as DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM as DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT as DOCUMENT_MARGIN_LEFT,
} from '../../core/atmp/CucaDiagram.js';

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
  // T2b (json-canvas-width-1px): `kind: 'json'` dispatches per body shape
  // -- see `addJsonBodyInk`'s own doc comment.
  if (c.kind === 'json') {
    addJsonBodyInk(box, c);
    return;
  }
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
  const enhanced = (c.enhancedBody?.parts ?? []).some((p) => p.kind === 'rows' && hasPolygonIcon(p.rows));
  if (!hasPolygonIcon(c.rows) && !enhanced) return;
  const left = c.x + ROW_TEXT_LEFT_MARGIN + 1;
  const right = left + (iconSize - 2);
  // y is unpadded and always inside the box, so only the x extremes matter;
  // the box's own rule already supplies a dominating y for every row.
  addPoint(box, left - HACK_X_FOR_POLYGON, c.y);
  addPoint(box, right + HACK_X_FOR_POLYGON, c.y);
}

function addClassifierInk(box: InkBox, outerC: ClassifierGeo, iconSize: number): void {
  // cdd-B10FU (`pijiju-95-xexi872`): a protected classifier's own ink
  // walk must match what `renderer-classifier-box.ts#renderClassifierBox`
  // actually draws -- the INNER box, not the OUTER/DOT-node box `c.x`/
  // `c.y`/`c.width`/`c.height` are (`ClassifierGeo.protectedBorder`'s own
  // doc comment). Every ink rule below reads `c`, never `outerC`
  // directly, so one substitution here covers all of them.
  const c: ClassifierGeo = outerC.protectedBorder !== undefined ? { ...outerC, ...protectedInnerBox(outerC) } : outerC;
  // G2 N33: a collapsed-empty package leaf draws the `USymbolFolder` `UPath`
  // (`addPlainInk`), never `EntityImageClass`'s rect+`UEmpty` -- `addRectInk`
  // shifts `gatula-10-bifu561` by (1,1). cdd3-T21 (E3-6): a `packageStyle
  // rect` leaf is a `URectangle` -> the inset rect rule
  // (`LimitFinder.java:184-188`, nijeli-04 height Δ1).
  if (c.folderTab !== undefined) {
    (c.folderTab.rect === true ? addNamespaceRectInk : addPlainInk)(box, c.x, c.y, c.width, c.height);
    // cdd3-T31 (E1-2): `EntityImageEmptyPackage`'s title `UText` ink.
    if (c.folderTab.titleInk !== undefined) addLocalInk(box, c, c.folderTab.titleInk);
    return;
  }
  // A `usecase` leaf is drawn as a real `<ellipse>`, never as a classifier
  // box -- see `addEllipseInk`'s own doc comment for the jar evidence.
  // cdd2-T17 (R-1, `jixamu-89-ribo225`): an association point is the SAME
  // bare ellipse -- `EntityImageAssociationPoint#drawU` draws only
  // `UEllipse.build(SIZE, SIZE)` (`svek/image/EntityImageAssociationPoint
  // .java:77-81`), no header/body composition and no `URectangle`.
  if (c.kind === 'usecase' || c.kind === 'assoc-circle') {
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
    // A leaf whose ink pass drew nothing reports `LimitFinder`'s untouched
    // `±MAX_VALUE` sentinel, minX > maxX; upstream it adds nothing to the one
    // shared `SvekResult` walk (`svek/SvekResult.java:130-135`). (cdd6 T3b's
    // `{{ }}`-only label was this case only through the oracle's old
    // `matchesProperty("SVG") = false`; the embed now draws in the ink pass.)
    if (c.symbolInk.minX > c.symbolInk.maxX) return;
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
 * `renderer-edge.ts` draws `label`/`labelLines` (the main arrow label, its
 * OWN font -- `arrowLabelTextAttrs`) and `tailLabel`/`headLabel` (the
 * cardinality quantifiers, `renderer-edge-extras.ts
 * #renderEdgeCardinalityLabels`) through the SAME `text(...)` shape, so
 * `LimitFinder` sees one identical rule for each -- but the two families'
 * `height` differs whenever a diagram overrides one font and not the
 * other (T11, cdd3 Q-5): the main label's stays `CARDINALITY_FONT_SIZE`
 * (its default, unchanged by this task); the cardinality family (`tailLabel`/
 * `headLabel`/role lines) takes the caller's resolved `cardinalityFontSize`
 * (`theme.cardinalityFontSize`, already cascade-populated --
 * `style-cascade-class-arrow-font.ts#computeCardinalityFontOverride`).
 */
const TEXT_INK_BASELINE_DROP = 1.5;

function addEdgeTextInk(
  box: InkBox,
  label: { x: number; y: number; width: number },
  fontSize: number = CARDINALITY_FONT_SIZE,
): void {
  addPoint(box, label.x, label.y - fontSize + TEXT_INK_BASELINE_DROP);
  addPoint(box, label.x + label.width, label.y + TEXT_INK_BASELINE_DROP);
}

/**
 * cdd2-T13 (Q-9): the ADDITIVE role label's own `UText` ink. Upstream draws
 * it through `SvekEdge#drawRoleLabel` (`svek/SvekEdge.java:1029-1063`,
 * `role.drawU(ug.apply(new UTranslate(x + roleX, y + roleY)))`), inside the
 * same `drawU` pass `LimitFinder` walks, so `LimitFinder#drawText`
 * (`klimt/drawing/LimitFinder.java:217-225`) records every role line exactly
 * like a quantifier line. `renderer-edge-extras.ts
 * #renderEdgeCardinalityLabels` draws `e.roleLines` with the same `text(...)`
 * call as the quantifier lines, so {@link addEdgeTextInk}'s rule applies --
 * T11: at `cardinalityFontSize`, the SAME font the role line itself draws at
 * (`cardinalityFont`, `GraphvizImageBuilder.java:236-237`).
 * `nenexe-35-zere033`: the head role `items` (x 47.429 + 31.038) is the
 * diagram's rightmost ink; without it our canvas was 2px narrow.
 */
function addRoleLinesInk(box: InkBox, e: EdgeGeo, cardinalityFontSize: number): void {
  for (const line of [...(e.roleLines?.[0] ?? []), ...(e.roleLines?.[1] ?? [])]) {
    addEdgeTextInk(box, line, cardinalityFontSize);
  }
}

/**
 * cdd3-T31 (B-3): the quantifier ink is what `SvekEdge#drawU` DRAWS --
 * `startTailText`/`endHeadText`, each built by `Display.getWithNewlines(...)
 * .create(cardinalityFont, CENTER, skinParam)` (`svek/SvekEdge.java:330-340`)
 * and drawn at `:956-980` -- one `UText` per physical line, which
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-225`) bounds.
 * `renderer-edge-extras.ts#renderEdgeCardinalityLabels` draws exactly
 * `e.quantifierLines` whenever present; `tailLabel`/`headLabel` are the
 * legacy RAW-string anchors (`"~* initiators"`, 61.1 px, where the drawn
 * creole line is `"* initiators"`, 53.46 px -- `focaci-80-suzu938`) and are
 * bounded only for a hand-built geometry that omits `quantifierLines`, which
 * is exactly when the renderer draws them instead.
 */
function addQuantifierInk(box: InkBox, e: EdgeGeo, cardinalityFontSize: number): void {
  if (e.quantifierLines !== undefined) {
    for (const line of [...e.quantifierLines[0], ...e.quantifierLines[1]]) {
      addEdgeTextInk(box, line, cardinalityFontSize);
    }
    return;
  }
  for (const lbl of [e.tailLabel, e.headLabel]) {
    if (lbl !== undefined) addEdgeTextInk(box, lbl, cardinalityFontSize);
  }
}

/**
 * T11 (cdd3, Q-5): {@link buildInkBox}'s two render-time constants, grouped
 * into one options object to stay under this project's 5-param cap.
 * `cardinalityFontSize` defaults to the pre-T11 `CARDINALITY_FONT_SIZE`
 * constant so every caller that omits it (hand-built test geometries)
 * stays byte-identical.
 */
export interface InkBoxOptions {
  readonly iconSize?: number | undefined;
  readonly cardinalityFontSize?: number | undefined;
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
  options: InkBoxOptions = {},
): InkBox {
  const iconSize = options.iconSize ?? VISIBILITY_ICON_SIZE;
  const cardinalityFontSize = options.cardinalityFontSize ?? CARDINALITY_FONT_SIZE;
  // #lizard forgives -- pre-existing CCN: a flat per-shape-family
  // accumulation loop, each `if` one independent ink source.
  const box = newInkBox();
  for (const c of classifiers) addClassifierInk(box, c, iconSize);
  for (const n of namespaces) addNamespaceInk(box, n);
  // Note-leaf ink term (dropped-tip exclusion, plain-box rule, cdd3-T15's
  // non-opalised connector reveal) -- see `class-ink-note.ts#addNoteInk`'s
  // own doc comment.
  addNoteInk(box, notes, classifiers);
  for (const e of edges) {
    // G2/N16 Kind B: a consumed (never-drawn) freestanding-note connector
    // contributes no ink of its own -- `EdgeGeo.consumedByOpaleNote`'s doc
    // comment; the note's own box already covers its Opale outline.
    if (e.consumedByOpaleNote === true) continue;
    // cdd2-T13 (Q-6): the post-extremity-move path -- see {@link
    // drawnEdgePoints}.
    for (const p of drawnEdgePoints(e)) addPoint(box, p.x, p.y);
    // G9/T16: every drawn label gets `LimitFinder#drawText`'s own box -- see
    // {@link addEdgeTextInk}. This replaced a documented "anchor point only"
    // simplification that `style-stereotype-on-arrow-3` disproved. T11: the
    // main label (`label`/`labelLines`) and the cardinality family
    // (`tailLabel`/`headLabel`) are split into separate loops -- they draw
    // at DIFFERENT fonts whenever a diagram overrides one and not the other.
    for (const lbl of [e.label, ...(e.labelLines ?? [])]) {
      if (lbl !== undefined) addEdgeTextInk(box, lbl);
    }
    addQuantifierInk(box, e, cardinalityFontSize);
    addRoleLinesInk(box, e, cardinalityFontSize);
    // cdd3-T10: the note-on-link `UPath` (`ComponentRoseNote.java:118-122`) -> `LimitFinder#drawUPath`.
    if (e.noteBox !== undefined)
      addPlainInk(box, e.noteBox.inkBox.x, e.noteBox.inkBox.y, e.noteBox.inkBox.width, e.noteBox.inkBox.height);
    // cdd-T35: the main label's own `TextBlockMarged` margin -- see
    // {@link addEdgeLabelMarginInk}'s own doc comment.
    addEdgeLabelMarginInk(box, e);
    // cdd-B10FU: the SAME margin, multi-line arm -- see
    // {@link addMultiLineLabelMarginInk}'s own doc comment.
    addMultiLineLabelMarginInk(box, e);
    // G2 item 44 / cdd4-T8 (jakapi-64-tine258, D8): the magic-arrow glyph
    // is a `UPolygon` (`klimt/shape/TextBlockArrow2.java:62-77`,
    // `final UPolygon triangle = new UPolygon(); ... ug.draw(triangle);`),
    // so it gets `LimitFinder#drawUPolygon`'s own x-only pad, exactly like
    // every other `UPolygon` this file bounds (`HACK_X_FOR_POLYGON`,
    // `klimt/drawing/LimitFinder.java:169-177`:
    // `addPoint(x + shape.getMinX() - HACK_X_FOR_POLYGON, y + shape.getMinY());
    // addPoint(x + shape.getMaxX() + HACK_X_FOR_POLYGON, y + shape.getMaxY());`)
    // -- unlike the single-point simplification above, the WHOLE triangle is
    // cheap to bound exactly (only 3 points), so every vertex is added, each
    // ± the pad on x. SI25 D1: the per-line glyphs of a multi-guide-line
    // label (`labelLines[i].glyph`) get the identical rule -- `UPolygon`
    // through `LimitFinder` either way.
    if (e.arrowGlyph !== undefined) {
      for (const p of e.arrowGlyph.points) {
        addPoint(box, p.x - HACK_X_FOR_POLYGON, p.y);
        addPoint(box, p.x + HACK_X_FOR_POLYGON, p.y);
      }
    }
    for (const line of e.labelLines ?? []) {
      if (line.glyph !== undefined) {
        for (const p of line.glyph.points) {
          addPoint(box, p.x - HACK_X_FOR_POLYGON, p.y);
          addPoint(box, p.x + HACK_X_FOR_POLYGON, p.y);
        }
      }
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
