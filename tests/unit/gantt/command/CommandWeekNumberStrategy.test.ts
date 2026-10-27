import { describe, expect, it } from 'vitest';
import {
  applyCommandWeekNumberStrategy,
  COMMAND_WEEK_NUMBER_STRATEGY_RE,
  CommandWeekNumberStrategy,
} from '../../../../src/diagrams/gantt/command/CommandWeekNumberStrategy.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandWeekNumberStrategy.java';

const strategyOf = (d: GanttDiagram): { first: DayOfWeek; minimal: number } => {
  const s = (
    d as unknown as {
      weekConfig: {
        getWeekNumberStrategy: () => { getFirstDayOfWeek(): DayOfWeek; getMinimalDaysInFirstWeek(): number };
      };
    }
  ).weekConfig.getWeekNumberStrategy();
  return { first: s.getFirstDayOfWeek(), minimal: s.getMinimalDaysInFirstWeek() };
};

function run(line: string): GanttDiagram {
  const d = newGantt();
  const m = COMMAND_WEEK_NUMBER_STRATEGY_RE.exec(line);
  if (m === null) throw new Error(`no match: ${line}`);
  expect(applyCommandWeekNumberStrategy(d, m).isOk()).toBe(true);
  return d;
}

describe('CommandWeekNumberStrategy', () => {
  // Corpus forms.
  it.each([
    'weeks starts on Sunday and must have at least 4 days',
    'weeks starts on Sunday and must have at least 1 days',
    'weeks starts on Monday and must have at least 4 days',
    'week start monday 3',
    'Weeks Starts On Saturday 7',
  ])(`matches %s (${CMD}:59-69)`, (line) => {
    expect(COMMAND_WEEK_NUMBER_STRATEGY_RE.test(line)).toBe(true);
  });

  it.each([
    'weeks starts on Sunday and must have at least days',
    'weeks starts on Funday 4',
    'weeks starts Sunday',
    'weekstarts Sunday 4',
    'weeks begin on Sunday 4',
    'weeks starts on Sunday 4 days 5',
  ])(`rejects %j (${CMD}:59-69)`, (line) => {
    expect(COMMAND_WEEK_NUMBER_STRATEGY_RE.test(line)).toBe(false);
  });

  it('captures WEEKDAY and NUM (CommandWeekNumberStrategy.java:64,67)', () => {
    const g = COMMAND_WEEK_NUMBER_STRATEGY_RE.exec('weeks starts on Sunday and must have at least 4 days')?.groups;
    expect(g?.['WEEKDAY']).toBe('Sunday');
    expect(g?.['NUM']).toBe('4');
  });

  it('apply sets the first day and the minimal days (CommandWeekNumberStrategy.java:75-77)', () => {
    expect(strategyOf(run('weeks starts on Sunday and must have at least 1 days'))).toEqual({
      first: DayOfWeek.SUNDAY,
      minimal: 1,
    });
    expect(strategyOf(run('weeks starts on Monday and must have at least 4 days'))).toEqual({
      first: DayOfWeek.MONDAY,
      minimal: 4,
    });
  });

  it('the weekday is resolved by its first three letters (DayOfWeekUtils.java:78-86)', () => {
    expect(strategyOf(run('week start thursday 2')).first).toBe(DayOfWeek.THURSDAY);
  });

  it('a count past the int range throws NumberFormatException as Integer.parseInt does (CommandWeekNumberStrategy.java:77)', () => {
    expect(() => run('week start monday 99999999999')).toThrow(/NumberFormatException/);
  });

  it('exports { regex, apply } under the Java class name', () => {
    expect(CommandWeekNumberStrategy.regex).toBe(COMMAND_WEEK_NUMBER_STRATEGY_RE);
    expect(CommandWeekNumberStrategy.apply).toBe(applyCommandWeekNumberStrategy);
  });
});
