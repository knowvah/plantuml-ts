import { describe, expect, it } from 'vitest';
import { USegmentType } from '../../../../src/core/klimt/shape/UPath.js';
import { PathUtils } from '../../../../src/diagrams/gantt/draw/PathUtils.js';

const M = USegmentType.SEG_MOVETO;
const L = USegmentType.SEG_LINETO;
const A = USegmentType.SEG_ARCTO;
const segs = (p: Iterable<{ segmentType: string; coord: readonly number[] }>) =>
  [...p].map((s) => [s.segmentType, ...s.coord]);

describe('PathUtils', () => {
  it('UtoRight round 0 (PathUtils.java:45-49)', () => {
    expect(segs(PathUtils.UtoRight(10, 4, 0).iterator())).toEqual([
      [M, 0, 0],
      [L, 10, 0],
      [L, 10, 4],
      [L, 0, 4],
    ]);
  });

  it('UtoRight rounded (PathUtils.java:51-57)', () => {
    expect(segs(PathUtils.UtoRight(10, 8, 4).iterator())).toEqual([
      [M, 0, 0],
      [L, 8, 0],
      [A, 2, 2, 0, 0, 1, 10, 2],
      [L, 10, 6],
      [A, 2, 2, 0, 0, 1, 8, 8],
      [L, 0, 8],
    ]);
  });

  it('UtoLeft round 0 (PathUtils.java:64-68)', () => {
    expect(segs(PathUtils.UtoLeft(10, 4, 0).iterator())).toEqual([
      [M, 10, 4],
      [L, 0, 4],
      [L, 0, 0],
      [L, 10, 0],
    ]);
  });

  it('UtoLeft rounded (PathUtils.java:70-77)', () => {
    expect(segs(PathUtils.UtoLeft(10, 8, 4).iterator())).toEqual([
      [M, 10, 8],
      [L, 2, 8],
      [A, 2, 2, 0, 0, 1, 0, 6],
      [L, 0, 2],
      [A, 2, 2, 0, 0, 1, 2, 0],
      [L, 10, 0],
    ]);
  });
});
