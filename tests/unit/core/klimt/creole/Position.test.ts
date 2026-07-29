/**
 * Position.test.ts — T8: unit coverage for `Position`
 * (klimt/creole/Position.java), the resolved (x, y, dim) box `Sea` (`Sea.ts`)
 * assigns each `CreoleAtom`.
 */
import { describe, expect, it } from 'vitest';
import { Position } from '../../../../../src/core/klimt/creole/Position.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { MinMax } from '../../../../../src/core/klimt/geom/MinMax.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';

/** Records the `UChange` it was `apply`d with -- enough to assert
 *  `translate`/`translateY`/etc. compose the right `UTranslate`. */
function recordingUGraphic(applied: UChange[]): UGraphic {
  const ug: UGraphic = {
    apply: (change: UChange): UGraphic => {
      applied.push(change);
      return ug;
    },
    draw: () => undefined,
    getParam: () => {
      throw new Error('not needed');
    },
    getTranslate: () => UTranslate.none(),
    getStringBounder: () => {
      throw new Error('not needed');
    },
  };
  return ug;
}

describe('Position', () => {
  it('getMinY/getMaxY/getHeight/getWidth read off the constructor y and dim', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    expect(pos.getMinY()).toBe(7);
    expect(pos.getMaxY()).toBe(11);
    expect(pos.getHeight()).toBe(4);
    expect(pos.getWidth()).toBe(10);
  });

  it('align(height) translates by (height - dim.height) (Java:68-71)', () => {
    const pos = new Position(0, 0, new XDimension2D(10, 4));
    const aligned = pos.align(10);
    expect(aligned.getMinY()).toBe(6); // dy = 10 - 4 = 6
    expect(pos.getMinY()).toBe(0); // original untouched
  });

  it('translateY returns a new Position shifted in y, x/dim unchanged', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    const shifted = pos.translateY(5);
    expect(shifted).not.toBe(pos);
    expect(shifted.getMinY()).toBe(12);
    expect(shifted.getWidth()).toBe(10);
  });

  it('translateX returns a new Position shifted in x, y/dim unchanged', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    const shifted = pos.translateX(5);
    expect(shifted).not.toBe(pos);
    expect(shifted.getMinY()).toBe(7);
    expect(shifted.getTranslate()).toEqual(new UTranslate(8, 7));
  });

  it('getTranslate returns a UTranslate(x, y)', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    expect(pos.getTranslate()).toEqual(new UTranslate(3, 7));
  });

  it('translate applies UTranslate(x, y) to the given UGraphic', () => {
    const applied: UChange[] = [];
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    pos.translate(recordingUGraphic(applied));
    expect(applied).toEqual([new UTranslate(3, 7)]);
  });

  it('update folds (x + width, y + height) into a MinMax accumulator', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    const result = pos.update(MinMax.getEmpty(true));
    expect(result.getMaxX()).toBe(13);
    expect(result.getMaxY()).toBe(11);
  });

  it('toString matches upstream "x=X y=Y dim=DIM" format', () => {
    const pos = new Position(3, 7, new XDimension2D(10, 4));
    expect(pos.toString()).toBe('x=3 y=7 dim=[10,4]');
  });
});
