/**
 * cdd5-T4e (`desc-usymbol-ink-missing`, close-b3): `descriptionLeafSymbolInk`
 * now gates `symbolInk` to a DENYLIST (`port`/`note`/`folder`/`package`/
 * `interface`/`circle`/`hexagon`) instead of the old hand-picked 3-symbol
 * allowlist (`component`/`database`/`node`) -- mirroring `leaf-sizing.ts
 * #measureLeafNode`'s OWN dispatch: a symbol whose `Dim` (box) comes from
 * `measureEntityLeaf` (the SAME `EntityImageDescription`-based construction
 * this file's `measureEntityLeafInk` walks) is safe to ink generically;
 * the denylisted symbols size their `Dim` through a DIFFERENT, non-generic
 * construction (or, for `hexagon`, outright throw) and stay excluded -- see
 * `class-layout-description-leaf-ink.ts`'s own doc comment for the
 * per-symbol Java citation, the jar-verified regression (`package` widened
 * `unknown/cepedu-19-namu934`'s width Δ from a wrong shift into a Δ32
 * blowout), and the crash (`hexagon`) the denylist avoids.
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

  test.each(['rectangle', 'queue', 'frame', 'stack', 'entity', 'card'] as const)(
    '%s -- ink present (cdd5-T4e: sizes via measureEntityLeaf, leaf-sizing.ts default case, so ink and box now agree)',
    (symbol) => {
      expect(
        descriptionLeafSymbolInk(node(symbol), symbol, baseFont, { opts: emptyOpts, sprites: undefined, measurer }),
      ).not.toBeUndefined();
    },
  );

  test.each(['port', 'note', 'interface', 'circle', 'hexagon'] as const)(
    '%s -- no ink (leaf-sizing.ts sizes its Dim through a DIFFERENT, non-generic construction; walking the generic one would disagree with the box)',
    (symbol) => {
      expect(
        descriptionLeafSymbolInk(node(symbol), symbol, baseFont, { opts: emptyOpts, sprites: undefined, measurer }),
      ).toBeUndefined();
    },
  );

  test.each(['folder', 'package'] as const)(
    '%s -- ink present (T2b: routes to measureFolderLeafInk, not the generic EntityImageDescription walk)',
    (symbol) => {
      const ink = descriptionLeafSymbolInk(node(symbol), symbol, baseFont, {
        opts: emptyOpts,
        sprites: undefined,
        measurer,
      });
      expect(ink).toBeDefined();
      // `USymbolFolder.ts#folderPath`'s arced outline bbox is exactly
      // (0,0)-(width,height) -- no `addRectInk`-style `-1` inset corner.
      expect(ink?.minX).toBe(0);
      expect(ink?.minY).toBe(0);
      expect(ink?.maxX).toBeGreaterThan(0);
      expect(ink?.maxY).toBeGreaterThan(0);
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
