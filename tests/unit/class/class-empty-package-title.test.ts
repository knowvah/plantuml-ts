/**
 * isw-T2-cls (the S* question): is an EMPTY package label Java `null` (0-wide,
 * no title table) or an empty Display (one " " atom)? One-JVM jar probe
 * (tests/fixtures/isw-T2-cls/empty-package-title.{puml,svg,dot}):
 * `package "" as p` and `package " " as q` BOTH get a title table
 * (`WIDTH="3" HEIGHT="9"`) and a 20px folder tab ending at x = 9.85 + 6 wide,
 * so `ClusterHeader#getTitleBlock` (`label == null` only, java:116-118) never
 * returns the empty block here and `USymbolFolder#getWTitle/#getHTitle`
 * (java:127-143) take the width > 0 branch.
 */
import { describe, expect, it } from 'vitest';
import { getHTitle, getWTitle } from '../../../src/diagrams/class/class-namespace-shape.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { diffsAgainstJar } from '../../helpers/isw-t2-cls-fixture.js';

const measurer = new DeterministicMeasurer();

describe('empty package label is one " " atom (jar probe)', () => {
  it('draws exactly the jar svg for "" and " " packages', () => {
    expect(diffsAgainstJar('empty-package-title')).toEqual([]);
  });
  it('getWTitle("") = 3.85 + 6 (jar path: L13.35 = 6 + 9.85 - 2.5)', () => {
    expect(getWTitle(measurer, defaultTheme, '', 200)).toBeCloseTo(9.85, 3);
  });
  it('getHTitle("") = 20 (jar path: tab bottom y 26 from top y 6)', () => {
    expect(getHTitle(measurer, defaultTheme, '')).toBe(20);
  });
});
