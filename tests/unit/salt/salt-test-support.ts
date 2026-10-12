/**
 * Shared support for the salt unit tests: the deterministic measurer the
 * oracle jar is pinned to (`scripts/oracle-render.sh`), the salt factories'
 * font, and a draw-to-SVG seam for one `Element`.
 */
import { readFileSync } from 'node:fs';
import { renderDrawableToFragment } from '../../../src/core/klimt/document-shell-fragment.js';
import { FontStack } from '../../../src/core/klimt/font/FontStack.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import type { UFont } from '../../../src/core/klimt/font/UFont.js';
import { UFontFactory } from '../../../src/core/klimt/font/UFontFactory.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { Element } from '../../../src/diagrams/salt/element/Element.js';

export const measurer = new DeterministicMeasurer();
export const stringBounder: StringBounder = new MeasurerStringBounder(measurer);

/** `UFontFactory.byDefault(12)` = `sansSerif(12)` (UFontFactory.java:66-68),
 *  the font every salt text factory builds (e.g. ElementFactoryText.java). */
export const FONT_12: UFont = UFontFactory.build(FontStack.SANS_SERIF, undefined, 12);

export const FIXTURES = 'tests/unit/salt/element/fixtures';

/** Draws `element` at z-index `zIndex`, translated to `(dx, dy)` — the cell
 *  origin the jar placed it at — and returns the SVG body. */
export function drawElement(element: Element, at: { dx: number; dy: number }, zIndex = 0): string {
  const dim = element.getPreferredDimension(stringBounder, 0, 0);
  const fragment = renderDrawableToFragment(
    {
      drawU: (ug) =>
        element.drawU(
          ug.apply(new UTranslate(at.dx, at.dy)),
          zIndex,
          new XDimension2D(dim.getWidth(), dim.getHeight()),
        ),
    },
    { width: 200, height: 100, measurer, uid: 'salt-test' },
  );
  return fragment.body;
}

/** Every `<text …>…</text>` element of `svg`, in document order, with the
 *  per-element `font-family` the port writes (the jar hoists it onto the
 *  enclosing `<g>`) removed so the two compare attribute for attribute. */
export function textElements(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>[^<]*<\/text>/g)].map((m) => m[0].replace(/ font-family="[^"]*"/, ''));
}

/** The `<text>` elements of an oracle SVG fixture under {@link FIXTURES}. */
export function jarTextElements(name: string): string[] {
  return textElements(readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8'));
}
