import { describe, expect, it } from 'vitest';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import { TimeBoundsData } from '../../../../src/diagrams/gantt/data/TimeBoundsData.js';
import type { TimeHeader } from '../../../../src/diagrams/gantt/draw/header/TimeHeader.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleDaily } from '../../../../src/diagrams/gantt/timescale/TimeScaleDaily.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeBoundsData.java
// 2024-03-04 is a Monday.

const STYLE = {} as unknown as StyleBuilder;
type Gantt = ConstructorParameters<typeof TaskImpl>[0];

const calendar = new DayCalendarData();
const gantt = {
  durationOfDays: (n: number) => calendar.durationOfDays(n),
  getLoadPlanableForTask: (id: string) =>
    calendar.getOpenClose().mutateMe(calendar.getOpenCloseForTask(id)).asPiecewiseConstant(),
} as unknown as Gantt;

const date = (d: number): LocalDate => LocalDate.of(2024, 3, d);
const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);
const iso = (t: TimePoint): string => t.toString();
/** A task running `[start, start + days)`. */
function taskOf(id: string, start: number, days: number): TaskImpl {
  const t = new TaskImpl(gantt, STYLE, TaskCode.fromId(id), day(start), 0);
  t.setLoad(Load.of(Duration.ofDays(days)));
  return t;
}

describe('TimeBoundsData', () => {
  it('minDay starts at the epoch, the others unset; setters round-trip (java:48-85)', () => {
    const b = new TimeBoundsData();
    expect(b.getMinDay().equals(TimePoint.epoch())).toBe(true);
    expect(b.getPrintStart()).toBeUndefined();
    expect(b.getPrintEnd()).toBeUndefined();
    b.setMinDay(date(1));
    b.setMaxDay(date(9));
    b.setPrintStart(date(2));
    b.setPrintEnd(date(8));
    expect([b.getMinDay(), b.getMaxDay(), b.getPrintStart(), b.getPrintEnd()].map((d) => d?.toString())).toEqual([
      '2024-03-01',
      '2024-03-09',
      '2024-03-02',
      '2024-03-08',
    ]);
  });

  describe('getStartForDrawing / getEndForDrawing (java:87-105)', () => {
    it('without printStart they are the task start and end', () => {
      const b = new TimeBoundsData();
      b.setMinDay(date(6));
      b.setMaxDay(date(7));
      const t = taskOf('A', 4, 5); // [03-04, 03-09)
      expect(iso(b.getStartForDrawing(t))).toBe('2024-03-04T00:00');
      expect(iso(b.getEndForDrawing(t))).toBe('2024-03-09T00:00');
    });

    it('with printStart they are clipped to [start of minDay, start of maxDay + 1]', () => {
      const b = new TimeBoundsData();
      b.setMinDay(date(6));
      b.setMaxDay(date(7));
      b.setPrintStart(date(6));
      const t = taskOf('A', 4, 5);
      expect(iso(b.getStartForDrawing(t))).toBe('2024-03-06T00:00');
      expect(iso(b.getEndForDrawing(t))).toBe('2024-03-08T00:00');
      const inside = taskOf('B', 6, 1);
      expect(iso(b.getStartForDrawing(inside))).toBe('2024-03-06T00:00');
      expect(iso(b.getEndForDrawing(inside))).toBe('2024-03-07T00:00');
    });
  });

  describe('isHidden (java:107-118)', () => {
    const bounds = (): TimeBoundsData => {
      const b = new TimeBoundsData();
      b.setMinDay(date(6));
      b.setMaxDay(date(8));
      b.setPrintStart(date(6));
      return b;
    };

    it('nothing is hidden without printStart, and separators never are', () => {
      const b = new TimeBoundsData();
      b.setMinDay(date(6));
      b.setMaxDay(date(8));
      expect(b.isHidden(taskOf('A', 1, 1))).toBe(false);
      expect(bounds().isHidden(new TaskSeparator(STYLE, 's', 1))).toBe(false);
    });

    it('hidden when it ends before minDay or starts after the end of maxDay', () => {
      const b = bounds();
      expect(b.isHidden(taskOf('before', 1, 2))).toBe(true); // ends 03-03, last day 03-02
      expect(b.isHidden(taskOf('after', 9, 1))).toBe(true);
      expect(b.isHidden(taskOf('overlap', 5, 2))).toBe(false); // last day 03-06 = minDay
      expect(b.isHidden(taskOf('edge', 8, 1))).toBe(false); // starts on maxDay
    });
  });

  it('getBarsColumnWidth is the width between minDay and the end of maxDay (java:120-124)', () => {
    const b = new TimeBoundsData();
    b.setMinDay(date(4));
    b.setMaxDay(date(10));
    const scale = new TimeScaleDaily(16, day(4), 1, undefined);
    const header = { getTimeScale: () => scale } as unknown as TimeHeader;
    expect(b.getBarsColumnWidth(header)).toBe(scale.getPosition(day(11)) - scale.getPosition(day(4)));
    expect(b.getBarsColumnWidth(header)).toBe(7 * 16);
  });

  describe('initMinMax (java:126-150)', () => {
    it('no tasks: maxDay = minDay', () => {
      const b = new TimeBoundsData();
      b.setMinDay(date(4));
      b.initMinMax(new GanttModelData(), new DayCalendarData());
      expect(b.getMaxDay().toString()).toBe('2024-03-04');
    });

    it('maxDay is the day of the latest (end - 1 second), skipping separators and groups', () => {
      const m = new GanttModelData();
      const a = taskOf('A', 4, 2); // end 03-06T00:00 -> 03-05
      const c = taskOf('C', 4, 5); // end 03-09T00:00 -> 03-08
      const group = new TaskGroup(undefined, STYLE, TaskCode.fromId('G'));
      const sep = new TaskSeparator(STYLE, 's', 1);
      for (const t of [a, c, group, sep]) m.putTask(t.getCode(), t);
      const b = new TimeBoundsData();
      b.initMinMax(m, new DayCalendarData());
      expect(b.getMaxDay().toString()).toBe('2024-03-08');
    });

    it('colour days and name days beyond maxDay raise it; earlier ones do not', () => {
      const m = new GanttModelData();
      const a = taskOf('A', 4, 2);
      m.putTask(a.getCode(), a);
      const cal = new DayCalendarData();
      cal.putColorDay(day(20), {} as never);
      cal.putColorDay(day(2), {} as never);
      cal.putNameDay(day(25), 'holiday');
      cal.putNameDay(day(30), 'later');
      cal.putNameDay(day(1), 'earlier');
      const b = new TimeBoundsData();
      b.initMinMax(m, cal);
      expect(b.getMaxDay().toString()).toBe('2024-03-30');
    });

    it('with no tasks a colour day still raises maxDay above minDay', () => {
      const cal = new DayCalendarData();
      cal.putColorDay(day(9), {} as never);
      const b = new TimeBoundsData();
      b.setMinDay(date(4));
      b.initMinMax(new GanttModelData(), cal);
      expect(b.getMaxDay().toString()).toBe('2024-03-09');
    });
  });

  it('durationInDays counts days from minDay to maxDay (java:152-154)', () => {
    const b = new TimeBoundsData();
    b.setMinDay(date(4));
    b.setMaxDay(date(10));
    expect(b.durationInDays()).toBe(6);
  });
});
