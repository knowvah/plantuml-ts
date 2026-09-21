/**
 * Unit tests for scripts/lib/assert-json-shape.ts (code-review-tasks.md
 * item 5 — minimal shape checks at CI-gate / re-pin JSON.parse boundaries).
 */
import { describe, it, expect } from 'vitest';
import { assertJsonObjectShape, assertJsonArrayShape } from '../../../scripts/lib/assert-json-shape.js';

describe('assertJsonObjectShape', () => {
  it('does not throw for an object carrying every required key', () => {
    const value: unknown = { fixtures: [1, 2, 3], $comment: 'x' };
    assertJsonObjectShape(value, 'baseline.json', ['fixtures', '$comment']);
    expect((value as { fixtures: number[] }).fixtures).toEqual([1, 2, 3]);
  });

  it('throws naming the file and the missing key', () => {
    const value: unknown = { fixtures: [] };
    expect(() =>
      assertJsonObjectShape(value, 'oracle/goldens/svg-sequence/diff-baseline.json', ['fixtures', '$comment']),
    ).toThrow('oracle/goldens/svg-sequence/diff-baseline.json: JSON object is missing required key(s): $comment');
  });

  it('throws naming the file when the value is an array, not an object', () => {
    expect(() => assertJsonObjectShape([1, 2], 'parity.json', ['fixtures'])).toThrow(
      'parity.json: expected a JSON object, got an array (length 2)',
    );
  });

  it('throws naming the file when the value is null', () => {
    expect(() => assertJsonObjectShape(null, 'parity.json', ['fixtures'])).toThrow(
      'parity.json: expected a JSON object, got null',
    );
  });
});

describe('assertJsonArrayShape', () => {
  it('passes through an array', () => {
    const value: unknown = [{ slug: 'a' }, { slug: 'b' }];
    assertJsonArrayShape(value, 'tests/visual/data/sequence.json');
    expect(value.length).toBe(2);
  });

  it('throws naming the file when the value is not an array', () => {
    expect(() => assertJsonArrayShape({ fixtures: [] }, 'tests/visual/data/sequence.json')).toThrow(
      'tests/visual/data/sequence.json: expected a JSON array, got object',
    );
  });
});
