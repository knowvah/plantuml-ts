import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { UPath } from '../../../../src/core/klimt/shape/UPath.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { Url } from '../../../../src/core/url/Url.js';
import { GArrowType } from '../../../../src/diagrams/gantt/core/GArrowType.js';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';
import { LabelPosition } from '../../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../../src/diagrams/gantt/LabelStrategy.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import { TaskDrawGroup } from '../../../../src/diagrams/gantt/draw/TaskDrawGroup.js';
import type { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { placed, recorded } from './header/helpers/header-fixture.js';
import {
  ShapeCapture,
  TASK_FONT_SIZE,
  TASK_MARGIN,
  day,
  measurer,
  skinParam,
  styleBuilder,
  taskOf,
  timeScale,
} from './helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawGroup.java
// (line numbers cited per test). Style: the `task` style (Margin 2, Padding 0, FontSize 11). 10 px per day from
// 2024-03-01: a group from day(4) to day(8) spans x = 30 .. 80 (the end day is 10 wide, java:84-85).

const sb = new MeasurerStringBounder(measurer);
const SANS = { family: 'SansSerif', size: TASK_FONT_SIZE };
const TEXT_H = measurer.measure('Phase', SANS).height;
const TEXT_W = measurer.measure('Phase', SANS).width;
const BASELINE = 8.555555555555555; // 11pt UText baseline, see TaskDrawRegular.test.ts
const START = 30;
const END = 80;
const BAR_HEIGHT = 10; // java:218
const LONG = 'A group label far too long for a one day bar';

function make(label = 'Phase', end: TimePoint = day(8)): TaskDrawGroup {
  return new TaskDrawGroup(
    HColorSet.instance(),
    timeScale,
    RealUtils.createOrigin(),
    label,
    day(4),
    end,
    taskOf(label),
    new TaskDrawRegistryData(),
    styleBuilder,
    skinParam(),
  );
}

describe('TaskDrawGroup sizes (java:78-92, 154-171)', () => {
  it('shape height: title + 2 when the title fits between the brackets (java:89-90)', () => {
    expect(make().getShapeHeight(sb)).toBe(TEXT_H + 2);
  });

  it('shape height: the title alone when it does not fit (java:91)', () => {
    expect(make(LONG, day(4)).getShapeHeight(sb)).toBe(TEXT_H);
  });

  it('full height adds the task margins (AbstractTaskDraw.java:155-159)', () => {
    expect(make().getFullHeightTask(sb)).toBe(TASK_MARGIN + TEXT_H + 2 + TASK_MARGIN);
  });

  it('getHeightMax is the full height; there is no note fingerprint (java:154-156, 165-167)', () => {
    const draw = make();
    expect(draw.getHeightMax(sb)).toBe(draw.getFullHeightTask(sb));
    expect(draw.getFingerPrintNote(sb)).toBeUndefined();
  });

  it('fingerprint = (start, y, end + width - start, full height) (java:158-163)', () => {
    expect(make().getFingerPrint(sb).toString()).toBe('X=(30.0->80.0) Y=(0.0 ->17.0)');
  });
});

describe('TaskDrawGroup.drawU (java:147-152, 197-216, 220-240)', () => {
  it('draws the bracket in black, bottom-aligned in the row (java:206-213)', () => {
    const capture = new ShapeCapture();
    make().drawU(capture);
    expect(capture.drawn).toHaveLength(1);
    const [bracket] = capture.drawn;
    // dy = full height - 10 = 17 - 10
    expect([bracket?.x, bracket?.y]).toEqual([0, 17 - BAR_HEIGHT]);
    const start = START + TASK_MARGIN;
    const end = END - TASK_MARGIN;
    const path = bracket?.shape as UPath;
    expect([...path.iterator()].map((s) => `${s.segmentType.slice(4)}(${s.coord.join(',')})`)).toEqual([
      `MOVETO(${start},0)`,
      `LINETO(${start + 6},4)`,
      `LINETO(${end - 6},4)`,
      `LINETO(${end},0)`,
      `LINETO(${end},10)`,
      `LINETO(${end - 6},6)`,
      `LINETO(${start + 6},6)`,
      `LINETO(${start},10)`,
      `LINETO(${start},0)`,
    ]);
  });

  it('the black overrides the style colours that applyColors set first (java:149, 211)', () => {
    const [bracket] = placed(recorded((ug) => make().drawU(ug)));
    expect(bracket?.paint).toEqual(['fore(#181818)', 'back(#E2E2F0)', 'fore(#000000)', 'back(#000000)']);
  });

  it('wraps the bracket in startUrl / closeUrl (java:202-203, 214-215)', () => {
    const draw = make();
    draw.setColorsAndCompletion(undefined, 100, new Url('http://x.test/', null, null), undefined, undefined);
    const log = recorded((ug) => draw.drawU(ug));
    expect(log[0]).toEqual({ startUrl: 'http://x.test/' });
    expect(log.at(-1)).toEqual({ closeUrl: true });
  });
});

describe('TaskDrawGroup.drawTitle (java:95-118)', () => {
  const LEGACY = new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.LEFT);
  const titleAt = (draw: TaskDrawGroup): [number, number] => {
    const text = placed(recorded((ug) => draw.drawTitle(ug, LEGACY, 200, 400))).find((p) =>
      p.shape.startsWith('UText'),
    );
    return [text?.x ?? Number.NaN, text?.y ?? Number.NaN];
  };

  it('centred between the brackets when it fits, at the top (java:107-111)', () => {
    // pos1 = 36, pos2 = 74
    const [x, y] = titleAt(make());
    expect(x).toBeCloseTo(36 + (74 - 36 - TEXT_W) / 2, 9);
    expect(y).toBe(BASELINE);
  });

  it('after the bracket, on the bottom line, when it does not fit (java:112-116)', () => {
    const draw = make(LONG, day(4));
    // pos2 = 30 + 10 - 6 = 34 -> 34 + 6
    const [x, y] = titleAt(draw);
    expect(x).toBe(40);
    expect(y).toBeCloseTo(draw.getFullHeightTask(sb) - TEXT_H + BASELINE, 9);
  });
});

describe('TaskDrawGroup.getLabelOverflow (java:126-141)', () => {
  it('0 when the title fits (java:134-135)', () => {
    expect(make().getLabelOverflow(sb, 10)).toBe(0);
  });

  it('the title end past barsWidth when it sits after the bracket (java:137-139)', () => {
    const textW = measurer.measure(LONG, SANS).width;
    // pos2 = 34 -> label ends at 34 + 6 + width
    expect(make(LONG, day(4)).getLabelOverflow(sb, 100)).toBeCloseTo(40 + textW - 100, 9);
    expect(make(LONG, day(4)).getLabelOverflow(sb, 10_000)).toBe(0);
  });
});

describe('TaskDrawGroup.getX (java:177-195)', () => {
  const x = (side: GSide): number => make().getX(sb, side, GArrowType.INCOMING);

  it('LEFT / RIGHT are the bracket ends, RIGHT including the end day (java:182-185)', () => {
    expect(x(GSide.LEFT)).toBe(START);
    expect(x(GSide.RIGHT)).toBe(END);
  });

  it('the top / bottom anchors are the middle of the first / last day (java:186-189)', () => {
    expect(x(GSide.TOP_LEFT)).toBe(35);
    expect(x(GSide.BOTTOM_LEFT)).toBe(35);
    expect(x(GSide.TOP_RIGHT)).toBe(75);
    expect(x(GSide.BOTTOM_RIGHT)).toBe(75);
  });
});

describe('TaskDrawGroup retired outlines (java:242-279, private and unused upstream)', () => {
  class Exposed extends TaskDrawGroup {
    old2(a: number, b: number): UPath {
      return this.getShapeOld2(a, b);
    }
    old(a: number, b: number): UPath {
      return this.getShapeOld(a, b);
    }
  }
  const exposed = (): Exposed =>
    new Exposed(
      HColorSet.instance(),
      timeScale,
      RealUtils.createOrigin(),
      'P',
      day(4),
      day(8),
      taskOf('P'),
      new TaskDrawRegistryData(),
      styleBuilder,
      skinParam(),
    );
  const segs = (p: UPath): string[] => [...p.iterator()].map((s) => `${s.segmentType.slice(4)}(${s.coord.join(',')})`);

  it('getShapeOld2 (java:242-259): 9 and 7 high', () => {
    expect(segs(exposed().old2(0, 20))).toEqual([
      'MOVETO(0,0)',
      'LINETO(6,7)',
      'LINETO(14,7)',
      'LINETO(20,0)',
      'LINETO(20,9)',
      'LINETO(0,9)',
      'LINETO(0,0)',
    ]);
  });

  it('getShapeOld (java:261-278): 9 and 2 high', () => {
    expect(segs(exposed().old(0, 20))).toEqual([
      'MOVETO(0,0)',
      'LINETO(20,0)',
      'LINETO(20,9)',
      'LINETO(14,2)',
      'LINETO(6,2)',
      'LINETO(0,9)',
      'LINETO(0,0)',
    ]);
  });
});

describe('TaskDrawGroup.getX, unknown side (java:177-195)', () => {
  it('an unknown side is an IllegalArgumentException (java:192)', () => {
    expect(() => make().getX(sb, {} as GSide, GArrowType.INCOMING)).toThrow('IllegalArgumentException');
  });
});
