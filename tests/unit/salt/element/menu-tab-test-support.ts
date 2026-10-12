/**
 * Support for the menu and tab element tests (sep-T2b): draws one `Element`
 * the way the jar's fixtures place it — as the only cell of a borderless
 * `{ … }` pyramid — and lists the SVG shapes it wrote.
 *
 * In a one-cell pyramid the cell origin is (6, 6) (margin 5, then
 * `xcell + 1, ycell + 1`, ElementPyramid.java:116) and the dimension handed
 * to the cell is its preferred one plus 1 on each axis (the column/row is
 * `dim + 2` wide, ElementPyramid.java:139, 146; the cell gets `… - 1`,
 * java:113-114). `PSystemSalt#getTextBlock` draws z-index 0, then 1
 * (PSystemSalt.java:120-121).
 */
import { readFileSync } from 'node:fs';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { FIXTURES, measurer, stringBounder } from '../salt-test-support.js';

/** The one-cell pyramid's cell origin (margin 5 + 1). */
export const CELL = { dx: 6, dy: 6 };

/** The one-cell pyramid's growth of the cell dimension over the preferred one. */
const PYRAMID_CELL_GROWTH = 1;

/** Draws `element` at {@link CELL} for every z-index in `zIndexes`, in order,
 *  with the pyramid's cell dimension, and returns the SVG body. */
export function drawInCell(element: Element, zIndexes: readonly number[] = [0, 1]): string {
  const dim = element.getPreferredDimension(stringBounder, 0, 0);
  const dimToUse = new XDimension2D(dim.getWidth() + PYRAMID_CELL_GROWTH, dim.getHeight() + PYRAMID_CELL_GROWTH);
  return drawAt(element, CELL, dimToUse, zIndexes);
}

/** Draws `element` translated to `at` into `dimToUse` for every z-index in
 *  `zIndexes`, in order, and returns the SVG body. */
export function drawAt(
  element: Element,
  at: { dx: number; dy: number },
  dimToUse: XDimension2D,
  zIndexes: readonly number[],
): string {
  const fragment = renderDrawableToFragment(
    {
      drawU: (ug) => {
        for (const zIndex of zIndexes) element.drawU(ug.apply(new UTranslate(at.dx, at.dy)), zIndex, dimToUse);
      },
    },
    { width: 400, height: 200, measurer, uid: 'salt-test' },
  );
  return fragment.body;
}

/** Every `<rect>`, `<line>` and `<text>` of `svg`, in document order, with the
 *  per-element `font-family` the port writes (the jar hoists it onto the
 *  enclosing `<g>`) removed. */
export function shapes(svg: string): string[] {
  return [...svg.matchAll(/<(?:rect|line)\b[^>]*\/>|<text\b[^>]*>[^<]*<\/text>/g)].map((m) =>
    m[0].replace(/ font-family="[^"]*"/, ''),
  );
}

/** The shapes of the oracle SVG fixture `name` under `FIXTURES`. */
export function jarShapes(name: string): string[] {
  return shapes(jarSvg(name));
}

/** The raw oracle SVG fixture `name` under `FIXTURES`. */
export function jarSvg(name: string): string {
  return readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8');
}

/** Splits a shape list into groups, each starting at a `<rect>` — one group
 *  per drawn popup (each popup paints its background first). */
export function groupsByRect(list: readonly string[]): string[][] {
  const groups: string[][] = [];
  for (const s of list) {
    const last = groups.at(-1);
    if (s.startsWith('<rect') || last === undefined) groups.push([s]);
    else last.push(s);
  }
  return groups;
}
