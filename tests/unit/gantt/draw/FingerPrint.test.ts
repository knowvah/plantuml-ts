import { describe, expect, it } from 'vitest';
import { FingerPrint } from '../../../../src/diagrams/gantt/draw/FingerPrint.js';

describe('FingerPrint', () => {
  it('toString prints Java doubles (FingerPrint.java:53-55)', () => {
    expect(new FingerPrint(1, 2, 3, 4).toString()).toBe('X=(1.0->4.0) Y=(2.0 ->6.0)');
    expect(new FingerPrint(0.5, 1.25, 1, 1).toString()).toBe('X=(0.5->1.5) Y=(1.25 ->2.25)');
  });

  it('overlap returns y + height - other.y when boxes intersect (:57-67)', () => {
    const a = new FingerPrint(0, 0, 10, 10);
    const b = new FingerPrint(5, 4, 10, 10);
    expect(a.overlap(b)).toBe(6);
    expect(b.overlap(a)).toBe(14 - 0);
  });

  it('overlap is 0 when separated in x or y, and on touching edges', () => {
    const a = new FingerPrint(0, 0, 10, 10);
    expect(a.overlap(new FingerPrint(10, 0, 5, 5))).toBe(0);
    expect(a.overlap(new FingerPrint(-5, 0, 5, 5))).toBe(0);
    expect(a.overlap(new FingerPrint(0, 10, 5, 5))).toBe(0);
    expect(a.overlap(new FingerPrint(0, -5, 5, 5))).toBe(0);
  });
});
