import { describe, expect, it } from 'vitest';
import {
  castAbstractReal,
  ClassCastException,
  IllegalArgumentException,
  IllegalStateException,
  javaDoubleToString,
  UnsupportedOperationException,
} from '../../../../src/core/real/AbstractReal.js';
import type { AbstractReal } from '../../../../src/core/real/AbstractReal.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import type { Real } from '../../../../src/core/real/Real.js';

// AbstractReal.java:38-67 and the JDK helpers that live beside it.
describe('AbstractReal', () => {
  it('registers itself with the line and reports the line extremes', () => {
    const origin = RealUtils.createOrigin();
    const x = origin.addAtLeast(10);
    origin.addAtLeast(3);
    origin.compileNow();
    // RealLine.java:93-106: min/max over every registered Real, seeded with 0.
    expect((x as AbstractReal).getMaxAbsolute().getCurrentValue()).toBe(10);
    expect((x as AbstractReal).getMinAbsolute().getCurrentValue()).toBe(0);
    expect(castAbstractReal(x)).toBe(x);
    expect(castAbstractReal(x).getLine()).toBe(castAbstractReal(origin).getLine());
  });

  it('castAbstractReal throws where the Java cast does', () => {
    const foreign: Real = {
      printCreationStackTrace: () => undefined,
      getName: () => 'foreign',
      getCurrentValue: () => 1,
      addFixed: () => foreign,
      addAtLeast: () => foreign,
      ensureBiggerThan: () => undefined,
    };
    expect(() => castAbstractReal(foreign)).toThrow(ClassCastException);
    expect(() => castAbstractReal(foreign)).toThrow('foreign cannot be cast to AbstractReal');
  });

  it('the exception classes carry their Java names', () => {
    expect(new IllegalStateException('m').name).toBe('IllegalStateException');
    expect(new IllegalArgumentException().name).toBe('IllegalArgumentException');
    expect(new UnsupportedOperationException().name).toBe('UnsupportedOperationException');
    expect(new ClassCastException().name).toBe('ClassCastException');
    expect(new IllegalStateException('m').message).toBe('m');
  });
});

describe('javaDoubleToString (Double.toString)', () => {
  it.each([
    [0, '0.0'],
    [-0, '-0.0'],
    [3, '3.0'],
    [-5, '-5.0'],
    [10.5, '10.5'],
    [0.001, '0.001'],
    [0.00012, '1.2E-4'],
    [0.0123, '0.0123'],
    [1234567, '1234567.0'],
    [9999999.5, '9999999.5'],
    [1e7, '1.0E7'],
    [12345678, '1.2345678E7'],
    [-1.5e-7, '-1.5E-7'],
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'Infinity'],
    [Number.NEGATIVE_INFINITY, '-Infinity'],
  ])('%s -> %s', (value, expected) => {
    expect(javaDoubleToString(value)).toBe(expected);
  });
});
