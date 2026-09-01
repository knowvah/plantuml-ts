/**
 * Unit tests for `scripts/sequence-distance-concentration.ts`.
 *
 * The guard exists because a headline number was published that one fixture
 * had written. `zudize-61-vomi445` is 45 512 lines long and supplied 94% of a
 * reported element deficit; the figure survived into a document before anyone
 * divided by fixture. These tests pin the one behaviour that would have caught
 * it: a total whose largest contributor exceeds the threshold reports itself
 * as a statement about that fixture.
 */
import { describe, it, expect } from 'vitest';

import {
  CONCENTRATION_ALARM,
  concentrationOf,
  formatConcentration,
} from '../../../scripts/sequence-distance-concentration.js';
import { summarize, type FixtureDistance } from '../../../scripts/sequence-geometry-distance.js';

function fx(slug: string, distance: number | null): FixtureDistance {
  return { slug, distance, numericCount: distance === null ? null : 1, descended: true, byAttribute: {} };
}

describe('concentrationOf', () => {
  it('names the heaviest fixture and its share', () => {
    const c = concentrationOf(summarize([fx('a', 30), fx('b', 70)]));
    expect(c.top?.slug).toBe('b');
    expect(c.top?.share).toBeCloseTo(0.7, 6);
  });

  it('raises the alarm when one fixture holds more than the threshold', () => {
    // The zudize case, in miniature: one fixture, almost all of the total.
    const c = concentrationOf(summarize([fx('normal', 6), fx('zudize', 94)]));
    expect(c.dominated).toBe(true);
    expect(c.top?.share).toBeGreaterThan(CONCENTRATION_ALARM);
  });

  it('stays quiet on an evenly spread corpus', () => {
    const spread = Array.from({ length: 50 }, (_, i) => fx(`f${String(i)}`, 10));
    expect(concentrationOf(summarize(spread)).dominated).toBe(false);
  });

  it('reports the heaviest ten, which is what a skewed corpus shows', () => {
    const rows = [...Array.from({ length: 10 }, (_, i) => fx(`heavy${String(i)}`, 10)),
                  ...Array.from({ length: 100 }, (_, i) => fx(`light${String(i)}`, 1))];
    const c = concentrationOf(summarize(rows));
    expect(c.top10Share).toBeCloseTo(100 / 200, 6);
  });

  it('is empty rather than dividing by zero on an exact corpus', () => {
    const c = concentrationOf(summarize([fx('a', 0), fx('b', 0)]));
    expect(c.top).toBeNull();
    expect(c.dominated).toBe(false);
  });

  it('ignores errored fixtures rather than counting them as zero', () => {
    const c = concentrationOf(summarize([fx('ok', 50), fx('broken', null)]));
    expect(c.top?.slug).toBe('ok');
    expect(c.top?.share).toBeCloseTo(1, 6);
  });
});

describe('formatConcentration', () => {
  it('spells out that a dominated total is about the fixture, not the corpus', () => {
    const text = formatConcentration(summarize([fx('normal', 6), fx('zudize', 94)]));
    expect(text).toContain('zudize');
    expect(text).toContain('ONE FIXTURE HOLDS OVER');
    expect(text).toContain('not about the corpus');
  });

  it('prints the line without an alarm when nothing dominates', () => {
    const spread = Array.from({ length: 50 }, (_, i) => fx(`f${String(i)}`, 10));
    const text = formatConcentration(summarize(spread));
    expect(text).toContain('concentration:');
    expect(text).not.toContain('ONE FIXTURE');
  });

  it('says so when nothing was measured', () => {
    expect(formatConcentration(summarize([]))).toBe('concentration: nothing measured.');
  });
});
