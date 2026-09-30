/** ValueNull — the absent-value singleton (`style/ValueNull.java`). */
import { describe, expect, it } from 'vitest';
import { ValueNull } from '../../../../src/core/style/ValueNull.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { TestHColor, TestHColorSet } from './helpers/hcolor-set.js';

describe('ValueNull.NULL', () => {
  const v = ValueNull.NULL;

  it('reads as zero/false/empty (ValueNull.java:51-79)', () => {
    expect([v.asInt(), v.asIntButMinusOneIfError(), v.asDouble(), v.asBoolean(), v.asString()]).toEqual([
      0,
      0,
      0,
      false,
      '',
    ]);
  });

  it('asDoubleDefaultTo returns the default (java:66-69)', () => {
    expect(v.asDoubleDefaultTo(12.5)).toBe(12.5);
  });

  it('asFontFace is normal, asHorizontalAlignment is LEFT (java:81-94)', () => {
    expect(v.asFontFace()).toEqual({ cssWeight: 400, italic: false });
    expect(v.asHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
  });

  it('asColor is HColors.BLACK = getColorOrWhite("#000000") (java:86-89, HColors.java:86)', () => {
    const set = new TestHColorSet();
    expect(v.asColor(set)).toEqual(new TestHColor({ r: 0, g: 0, b: 0, a: 255 }));
    expect(set.requested).toEqual(['#000000']);
  });

  it('getPriority is inherited from ValueAbstract and throws (ValueAbstract.java:82-84)', () => {
    expect(() => v.getPriority()).toThrow('UnsupportedOperationException');
  });
});
