/**
 * Support for the salt container tests (Grid, ElementPyramid,
 * ElementPyramidScrolled, ElementBorder): builds a pyramid's `Positionner2`
 * the way `ElementFactoryPyramid#create` feeds it (ElementFactoryPyramid.java:
 * 79-86), draws a root element the way `PSystemSalt#getTextBlock` does
 * (black foreground, z-index 0 then 1 into its preferred dimension,
 * PSystemSalt.java:114-122) at the jar's (5, 5) document margin, and lists
 * an SVG's drawn elements for an element-for-element comparison with a jar
 * oracle under `fixtures/`.
 */
import { readFileSync } from 'node:fs';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { Positionner2 } from '../../../../src/diagrams/salt/Positionner2.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminated } from '../../../../src/diagrams/salt/Terminated.js';
import { Terminator } from '../../../../src/diagrams/salt/Terminator.js';
import { FIXTURES, FONT_12, measurer, stringBounder } from '../salt-test-support.js';

/** The jar's document margin around the salt root (every fixture's first cell sits at 5 + 1). */
export const ROOT_AT = { dx: 5, dy: 5 };

/** The cell a pyramid factory merges left instead of adding (ElementFactoryPyramid.java:88-93). */
export const STAR = '*';

export const dictionary = new SaltDictionary();

/** A plain text cell, as `ElementFactoryText` builds it (12 pt sans). */
export function text(...lines: string[]): ElementText {
  return new ElementText(lines, FONT_12, dictionary);
}

/** `rows` cells (an `Element`, or {@link STAR} for `mergeLeft`), each row
 *  `NEWCOL`-separated and `NEWLINE`-terminated, fed to a `Positionner2`. */
export function positionner(rows: readonly (readonly (Element | typeof STAR)[])[]): Positionner2 {
  const p = new Positionner2();
  for (const row of rows) {
    row.forEach((cell, i) => {
      const terminator = i === row.length - 1 ? Terminator.NEWLINE : Terminator.NEWCOL;
      if (cell === STAR) p.mergeLeft(terminator);
      else p.add(new Terminated<Element>(cell, terminator));
    });
  }
  return p;
}

/** Text cells from strings; `*` stays {@link STAR}. */
export function textRows(rows: readonly (readonly string[])[]): (Element | typeof STAR)[][] {
  return rows.map((row) => row.map((s) => (s === STAR ? STAR : text(s))));
}

/** Draws `root` as `PSystemSalt#getTextBlock` does and returns the SVG body. */
export function drawRoot(root: Element): string {
  const size = root.getPreferredDimension(stringBounder, 0, 0);
  const fragment = renderDrawableToFragment(
    {
      drawU: (ug) => {
        const black = ug.apply(new UTranslate(ROOT_AT.dx, ROOT_AT.dy)).apply(new Fore('#000000'));
        root.drawU(black, 0, new XDimension2D(size.getWidth(), size.getHeight()));
        root.drawU(black, 1, new XDimension2D(size.getWidth(), size.getHeight()));
      },
    },
    { width: 400, height: 400, measurer, uid: 'salt-container-test' },
  );
  return fragment.body;
}

const DRAWN = /<(?:line|rect|path|polygon)\b[^>]*\/>|<text\b[^>]*>[^<]*<\/text>/g;

/** Every drawn element of `svg` in document order, with the per-element
 *  `font-family` the port writes on `<text>` (the jar hoists it onto the
 *  enclosing `<g>`) removed. */
export function drawnElements(svg: string): string[] {
  return [...svg.matchAll(DRAWN)].map((m) => m[0].replace(/ font-family="[^"]*"/, ''));
}

/** The drawn elements of the jar oracle `fixtures/<name>.jar.svg`. */
export function jarDrawnElements(name: string): string[] {
  return drawnElements(readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8'));
}

interface JarDimension {
  readonly root: string;
  readonly width: number;
  readonly height: number;
}

/** `fixtures/preferred-dimension.json` (PreferredDimensionProbe.java). */
export const JAR_DIMENSIONS: Readonly<Record<string, JarDimension>> = JSON.parse(
  readFileSync(`${FIXTURES}/preferred-dimension.json`, 'utf8'),
) as Readonly<Record<string, JarDimension>>;
