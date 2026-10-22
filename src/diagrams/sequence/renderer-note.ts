/**
 * The note and box (englober) shapes, drawn from their resolved style paint
 * (sdd1 T2e). Split out of `renderer.ts`, which is past the 500-line cap.
 *
 * Every paint read is the component's own, off the `Style` its event resolved
 * (`Note#getUsedStyles`, `Note.java:75-82`; `Doll#getUsedStyles`,
 * `Doll.java:107-114`): `getSymbolContext(colors)` (`AbstractComponent
 * .java:89-91` -> `Style.java:270-281`) supplies back/fore colour, stroke and
 * delta shadow, `getRoundCorner()` (`AbstractComponent.java:109-111`) the
 * corner. Lengths are scaled here, at emission, as `SvgGraphics#format` and
 * `#setStrokeWidth` scale them (`SvgGraphics.java:466-468,555-561`).
 */
import type { BoxGeo, NoteConnector, NoteGeo } from './ast.js';
import type { SequencePaint } from './sequence-skin-param.js';
import type { ScaledTheme } from './scale-geo.js';
import { line, path, polygon, rect } from '../../core/svg.js';
import { noGradient } from '../../core/paint.js';
import { arcTo, lineTo, moveTo } from '../../core/svg-path-builder.js';
import { fmt } from '../../core/svg-format.js';
import { OPALE_CORNERSIZE } from '../../core/svek/image/Opale.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { withNoteShadow } from './sequence-shadow.js';
import { creoleRunText } from './renderer.js';

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

/** `Fashion#apply` (`klimt/Fashion.java`): back, fore and stroke, its
 *  thickness and dashes scaled at emission. */
function shapeStyle(paint: SequencePaint, k: number) {
  const dash = paint.dash;
  return {
    fill: paint.fill,
    stroke: paint.stroke,
    strokeWidth: paint.thickness * k,
    ...(dash === undefined ? {} : { strokeDasharray: dash.map((d) => fmt(d * k)).join(',') }),
  };
}

/** `URectangle#rounded(roundCorner)` (`URectangle.java:80-84`):
 *  `DriverRectangleSvg` hands `svgRectangle` `rx / 2, ry / 2`
 *  (`DriverRectangleSvg.java:57,78`), which writes them only when positive
 *  (`SvgGraphics.java:582-584`). */
function roundedCorner(roundCorner: number, k: number): { rx?: number; ry?: number } {
  const r = (roundCorner / 2) * k;
  return r > 0 ? { rx: r, ry: r } : {};
}

/** The note's box in document coordinates, with `Opale`'s scaled
 *  `cornersize` (`c`) and `roundCorner` (`rc`). */
interface OpaleFrame {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly c: number;
  readonly rc: number;
}

/**
 * `Opale.getPolygonNormal(width, height, roundCorner)` at `(x, y)`, its
 * `closePath` adding nothing to the emitted `d` (the jar's own goldens end at
 * the last segment).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:149-171
 */
function polygonNormal(f: OpaleFrame): string {
  const { x, y, w, h, c, rc } = f;
  if (rc === 0) {
    const points: Array<[number, number]> = [
      [x, y + h],
      [x + w, y + h],
      [x + w, y + c],
      [x + w - c, y],
      [x, y],
    ];
    return [moveTo(x, y), ...points.map(([px, py]) => lineTo(px, py))].join(' ');
  }
  const r = rc / 2;
  return [
    moveTo(x, y + r),
    lineTo(x, y + h - r),
    arcTo(x + r, y + h, r, 0, 0),
    lineTo(x + w - r, y + h),
    arcTo(x + w, y + h - r, r, 0, 0),
    lineTo(x + w, y + c),
    lineTo(x + w - c, y),
    lineTo(x + r, y),
    arcTo(x, y + r, r, 0, 0),
  ].join(' ');
}

/** `Opale.getCorner(width, roundCorner)` at `(x, y)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:134-147 */
function corner(f: OpaleFrame): string {
  const { x, y, w, c, rc } = f;
  const fold =
    rc === 0
      ? [lineTo(x + w - c, y + c)]
      : [lineTo(x + w - c, y + c - rc / 4), arcTo(x + w - c + rc / 4, y + c, rc / 4, 0, 0)];
  return [moveTo(x + w - c, y), ...fold, lineTo(x + w, y + c), lineTo(x + w - c, y)].join(' ');
}

/** `ComponentRoseNoteHexagonal`'s `cornersize` (`:54`). */
export const NOTE_HEXAGON_CORNERSIZE = 10;

/**
 * `ComponentRoseNoteHexagonal#drawInternalU`'s `UPolygon` at `(x, y)`, its
 * seven points in the jar's order (`:99-106`). `textHeight` and `x2` are
 * `int`s (`:89,91,97`), so `textHeight / 2` is INTEGER division. The geo is
 * already scaled while the jar scales each point at emission
 * (`SvgGraphics.java:466-468`): the unscaled height is recovered from the
 * scaled one -- an integer, as layout truncates it (`sequence-layout-note.ts`)
 * -- and halved before `k` is applied again.
 */
export function hexagonPoints(
  note: Pick<NoteGeo, 'x' | 'y' | 'width' | 'height'>,
  k: number,
): Array<{ x: number; y: number }> {
  const { x, y, width: x2, height: textHeight } = note;
  const c = NOTE_HEXAGON_CORNERSIZE * k;
  const mid = Math.trunc(Math.round(textHeight / k) / 2) * k;
  return [
    { x: x + c, y },
    { x: x + x2 - c, y },
    { x: x + x2, y: y + mid },
    { x: x + x2 - c, y: y + textHeight },
    { x: x + c, y: y + textHeight },
    { x, y: y + mid },
    { x: x + c, y },
  ];
}

/**
 * A note's shape: `ComponentRoseNote#drawInternalU` draws the Opale polygon
 * (shadowed) then the corner (`ComponentRoseNote.java:118-124`), both under
 * `symbolContext.apply(ug)`; `ComponentRoseNoteBox#drawInternalU` one rounded
 * `URectangle` (`ComponentRoseNoteBox.java:99-102`);
 * `ComponentRoseNoteHexagonal#drawInternalU` one shadowed `UPolygon`
 * (`ComponentRoseNoteHexagonal.java:99-110`).
 */
function noteShape(note: NoteGeo, paint: SequencePaint, k: number): string {
  const style = shapeStyle(paint, k);
  const { x, y, width: w, height: h } = note;
  const shadow = note.shadow ?? 0;
  if (note.shape === 'rect')
    return withNoteShadow(rect(x, y, w, h, { ...style, ...roundedCorner(paint.roundCorner, k) }), shadow);
  if (note.shape === 'hexagon') return withNoteShadow(polygon(hexagonPoints(note, k), style), shadow);
  const frame: OpaleFrame = { x, y, w, h, c: OPALE_CORNERSIZE * k, rc: paint.roundCorner * k };
  return withNoteShadow(path(polygonNormal(frame), style), shadow) + path(corner(frame), style);
}

/** A note: its shape, then its body runs at the note style's font. */
export function renderNote(note: NoteGeo, theme: ScaledTheme): string {
  const paint = paintOf(note, 'note');
  const k = theme.scaleK;
  const bold = paint.font.styles.has(FontStyle.BOLD);
  return (
    noteShape(note, paint, k) +
    note.textRuns.map((run) => creoleRunText(run, theme, paint.font.size * k, bold)).join('') +
    (note.connector === undefined ? '' : renderConnector(note.connector, k))
  );
}

/**
 * The background pass of a note: nothing, but for a `top`/`bottom` note's
 * connector. `drawLine` draws straight on the `UGraphic`, not through a
 * component, so it ignores `Context2D#isBackground` and lands in BOTH passes
 * (`CommunicationTileNoteBottomTopAbstract.java:70-79`; the jar's goldens
 * carry each line twice, ahead of the lifelines and again after the note).
 */
export function renderNoteBackground(note: NoteGeo, theme: ScaledTheme): string {
  return note.connector === undefined ? '' : renderConnector(note.connector, theme.scaleK);
}

/** `CommunicationTileNoteBottomTopAbstract#drawLine` (`:70-79`): a
 *  `ULine(dx, dy)` under `UStroke(2, 2, 1)` in the root `LineColor`. */
function renderConnector(c: NoteConnector, k: number): string {
  return line(c.x1, c.y1, c.x2, c.y2, {
    stroke: noGradient(c.paint.stroke),
    strokeWidth: CONNECTOR_THICKNESS * k,
    strokeDasharray: [CONNECTOR_DASH, CONNECTOR_GAP].map((d) => fmt(d * k)).join(','),
  });
}

/**
 * `ComponentRoseEnglober#drawBackgroundInternalU` (`:65-71`): the rounded
 * `URectangle` under `symbolContext.apply(ug)`, then the title -- placed in
 * layout (`sequence-layout-box.ts`), drawn at the box style's font.
 */
export function renderBoxBackground(box: BoxGeo, theme: ScaledTheme): string {
  const paint = paintOf(box, 'box');
  const k = theme.scaleK;
  const boxRect = rect(box.x, box.y, box.width, box.height, {
    ...shapeStyle(paint, k),
    ...roundedCorner(paint.roundCorner, k),
  });
  const bold = paint.font.styles.has(FontStyle.BOLD);
  return boxRect + box.labelRuns.map((run) => creoleRunText(run, theme, paint.font.size * k, bold)).join('');
}
