import { describe, expect, it } from 'vitest';
import { Segment } from '../../../../../src/core/sequencediagram/graphic/Segment.js';

// Expected values: Segment.java (sequencediagram/graphic), line refs per case.
const pairs = (segments: readonly Segment[]): number[][] => segments.map((s) => [s.getPos1(), s.getPos2()]);

describe('Segment', () => {
  it('rejects pos2 < pos1 (java:51-57)', () => {
    expect(() => new Segment(5, 4)).toThrow('IllegalArgumentException');
    expect(new Segment(5, 5).getLength()).toBe(0);
  });

  it('exposes pos1, pos2 and length (java:83-93)', () => {
    const s = new Segment(2, 7.5);
    expect([s.getPos1(), s.getPos2(), s.getLength()]).toEqual([2, 7.5, 5.5]);
  });

  it('equals compares both ends; a non-Segment is a ClassCastException (java:59-63)', () => {
    expect(new Segment(1, 2).equals(new Segment(1, 2))).toBe(true);
    expect(new Segment(1, 2).equals(new Segment(1, 3))).toBe(false);
    expect(() => new Segment(1, 2).equals('x')).toThrow('ClassCastException');
  });

  it('hashCode is the sum of Double.hashCode (java:65-68)', () => {
    // Double.hashCode(1.0): bits 0x3FF0000000000000 -> 0x3FF00000; (2.0): 0x40000000.
    expect(new Segment(1, 2).hashCode()).toBe(0x3ff00000 + 0x40000000);
    // 0.0 hashes to 0.
    expect(new Segment(0, 0).hashCode()).toBe(0);
  });

  it('contains a point (inclusive) and a segment (java:70-76)', () => {
    const s = new Segment(10, 20);
    expect([s.contains(10), s.contains(20), s.contains(9.9), s.contains(20.1)]).toEqual([true, true, false, false]);
    expect(s.contains(new Segment(12, 18))).toBe(true);
    expect(s.contains(new Segment(5, 15))).toBe(false);
  });

  it('toString prints Java doubles (java:78-81)', () => {
    expect(new Segment(1, 2.5).toString()).toBe('1.0 - 2.5');
  });

  it('merge spans both (java:95-97)', () => {
    expect(pairs([new Segment(3, 5).merge(new Segment(1, 4))])).toEqual([[1, 5]]);
  });

  describe('cutSegmentIfNeed (java:99-127)', () => {
    const seg = new Segment(0, 100);

    it('no delays returns the whole segment', () => {
      expect(pairs(seg.cutSegmentIfNeed([]))).toEqual([[0, 100]]);
    });

    it('cuts out contained delays, sorted by pos1 (java:129-133)', () => {
      const cut = seg.cutSegmentIfNeed([new Segment(60, 70), new Segment(20, 30)]);
      expect(pairs(cut)).toEqual([
        [0, 20],
        [30, 60],
        [70, 100],
      ]);
    });

    it('a delay starting at the pending start only advances it (java:104-107)', () => {
      expect(pairs(seg.cutSegmentIfNeed([new Segment(0, 10)]))).toEqual([[10, 100]]);
      expect(pairs(seg.cutSegmentIfNeed([new Segment(0.0005, 10)]))).toEqual([[10, 100]]);
    });

    it('a delay before the pending start is skipped (java:108-109)', () => {
      expect(pairs(seg.cutSegmentIfNeed([new Segment(0, 50), new Segment(20, 30)]))).toEqual([[50, 100]]);
    });

    it('a delay past the end stops the scan (java:111-116)', () => {
      expect(pairs(seg.cutSegmentIfNeed([new Segment(150, 160), new Segment(20, 30)]))).toEqual([
        [0, 20],
        [30, 100],
      ]);
      expect(pairs(seg.cutSegmentIfNeed([new Segment(0, 100), new Segment(150, 160)]))).toEqual([]);
    });

    it('a delay straddling the end is not contained and is ignored (java:117-122)', () => {
      expect(pairs(seg.cutSegmentIfNeed([new Segment(90, 120)]))).toEqual([[0, 100]]);
    });

    it('a delay ending the segment leaves nothing pending (java:124-125)', () => {
      expect(pairs(seg.cutSegmentIfNeed([new Segment(50, 100)]))).toEqual([[0, 50]]);
    });
  });
});
