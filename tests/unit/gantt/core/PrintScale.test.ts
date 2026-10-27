import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/PrintScale.java:35-67
describe('PrintScale', () => {
  it.each([
    [PrintScale.DAILY, 'DAILY', 0, 1],
    [PrintScale.WEEKLY, 'WEEKLY', 1, 1 / 4],
    [PrintScale.MONTHLY, 'MONTHLY', 2, 1 / 15],
    [PrintScale.QUARTERLY, 'QUARTERLY', 3, 1 / 40],
    [PrintScale.YEARLY, 'YEARLY', 4, 1 / 60],
  ])('%s default scale is 1/compress (java:36,40-46)', (scale, name, ordinal, defaultScale) => {
    expect(scale.name()).toBe(name);
    expect(scale.ordinal()).toBe(ordinal);
    expect(scale.getDefaultScale()).toBe(defaultScale);
    expect(String(scale)).toBe(name);
  });

  it('values() is in ordinal order', () => {
    expect(PrintScale.values().map((s) => s.name())).toEqual(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
  });

  it.each([
    ['weekly', PrintScale.WEEKLY],
    ['w', PrintScale.WEEKLY],
    ['monthly', PrintScale.MONTHLY],
    ['m', PrintScale.MONTHLY],
    ['quarterly', PrintScale.QUARTERLY],
    ['q', PrintScale.QUARTERLY],
    ['yearly', PrintScale.YEARLY],
    ['y', PrintScale.YEARLY],
    ['daily', PrintScale.DAILY],
    ['', PrintScale.DAILY],
    ['Weekly', PrintScale.DAILY],
    ['zoom', PrintScale.DAILY],
  ])('fromString(%j) (java:48-65: lower-case prefix, else DAILY)', (value, expected) => {
    expect(PrintScale.fromString(value)).toBe(expected);
  });
});
