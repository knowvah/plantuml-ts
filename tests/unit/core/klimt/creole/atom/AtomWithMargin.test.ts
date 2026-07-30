/**
 * AtomWithMargin.test.ts — T10a: unit coverage for `AtomWithMargin`
 * (klimt/creole/atom/AtomWithMargin.java): vertical-margin dimension
 * widening, altitude pass-through, and the `marginY1` draw-time
 * translate.
 */
import { describe, expect, it } from 'vitest';
import { AtomWithMargin } from '../../../../../../src/core/klimt/creole/atom/AtomWithMargin.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}

const sb: StringBounder = new FakeStringBounder();

/** Composes `apply(UTranslate)` calls so `getTranslate()` reports the
 *  accumulated (dx, dy) applied — same pattern as `SheetBlock1.test.ts`'s
 *  `RecordingUGraphic` (this project's established per-file convention;
 *  no shared UGraphic-double helper exists yet). */
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
    return sb;
  }
}

function fakeInnerAtom(overrides: Partial<Atom> = {}): Atom & { drawnAt: UTranslate[] } {
  const drawnAt: UTranslate[] = [];
  return {
    drawnAt,
    calculateDimension: (): XDimension2D => new XDimension2D(20, 30),
    getStartingAltitude: (): number => -5,
    getNeutrons: (): never => {
      throw new Error('not needed');
    },
    drawU: (ug: UGraphic): void => {
      drawnAt.push(ug.getTranslate());
    },
    ...overrides,
  };
}

describe('AtomWithMargin.calculateDimensionSlow (java:56-58)', () => {
  it('widens height by marginY1+marginY2, leaves width unchanged', () => {
    const inner = fakeInnerAtom();
    const wrapped = new AtomWithMargin(inner, 4, 6);
    expect(wrapped.calculateDimension(sb)).toEqual(new XDimension2D(20, 30 + 4 + 6));
  });

  it('zero margins produce the same dimension as the inner atom', () => {
    const inner = fakeInnerAtom();
    const wrapped = new AtomWithMargin(inner, 0, 0);
    expect(wrapped.calculateDimension(sb)).toEqual(new XDimension2D(20, 30));
  });
});

describe('AtomWithMargin.getStartingAltitude (java:60-62)', () => {
  it('delegates straight to the wrapped atom — margin does not shift altitude', () => {
    const inner = fakeInnerAtom({ getStartingAltitude: () => -17 });
    const wrapped = new AtomWithMargin(inner, 8, 2);
    expect(wrapped.getStartingAltitude(sb)).toBe(-17);
  });
});

describe('AtomWithMargin.drawU (java:65-67)', () => {
  it('draws the wrapped atom translated down by marginY1 only (not marginY2)', () => {
    const inner = fakeInnerAtom();
    const wrapped = new AtomWithMargin(inner, 5, 9);
    wrapped.drawU(new RecordingUGraphic());
    expect(inner.drawnAt).toHaveLength(1);
    expect(inner.drawnAt[0]).toEqual(new UTranslate(0, 5));
  });

  it('composes with an already-translated incoming UGraphic', () => {
    const inner = fakeInnerAtom();
    const wrapped = new AtomWithMargin(inner, 3, 0);
    wrapped.drawU(new RecordingUGraphic(new UTranslate(11, 2)));
    expect(inner.drawnAt[0]).toEqual(new UTranslate(11, 5));
  });
});
