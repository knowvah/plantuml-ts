/**
 * ULayoutGroup.test.ts — SI1/T4: unit coverage for the ported
 * `src/core/klimt/geom/ULayoutGroup.ts` (klimt/geom/ULayoutGroup.java)
 * plus the two `UTranslate` members it pulled in (`UTranslate.point`,
 * `UTranslate#apply(XRectangle2D)` — UTranslate.java:68-70, :103-105).
 * Expected numbers derive from `PlacementStrategyY1Y2Left` arithmetic:
 * A(10x5), B(20x10) in 40x27 place at (0,4) and (0,13).
 */
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import { XRectangle2D } from '../../../../../src/core/klimt/geom/XRectangle2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { PlacementStrategyY1Y2Left } from '../../../../../src/core/klimt/geom/PlacementStrategyY1Y2Left.js';
import { ULayoutGroup } from '../../../../../src/core/klimt/geom/ULayoutGroup.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** Minimal UGraphic that only composes translates — all ULayoutGroup#drawU needs. */
function translatingUGraphic(translate: UTranslate = UTranslate.none()): UGraphic {
  const ug: UGraphic = {
    apply: (change: UChange) =>
      change instanceof UTranslate ? translatingUGraphic(translate.compose(change)) : ug,
    draw: () => undefined,
    getParam: () => {
      throw new Error('not needed');
    },
    getTranslate: () => translate,
    getStringBounder: () => stubStringBounder,
  };
  return ug;
}

function recordingBlock(width: number, height: number, log: Array<{ dx: number; dy: number }>): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: (ug: UGraphic) => {
      const t = ug.getTranslate();
      log.push({ dx: t.getDx(), dy: t.getDy() });
    },
  };
}

describe('UTranslate additions pulled in by ULayoutGroup', () => {
  it('point(XPoint2D) builds the equivalent translate (UTranslate.java:68-70)', () => {
    const t = UTranslate.point(new XPoint2D(3, 4));
    expect(t.getDx()).toBe(3);
    expect(t.getDy()).toBe(4);
  });

  it('apply(XRectangle2D) shifts x/y and preserves size (UTranslate.java:103-105)', () => {
    const moved = new UTranslate(5, 7).apply(new XRectangle2D(1, 2, 3, 4));
    expect([moved.getX(), moved.getY(), moved.getWidth(), moved.getHeight()]).toEqual([6, 9, 3, 4]);
  });
});

describe('ULayoutGroup (klimt/geom/ULayoutGroup.java)', () => {
  it('drawU draws every block translated to its strategy position (:56-62)', () => {
    const log: Array<{ dx: number; dy: number }> = [];
    const a = recordingBlock(10, 5, log);
    const b = recordingBlock(20, 10, log);
    const group = new ULayoutGroup(new PlacementStrategyY1Y2Left(stubStringBounder));
    group.add(a);
    group.add(b);
    group.drawU(translatingUGraphic(), 40, 27);
    expect(log).toEqual([
      { dx: 0, dy: 4 },
      { dx: 0, dy: 13 },
    ]);
  });

  it('getInnerPosition translates the first matching inner rectangle (:69-86)', () => {
    const a = recordingBlock(10, 5, []);
    const b: TextBlock & {
      getInnerPosition(member: string, sb: StringBounder): XRectangle2D | undefined;
    } = {
      calculateDimension: () => new XDimension2D(20, 10),
      drawU: () => undefined,
      getInnerPosition: (member) => (member === 'm' ? new XRectangle2D(1, 2, 3, 4) : undefined),
    };
    const group = new ULayoutGroup(new PlacementStrategyY1Y2Left(stubStringBounder));
    group.add(a);
    group.add(b);
    // B is placed at (0, 13); its inner rect (1,2,3,4) translates to (1,15,3,4).
    const found = group.getInnerPosition('m', 40, 27, stubStringBounder);
    expect(found).toBeDefined();
    expect([found?.getX(), found?.getY(), found?.getWidth(), found?.getHeight()]).toEqual([1, 15, 3, 4]);
  });

  it('getInnerPosition yields undefined when no block matches', () => {
    const a = recordingBlock(10, 5, []);
    const group = new ULayoutGroup(new PlacementStrategyY1Y2Left(stubStringBounder));
    group.add(a);
    expect(group.getInnerPosition('missing', 40, 27, stubStringBounder)).toBeUndefined();
  });
});
