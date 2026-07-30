/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java
 */
import { describe, expect, it } from 'vitest';
import { parseSvgPath } from '../../../../../src/core/klimt/sprite/SvgPath.js';
import { pathBBox } from '../../../../../src/core/klimt/sprite/svg-path-bbox.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { USegmentType } from '../../../../../src/core/klimt/shape/UPath.js';

const NONE = UTranslate.none();

describe('parseSvgPath -- bbox equivalence with pathBBox (acceptance criterion 1)', () => {
  it('matches pathBBox exactly for the bi-globe sprite d attribute', () => {
    // Verbatim from assets/stdlib/bootstrap1.12.1/bootstrap.puml `sprite bi-globe`.
    const d =
      'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z';
    const path = parseSvgPath(d, NONE);
    const box = pathBBox(d);
    expect(box).toBeDefined();
    expect(path.getMinX()).toBeCloseTo(box!.minX, 9);
    expect(path.getMaxX()).toBeCloseTo(box!.maxX, 9);
    expect(path.getMinY()).toBeCloseTo(box!.minY, 9);
    expect(path.getMaxY()).toBeCloseTo(box!.maxY, 9);
  });
});

describe('parseSvgPath -- arc endpoint-only minmax (acceptance criterion 2)', () => {
  it('ignores the arc bulge; only rx/ry-independent endpoint enters the box', () => {
    // A large-bulge semicircle from (0,0) to (10,0): a true-extrema box would
    // include y=-5 (or +5) for the bulge. UPath's SEG_ARCTO rule records only
    // the endpoint, so the box must be flat.
    const path = parseSvgPath('M0 0 A5 5 0 0 1 10 0', NONE);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(10);
    expect(path.getMinY()).toBe(0);
    expect(path.getMaxY()).toBe(0);
  });

  it('absolutizes a relative arc endpoint while leaving radii/flags untouched', () => {
    const path = parseSvgPath('M2 3 a4 4 0 0 1 6 0', NONE);
    const segs = Array.from(path.iterator());
    const arc = segs.find((s) => s.segmentType === USegmentType.SEG_ARCTO);
    expect(arc).toBeDefined();
    // coord = [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y]
    expect(arc!.coord).toEqual([4, 4, 0, 0, 1, 8, 3]);
  });
});

describe('parseSvgPath -- H/V shorthand normalisation (acceptance criterion 3)', () => {
  it('folds absolute and relative H/V into line points that enter the box', () => {
    const path = parseSvgPath('M0 0 h10 v5 H20 V0', NONE);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(20);
    expect(path.getMinY()).toBe(0);
    expect(path.getMaxY()).toBe(5);
    const segs = Array.from(path.iterator());
    expect(segs.map((s) => [s.segmentType, s.coord])).toEqual([
      [USegmentType.SEG_MOVETO, [0, 0]],
      [USegmentType.SEG_LINETO, [10, 0]],
      [USegmentType.SEG_LINETO, [10, 5]],
      [USegmentType.SEG_LINETO, [20, 5]],
      [USegmentType.SEG_LINETO, [20, 0]],
    ]);
  });
});

describe('parseSvgPath -- Q control point enters the box (acceptance criterion 4)', () => {
  it('records the single Q control point via a duplicated cubic', () => {
    const path = parseSvgPath('M0 0 Q50 100 100 0', NONE);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(100);
    expect(path.getMinY()).toBe(0);
    expect(path.getMaxY()).toBe(100);
    const segs = Array.from(path.iterator());
    expect(segs[1]!.segmentType).toBe(USegmentType.SEG_CUBICTO);
    expect(segs[1]!.coord).toEqual([50, 100, 50, 100, 100, 0]);
  });
});

describe('parseSvgPath -- S shorthand (acceptance criterion 3)', () => {
  it('reflects the previous C control point when a mirror is available', () => {
    // C: ctl1=(0,10) ctl2=(10,10) end=(10,0). Mirror of ctl2 about end:
    // (2*10-10, 2*0-10) = (10,-10).
    const path = parseSvgPath('M0 0 C0 10 10 10 10 0 S20 -10 20 0', NONE);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(20);
    expect(path.getMinY()).toBe(-10);
    expect(path.getMaxY()).toBe(10);
    const segs = Array.from(path.iterator());
    expect(segs[2]!.segmentType).toBe(USegmentType.SEG_CUBICTO);
    expect(segs[2]!.coord).toEqual([10, -10, 20, -10, 20, 0]);
  });

  it('falls back to its own control point (doubled) when no mirror is available -- Movement#mutoToC null branch', () => {
    // S immediately after M: no preceding C/S, so upstream reuses this S's
    // OWN explicit control point as BOTH cubic control points -- not the
    // current point. Awkward but faithful (Movement.java:92-95).
    const path = parseSvgPath('M0 0 S10 10 20 0', NONE);
    const segs = Array.from(path.iterator());
    expect(segs[1]!.segmentType).toBe(USegmentType.SEG_CUBICTO);
    expect(segs[1]!.coord).toEqual([10, 10, 10, 10, 20, 0]);
    expect(path.getMinY()).toBe(0);
    expect(path.getMaxY()).toBe(10);
  });
});

describe('parseSvgPath -- T shorthand (acceptance criterion 3)', () => {
  it('reflects the previous Q control point about the current point', () => {
    // Q: ctl=(5,10) end=(10,0). Mirror of ctl about end: (2*10-5, 2*0-10) = (15,-10).
    const path = parseSvgPath('M0 0 Q5 10 10 0 T20 0', NONE);
    const segs = Array.from(path.iterator());
    expect(segs[2]!.segmentType).toBe(USegmentType.SEG_CUBICTO);
    expect(segs[2]!.coord).toEqual([15, -10, 15, -10, 20, 0]);
    expect(path.getMinY()).toBe(-10);
    expect(path.getMaxY()).toBe(10);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(20);
  });

  it('T-after-T reflects the PREVIOUS T endpoint about itself -- a degenerate but faithful quirk', () => {
    // Movement#getSvgPosition(0) on a T movement (only 2 stored args) IS its
    // own endpoint, so mirroring it about itself yields that same point --
    // upstream's toUPath(XAffineTransform) does not special-case this.
    const path = parseSvgPath('M0 0 Q5 10 10 0 T20 0 T30 0', NONE);
    const segs = Array.from(path.iterator());
    expect(segs[3]!.segmentType).toBe(USegmentType.SEG_CUBICTO);
    expect(segs[3]!.coord).toEqual([20, 0, 20, 0, 30, 0]);
    expect(path.getMaxX()).toBe(30);
  });

  it('throws when T does not immediately follow Q or T', () => {
    expect(() => parseSvgPath('M0 0 L10 0 T20 0', NONE)).toThrow(/'T' must follow 'Q' or 'T'/);
  });
});

describe('parseSvgPath -- multi-subpath Z/m reset (acceptance criterion 5)', () => {
  it('resets a subsequent relative m against the FIRST subpath M point, not the point before Z', () => {
    const path = parseSvgPath('M0 0 L10 0 L10 10 Z m5 5 L15 15', NONE);
    const segs = Array.from(path.iterator());
    const moveTos = segs.filter((s) => s.segmentType === USegmentType.SEG_MOVETO);
    expect(moveTos).toHaveLength(2);
    expect(moveTos[0]!.coord).toEqual([0, 0]);
    // If `m5 5` were relative to the point before Z (10,10) it would land at
    // (15,15); SvgPath's lastMove convention places it at (5,5) instead.
    expect(moveTos[1]!.coord).toEqual([5, 5]);
    expect(path.getMinX()).toBe(0);
    expect(path.getMaxX()).toBe(15);
    expect(path.getMinY()).toBe(0);
    expect(path.getMaxY()).toBe(15);
  });
});

describe('parseSvgPath -- translate', () => {
  it('applies the translate offset to every recorded coordinate', () => {
    const path = parseSvgPath('M0 0 L10 10', new UTranslate(100, -50));
    const segs = Array.from(path.iterator());
    expect(segs.map((s) => s.coord)).toEqual([
      [100, -50],
      [110, -40],
    ]);
  });
});

describe('parseSvgPath -- empty and malformed input', () => {
  it('returns an empty UPath for an empty d', () => {
    const path = parseSvgPath('', NONE);
    expect(path.isEmpty()).toBe(true);
    expect(path.size()).toBe(0);
  });

  it('silently truncates a malformed trailing number fragment (StringDecipher#decipher parity)', () => {
    const path = parseSvgPath('M0 0-', NONE);
    const segs = Array.from(path.iterator());
    expect(segs).toHaveLength(1);
    expect(segs[0]!.coord).toEqual([0, 0]);
  });

  it('throws on an unsupported command letter', () => {
    expect(() => parseSvgPath('X0 0', NONE)).toThrow(/unsupported command letter/);
  });

  it('throws when a bare number appears before any command letter', () => {
    expect(() => parseSvgPath('0 0', NONE)).toThrow(/must start with a command letter/);
  });

  it('throws when a command runs out of arguments', () => {
    expect(() => parseSvgPath('M0', NONE)).toThrow(/expects 2 argument/);
  });
});

describe('parseSvgPath -- implicit repeated coordinate pairs after M', () => {
  it('treats bare number pairs after M as implicit L commands', () => {
    const path = parseSvgPath('M0 0 1 1 2 2', NONE);
    const segs = Array.from(path.iterator());
    expect(segs.map((s) => [s.segmentType, s.coord])).toEqual([
      [USegmentType.SEG_MOVETO, [0, 0]],
      [USegmentType.SEG_LINETO, [1, 1]],
      [USegmentType.SEG_LINETO, [2, 2]],
    ]);
  });

  it('treats bare number pairs after m (relative) as implicit l commands', () => {
    const path = parseSvgPath('m0 0 1 1 2 2', NONE);
    const segs = Array.from(path.iterator());
    expect(segs.map((s) => s.coord)).toEqual([
      [0, 0],
      [1, 1],
      [3, 3],
    ]);
  });
});
