/**
 * body-ink.ts -- lgm-T1a: `TextBlockUtils.getMinMax(original, sb, false)`
 * (the `LimitFinder` draw pass `DiagramChromeFactory.decorateWithFrame` and
 * `BigFrame` size the mainframe from) over an ALREADY-SERIALIZED fragment
 * body.
 *
 * Upstream never asks the diagram for its `calculateDimension` when it frames
 * it: `BigFrame#computeWidth`/`#computeHeight` (`klimt/shape/BigFrame.java:
 * 77-91`) and `decorateWithFrame#computeDelta` (`core/DiagramChromeFactory
 * .java:331-335`) read the INK the diagram's `drawU` leaves in a
 * `LimitFinder` (`klimt/drawing/LimitFinder.java:108-215`). This port's
 * `RenderFragment.body` is the string that same `drawU` serialized, so the
 * ink is recovered by re-applying `LimitFinder`'s per-shape rules to the
 * element each shape was serialized as -- one rule table for every engine,
 * instead of one hand-derived ink box per engine.
 *
 * Shape -> element -> rule (x/y are the shape's drawn origin):
 *  - `URectangle`  `<rect>`      (x-1, y-1) .. (x+w-1, y+h-1)  (:drawRectangle)
 *  - `ULine`       `<line>`      (x1, y1) .. (x2, y2)          (:drawULine)
 *  - `UEllipse`    `<ellipse>`   (x, y) .. (x+w-1, y+h-1)      (:drawEllipse)
 *  - `UPolygon`    `<polygon>`   minX-10 .. maxX+10, minY .. maxY
 *                                (:drawUPolygon, `HACK_X_FOR_POLYGON`)
 *  - `UPath`       `<path>`      every segment point; an arc only its end
 *                                point (`UPath#addPoint`)      (:drawUPath)
 *  - `UText`       `<text>`      (x, y-(h-1.5)) .. (x+w, y+1.5) (:drawText)
 *  - `UImage`      `<image>`     (x, y) .. (x+w-1, y+h-1)      (:drawImage)
 *
 * NOT modelled (named, not silently dropped): `URectangle`/`UEllipse`
 * `deltaShadow` (`:drawRectangle`'s `+ shadow*2`) -- a shadowed shape
 * serializes as a `filter` reference that carries no offset; `UClip`
 * (`LimitFinder#apply` rejects it in this port too).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/BigFrame.java:77-91
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:331-335
 */

import type { FontSpec, StringMeasurer } from '../measurer.js';

/** An accumulated ink extent in the body's own coordinates. */
export interface InkBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** `LimitFinder.HACK_X_FOR_POLYGON` (`LimitFinder.java:67`) -- the polygon's
 *  X extent is widened by this on both sides. */
const HACK_X_FOR_POLYGON = 10;

/** `LimitFinder#drawText`'s `dim.getHeight() - 1.5` (`:211`). */
const TEXT_BASELINE_LIFT = 1.5;

const ELEMENT_RE = /<(rect|line|ellipse|polygon|path|text|image)\b([^>]*?)(\/?)>/g;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;
const NUMBER_RE = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g;
const PATH_COMMAND_RE = /([MLCQAZ])([^MLCQAZ]*)/g;
const TEXT_END = '</text>';

type Attrs = Readonly<Record<string, string>>;

interface Ink {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function addPoint(ink: Ink, x: number, y: number): void {
  if (x < ink.minX) ink.minX = x;
  if (x > ink.maxX) ink.maxX = x;
  if (y < ink.minY) ink.minY = y;
  if (y > ink.maxY) ink.maxY = y;
}

function parseAttrs(source: string): Attrs {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(ATTR_RE)) out[m[1]!] = m[2]!;
  return out;
}

function num(attrs: Attrs, name: string): number {
  const raw = attrs[name];
  return raw === undefined ? 0 : Number(raw);
}

function numbers(text: string): number[] {
  return (text.match(NUMBER_RE) ?? []).map(Number);
}

function inkRect(ink: Ink, a: Attrs): void {
  const x = num(a, 'x');
  const y = num(a, 'y');
  addPoint(ink, x - 1, y - 1);
  addPoint(ink, x + num(a, 'width') - 1, y + num(a, 'height') - 1);
}

function inkLine(ink: Ink, a: Attrs): void {
  addPoint(ink, num(a, 'x1'), num(a, 'y1'));
  addPoint(ink, num(a, 'x2'), num(a, 'y2'));
}

function inkEllipse(ink: Ink, a: Attrs): void {
  const rx = num(a, 'rx');
  const ry = num(a, 'ry');
  addPoint(ink, num(a, 'cx') - rx, num(a, 'cy') - ry);
  addPoint(ink, num(a, 'cx') + rx - 1, num(a, 'cy') + ry - 1);
}

function inkPolygon(ink: Ink, a: Attrs): void {
  const values = numbers(a['points'] ?? '');
  if (values.length < 2) return;
  const xs = values.filter((_, i) => i % 2 === 0);
  const ys = values.filter((_, i) => i % 2 === 1);
  addPoint(ink, Math.min(...xs) - HACK_X_FOR_POLYGON, Math.min(...ys));
  addPoint(ink, Math.max(...xs) + HACK_X_FOR_POLYGON, Math.max(...ys));
}

/** `UPath#addPoint`: an arc contributes only its end point (coordinates 5
 *  and 6 of `rx ry rot large sweep x y`); every other segment, all its pairs. */
function inkPath(ink: Ink, a: Attrs): void {
  for (const m of (a['d'] ?? '').matchAll(PATH_COMMAND_RE)) {
    const values = numbers(m[2]!);
    if (m[1] === 'A') {
      if (values.length >= 7) addPoint(ink, values[5]!, values[6]!);
      continue;
    }
    for (let i = 0; i + 1 < values.length; i += 2) addPoint(ink, values[i]!, values[i + 1]!);
  }
}

function inkImage(ink: Ink, a: Attrs): void {
  const x = num(a, 'x');
  const y = num(a, 'y');
  addPoint(ink, x, y);
  addPoint(ink, x + num(a, 'width') - 1, y + num(a, 'height') - 1);
}

/** The `FontSpec` `<text>` was serialized from. */
function fontOf(a: Attrs): FontSpec {
  return {
    family: a['font-family'] ?? 'sans-serif',
    size: num(a, 'font-size') || 14,
    weight: a['font-weight'] === 'bold' || Number(a['font-weight']) >= 600 ? 'bold' : 'normal',
    style: a['font-style'] === 'italic' ? 'italic' : 'normal',
  };
}

const ENTITY_RE = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
const TAG_RE = /<[^>]*>/g;

function plainText(inner: string): string {
  return inner.replace(TAG_RE, '').replace(ENTITY_RE, (e) => {
    if (e === '&amp;') return '&';
    if (e === '&lt;') return '<';
    if (e === '&gt;') return '>';
    if (e === '&quot;') return '"';
    if (e === '&apos;') return "'";
    return String.fromCodePoint(e.startsWith('&#x') ? parseInt(e.slice(3, -1), 16) : Number(e.slice(2, -1)));
  });
}

/** `LimitFinder#drawText`: width/height from the `StringBounder` -- the
 *  serialized `textLength` IS that width; the height (only the top edge
 *  needs it) comes from the injected measurer. */
function inkText(ink: Ink, a: Attrs, inner: string, measurer: StringMeasurer): void {
  const text = plainText(inner);
  const font = fontOf(a);
  const dim = measurer.measure(text, font);
  const width = a['textLength'] === undefined ? dim.width : Number(a['textLength']);
  const x = num(a, 'x');
  const yy = num(a, 'y') - (dim.height - TEXT_BASELINE_LIFT);
  addPoint(ink, x, yy);
  addPoint(ink, x + width, yy + dim.height);
}

const SHAPE_INK: Readonly<Record<string, (ink: Ink, a: Attrs) => void>> = {
  rect: inkRect,
  line: inkLine,
  ellipse: inkEllipse,
  polygon: inkPolygon,
  path: inkPath,
  image: inkImage,
};

/**
 * `LimitFinder#getMinMax` over `body`: the extent of everything the body
 * draws. An empty body is `MinMax.getEmpty(true)` -- all zero
 * (`LimitFinder.java:217-221`).
 */
export function inkOfBody(body: string, measurer: StringMeasurer): InkBox {
  const ink: Ink = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const m of body.matchAll(ELEMENT_RE)) {
    const attrs = parseAttrs(m[2]!);
    if (m[1] !== 'text') {
      SHAPE_INK[m[1]!]!(ink, attrs);
      continue;
    }
    const start = (m.index ?? 0) + m[0].length;
    const end = m[3] === '/' ? start : body.indexOf(TEXT_END, start);
    inkText(ink, attrs, body.slice(start, end < 0 ? start : end), measurer);
  }
  return Number.isFinite(ink.minX) ? ink : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}
