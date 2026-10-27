import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import { SubjectDayAsDate } from '../../../../src/diagrams/gantt/lang/SubjectDayAsDate.js';

// Expected values: SubjectDayAsDate.java:56-145.
const subject = SubjectDayAsDate.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const command = new NaturalGanttCommand(subject);
const line = (s: string): StringLocated => new StringLocated(s, undefined);

/** Run one sentence through the natural-language command; the result message ('ok' or the error). */
function say(gantt: GanttDiagram, text: string): string {
  expect(command.isValid(line(text))).toBe('OK');
  const result = command.execute(gantt, line(text), ParserPass.ONE);
  return result.isOk() ? 'ok' : result.getError();
}

/** `dayCalendar` is protected on the diagram; the data object it holds is what the verb phrases mutate. */
const calendar = (d: GanttDiagram) => (d as unknown as { dayCalendar: DayCalendarData }).dayCalendar;
const asString = (c: unknown): string | undefined => (c as HColorSimple | undefined)?.asString();
const closed = (d: GanttDiagram, y: number, m: number, day: number): boolean =>
  calendar(d)
    .getOpenClose()
    .isClosed(LocalDate.of(y, m, day));

const START = LocalDate.of(2020, 7, 1); // a Wednesday
const started = (): GanttDiagram => {
  const gantt = newGantt();
  gantt.updateStartingPoint(START);
  return gantt;
};

describe('SubjectDayAsDate', () => {
  it.each(['2020-07-14', '2020/7/4', '20-7-4', 'd+3', 'D-1', 't+0', 'T-2', 'e+5', 'E-1'])(
    'subject accepts %s (java:128-143)',
    (s) => {
      expect(subjectMatch(s).exactMatch()).toBe(true);
    },
  );

  it.each(['', '2020-07', 'd3', 'x+3', 'd+', 'd+x', 'july', '2020-07-14-1'])('subject rejects %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('getMe on a literal date gives that LocalDate (java:106-111)', () => {
    expect((subject.getMe(newGantt(), subjectMatch('2020-07-14')).get() as LocalDate).toString()).toBe('2020-07-14');
    expect((subject.getMe(newGantt(), subjectMatch('2020/7/4')).get() as LocalDate).toString()).toBe('2020-07-04');
  });

  it('getMe d+N / d-N counts from the minimum day (java:113-120)', () => {
    const gantt = started();
    expect((subject.getMe(gantt, subjectMatch('d+3')).get() as LocalDate).toString()).toBe('2020-07-04');
    expect((subject.getMe(gantt, subjectMatch('D-1')).get() as LocalDate).toString()).toBe('2020-06-30');
  });

  it('getMe t+N counts from today (java:121-122)', () => {
    const gantt = started();
    gantt.setToday(LocalDate.of(2020, 7, 10));
    expect((subject.getMe(gantt, subjectMatch('t+2')).get() as LocalDate).toString()).toBe('2020-07-12');
    expect((subject.getMe(gantt, subjectMatch('T-2')).get() as LocalDate).toString()).toBe('2020-07-08');
  });

  it('getMe e+N counts from the maximum day (java:123-124)', () => {
    const gantt = started();
    const max = gantt.getMaxDay();
    expect((subject.getMe(gantt, subjectMatch('e+2')).get() as LocalDate).toString()).toBe(max.plusDays(2).toString());
    expect((subject.getMe(gantt, subjectMatch('E-1')).get() as LocalDate).toString()).toBe(max.plusDays(-1).toString());
  });

  it('getMe on a match with neither BDAY nor ECOUNT throws IllegalStateException (java:103)', () => {
    expect(() => subject.getMe(newGantt(), subjectMatch('x'))).toThrow('IllegalStateException');
  });

  it('has three verb phrases: is|are open, closed, colored (java:66,74,82)', () => {
    expect(subject.getVerbPhrases().map((p) => p.toString().split(' ').pop())).toEqual([
      'ComplementOpen',
      'ComplementClose',
      'ComplementInColors2',
    ]);
  });

  it('"2020-07-14 is closed" closes that date only (java:74-80 -> closeDayAsDate)', () => {
    const gantt = started();
    expect(say(gantt, '2020-07-14 is closed')).toBe('ok');
    expect(closed(gantt, 2020, 7, 14)).toBe(true);
    expect(closed(gantt, 2020, 7, 15)).toBe(false);
  });

  it('"2020-07-14 is open" opens it (java:66-72); open overrides an earlier close', () => {
    const gantt = started();
    say(gantt, '2020-07-14 is closed');
    expect(say(gantt, '2020-07-14 is open')).toBe('ok');
    expect(closed(gantt, 2020, 7, 14)).toBe(false);
  });

  it('"2020-07-14 is closed for [A]" closes on the per-task calendar only (java:76-78)', () => {
    const gantt = started();
    expect(say(gantt, '2020-07-14 is closed for [A]')).toBe('ok');
    expect(closed(gantt, 2020, 7, 14)).toBe(false);
    expect(
      calendar(gantt)
        .getOpenCloseForTask('A')
        .isClosed(LocalDate.of(2020, 7, 14)),
    ).toBe(true);
  });

  it('"d+3 is colored in #AAF" colours the day (java:82-89 -> colorDay)', () => {
    const gantt = started();
    expect(say(gantt, 'd+3 is colored in #AAF')).toBe('ok');
    expect(asString(calendar(gantt).getDayColor(TimePoint.ofStartOfDay(LocalDate.of(2020, 7, 4))))).toBe('#AAAAFF');
  });
});
