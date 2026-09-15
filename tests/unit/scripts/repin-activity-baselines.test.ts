/**
 * Unit tests for `scripts/repin-activity-baselines.ts`'s pure functions
 * (mission `activity-lane-capture`, T0b). The render/measure/CLI/write path
 * is exercised by the manual acceptance runs documented in the task's own
 * return report, not by a fixture-corpus- or filesystem-dependent test here
 * -- mirrors `rebaseline-svg-goldens.test.ts`'s own split between
 * pure-function unit tests and a manual full-corpus run.
 */
import { describe, it, expect } from 'vitest';
import {
  classifyChange,
  plannedWrites,
  unacceptedRises,
  formatRiseLine,
  censusChanged,
  formatChangedLine,
  type PlannedWrite,
} from '../../../scripts/repin-activity-baselines.js';

describe('classifyChange', () => {
  it('is "rose" when the measured value exceeds the pin', () => {
    expect(classifyChange(5, 7)).toBe('rose');
  });

  it('is "fell" when the measured value is below the pin', () => {
    expect(classifyChange(7, 5)).toBe('fell');
  });

  it('is "same" when nothing moved', () => {
    expect(classifyChange(5, 5)).toBe('same');
  });
});

describe('plannedWrites', () => {
  it('reports a rise and a fall, omitting the slug that held steady (AC2 setup)', () => {
    const writes = plannedWrites({ a: 5, b: 5, c: 5 }, { a: 7, b: 3, c: 5 });
    expect(writes).toEqual([
      { slug: 'a', classification: 'rose', oldValue: 5, newValue: 7 },
      { slug: 'b', classification: 'fell', oldValue: 5, newValue: 3 },
    ]);
  });

  it('is empty when the unchanged tree measures identically to its pin (AC1)', () => {
    expect(plannedWrites({ a: 5, b: 12 }, { a: 5, b: 12 })).toEqual([]);
  });

  it('skips a slug missing from the measured side rather than treating it as a move', () => {
    expect(plannedWrites({ a: 5, b: 5 }, { a: 5 })).toEqual([]);
  });
});

describe('unacceptedRises', () => {
  const rose: PlannedWrite = { slug: 'a', classification: 'rose', oldValue: 5, newValue: 7 };
  const fell: PlannedWrite = { slug: 'b', classification: 'fell', oldValue: 7, newValue: 5 };

  it('a synthetic rise is refused with no acceptance set (AC2)', () => {
    expect(unacceptedRises([rose], new Set())).toEqual([rose]);
  });

  it('naming the slug in --accept-rises clears it (AC2)', () => {
    expect(unacceptedRises([rose], new Set(['a']))).toEqual([]);
  });

  it('never flags a fall as a rise needing acceptance', () => {
    expect(unacceptedRises([fell], new Set())).toEqual([]);
  });

  it('accepting an unrelated slug does not clear the real rise', () => {
    expect(unacceptedRises([rose], new Set(['z']))).toEqual([rose]);
  });
});

describe('formatRiseLine', () => {
  it('matches the exact interface contract: ROSE <file> <slug> <old>→<new>', () => {
    const w: PlannedWrite = { slug: 'jevoce-05-mumi686', classification: 'rose', oldValue: 369, newValue: 599 };
    expect(formatRiseLine('diff-baseline', w)).toBe('ROSE diff-baseline jevoce-05-mumi686 369→599');
  });
});

describe('censusChanged', () => {
  it('is false for two deep-equal objects in different key order', () => {
    expect(censusChanged({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(false);
  });

  it('is true when a nested value differs', () => {
    expect(censusChanged({ fontSize: { '12': 2 } }, { fontSize: { '12': 3 } })).toBe(true);
  });

  it('is true when one side is undefined and the other is not', () => {
    expect(censusChanged(undefined, { a: 1 })).toBe(true);
  });

  it('is false for two undefined sides', () => {
    expect(censusChanged(undefined, undefined)).toBe(false);
  });
});

describe('formatChangedLine', () => {
  it('matches the exact interface contract: CHANGED <file> <slug>', () => {
    expect(formatChangedLine('style-baseline', 'bixefi-77-moki051', false)).toBe(
      'CHANGED style-baseline bixefi-77-moki051',
    );
  });

  it('appends " in-subset" when the slug is in the --slugs-file selection', () => {
    expect(formatChangedLine('style-baseline', 'bixefi-77-moki051', true)).toBe(
      'CHANGED style-baseline bixefi-77-moki051 in-subset',
    );
  });
});
