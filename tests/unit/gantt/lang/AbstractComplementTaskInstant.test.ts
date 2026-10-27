import { describe, expect, it } from 'vitest';
import type { Failable } from '../../../../src/core/gantt/Failable.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../../src/core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { TaskAttribute } from '../../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { AbstractComplementTaskInstant } from '../../../../src/diagrams/gantt/lang/AbstractComplementTaskInstant.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

// The abstract class has no pattern of its own; a minimal subclass exposes getComplementTaskInstant.
class Probe extends AbstractComplementTaskInstant {
  getMe(diagram: GanttDiagram, arg: CaptureLookup): Failable<unknown> {
    return this.getComplementTaskInstant(diagram, arg);
  }
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexLeaf('x');
  }
}

const START = LocalDate.of(2020, 7, 1); // a Wednesday
const day = (y: number, m: number, d: number): TimePoint => TimePoint.ofStartOfDay(LocalDate.of(y, m, d));

function started(): GanttDiagram {
  const d = newGantt();
  d.updateStartingPoint(START);
  d.getOrCreateTask(TaskCode.fromId('A'), false);
  return d;
}

const base = { COMPLEMENT_CODE_OTHER: ['A'], COMPLEMENT_START_OR_END: ['start'] };

// Expected values: lang/AbstractComplementTaskInstant.java (:49-84).
describe('AbstractComplementTaskInstant', () => {
  const p = new Probe();

  it('an unknown task is a failure "No such task <code>" (java:53-55)', () => {
    const r = p.getComplementTaskInstant(started(), lookup({ ...base, COMPLEMENT_CODE_OTHER: ['Z'] }));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('No such task Z');
  });

  it('without a count the instant is the task start itself (java:57, 74-75)', () => {
    const d = started();
    const ti = p.getComplementTaskInstant(d, lookup(base)).get();
    expect(ti.getAttribute()).toBe(TaskAttribute.START);
    expect(ti.getMoment()).toBe(d.getExistingMoment('A'));
    expect(ti.getInstantPrecise().equals(day(2020, 7, 1))).toBe(true);
  });

  it('the attribute is read case-insensitively from the START_OR_END group (java:57, TaskAttribute.java:41-43)', () => {
    const ti = p.getComplementTaskInstant(started(), lookup({ ...base, COMPLEMENT_START_OR_END: ['END'] })).get();
    expect(ti.getAttribute()).toBe(TaskAttribute.END);
  });

  it('N days after shifts by N (java:58-61, 71)', () => {
    const r = lookup({ ...base, COMPLEMENT_NB1: ['3'], COMPLEMENT_DAY_OR_WEEK1: ['days'] });
    expect(
      p
        .getComplementTaskInstant(started(), r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 4)),
    ).toBe(true);
  });

  it('a week counts daysInWeek days, and the second term adds to the first (java:60, 63-69)', () => {
    const r = lookup({
      ...base,
      COMPLEMENT_NB1: ['1'],
      COMPLEMENT_DAY_OR_WEEK1: ['week'],
      COMPLEMENT_NB2: ['2'],
      COMPLEMENT_DAY_OR_WEEK2: ['days'],
    });
    // daysInWeek() = 7 with no closed day -> 7 + 2 = 9 days: 2020-07-10.
    expect(
      p
        .getComplementTaskInstant(started(), r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 10)),
    ).toBe(true);
  });

  it('a week in the second term also counts daysInWeek days (java:66)', () => {
    const r = lookup({
      ...base,
      COMPLEMENT_NB1: ['1'],
      COMPLEMENT_DAY_OR_WEEK1: ['day'],
      COMPLEMENT_NB2: ['1'],
      COMPLEMENT_DAY_OR_WEEK2: ['week'],
    });
    expect(
      p
        .getComplementTaskInstant(started(), r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 9)),
    ).toBe(true);
  });

  it('closed weekend days shrink the week: daysInWeek() = 5 (java:60; GanttDiagramConfig.daysInWeek)', () => {
    const d = started();
    d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
    d.closeDayOfWeek(DayOfWeek.SUNDAY, '');
    const r = lookup({ ...base, COMPLEMENT_NB1: ['1'], COMPLEMENT_DAY_OR_WEEK1: ['week'] });
    expect(
      p
        .getComplementTaskInstant(d, r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 6)),
    ).toBe(true);
  });

  it('"before" negates the delta, ignoring case (java:71-72)', () => {
    for (const word of ['before', 'BEFORE']) {
      const r = lookup({
        ...base,
        COMPLEMENT_NB1: ['3'],
        COMPLEMENT_DAY_OR_WEEK1: ['days'],
        COMPLEMENT_BEFORE_OR_AFTER: [word],
      });
      expect(
        p
          .getComplementTaskInstant(started(), r)
          .get()
          .getInstantPrecise()
          .equals(day(2020, 6, 28)),
      ).toBe(true);
    }
  });

  it('"after" keeps the delta positive (java:71-72)', () => {
    const r = lookup({
      ...base,
      COMPLEMENT_NB1: ['1'],
      COMPLEMENT_DAY_OR_WEEK1: ['day'],
      COMPLEMENT_BEFORE_OR_AFTER: ['after'],
    });
    expect(
      p
        .getComplementTaskInstant(started(), r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 2)),
    ).toBe(true);
  });

  it.each(['COMPLEMENT_WORKING1', 'COMPLEMENT_WORKING2'])(
    'a %s group selects DO_NOT_COUNT_CLOSE_DAY: closed days are not counted (java:74-80)',
    (key) => {
      const d = started();
      d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
      d.closeDayOfWeek(DayOfWeek.SUNDAY, '');
      const r = lookup({ ...base, COMPLEMENT_NB1: ['3'], COMPLEMENT_DAY_OR_WEEK1: ['days'], [key]: ['working'] });
      // Wed 07-01: Thu 02, Fri 03, (Sat/Sun skipped) Mon 06.
      expect(
        p
          .getComplementTaskInstant(d, r)
          .get()
          .getInstantPrecise()
          .equals(day(2020, 7, 6)),
      ).toBe(true);
    },
  );

  it('without a working group the calendar is ignored: weekends count (java:77-80)', () => {
    const d = started();
    d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
    d.closeDayOfWeek(DayOfWeek.SUNDAY, '');
    const r = lookup({ ...base, COMPLEMENT_NB1: ['3'], COMPLEMENT_DAY_OR_WEEK1: ['days'] });
    expect(
      p
        .getComplementTaskInstant(d, r)
        .get()
        .getInstantPrecise()
        .equals(day(2020, 7, 4)),
    ).toBe(true);
  });

  it('a non-integer count is a NumberFormatException (java:60, Integer.parseInt)', () => {
    const r = lookup({ ...base, COMPLEMENT_NB1: ['x'], COMPLEMENT_DAY_OR_WEEK1: ['days'] });
    expect(() => p.getComplementTaskInstant(started(), r)).toThrow('NumberFormatException');
  });
});
