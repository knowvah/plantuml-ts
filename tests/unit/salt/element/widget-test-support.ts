/**
 * Shared support for the batch-2 widget tests (sep-T2a): every widget is
 * drawn through the real SVG `UGraphic` and its shapes are compared to the
 * jar's, element for element, in document order.
 *
 * Every `fixtures/widget-*.puml` is one `@startsalt { … }` rendered by
 * `scripts/oracle-render.sh` (1.2026.8beta1, deterministic text). A widget
 * in the first row and column of a borderless `{` pyramid is drawn at
 * (6, 6): diagram margin 5 (`PSystemSalt#getDefaultMargins`, decisions.md
 * D2) + `xcell + 1` / `ycell + 1` (ElementPyramid.java:116).
 */
import { readFileSync } from 'node:fs';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { FIXTURES, measurer, stringBounder, textElements } from '../salt-test-support.js';

/** The first cell's origin in every `widget-*` fixture. */
export const CELL = { dx: 6, dy: 6 } as const;

/** Every drawn element — shapes and `<text>` — in document order, with the
 *  per-element `font-family` the port writes on `<text>` removed (the jar
 *  hoists it onto the enclosing `<g>`; see `textElements`). */
export function drawnElements(svg: string): string[] {
  const shapes = /<(?:rect|line|ellipse|polygon)\b[^>]*\/>|<text\b[^>]*>[^<]*<\/text>/g;
  return [...svg.matchAll(shapes)].map((m) => (m[0].startsWith('<text') ? textElements(m[0])[0]! : m[0]));
}

/** The drawn elements of the oracle SVG fixture `name`. */
export function jarElements(name: string): string[] {
  return drawnElements(readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8'));
}

/** Draws `element` at `zIndex` into `dimToUse` (default: its preferred
 *  dimension, what a one-cell pyramid hands it) at {@link CELL}, in the
 *  black ink the enclosing pyramid applies first (`ug.apply(getBlack())`,
 *  ElementPyramid.java:102) — `ElementTextField` draws in whatever ink it
 *  is handed. */
export function drawAt(element: Element, zIndex: number, dimToUse?: XDimension2D): string[] {
  const dim = dimToUse ?? element.getPreferredDimension(stringBounder, 0, 0);
  const fragment = renderDrawableToFragment(
    {
      drawU: (ug) =>
        element.drawU(ug.apply(new Fore(HColors.BLACK.asPaint())).apply(new UTranslate(CELL.dx, CELL.dy)), zIndex, dim),
    },
    { width: 400, height: 200, measurer, uid: 'salt-widget-test' },
  );
  return drawnElements(fragment.body);
}

/** `new XDimension2D(w, h)`, for an explicit `dimToUse`. */
export function dimension(width: number, height: number): XDimension2D {
  return new XDimension2D(width, height);
}
