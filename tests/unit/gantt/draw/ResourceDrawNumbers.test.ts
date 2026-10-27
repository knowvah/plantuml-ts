import { describe, expect, it } from 'vitest';
import { UText } from '../../../../src/core/klimt/shape/UText.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import { ResourceDrawNumbers } from '../../../../src/diagrams/gantt/draw/ResourceDrawNumbers.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import type { TimeScale } from '../../../../src/diagrams/gantt/timescale/TimeScale.js';
import { headerData } from './header/helpers/header-fixture.js';
import { ShapeCapture, day, measurer, resourceOf, timeScale } from './helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java
// (line numbers cited per test). 10 px per day from 2024-03-01; the figures are drawn 16 below the name line
// (java:109), 9pt serif; the name is 13pt serif (java:80).

const sb = new MeasurerStringBounder(measurer);
const SERIF_13 = { family: 'Serif', size: 13 };
const SERIF_9 = { family: 'Serif', size: 9 };
const MIN = day(4);
const MAX = day(8); // five days, 30 .. 80
const ALICE = resourceOf('Alice');

/** `getLoadForResource(res, i)` answers `loads[day - 4]` (GanttModelData.java:91-101 sums the tasks' loads). */
function modelWith(loads: readonly number[]): GanttModelData {
  return {
    getLoadForResource: (_res: Resource, i: TimePoint) => loads[i.toDay().getDayOfMonth() - 4] ?? 0,
  } as unknown as GanttModelData;
}

function scaleBreakingOn(...days: number[]): TimeScale {
  return { ...timeScale, isBreaking: (t: TimePoint) => days.includes(t.toDay().getDayOfMonth()) };
}

function make(loads: readonly number[], scale: TimeScale, y = 40): ResourceDrawNumbers {
  return new ResourceDrawNumbers(modelWith(loads), headerData().timelineStyle, ALICE, scale, y, MIN, MAX);
}

interface Drawn {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly color: string | null;
  readonly size: number;
}

function texts(draw: ResourceDrawNumbers): { capture: ShapeCapture; texts: Drawn[] } {
  const capture = new ShapeCapture();
  draw.drawU(capture);
  const found = capture.drawn.flatMap((d) =>
    d.shape instanceof UText
      ? [
          {
            text: d.shape.getText(),
            x: d.x,
            y: d.y,
            color: d.shape.getFontConfiguration().color,
            size: d.shape.getFontConfiguration().size,
          },
        ]
      : [],
  );
  return { capture, texts: found };
}

describe('ResourceDrawNumbers geometry (java:141-149)', () => {
  it('the footer is two 16 px rows high (java:141-144)', () => {
    expect(make([], timeScale).getHeight(sb)).toBe(32);
  });

  it('getY answers the constructor y (java:146-149)', () => {
    expect(make([], timeScale, 123.5).getY()).toBe(123.5);
  });
});

describe('ResourceDrawNumbers.drawU (java:78-119)', () => {
  it('draws the name in 13pt black serif at the origin and a rule below it (java:79-86)', () => {
    const { capture, texts: found } = texts(make([], timeScale));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ text: 'Alice', x: 0, size: 13, color: '#000000' });
    const nameH = measurer.measure('Alice', SERIF_13).height;
    const rule = capture.drawn.find((d) => !(d.shape instanceof UText));
    // hline(pos(max) - pos(min)) = 70 - 30 (the start of the last day), shifted down by the name height
    expect(rule).toMatchObject({ x: 0, y: nameH });
    expect(rule?.shape).toMatchObject({ dx: 40 });
  });

  it('prints the average load of the active days when the scale breaks (java:88-112)', () => {
    // days 4..8 load 100, 50, 0, 150, 100: total 400 over 4 active days -> 100; 150 > 100 turns it red
    const { texts: found } = texts(make([100, 50, 0, 150, 100], scaleBreakingOn(8)));
    const figure = found.find((t) => t.text === '100');
    const w = measurer.measure('100', SERIF_9).width;
    // startingPosition = pos(day 4) = 30; ending = pos(day 8) + 10 = 80 (java:101-103)
    expect(figure).toMatchObject({ x: (30 + 80) / 2 - w / 2, size: 9, color: '#FF0000' });
    // drawn 16 down (java:109); the UText y adds the 9pt baseline, 0.7777... * 9 = 7
    expect(figure?.y).toBeCloseTo(16 + 7, 9);
  });

  it('a load of 100 or less stays black (java:93-94)', () => {
    const { texts: found } = texts(make([100, 100, 100, 100, 100], scaleBreakingOn(8)));
    expect(found.find((t) => t.text === '100')).toMatchObject({ color: '#000000' });
  });

  it('rounds the average to the nearest integer (java:98)', () => {
    // 10 + 10 + 11 = 31 over 3 active days -> 10.33 -> 10 ; 10 + 11 = 21 over 2 -> 10.5 -> 11
    expect(texts(make([10, 10, 11, 0, 0], scaleBreakingOn(8))).texts.map((t) => t.text)).toContain('10');
    expect(texts(make([10, 11, 0, 0, 0], scaleBreakingOn(8))).texts.map((t) => t.text)).toContain('11');
  });

  it('prints nothing for a period without load (java:96)', () => {
    expect(texts(make([0, 0, 0, 0, 0], scaleBreakingOn(8))).texts.map((t) => t.text)).toEqual(['Alice']);
  });

  it('prints one figure per period and resets the red flag between them (java:96-112)', () => {
    // breaks after day 5 and day 8: [200, 20] -> 110 (red); [30, 0, 30] -> 30 (black)
    const { texts: found } = texts(make([200, 20, 30, 0, 30], scaleBreakingOn(5, 8)));
    const figures = found.filter((t) => t.text !== 'Alice');
    expect(figures.map((t) => [t.text, t.color])).toEqual([
      ['110', '#FF0000'],
      ['30', '#000000'],
    ]);
    // second period starts at pos(day 6) = 50 and ends at pos(day 8) + 10 = 80
    const w = measurer.measure('30', SERIF_9).width;
    expect(figures[1]?.x).toBeCloseTo((50 + 80) / 2 - w / 2, 9);
  });

  it('a period with no breaking day prints nothing (the run is open until the last day)', () => {
    expect(texts(make([100, 100, 100, 100, 100], timeScale)).texts.map((t) => t.text)).toEqual(['Alice']);
  });

  it('draws the name of the Resource it was given (java:79-80)', () => {
    const draw = new ResourceDrawNumbers(
      modelWith([]),
      headerData().timelineStyle,
      resourceOf('Bob'),
      timeScale,
      0,
      TimePoint.ofStartOfDay(LocalDate.of(2024, 3, 4)),
      TimePoint.ofStartOfDay(LocalDate.of(2024, 3, 8)),
    );
    expect(texts(draw).texts[0]?.text).toBe('Bob');
  });
});

describe('ResourceDrawNumbers, a period of one day (java:96-112)', () => {
  it('a breaking first day prints its figure centred on that day alone', () => {
    const { texts: found } = texts(make([40, 0, 0, 0, 0], scaleBreakingOn(4)));
    const w = measurer.measure('40', SERIF_9).width;
    // startingPosition = pos(day 4) = 30, ending = 30 + 10
    expect(found.find((t) => t.text === '40')?.x).toBeCloseTo(35 - w / 2, 9);
  });
});
