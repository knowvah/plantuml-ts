import { describe, expect, it } from 'vitest';
import {
  TimeResolution,
  toUbrexA_DD_MONTH_YYYY,
  toUbrexB_YYYY_MM_DD,
  toUbrexC_MONTH_DD_YYYY,
} from '../../../../src/diagrams/gantt/lang/TimeResolution.js';

describe('TimeResolution', () => {
  it('A: DD <non-month> MONTH <non-digit> YYYY (TimeResolution.java:47-58)', () => {
    const m = toUbrexA_DD_MONTH_YYYY('y', 'm', 'd').match('15 March 2020');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('d')).toBe('15');
    expect(m.findFirstValueByKey('m')).toBe('March');
    expect(m.findFirstValueByKey('y')).toBe('2020');
  });

  it('B: YYYY MM DD separated by non-digits (TimeResolution.java:60-72)', () => {
    const m = toUbrexB_YYYY_MM_DD('y', 'm', 'd').match('2020/3-9');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('y')).toBe('2020');
    expect(m.findFirstValueByKey('m')).toBe('3');
    expect(m.findFirstValueByKey('d')).toBe('9');
  });

  it('C: MONTH DD YYYY (TimeResolution.java:74-87)', () => {
    const m = toUbrexC_MONTH_DD_YYYY('y', 'm', 'd').match('dec 25, 2021');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('m')).toBe('dec');
    expect(m.findFirstValueByKey('d')).toBe('25');
    expect(m.findFirstValueByKey('y')).toBe('2021');
  });

  it('B rejects a letter in the year', () => {
    expect(toUbrexB_YYYY_MM_DD('y', 'm', 'd').match('20x0/3/9').exactMatch()).toBe(false);
  });

  it('namespace object exposes the builders', () => {
    expect(TimeResolution.toUbrexB_YYYY_MM_DD).toBe(toUbrexB_YYYY_MM_DD);
    expect(TimeResolution.toUbrexA_DD_MONTH_YYYY).toBe(toUbrexA_DD_MONTH_YYYY);
    expect(TimeResolution.toUbrexC_MONTH_DD_YYYY).toBe(toUbrexC_MONTH_DD_YYYY);
  });
});
