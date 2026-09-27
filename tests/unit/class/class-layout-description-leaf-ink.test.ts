/**
 * cdd3-T8 (R-LEAF): `descriptionLeafSymbolInk` gates `symbolInk` to the two
 * USymbols a `descriptive` classifier ALSO draws through
 * `EntityImageDescription.drawU` at render time
 * (`renderer-usymbol-entity.ts#usesClassUSymbolEntity`'s `component`/
 * `database` arms) -- every other symbol falls through to
 * `class-ink-box.ts#addClassifierInk`'s existing `addRectInk` box rule
 * unchanged, and the per-element `opts.fontSize` cascade (`leaf-sizing.ts:
 * 117`'s collapse, reproduced here) must match what `measureLeafNode`
 * itself measured the BOX with, or ink and box would size to two different
 * fonts.
 */
import { describe, expect, test } from 'vitest';
import { descriptionLeafSymbolInk } from '../../../src/diagrams/class/class-layout-description-leaf-ink.js';
import type { LeafSizingSubject } from '../../../src/core/svek/image/LeafSizingSubject.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { BoxSizingOpts } from '../../../src/core/svek/image/leaf-sizing.js';

const measurer = new WidthTableMeasurer();
const baseFont = { family: 'sans-serif', size: 14 };
const emptyOpts: BoxSizingOpts = {};

function node(symbol: LeafSizingSubject['symbol']): LeafSizingSubject {
  return { id: '', display: 'comp3', symbol };
}

describe('descriptionLeafSymbolInk (cdd3-T8, R-LEAF gate)', () => {
  test('component -- ink present (the daxeno/cacoma mechanism)', () => {
    const ink = descriptionLeafSymbolInk(node('component'), 'component', baseFont, {
      opts: emptyOpts,
      sprites: undefined,
      measurer,
    });
    expect(ink).toEqual({ minX: -1, minY: -1, maxX: 81, maxY: 43 });
  });

  test("database -- ink present (daxeno's `<<Database>>` empty-package leaf)", () => {
    const ink = descriptionLeafSymbolInk(node('database'), 'database', baseFont, {
      opts: emptyOpts,
      sprites: undefined,
      measurer,
    });
    expect(ink).not.toBeUndefined();
  });

  test.each(['folder', 'package', 'note', 'rectangle', 'interface', 'circle', 'actor'] as const)(
    '%s -- no ink (renders through a DIFFERENT path, not EntityImageDescription.drawU)',
    (symbol) => {
      expect(
        descriptionLeafSymbolInk(node(symbol), symbol, baseFont, { opts: emptyOpts, sprites: undefined, measurer }),
      ).toBeUndefined();
    },
  );

  test("a per-element `opts.fontSize` override collapses into the walked font (leaf-sizing.ts:117's formula, reproduced)", () => {
    const default14 = descriptionLeafSymbolInk(node('component'), 'component', baseFont, {
      opts: emptyOpts,
      sprites: undefined,
      measurer,
    });
    const overridden20 = descriptionLeafSymbolInk(node('component'), 'component', baseFont, {
      opts: { fontSize: 20 },
      sprites: undefined,
      measurer,
    });
    expect(overridden20).not.toEqual(default14);
  });
});
