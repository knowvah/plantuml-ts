/**
 * Unit tests for `scripts/measure-state-size-deltas.ts`'s pure comparator
 * arithmetic (G8/T1). Only `classifyDelta`/`summarize` are exercised here —
 * the fixture-rendering/comparison plumbing (renderSync, renderFixtureState,
 * compareStructural, compareSvg) is exercised by the real harness run and by
 * the pre-existing `state-dot-parity.test.ts` /
 * `state.golden.ratchet.test.ts` suites it reuses.
 */
import { describe, it, expect } from 'vitest';
import {
  classifyDelta,
  summarize,
  DELTA_EPSILON,
  type DeltaResult,
} from '../../../scripts/measure-state-size-deltas.js';

describe('classifyDelta', () => {
  it('classifies an exact match as unchanged', () => {
    expect(classifyDelta(0.05, 0.05)).toBe('unchanged');
  });

  it('classifies a larger delta than allowed as widened', () => {
    expect(classifyDelta(0.1, 0.05)).toBe('widened');
  });

  it('classifies a smaller delta than allowed as improved', () => {
    expect(classifyDelta(0.02, 0.05)).toBe('improved');
  });

  it('treats a delta within +epsilon of allowed as unchanged, not widened', () => {
    expect(classifyDelta(0.05 + DELTA_EPSILON / 2, 0.05)).toBe('unchanged');
  });

  it('treats a delta within -epsilon of allowed as unchanged, not improved', () => {
    expect(classifyDelta(0.05 - DELTA_EPSILON / 2, 0.05)).toBe('unchanged');
  });

  it('classifies a delta just past +epsilon as widened', () => {
    expect(classifyDelta(0.05 + DELTA_EPSILON * 2, 0.05)).toBe('widened');
  });

  it('classifies a delta just past -epsilon as improved', () => {
    expect(classifyDelta(0.05 - DELTA_EPSILON * 2, 0.05)).toBe('improved');
  });

  it('handles a zero-allowed (pin) baseline: any positive diff count widens', () => {
    expect(classifyDelta(1, 0)).toBe('widened');
    expect(classifyDelta(0, 0)).toBe('unchanged');
  });
});

describe('summarize', () => {
  function result(status: DeltaResult['status'], slug = 's'): DeltaResult {
    return { slug, kind: 'backlog', delta: 0, allowed: 0, status };
  }

  it('counts an empty result set as all zeros', () => {
    expect(summarize([])).toEqual({ total: 0, widened: 0, improved: 0, unchanged: 0 });
  });

  it('tallies each status bucket independently', () => {
    const results = [
      result('widened', 'a'),
      result('widened', 'b'),
      result('improved', 'c'),
      result('unchanged', 'd'),
      result('unchanged', 'e'),
      result('unchanged', 'f'),
    ];
    expect(summarize(results)).toEqual({ total: 6, widened: 2, improved: 1, unchanged: 3 });
  });
});
