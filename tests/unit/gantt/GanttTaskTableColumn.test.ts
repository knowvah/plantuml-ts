import { describe, expect, it } from 'vitest';
import type { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { LocalDate } from '../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../src/core/time/LocalDateTime.js';
import { newLocale } from '../../../src/core/utils/I18nTimeData.js';
import { AbstractTask, unsupportedOperation } from '../../../src/diagrams/gantt/core/AbstractTask.js';
import { TaskCode } from '../../../src/diagrams/gantt/core/TaskCode.js';
import { Context, GanttTaskTableColumn } from '../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { TimePoint } from '../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java
const EN = newLocale('en');
const at = (d: number, h = 0, m = 0, s = 0): TimePoint => TimePoint.of(LocalDateTime.of(2024, 3, d, h, m, s));

class FakeTask extends AbstractTask {
  constructor(
    code: TaskCode,
    readonly start: TimePoint,
    readonly end: TimePoint,
  ) {
    super({} as unknown as StyleBuilder, code);
  }
  getStart(): TimePoint {
    return this.start;
  }
  getEnd(): TimePoint {
    return this.end;
  }
  getLoad = unsupportedOperation;
  setLoad = unsupportedOperation;
  setStart = unsupportedOperation;
  setEnd = unsupportedOperation;
  setColors = unsupportedOperation;
  addResource = unsupportedOperation;
  setDiamond = unsupportedOperation;
  isDiamond = unsupportedOperation;
  setCompletion = unsupportedOperation;
  setUrl = unsupportedOperation;
  addPause = unsupportedOperation;
  setNote = unsupportedOperation;
  isAssignedTo = unsupportedOperation;
}

const task = (start: TimePoint, end: TimePoint): FakeTask =>
  new FakeTask(TaskCode.fromIdAndDisplay('T1', 'First task'), start, end);
const absolute = new Context(EN, false, LocalDate.of(2024, 3, 1));
const relative = new Context(EN, true, LocalDate.of(2024, 3, 1));

describe('GanttTaskTableColumn enum surface', () => {
  it('values() in declaration order (java:62-112) with ordinals', () => {
    expect(GanttTaskTableColumn.values().map((c) => `${c.ordinal()}${c.name()}`)).toEqual([
      '0TASK',
      '1START',
      '2END',
      '3DURATION',
    ]);
  });

  it('SECONDS_IN_A_DAY = 86400 (java:116)', () => {
    expect(GanttTaskTableColumn.SECONDS_IN_A_DAY).toBe(86400);
  });

  it('of() upper-cases; unknown is undefined (java:202-208, null)', () => {
    expect(GanttTaskTableColumn.of('start')).toBe(GanttTaskTableColumn.START);
    expect(GanttTaskTableColumn.of('Duration')).toBe(GanttTaskTableColumn.DURATION);
    expect(GanttTaskTableColumn.of('nope')).toBeUndefined();
  });

  it('valueOf rejects an unknown name', () => {
    expect(() => GanttTaskTableColumn.valueOf('nope')).toThrow('IllegalArgumentException');
    expect(GanttTaskTableColumn.END.toString()).toBe('END');
  });

  it('getUbrex() matches each name in both listed cases (java:210-217)', () => {
    const part = GanttTaskTableColumn.getUbrex();
    for (const word of ['TASK', 'task', 'START', 'start', 'END', 'end', 'DURATION', 'duration'])
      expect(part.match(word).exactMatch()).toBe(true);
    // ubrex letter leaves match case-insensitively, so any case of a column name matches
    expect(part.match('taSK').exactMatch()).toBe(true);
    expect(part.match('TASKS').exactMatch()).toBe(false);
    expect(part.match('TAS').exactMatch()).toBe(false);
  });
});

describe('GanttTaskTableColumn headers (java:62-112)', () => {
  it('delegate to GanttI18n', () => {
    expect(GanttTaskTableColumn.values().map((c) => c.header(newLocale('de')))).toEqual([
      'Aufgabe',
      'Start',
      'Ende',
      'Dauer',
    ]);
  });
});

describe('GanttTaskTableColumn values', () => {
  const t = task(at(2), at(6));

  it('TASK is the code display (java:70)', () => {
    expect(GanttTaskTableColumn.TASK.valueOf(t, absolute)).toBe('First task');
  });

  it('START at midnight is the day only (java:156-182)', () => {
    expect(GanttTaskTableColumn.START.valueOf(t, absolute)).toBe('Mar 2');
  });

  it('START with a time appends HH:mm, and :ss only when seconds != 0', () => {
    expect(GanttTaskTableColumn.START.valueOf(task(at(2, 14, 30), at(6)), absolute)).toBe('Mar 2 14:30');
    expect(GanttTaskTableColumn.START.valueOf(task(at(2, 9, 5, 7), at(6)), absolute)).toBe('Mar 2 09:05:07');
  });

  it('END at midnight steps back one second to the last included day (java:184-193)', () => {
    expect(GanttTaskTableColumn.END.valueOf(t, absolute)).toBe('Mar 5');
  });

  it('END with a time of day is shown as-is', () => {
    expect(GanttTaskTableColumn.END.valueOf(task(at(2), at(6, 17, 45)), absolute)).toBe('Mar 6 17:45');
  });

  it('relative mode shows day numbers from minDay (java:149-155, :195-198)', () => {
    expect(GanttTaskTableColumn.START.valueOf(t, relative)).toBe('Day 2');
    expect(GanttTaskTableColumn.END.valueOf(t, relative)).toBe('Day 5');
    expect(relative.getLocale()).toBe(EN);
  });

  it('DURATION is Duration.between humanised (java:98-113)', () => {
    expect(GanttTaskTableColumn.DURATION.valueOf(t, absolute)).toBe('4 days');
    expect(GanttTaskTableColumn.DURATION.valueOf(task(at(2), at(2, 1, 30)), absolute)).toBe('1 hour, 30 minutes');
  });
});
