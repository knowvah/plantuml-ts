/**
 * Support for the `{T` tree tests (`ElementTree.test.ts`,
 * `ElementTreeEntry.test.ts`): draw any `drawU` body to the port's SVG, list
 * the `<text>`/`<line>`/`<rect>` elements in document order (the per-element
 * `font-family` the port writes is dropped — the jar hoists it onto the
 * enclosing `<g>`), and rebuild a corpus fixture's `{T` block the way
 * `ElementFactoryTree#create` does (ElementFactoryTree.java:54-108): the
 * first cell of a row is `addEntry`'d raw, every other cell is an
 * `ElementText` (`ElementFactoryText#create`, java:55-64 — every non-first
 * cell of the fixtures used here is plain text).
 */
import { readFileSync } from 'node:fs';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { ElementTree } from '../../../../src/diagrams/salt/element/ElementTree.js';
import { fromChar, TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminator } from '../../../../src/diagrams/salt/Terminator.js';
import { FONT_12, measurer } from '../salt-test-support.js';

/** The salt corpus' cached jar oracles. */
export const SALT_CACHE = 'test-results/dot-cache/salt';

/** Renders `drawU` through the port's SVG writer and returns the body. */
export function drawTo(drawU: (ug: UGraphic) => void): string {
  return renderDrawableToFragment({ drawU }, { width: 200, height: 100, measurer, uid: 'salt-tree-test' }).body;
}

/** Every `<text>…</text>`, `<line/>` and `<rect/>` of `svg`, in document order. */
export function shapeElements(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>[^<]*<\/text>|<line\b[^>]*\/>|<rect\b[^>]*\/>/g)].map((m) =>
    m[0].replace(/ font-family="[^"]*"/, ''),
  );
}

/** The {@link shapeElements} of a jar SVG file. */
export function jarShapes(path: string): string[] {
  return shapeElements(readFileSync(path, 'utf8'));
}

/**
 * The run of `jar` that starts where `ours[0]` first appears, as long as
 * `ours` — equal to `ours` exactly when the jar draws the same elements
 * contiguously, in the same order.
 */
export function jarRunFrom(jar: readonly string[], ours: readonly string[]): string[] {
  const start = ours[0] === undefined ? -1 : jar.indexOf(ours[0]);
  return start < 0 ? [] : jar.slice(start, start + ours.length);
}

/** The lines of the `index`-th `{T` block of `puml`, its opening `{T…` through its closing `}`. */
function treeBlock(puml: string, index: number): string[] {
  const lines = puml.split('\n');
  const starts = lines.flatMap((l, i) => (l.trim().startsWith('{T') ? [i] : []));
  const from = starts[index];
  if (from === undefined) throw new Error(`no {T block #${index}`);
  const to = lines.findIndex((l, i) => i > from && l.trim() === '}');
  return lines.slice(from, to + 1);
}

/** A cached corpus fixture's `in.puml` / `in.svg`. */
export function cached(slug: string, file: 'in.puml' | 'in.svg'): string {
  return `${SALT_CACHE}/${slug}/${file}`;
}

/** `ElementFactoryTree#create` (java:54-108) over the `index`-th `{T` block of the `.puml` at `path`. */
export function treeOf(path: string, index = 0): ElementTree {
  const ds = new DataSourceImpl(treeBlock(readFileSync(path, 'utf8'), index));
  ds.next();
  const textT = ds.next().getElement();
  const strategy = textT.length === 2 ? fromChar(textT.charAt(1)) : TableStrategy.DRAW_NONE;
  if (strategy === undefined) throw new Error(`not a tree marker: ${textT}`);
  const dict = new SaltDictionary();
  const tree = new ElementTree(FONT_12, dict, strategy);
  let takeMe = true;
  while (ds.peek(0).getElement() !== '}') {
    const t = ds.next();
    if (takeMe) tree.addEntry(t.getElement());
    else tree.addCellToEntry(new ElementText([t.getElement()], FONT_12, dict));
    takeMe = t.getTerminator() === Terminator.NEWLINE;
  }
  return tree;
}
