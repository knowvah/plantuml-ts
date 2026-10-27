import { describe, expect, it } from 'vitest';
import type { Display } from '../../../../src/core/klimt/creole/Display.js';
import type { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { Url } from '../../../../src/core/url/Url.js';
import { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import type { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskImpl.java
// (line numbers cited per test). Dates are worked out by hand from the calendar: 2024-03-04 is a Monday.

const STYLE = {} as unknown as StyleBuilder;
type Gantt = ConstructorParameters<typeof TaskImpl>[0];

/** The two GanttDiagram members TaskImpl calls: durationOfDays (GanttDiagram.java:575) and
 * getLoadPlanableForTask (GanttDiagram.java:296-299), over the real DayCalendarData. */
function ganttOver(calendar: DayCalendarData): Gantt {
  return {
    durationOfDays: (n: number) => calendar.durationOfDays(n),
    getLoadPlanableForTask: (id: string) =>
      calendar.getOpenClose().mutateMe(calendar.getOpenCloseForTask(id)).asPiecewiseConstant(),
  } as unknown as Gantt;
}

const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);
const iso = (t: TimePoint): string => t.toString();
const date = (d: number): LocalDate => LocalDate.of(2024, 3, d);

function task(start: TimePoint = day(4), calendar: DayCalendarData = new DayCalendarData()): TaskImpl {
  return new TaskImpl(ganttOver(calendar), STYLE, TaskCode.fromIdAndDisplay('T', 'Task T'), start, 0);
}

describe('TaskImpl', () => {
  it('constructor: start as given, one-day load, end the next day (java:100-108)', () => {
    const t = task();
    expect(iso(t.getStart())).toBe('2024-03-04T00:00');
    expect(t.getLoad().equals(Load.of(Duration.ofDays(1)))).toBe(true);
    expect(iso(t.getEnd())).toBe('2024-03-05T00:00');
    expect(iso(t.getEndMinusOneDayTOBEREMOVED())).toBe('2024-03-04T00:00');
  });

  it('setLoad / setEnd drive the solver and invalidate the caches (java:274-299)', () => {
    const t = task();
    expect(iso(t.getEnd())).toBe('2024-03-05T00:00');
    t.setLoad(Load.of(Duration.ofDays(3)));
    expect(iso(t.getEnd())).toBe('2024-03-07T00:00');
    t.setStart(day(5));
    expect(iso(t.getStart())).toBe('2024-03-05T00:00');
    expect(iso(t.getEnd())).toBe('2024-03-08T00:00');
  });

  it('a paused day of week stretches the task (java:114-135, :182-192)', () => {
    const t = task(day(5));
    t.setLoad(Load.of(Duration.ofDays(2)));
    t.addPause(DayOfWeek.WEDNESDAY);
    // Tuesday works, Wednesday is paused, Thursday works.
    expect(iso(t.getEnd())).toBe('2024-03-08T00:00');
  });

  it('setEnd replaces the oldest of START/LOAD in the solver, so start is derived from end and load (java:293-298)', () => {
    const t = task(day(4));
    t.setEnd(day(9));
    expect(iso(t.getEnd())).toBe('2024-03-09T00:00');
    expect(iso(t.getStart())).toBe('2024-03-08T00:00');
  });

  it('paused dates are kept ascending whatever the insertion order (TreeSet, java:69)', () => {
    const t = task(day(4));
    t.addPause(date(2));
    t.addPause(date(6));
    t.addPause(date(3));
    expect(t.getAllPaused().map((d) => d.toString())).toEqual(['2024-03-02', '2024-03-03', '2024-03-06']);
  });

  it('a paused date stretches the task (java:120-131)', () => {
    const t = task(day(5));
    t.setLoad(Load.of(Duration.ofDays(2)));
    t.addPause(date(6));
    expect(iso(t.getEnd())).toBe('2024-03-08T00:00');
  });

  it('a non-diamond start skips leading zero-load days; a diamond keeps it (java:245-262)', () => {
    const t = task(day(6));
    t.addPause(DayOfWeek.WEDNESDAY);
    expect(iso(t.getStart())).toBe('2024-03-07T00:00');
    const d = task(day(6));
    d.setDiamond(true);
    d.addPause(DayOfWeek.WEDNESDAY);
    expect(d.isDiamond()).toBe(true);
    expect(iso(d.getStart())).toBe('2024-03-06T00:00');
  });

  it('getAllPaused merges dates and the weekdays inside [start, end-1], ascending, no duplicates (java:349-363)', () => {
    const t = task(day(4));
    t.setLoad(Load.of(Duration.ofDays(5)));
    t.addPause(date(6));
    t.addPause(date(6));
    t.addPause(date(2));
    t.addPause(DayOfWeek.SATURDAY);
    t.addPause(DayOfWeek.WEDNESDAY);
    // Worked days Mon 04, Tue 05, Thu 07, Fri 08, Sun 10 -> [04, 10]; Wed 06 and Sat 09 fall inside,
    // the pause on Sat 02 (before the start) is kept as a date.
    expect(t.getAllPaused().map((d) => d.toString())).toEqual(['2024-03-02', '2024-03-06', '2024-03-09']);
  });

  it('getAllPaused with nothing paused is empty (java:349-355)', () => {
    expect(task().getAllPaused()).toEqual([]);
  });

  describe('resources', () => {
    it('getPrettyDisplay lists {name} and {name:pct%} when not 100 (java:214-234)', () => {
      const t = task();
      expect(t.getPrettyDisplay()).toBe('Task T');
      t.addResource(new Resource('R1'), 100);
      t.addResource(new Resource('R2'), 50);
      expect(t.getPrettyDisplay()).toBe('Task T {R1} {R2:50%}');
    });

    it('a re-put keeps the original position and updates the percentage (LinkedHashMap#put, java:305-309)', () => {
      const t = task();
      t.addResource(new Resource('R1'), 100);
      t.addResource(new Resource('R2'), 100);
      t.addResource(new Resource('R1'), 25);
      expect(t.getPrettyDisplay()).toBe('Task T {R1:25%} {R2}');
    });

    it('isAssignedTo is by resource name (java:378-381)', () => {
      const t = task();
      t.addResource(new Resource('R1'), 100);
      expect(t.isAssignedTo(new Resource('R1'))).toBe(true);
      expect(t.isAssignedTo(new Resource('R2'))).toBe(false);
    });

    it('a 50% resource doubles the duration of a one-day load (java:137-148, :194-212)', () => {
      const t = task();
      t.addResource(new Resource('R1'), 50);
      expect(iso(t.getEnd())).toBe('2024-03-06T00:00');
    });

    it('loadForResource: percentage inside [start, end-1], 0 outside, paused or closed (java:168-180)', () => {
      const t = task();
      t.setLoad(Load.of(Duration.ofDays(3)));
      const r = new Resource('R1');
      t.addResource(r, 40);
      expect(t.loadForResource(r, day(4))).toBe(40);
      expect(t.loadForResource(r, day(3))).toBe(0);
      expect(t.loadForResource(r, day(20))).toBe(0);
      expect(t.loadForResource(new Resource('other'), day(4))).toBe(0);
      r.addCloseDay(date(5));
      expect(t.loadForResource(r, day(5))).toBe(0);
      t.addPause(date(4));
      expect(t.loadForResource(r, day(4))).toBe(0);
      t.addPause(DayOfWeek.TUESDAY);
      expect(t.loadForResource(r, day(5))).toBe(0);
    });

    it('a paused date INSIDE the task gives the resource no load that day (java:150-158, :168-173)', () => {
      const t = task();
      t.setLoad(Load.of(Duration.ofDays(3)));
      const r = new Resource('R1');
      t.addResource(r, 100);
      t.addPause(date(5));
      // Mon 4, (Tue 5 paused), Wed 6, Thu 7: the task ends the morning of the 8th, so [start, end-1] = [4, 7]
      expect(iso(t.getStart())).toBe('2024-03-04T00:00');
      expect(iso(t.getEndMinusOneDayTOBEREMOVED())).toBe('2024-03-07T00:00');
      expect([4, 5, 6, 7].map((d) => t.loadForResource(r, day(d)))).toEqual([100, 0, 100, 100]);
    });

    it('a paused day of week INSIDE the task gives the resource no load that day (java:160-166, :168-173)', () => {
      const t = task();
      t.setLoad(Load.of(Duration.ofDays(3)));
      const r = new Resource('R1');
      t.addResource(r, 100);
      t.addPause(DayOfWeek.WEDNESDAY);
      // Mon 4, Tue 5, (Wed 6 paused), Thu 7
      expect(iso(t.getEndMinusOneDayTOBEREMOVED())).toBe('2024-03-07T00:00');
      expect([4, 5, 6, 7].map((d) => t.loadForResource(r, day(d)))).toEqual([100, 100, 0, 100]);
    });
  });

  describe('colors, completion, url, note', () => {
    const marker = { tag: 'blended' } as unknown as CenterBorderColor;
    const fake = (calls: [CenterBorderColor, number][]): CenterBorderColor =>
      ({
        unlinearTo: (other: CenterBorderColor, completion: number) => {
          calls.push([other, completion]);
          return marker;
        },
      }) as unknown as CenterBorderColor;

    it('no colours -> undefined; one colour -> itself (java:336-343)', () => {
      const t = task();
      expect(t.getColors()).toBeUndefined();
      const a = fake([]);
      t.setColors(a);
      expect(t.getColors()).toBe(a);
    });

    it('two colours -> first.unlinearTo(second, completion) (java:336-343)', () => {
      const calls: [CenterBorderColor, number][] = [];
      const a = fake(calls);
      const b = fake([]);
      const t = task();
      t.setColors(a, b);
      t.setCompletion(30);
      expect(t.getCompletion()).toBe(30);
      expect(t.getColors()).toBe(marker);
      expect(calls).toEqual([[b, 30]]);
    });

    it('an empty colour list is the Java ArrayIndexOutOfBoundsException (java:340)', () => {
      const t = task();
      t.setColors();
      expect(() => t.getColors()).toThrow('ArrayIndexOutOfBoundsException');
    });

    it('a colour list of length > 1 is read as [0], [1] only (java:342)', () => {
      const t = task();
      t.setColors(fake([]), fake([]), fake([]));
      expect(t.getColors()).toBe(marker);
    });

    it('url and note round-trip (java:91-93, :332-334, :365-376)', () => {
      const t = task();
      expect(t.getUrl()).toBeUndefined();
      expect(t.getNote()).toBeUndefined();
      expect(t.getNoteStereotype()).toBeUndefined();
      const url = { tag: 'url' } as unknown as Url;
      const note = { tag: 'note' } as unknown as Display;
      const stereotype = { tag: 'st' } as unknown as Stereotype;
      t.setUrl(url);
      t.setNote(note, stereotype);
      expect(t.getUrl()).toBe(url);
      expect(t.getNote()).toBe(note);
      expect(t.getNoteStereotype()).toBe(stereotype);
    });

    it('the constructor completion is returned (java:100-103)', () => {
      const t = new TaskImpl(ganttOver(new DayCalendarData()), STYLE, TaskCode.fromId('X'), day(4), 77);
      expect(t.getCompletion()).toBe(77);
    });
  });

  it('debug prints start ---> end [load] (java:241-243)', () => {
    expect(task().debug()).toBe(`2024-03-04T00:00 ---> 2024-03-05T00:00   [${Load.of(Duration.ofDays(1)).toString()}]`);
  });

  it('getDefaultPlan asks the diagram for the task id (java:110-112)', () => {
    const asked: string[] = [];
    const calendar = new DayCalendarData();
    const gantt = {
      durationOfDays: (n: number) => calendar.durationOfDays(n),
      getLoadPlanableForTask: (id: string) => {
        asked.push(id);
        return calendar.getOpenClose().asPiecewiseConstant();
      },
    } as unknown as Gantt;
    const t = new TaskImpl(gantt, STYLE, TaskCode.fromIdAndDisplay('ID7', 'shown'), day(4), 0);
    t.getDefaultPlan();
    expect(asked).toEqual(['ID7']);
  });

  it('toString: TaskCode has no toString upstream, so the Object default (java:236-239)', () => {
    expect(task().toString()).toBe(Object.prototype.toString.call(TaskCode.fromId('T')));
  });
});
