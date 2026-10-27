import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { Fraction } from '../../../../src/diagrams/gantt/ngm/math/Fraction.js';

describe('Load', () => {
  it('of(...).toSeconds() is duration seconds over 1 (Load.java:101-103)', () => {
    const f = Load.of(Duration.ofHours(8)).toSeconds();
    expect(f.getNumerator()).toBe(28_800);
    expect(f.getDenominator()).toBe(1);
  });

  it('toSeconds truncates sub-second millis toward zero (toMillis()/1000L)', () => {
    expect(Load.of(Duration.ofSeconds(2, 999_000_000)).toSeconds().equals(Fraction.of(2))).toBe(true);
  });

  it('zero() is PT0S and zero seconds (Load.java:97-99)', () => {
    expect(Load.zero().toString()).toBe('PT0S');
    expect(Load.zero().toSeconds().isZero()).toBe(true);
  });

  it('rejects negative effort (Load.java:78-80)', () => {
    expect(() => Load.of(Duration.ofSeconds(-5))).toThrow('Effort cannot be negative: PT-5S');
  });

  it('equals/toString (Load.java:106-118)', () => {
    const a = Load.of(Duration.ofHours(1));
    expect(a.equals(a)).toBe(true);
    expect(a.equals(Load.of(Duration.ofSeconds(3600)))).toBe(true);
    expect(a.equals(Load.of(Duration.ofHours(2)))).toBe(false);
    expect(a.equals('PT1H')).toBe(false);
    expect(a.toString()).toBe('PT1H');
  });
});
