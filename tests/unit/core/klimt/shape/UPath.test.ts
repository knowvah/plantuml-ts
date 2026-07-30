/**
 * T13 -- port of `USegment.rotate`/`affine` and `UPath.rotate`/`affine`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/USegment.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/UPath.java
 */
import { describe, expect, it } from 'vitest';
import { UPath, USegmentType } from '../../../../../src/core/klimt/shape/UPath.js';
import { XAffineTransform } from '../../../../../src/core/klimt/UGraphicWithScale.js';

describe('UPath#rotate / USegment#rotate', () => {
  it('rotates a 2-coord segment by theta radians', () => {
    const path = UPath.none();
    path.moveTo(0, 0);
    path.lineTo(1, 0);

    const rotated = path.rotate(Math.PI / 2);
    const segs = [...rotated];

    expect(segs[0]!.coord[0]).toBeCloseTo(0, 9);
    expect(segs[0]!.coord[1]).toBeCloseTo(0, 9);
    // (1,0) rotated 90 degrees -> (0,1).
    expect(segs[1]!.coord[0]).toBeCloseTo(0, 9);
    expect(segs[1]!.coord[1]).toBeCloseTo(1, 9);
  });

  it('preserves comment/codeLine on the returned UPath', () => {
    const path = new UPath('a comment', 'a code line');
    path.moveTo(0, 0);
    const rotated = path.rotate(0);
    expect(rotated.getComment()).toBe('a comment');
    expect(rotated.getCodeLine()).toBe('a code line');
  });

  it('throws for a cubic (6-coord) segment -- rotate has no SEG_ARCTO exception, unlike affine', () => {
    const path = UPath.none();
    path.moveTo(0, 0);
    path.cubicTo(1, 1, 2, 2, 3, 3);
    expect(() => path.rotate(0)).toThrow();
  });

  it('throws for an arc (7-coord) segment', () => {
    const path = UPath.none();
    path.arcTo(5, 5, 0, 0, 1, 10, 0);
    expect(() => path.rotate(0)).toThrow();
  });
});

describe('UPath#affine / USegment#affine -- T13 acceptance criteria 1, 2, 4', () => {
  it('translates a 2-coord segment by exactly (4,2) -- acceptance criterion 1', () => {
    const path = UPath.none();
    path.moveTo(0, 0);
    path.lineTo(5, 5);
    const at = new XAffineTransform(1, 0, 0, 1, 4, 2);

    const affined = path.affine(at, 0, 1);
    const segs = [...affined];

    expect(segs[0]!.coord).toEqual([4, 2]);
    expect(segs[1]!.coord).toEqual([9, 7]);
  });

  it('scales a 2-coord segment by exactly 2x -- acceptance criterion 2', () => {
    const path = UPath.none();
    path.moveTo(1, 1);
    path.lineTo(3, 4);
    const at = new XAffineTransform(2, 0, 0, 2, 0, 0);

    const affined = path.affine(at, 0, 2);
    const segs = [...affined];

    expect(segs[0]!.coord).toEqual([2, 2]);
    expect(segs[1]!.coord).toEqual([6, 8]);
  });

  it('special-cases SEG_ARCTO: scales rx/ry by `scale`, adds `angle` to x-axis-rotation, transforms only the endpoint', () => {
    const path = UPath.none();
    path.arcTo(5, 5, 0, 0, 1, 10, 0);
    const at = new XAffineTransform(1, 0, 0, 1, 4, 2);

    const affined = path.affine(at, 30, 2);
    const seg = [...affined][0]!;

    expect(seg.segmentType).toBe(USegmentType.SEG_ARCTO);
    // rx*scale=10, ry*scale=10, x_axis_rotation+angle=30, flags unchanged,
    // endpoint (10,0) transformed by `at` (translate 4,2) -> (14,2).
    expect(seg.coord).toEqual([10, 10, 30, 0, 1, 14, 2]);
  });

  it("throws for a cubic segment -- USegment.affine's coord.length!==2 restriction, load-bearing (acceptance criterion 4)", () => {
    const path = UPath.none();
    path.moveTo(0, 0);
    path.cubicTo(1, 1, 2, 2, 3, 3);
    const identity = new XAffineTransform(1, 0, 0, 1, 0, 0);

    expect(() => path.affine(identity, 0, 1)).toThrow();
  });

  it('composes two affine calls in sequence, matching nested-transform order (acceptance criterion 3)', () => {
    // Two <g> levels: outer scale(2), inner translate(1,1) -- upstream
    // composes them via XAffineTransform#concatenate at accumulation
    // time, not by calling UPath#affine twice; this test instead confirms
    // UPath#affine correctly applies whatever COMPOSED matrix it is given
    // (the actual composition is UGraphicWithScale's job, exercised
    // separately in SvgNanoParser.test.ts).
    const outer = new XAffineTransform(2, 0, 0, 2, 0, 0);
    outer.concatenate(new XAffineTransform(1, 0, 0, 1, 1, 1));

    const path = UPath.none();
    path.moveTo(1, 1);
    const affined = path.affine(outer, 0, 2);
    const seg = [...affined][0]!;

    // point (1,1) -> translate(1,1) first (inner) -> (2,2) -> scale(2) (outer) -> (4,4).
    expect(seg.coord).toEqual([4, 4]);
  });
});
