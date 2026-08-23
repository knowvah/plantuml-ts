import { describe, it, expect } from 'vitest';
import {
  ARROW_DELTA_X,
  ARROW_DELTA_Y,
  NICE_ARROW_INSET,
  DIAM_CIRCLE,
  THIN_CIRCLE,
  SPACE_CROSS_X,
  arrowConfigurationFor,
  headGeometryNormalSide,
  headGeometryReverseSide,
  headGeometrySelf,
} from '../../../src/diagrams/sequence/sequence-arrowhead.js';
import type {
  ArrowConfiguration,
  ArrowDressing,
  ArrowHeadKind,
  ArrowPart,
} from '../../../src/diagrams/sequence/sequence-arrowhead.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const NO_DECORATION = 'NONE';
const CIRCLE_DECORATION = 'CIRCLE';

/** Circle-induced head shift: `diamCircle / 2 + thinCircle`
 *  (ComponentRoseArrow.java:206, :243). */
const CIRCLE_SHIFT = DIAM_CIRCLE / 2 + THIN_CIRCLE;

function dressing(head: ArrowHeadKind, part: ArrowPart): ArrowDressing {
  return { head, part };
}

function pt(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

/** A config whose `getPart()` resolves through `dressing2` — upstream picks
 *  dressing2's part whenever its head is not NONE
 *  (ArrowConfiguration.java:221-226). */
function selfConfig(head: ArrowHeadKind, part: ArrowPart): ArrowConfiguration {
  return {
    dressing1: dressing('NONE', 'FULL'),
    dressing2: dressing(head, part),
    decoration1: NO_DECORATION,
    decoration2: NO_DECORATION,
    dashed: false,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('sequence arrowhead constants', () => {
  it('carries the upstream arrow deltas and circle/cross metrics', () => {
    expect(ARROW_DELTA_X).toBe(10);
    expect(ARROW_DELTA_Y).toBe(4);
    expect(NICE_ARROW_INSET).toBe(4);
    expect(DIAM_CIRCLE).toBe(8);
    expect(THIN_CIRCLE).toBe(1.5);
    expect(SPACE_CROSS_X).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// arrowConfigurationFor — the single MessageStyle adapter (D2)
// ---------------------------------------------------------------------------

describe('arrowConfigurationFor', () => {
  it('maps sync to a solid body with a NORMAL head on dressing2', () => {
    const cfg = arrowConfigurationFor('sync');
    expect(cfg.dressing1).toEqual({ head: 'NONE', part: 'FULL' });
    expect(cfg.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(cfg.decoration1).toBe('NONE');
    expect(cfg.decoration2).toBe('NONE');
    expect(cfg.dashed).toBe(false);
  });

  it('maps async to an ASYNC head on dressing2, still solid', () => {
    const cfg = arrowConfigurationFor('async');
    expect(cfg.dressing2).toEqual({ head: 'ASYNC', part: 'FULL' });
    expect(cfg.dressing1).toEqual({ head: 'NONE', part: 'FULL' });
    expect(cfg.dashed).toBe(false);
  });

  it('maps reply to a dashed body with a NORMAL head', () => {
    const cfg = arrowConfigurationFor('reply');
    expect(cfg.dashed).toBe(true);
    expect(cfg.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
  });

  it('maps replyAsync to a dashed body with an ASYNC head', () => {
    const cfg = arrowConfigurationFor('replyAsync');
    expect(cfg.dashed).toBe(true);
    expect(cfg.dressing2).toEqual({ head: 'ASYNC', part: 'FULL' });
  });

  // The one trap: ArrowDecoration.CIRCLE comes from an explicit `o` in the
  // arrow syntax (CommandArrow.java:367-371, CommandExoArrowAny.java:109-116)
  // and is orthogonal to lost/found, which are MessageExoType.
  it('maps lost to a plain NORMAL head with no circle decoration', () => {
    const cfg = arrowConfigurationFor('lost');
    expect(cfg.decoration1).toBe('NONE');
    expect(cfg.decoration2).toBe('NONE');
    expect(cfg.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(cfg.dashed).toBe(false);
  });

  it('maps found to a plain NORMAL head with no circle decoration', () => {
    const cfg = arrowConfigurationFor('found');
    expect(cfg.decoration1).toBe('NONE');
    expect(cfg.decoration2).toBe('NONE');
    expect(cfg.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(cfg.dashed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// headGeometryNormalSide — dressing2, getPolygonNormal
// ---------------------------------------------------------------------------

describe('headGeometryNormalSide', () => {
  it('builds the nice-arrow FULL polygon', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4), pt(-6, 0)]);
    expect(geo.lines).toBeUndefined();
    expect(geo.circle).toBeUndefined();
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      false,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4)]);
  });

  it('builds the TOP_PART half polygon with no nice-arrow point', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 0)]);
  });

  it('builds the BOTTOM_PART half polygon', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(-10, 0), pt(0, 0), pt(-10, 4)]);
  });

  it('builds two ASYNC line segments for a FULL part', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(0, 0), pt(-10, -4)],
      [pt(0, 0), pt(-10, 4)],
    ]);
    expect(geo.polygon).toBeUndefined();
  });

  it('builds exactly one ASYNC segment for TOP_PART', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(-10, -4)]]);
  });

  it('builds exactly one ASYNC segment for BOTTOM_PART', () => {
    const geo = headGeometryNormalSide(
      dressing('ASYNC', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(-10, 4)]]);
  });

  it('builds the CROSSX saltire left of the tip', () => {
    const geo = headGeometryNormalSide(
      dressing('CROSSX', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(-16, -5), pt(-6, 5)],
      [pt(-16, 5), pt(-6, -5)],
    ]);
  });

  it('produces no shape for a NONE head', () => {
    const geo = headGeometryNormalSide(
      dressing('NONE', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo).toEqual({});
  });

  it('places the CIRCLE decoration right of the tip and shifts the head', () => {
    const geo = headGeometryNormalSide(
      dressing('NORMAL', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({
      cx: 1.5,
      cy: -0.75,
      d: 8,
      thickness: 1.5,
    });
    expect(geo.polygon).toEqual([
      pt(-10 - CIRCLE_SHIFT, -4),
      pt(-CIRCLE_SHIFT, 0),
      pt(-10 - CIRCLE_SHIFT, 4),
      pt(-6 - CIRCLE_SHIFT, 0),
    ]);
  });

  it('shifts a CROSSX head too — dressing2 translates unconditionally', () => {
    const geo = headGeometryNormalSide(
      dressing('CROSSX', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(-16 - CIRCLE_SHIFT, -5), pt(-6 - CIRCLE_SHIFT, 5)],
      [pt(-16 - CIRCLE_SHIFT, 5), pt(-6 - CIRCLE_SHIFT, -5)],
    ]);
  });

  it('draws the circle alone for a NONE head', () => {
    const geo = headGeometryNormalSide(
      dressing('NONE', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({ cx: 1.5, cy: -0.75, d: 8, thickness: 1.5 });
    expect(geo.polygon).toBeUndefined();
    expect(geo.lines).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// headGeometryReverseSide — dressing1, getPolygonReverse
// ---------------------------------------------------------------------------

describe('headGeometryReverseSide', () => {
  it('builds the nice-arrow FULL polygon mirrored about the tip', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4), pt(6, 0)]);
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      NO_DECORATION,
      false,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4)]);
  });

  it('builds the TOP_PART half polygon with no nice-arrow point', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 0)]);
  });

  it('builds the BOTTOM_PART half polygon', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.polygon).toEqual([pt(10, 0), pt(0, 0), pt(10, 4)]);
  });

  it('builds two ASYNC line segments for a FULL part', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(0, 0), pt(10, -4)],
      [pt(0, 0), pt(10, 4)],
    ]);
  });

  it('builds exactly one ASYNC segment for TOP_PART', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'TOP_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(10, -4)]]);
  });

  it('builds exactly one ASYNC segment for BOTTOM_PART', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'BOTTOM_PART'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([[pt(0, 0), pt(10, 4)]]);
  });

  it('builds the CROSSX saltire right of the tip', () => {
    const geo = headGeometryReverseSide(
      dressing('CROSSX', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(6, -5), pt(16, 5)],
      [pt(6, 5), pt(16, -5)],
    ]);
  });

  it('produces no shape for a NONE head', () => {
    const geo = headGeometryReverseSide(
      dressing('NONE', 'FULL'),
      NO_DECORATION,
      true,
    );
    expect(geo).toEqual({});
  });

  it('places the CIRCLE decoration left of the tip and shifts the head', () => {
    const geo = headGeometryReverseSide(
      dressing('NORMAL', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({
      cx: -1.5,
      cy: -0.75,
      d: 8,
      thickness: 1.5,
    });
    expect(geo.polygon).toEqual([
      pt(10 + CIRCLE_SHIFT, -4),
      pt(CIRCLE_SHIFT, 0),
      pt(10 + CIRCLE_SHIFT, 4),
      pt(6 + CIRCLE_SHIFT, 0),
    ]);
  });

  it('leaves a CROSSX head unshifted — dressing1 skips the translate', () => {
    const geo = headGeometryReverseSide(
      dressing('CROSSX', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.circle).toEqual({ cx: -1.5, cy: -0.75, d: 8, thickness: 1.5 });
    expect(geo.lines).toEqual([
      [pt(6, -5), pt(16, 5)],
      [pt(6, 5), pt(16, -5)],
    ]);
  });

  it('shifts ASYNC segments when a circle is present', () => {
    const geo = headGeometryReverseSide(
      dressing('ASYNC', 'FULL'),
      CIRCLE_DECORATION,
      true,
    );
    expect(geo.lines).toEqual([
      [pt(CIRCLE_SHIFT, 0), pt(10 + CIRCLE_SHIFT, -4)],
      [pt(CIRCLE_SHIFT, 0), pt(10 + CIRCLE_SHIFT, 4)],
    ]);
  });
});

// ---------------------------------------------------------------------------
// headGeometrySelf — ComponentRoseSelfArrow#getPolygon
// ---------------------------------------------------------------------------

describe('headGeometrySelf', () => {
  it('points right with the nice-arrow inset when not reverse-defined', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), false, true);
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4), pt(6, 0)]);
  });

  it('points left when reverse-defined, insetting the other way', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), true, true);
    expect(geo.polygon).toEqual([pt(-10, -4), pt(0, 0), pt(-10, 4), pt(-6, 0)]);
  });

  it('omits the nice-arrow point under strict UML style', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'FULL'), false, false);
    expect(geo.polygon).toEqual([pt(10, -4), pt(0, 0), pt(10, 4)]);
  });

  it('nudges the TOP_PART polygon back by one, unlike the flat builders', () => {
    const geo = headGeometrySelf(selfConfig('NORMAL', 'TOP_PART'), false, true);
    expect(geo.polygon).toEqual([pt(9, -4), pt(-1, 0), pt(9, 0)]);
  });

  it('nudges the BOTTOM_PART polygon back by one', () => {
    const geo = headGeometrySelf(
      selfConfig('NORMAL', 'BOTTOM_PART'),
      false,
      true,
    );
    expect(geo.polygon).toEqual([pt(9, 0), pt(-1, 0), pt(9, 4)]);
  });

  it('mirrors the BOTTOM_PART nudge when reverse-defined', () => {
    const geo = headGeometrySelf(
      selfConfig('NORMAL', 'BOTTOM_PART'),
      true,
      true,
    );
    expect(geo.polygon).toEqual([pt(-11, 0), pt(-1, 0), pt(-11, 4)]);
  });

  it('falls back to dressing1 part when dressing2 has no head', () => {
    const cfg: ArrowConfiguration = {
      dressing1: dressing('NORMAL', 'TOP_PART'),
      dressing2: dressing('NONE', 'FULL'),
      decoration1: NO_DECORATION,
      decoration2: NO_DECORATION,
      dashed: false,
    };
    const geo = headGeometrySelf(cfg, false, true);
    expect(geo.polygon).toEqual([pt(9, -4), pt(-1, 0), pt(9, 0)]);
  });
});
