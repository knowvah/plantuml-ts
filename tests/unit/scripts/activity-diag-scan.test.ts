/**
 * Unit tests for `scripts/activity-diag-scan.ts`'s pure segment filter
 * (mission `activity-loop-tile-port`, T0). The render/CLI path is exercised
 * by the manual full-corpus run recorded in the mission's decision journal,
 * mirroring `activity-probe.test.ts`'s split.
 */
import { describe, it, expect } from 'vitest';
import { diagonalSegments, DIAGONAL_TOLERANCE_PX } from '../../../scripts/activity-diag-scan.js';

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#181818"/>`;
}

const VERTICAL = line(10, 0, 10, 40);
const HORIZONTAL = line(0, 20, 60, 20);
const DIAGONAL = line(10, 0, 40, 30);

describe('diagonalSegments', () => {
  it('returns nothing for axis-aligned lines', () => {
    expect(diagonalSegments(`<svg>${VERTICAL}${HORIZONTAL}</svg>`)).toEqual([]);
  });

  it('returns a real diagonal as (x1,y1)->(x2,y2)', () => {
    expect(diagonalSegments(`<svg>${VERTICAL}${DIAGONAL}</svg>`)).toEqual(['(10,0)->(40,30)']);
  });

  it('does not count a dx at rounding-noise scale', () => {
    // awrl-T3: `firibi-00-puki721` carries a 0.001 px dx from rounding.
    const nearVertical = line(10, 0, 10.001, 40);
    expect(diagonalSegments(`<svg>${nearVertical}</svg>`)).toEqual([]);
    expect(DIAGONAL_TOLERANCE_PX).toBeGreaterThan(0.001);
  });

  it('pairs out a kill/end cross: two 45-degree lines sharing one bounding box', () => {
    const arm1 = line(100, 100, 110, 110);
    const arm2 = line(100, 110, 110, 100);
    expect(diagonalSegments(`<svg>${arm1}${arm2}</svg>`)).toEqual([]);
  });

  it('keeps a diagonal that shares no box with another', () => {
    const arm1 = line(100, 100, 110, 110);
    const arm2 = line(100, 110, 110, 100);
    expect(diagonalSegments(`<svg>${arm1}${arm2}${DIAGONAL}</svg>`)).toEqual(['(10,0)->(40,30)']);
  });

  it('keeps three lines in one box (only an exact pair is a cross)', () => {
    const arm1 = line(100, 100, 110, 110);
    const arm2 = line(100, 110, 110, 100);
    const arm3 = line(110, 110, 100, 100);
    expect(diagonalSegments(`<svg>${arm1}${arm2}${arm3}</svg>`)).toHaveLength(3);
  });

  it('reads attributes in any order and ignores other elements', () => {
    const svg =
      '<svg><rect x="1" y="2" width="3" height="4"/><line stroke="#000" y2="30" x2="40" y1="0" x1="10"/></svg>';
    expect(diagonalSegments(svg)).toEqual(['(10,0)->(40,30)']);
  });
});
