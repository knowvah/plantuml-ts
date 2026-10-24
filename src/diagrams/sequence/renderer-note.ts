/**
 * The note and box (englober) shapes, drawn through the page's `UGraphic`
 * from their resolved style paint (sdd1 T2e; sdd3 T8e).
 *
 * Every paint read is the component's own, off the `Style` its event resolved
 * (`Note#getUsedStyles`, `Note.java:75-82`; `Doll#getUsedStyles`,
 * `Doll.java:107-114`): `getSymbolContext(colors)` (`AbstractComponent
 * .java:89-91` -> `Style.java:270-281`) supplies back/fore colour, stroke and
 * delta shadow, `getRoundCorner()` (`AbstractComponent.java:109-111`) the
 * corner. Lengths are the page's own; the export scale is the exporter's
 * `SvgGraphics#format` pass (`SvgGraphics.java:466-468,555-561`).
 *
 * The shapes are drawn in the jar's local frame: the component is translated
 * to its top-left (`CommunicationTileNoteRight.java:139-141`) and the
 * `Opale` builders know nothing of where they sit
 * (`Opale.java:134-171`).
 */
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { noGradient } from '../../core/paint.js';
import { OPALE_CORNERSIZE } from '../../core/svek/image/Opale.js';
import type { BoxGeo, NoteConnector, NoteGeo } from './ast.js';
import type { SequencePaint } from './sequence-skin-param.js';
import type { PageTheme } from './renderer-ug.js';
import { strokeOf } from './renderer-line-component.js';
import { drawCreoleRuns } from './sequence-text.js';

/** `new UStroke(2, 2, 1)` (`CommunicationTileNoteBottomTopAbstract.java:78`):
 *  dash, gap, thickness. */
const CONNECTOR_DASH = 2;
const CONNECTOR_GAP = 2;
const CONNECTOR_THICKNESS = 1;

/** The paint every migrated geo carries: layout resolves it (D1). */
function paintOf(geo: { readonly paint?: SequencePaint }, what: string): SequencePaint {
  if (geo.paint === undefined) throw new Error(`${what} geo has no paint: layout resolves it (sdd1 D1)`);
  return geo.paint;
}

/**
 * `Fashion#apply` (`klimt/Fashion.java:76-92`): the fore colour, the back
 * colour `.bg()`, then the stroke -- `symbolContext.apply(ug)` in every
 * `ComponentRoseNote*` and `ComponentRoseEnglober`. Returns ONE instance: the
 * note's polygon and corner are both drawn on it
 * (`ComponentRoseNote.java:121-124`).
 */
function fashion(ug: UGraphic, paint: SequencePaint): UGraphic {
  return ug.apply(new Fore(paint.stroke)).apply(new Back(paint.fill)).apply(strokeOf(paint));
}

/** `ComponentRoseNoteHexagonal`'s `cornersize` (`:54`). */
const NOTE_HEXAGON_CORNERSIZE = 10;

/**
 * `Opale.getPolygonNormal(width, height, roundCorner)`, at the origin: its
 * `closePath` records nothing (`UPath#closePath` is empty), so the emitted `d`
 * ends at the last segment, as the jar's own goldens do. The arcs stay
 * `arcTo` so a decorator can rewrite them (`UPathHand`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:149-171
 */
function polygonNormal(width: number, height: number, cornersize: number, roundCorner: number): UPath {
  const polygon = UPath.none();
  if (roundCorner === 0) {
    polygon.moveTo(0, 0);
    polygon.lineTo(0, height);
    polygon.lineTo(width, height);
    polygon.lineTo(width, cornersize);
    polygon.lineTo(width - cornersize, 0);
    polygon.lineTo(0, 0);
    return polygon;
  }
  const r = roundCorner / 2;
  polygon.moveTo(0, r);
  polygon.lineTo(0, height - r);
  polygon.arcTo({ x: r, y: height }, r, 0, 0);
  polygon.lineTo(width - r, height);
  polygon.arcTo({ x: width, y: height - r }, r, 0, 0);
  polygon.lineTo(width, cornersize);
  polygon.lineTo(width - cornersize, 0);
  polygon.lineTo(r, 0);
  polygon.arcTo({ x: 0, y: r }, r, 0, 0);
  return polygon;
}

/** `Opale.getCorner(width, roundCorner)`, at the origin.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:134-147 */
function opaleCornerPath(width: number, cornersize: number, roundCorner: number): UPath {
  const path = UPath.none();
  path.moveTo(width - cornersize, 0);
  if (roundCorner === 0) {
    path.lineTo(width - cornersize, cornersize);
  } else {
    path.lineTo(width - cornersize, cornersize - roundCorner / 4);
    path.arcTo({ x: width - cornersize + roundCorner / 4, y: cornersize }, roundCorner / 4, 0, 0);
  }
  path.lineTo(width, cornersize);
  path.lineTo(width - cornersize, 0);
  return path;
}

/**
 * `ComponentRoseNoteHexagonal#drawInternalU`'s `UPolygon` at the origin, its
 * seven points in the jar's order (`:99-106`). `textHeight` and `x2` are
 * `int`s (`:89,91,97`), so `textHeight / 2` is INTEGER division. The height is an
 * integer, as layout truncates it (`sequence-layout-note.ts`).
 */
function hexagonPolygon(width: number, height: number): UPolygon {
  const c = NOTE_HEXAGON_CORNERSIZE;
  const mid = Math.trunc(Math.round(height) / 2);
  return new UPolygon([
    { x: c, y: 0 },
    { x: width - c, y: 0 },
    { x: width, y: mid },
    { x: width - c, y: height },
    { x: c, y: height },
    { x: 0, y: mid },
    { x: c, y: 0 },
  ]);
}

/**
 * `ComponentRoseNote#drawInternalU` (`:118-124`):
 *
 * ```java
 * final UPath polygon = Opale.getPolygonNormal(x2, textHeight, roundCorner);
 * polygon.setDeltaShadow(symbolContext.getDeltaShadow());
 * ug = symbolContext.apply(ug);
 * ug.draw(polygon);
 * ug.draw(Opale.getCorner(x2, roundCorner));
 * ```
 * -- the polygon and the corner on ONE instance, so a decorator's random
 * stream runs on from the polygon into the corner (T8a). The corner carries
 * no shadow.
 */
function drawOpaleNote(ug: UGraphic, note: NoteGeo, paint: SequencePaint): void {
  const { width, height } = note;
  const cornersize = OPALE_CORNERSIZE;
  const roundCorner = paint.roundCorner;
  const polygon = polygonNormal(width, height, cornersize, roundCorner);
  polygon.setDeltaShadow(note.shadow ?? 0);
  const f = fashion(ug, paint);
  f.draw(polygon);
  f.draw(opaleCornerPath(width, cornersize, roundCorner));
}

/**
 * A note's shape: `ComponentRoseNote#drawInternalU` draws the Opale polygon
 * (shadowed) then the corner (above); `ComponentRoseNoteBox#drawInternalU` one
 * rounded `URectangle` (`ComponentRoseNoteBox.java:99-102`);
 * `ComponentRoseNoteHexagonal#drawInternalU` one shadowed `UPolygon`
 * (`ComponentRoseNoteHexagonal.java:99-110`). `URectangle#rounded` reaches the
 * SVG as `rx = ry = roundCorner / 2`, written when positive
 * (`DriverRectangleSvg.java:57,78`; `SvgGraphics.java:582-584`).
 */
function drawNoteShape(ug: UGraphic, note: NoteGeo, paint: SequencePaint): void {
  const placed = ug.apply(new UTranslate(note.x, note.y));
  const { width, height } = note;
  if (note.shape === 'rect') {
    const rect = URectangle.build(width, height).rounded(paint.roundCorner);
    rect.setDeltaShadow(note.shadow ?? 0);
    fashion(placed, paint).draw(rect);
  } else if (note.shape === 'hexagon') {
    const polygon = hexagonPolygon(width, height);
    polygon.setDeltaShadow(note.shadow ?? 0);
    fashion(placed, paint).draw(polygon);
  } else {
    drawOpaleNote(placed, note, paint);
  }
}

/** A note: its shape, then its body runs at the note style's font. */
export function drawNote(ug: UGraphic, note: NoteGeo, theme: PageTheme): void {
  const paint = paintOf(note, 'note');
  drawNoteShape(ug, note, paint);
  drawCreoleRuns(ug, note.textRuns, theme, paint.font.size, paint.font.styles.has(FontStyle.BOLD));
  if (note.connector !== undefined) drawConnector(ug, note.connector);
}

/**
 * The background pass of a note: nothing, but for a `top`/`bottom` note's
 * connector. `drawLine` draws straight on the `UGraphic`, not through a
 * component, so it ignores `Context2D#isBackground` and lands in BOTH passes
 * (`CommunicationTileNoteBottomTopAbstract.java:70-79`; the jar's goldens
 * carry each line twice, ahead of the lifelines and again after the note).
 */
export function drawNoteBackground(ug: UGraphic, note: NoteGeo): void {
  if (note.connector !== undefined) drawConnector(ug, note.connector);
}

/** `CommunicationTileNoteBottomTopAbstract#drawLine` (`:70-79`):
 *  `ug.apply(new UTranslate(x1, y1)).apply(color).apply(new UStroke(2, 2, 1))
 *  .draw(new ULine(dx, dy))`, the colour the root `LineColor`. */
export function drawConnector(ug: UGraphic, c: NoteConnector): void {
  ug.apply(new UTranslate(c.x1, c.y1))
    .apply(new Fore(noGradient(c.paint.stroke)))
    .apply(new UStroke(CONNECTOR_DASH, CONNECTOR_GAP, CONNECTOR_THICKNESS))
    .draw(new ULine(c.x2 - c.x1, c.y2 - c.y1));
}

/**
 * `ComponentRoseEnglober#drawBackgroundInternalU` (`:65-71`): the rounded
 * `URectangle` under `symbolContext.apply(ug)`, then the title -- placed in
 * layout (`sequence-layout-box.ts`), drawn at the box style's font.
 */
export function drawBoxBackground(ug: UGraphic, box: BoxGeo, theme: PageTheme): void {
  const paint = paintOf(box, 'box');
  const rect = URectangle.build(box.width, box.height).rounded(paint.roundCorner);
  fashion(ug.apply(new UTranslate(box.x, box.y)), paint).draw(rect);
  drawCreoleRuns(ug, box.labelRuns, theme, paint.font.size, paint.font.styles.has(FontStyle.BOLD));
}
