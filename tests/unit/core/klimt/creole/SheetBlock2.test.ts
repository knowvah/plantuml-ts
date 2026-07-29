/**
 * SheetBlock2.test.ts — T8: unit coverage for `SheetBlock2`
 * (klimt/creole/SheetBlock2.java) — the `Stencil`-clipped, alignment-aware
 * wrapper around a `SheetBlock1`.
 *
 * `fakeBlock` below is a lightweight `SheetBlock1` DOUBLE (cast via `as
 * unknown as SheetBlock1`, the same technique `Sheet.test.ts` already uses
 * for `Stripe` doubles) rather than a real `SheetBlock1` instance: the
 * CENTER/RIGHT `minimumWidth`-shift branches (Java:101-109) are reachable
 * ONLY when `block.getMinimumWidth() > 0`, and this port's `SheetBlock1`
 * never sets a positive `minimumWidth` (its sole setter, the `Style`-based
 * constructor overload, is deliberately not ported — see `SheetBlock1.ts`'s
 * own doc comment). A double lets this file exercise those branches on
 * `SheetBlock2`'s OWN logic without inventing Style-cascade machinery.
 */
import { describe, expect, it } from 'vitest';
import { SheetBlock2 } from '../../../../../src/core/klimt/creole/SheetBlock2.js';
import type { SheetBlock1 } from '../../../../../src/core/klimt/creole/SheetBlock1.js';
import type { Stencil } from '../../../../../src/core/klimt/creole/Stencil.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

const OPEN_STENCIL: Stencil = {
  getStartingX: () => -1000,
  getEndingX: () => 1000,
};

function fakeBlock(opts: {
  alignment: HorizontalAlignment;
  minimumWidth: number;
  width: number;
  drawnWith?: UGraphic[];
}): SheetBlock1 {
  return {
    getHorizontalAlignment: () => opts.alignment,
    getMinimumWidth: () => opts.minimumWidth,
    calculateDimension: () => new XDimension2D(opts.width, 5),
    toString: () => 'fake-block',
    drawU: (ug: UGraphic) => opts.drawnWith?.push(ug),
    getInnerPosition: () => undefined,
  } as unknown as SheetBlock1;
}

/** Composes `apply(UTranslate)` calls, reporting the accumulated (dx, dy). */
class RecordingUGraphic implements UGraphic {
  constructor(private readonly translate: UTranslate = UTranslate.none()) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.translate.compose(change));
    return this;
  }

  draw(): void {
    throw new Error('not needed');
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return stubStringBounder;
  }
}

describe('SheetBlock2 — pure delegation', () => {
  it('toString delegates to the wrapped block (Java:86-88)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(sb2.toString()).toBe('fake-block');
  });

  it('calculateDimension delegates to the wrapped block (Java:90-94)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 42 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(sb2.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(42, 5));
  });

  it('getInnerPosition delegates to the wrapped block (Java:117-120)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(sb2.getInnerPosition('member', stubStringBounder)).toBeUndefined();
  });

  it('getStartingAltitude is always 0 (Java:113-115)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(sb2.getStartingAltitude(stubStringBounder)).toBe(0);
  });

  it('getPorts always returns a fresh, empty Ports (Java:122-125, NOT delegated to block)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(sb2.getPorts(stubStringBounder).getAllPortGeometry()).toEqual([]);
  });

  it('getNeutrons always throws (Java:127-130)', () => {
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    expect(() => sb2.getNeutrons()).toThrow('UnsupportedOperationException');
  });
});

describe('SheetBlock2.drawU — alignment/minimumWidth x-shift (Java:96-111)', () => {
  it('LEFT alignment never shifts, regardless of minimumWidth', () => {
    const drawnWith: UGraphic[] = [];
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 100, width: 40, drawnWith });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    sb2.drawU(new RecordingUGraphic());
    expect(drawnWith[0]?.getTranslate()).toEqual(UTranslate.none());
  });

  it('CENTER alignment with minimumWidth <= 0 never shifts', () => {
    const drawnWith: UGraphic[] = [];
    const block = fakeBlock({ alignment: HorizontalAlignment.CENTER, minimumWidth: 0, width: 40, drawnWith });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    sb2.drawU(new RecordingUGraphic());
    expect(drawnWith[0]?.getTranslate()).toEqual(UTranslate.none());
  });

  it('CENTER alignment with minimumWidth > 0 shifts by (minimumWidth - width) / 2', () => {
    const drawnWith: UGraphic[] = [];
    const block = fakeBlock({ alignment: HorizontalAlignment.CENTER, minimumWidth: 100, width: 40, drawnWith });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    sb2.drawU(new RecordingUGraphic());
    expect(drawnWith[0]?.getTranslate().getDx()).toBe(30); // (100 - 40) / 2
  });

  it('RIGHT alignment with minimumWidth > 0 shifts by the full (minimumWidth - width)', () => {
    const drawnWith: UGraphic[] = [];
    const block = fakeBlock({ alignment: HorizontalAlignment.RIGHT, minimumWidth: 100, width: 40, drawnWith });
    const sb2 = new SheetBlock2(block, OPEN_STENCIL, UStroke.simple());
    sb2.drawU(new RecordingUGraphic());
    expect(drawnWith[0]?.getTranslate().getDx()).toBe(60); // 100 - 40
  });
});

describe('SheetBlock2.enlargeMe (Java:61-73)', () => {
  it('returns a NEW SheetBlock2 wrapping a Stencil narrowed by (delta1, delta2)', () => {
    const stencil: Stencil = {
      getStartingX: () => 5,
      getEndingX: () => 50,
    };
    const block = fakeBlock({ alignment: HorizontalAlignment.LEFT, minimumWidth: 0, width: 10 });
    const sb2 = new SheetBlock2(block, stencil, UStroke.simple());
    const enlarged = sb2.enlargeMe(2, 3);

    expect(enlarged).not.toBe(sb2);
    expect(enlarged.toString()).toBe('fake-block'); // same underlying block

    // `stencil` is TS-private (compile-time only) on SheetBlock2 -- reading
    // it back here white-box-verifies enlargeMe's own delta arithmetic
    // (`getStartingX(...) - delta1`, `getEndingX(...) + delta2`) directly,
    // rather than only indirectly through the deeper UGraphicStencil/
    // UHorizontalLine clipping pipeline (out of this file's scope).
    const enlargedStencil = (enlarged as unknown as { stencil: Stencil }).stencil;
    expect(enlargedStencil.getStartingX(stubStringBounder, 0)).toBe(3); // 5 - 2
    expect(enlargedStencil.getEndingX(stubStringBounder, 0)).toBe(53); // 50 + 3
  });
});
