import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { DaysAsDates } from '../../../../src/diagrams/gantt/DaysAsDates.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import { SubjectDaysAsDates } from '../../../../src/diagrams/gantt/lang/SubjectDaysAsDates.js';

// Expected values: SubjectDaysAsDates.java:58-202.
const subject = SubjectDaysAsDates.ME;
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
const dates = (g: GanttDiagram, s: string): string[] =>
  [...(subject.getMe(g, subjectMatch(s)).get() as DaysAsDates)].map((d) => d.toString());

describe('SubjectDaysAsDates', () => {
  it.each([
    '2020-07-01 to 2020-07-03', // toUBrexB, java:70-77
    '2020-07-01   to   2020-07-03',
    'd+1 to d+3', // toUBrexE, java:79-87
    'D+1 to D+3',
    '2020-07-01 and 3 days', // andUBrex, java:89-98
    '2020-07-01 and 1 day',
    'then 2 days', // thenUBrex, java:100-109
    'then 1 day',
  ])('subject accepts %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(true);
  });

  it.each([
    '',
    '2020-07-01',
    '2020-07-01 to',
    'to 2020-07-03',
    'd+1',
    'd1 to d3', // the + is literal (java:81,84)
    'd+1 to 2020-07-03',
    '2020-07-01 and days',
    'then days',
    'then 2',
    'and 3 days',
  ])('subject rejects %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('captures the named parts (java:72,82,85,94,104)', () => {
    expect(subjectMatch('2020-07-01 to 2021-08-09').findFirstValueByKey('BYEAR2')).toBe('2021');
    expect(subjectMatch('d+1 to d+3').findFirstValueByKey('ECOUNT2')).toBe('3');
    expect(subjectMatch('2020-07-01 and 3 days').findFirstValueByKey('COUNT_AND')).toBe('3');
    expect(subjectMatch('then 2 days').findFirstValueByKey('COUNT_THEN')).toBe('2');
  });

  it('getMe on two literal dates is the inclusive range (java:124-126)', () => {
    expect(dates(newGantt(), '2020-07-01 to 2020-07-03')).toEqual(['2020-07-01', '2020-07-02', '2020-07-03']);
  });

  it('getMe on dN to dM counts from the min time point (java:136-138)', () => {
    expect(dates(started(), 'd+1 to d+3')).toEqual(['2020-07-02', '2020-07-03', '2020-07-04']);
  });

  // DaysAsDates(gantt, date1, count) walks forward until `count` open days passed (DaysAsDates.java:56-66) and the
  // iterator is inclusive of date2, so N days yields N+1 dates.
  it('getMe on <date> and N days spans the date through N open days later (java:112-117)', () => {
    expect(dates(started(), '2020-07-10 and 3 days')).toEqual(['2020-07-10', '2020-07-11', '2020-07-12', '2020-07-13']);
  });

  it('getMe on then N days starts at gantt.getThenDate() (java:118-123)', () => {
    const gantt = started();
    const then = gantt.getThenDate().toDay();
    const expected = [0, 1, 2].map((n) => then.plusDays(n).toString());
    expect(dates(gantt, 'then 2 days')).toEqual(expected);
  });

  it('getMe with no date capture at all throws IllegalStateException (java:139)', () => {
    expect(() => subject.getMe(newGantt(), subjectMatch('x'))).toThrow('IllegalStateException');
  });

  it('has four verb phrases: closed, open, colored, named (java:146,156,166,177)', () => {
    expect(subject.getVerbPhrases().map((p) => p.toString().split(' ').pop())).toEqual([
      'ComplementClose',
      'ComplementOpen',
      'ComplementInColors2',
      'ComplementNamed',
    ]);
  });

  it('"2020-07-10 to 2020-07-12 are closed" closes each day of the range (java:146-154)', () => {
    const gantt = started();
    expect(say(gantt, '2020-07-10 to 2020-07-12 are closed')).toBe('ok');
    expect([9, 10, 11, 12, 13].map((d) => closed(gantt, 2020, 7, d))).toEqual([false, true, true, true, false]);
  });

  it('"d+8 to d+9 are open" opens each day (java:156-164), overriding a close', () => {
    const gantt = started();
    say(gantt, '2020-07-09 to 2020-07-10 are closed');
    expect(say(gantt, '2020-07-09 to 2020-07-10 are open')).toBe('ok');
    expect([9, 10].map((d) => closed(gantt, 2020, 7, d))).toEqual([false, false]);
  });

  it('"2020-07-10 and 2 days are closed for [A]" uses the per-task calendar (java:150-151)', () => {
    const gantt = started();
    expect(say(gantt, '2020-07-10 and 2 days are closed for [A]')).toBe('ok');
    expect(closed(gantt, 2020, 7, 10)).toBe(false);
    const forTask = calendar(gantt).getOpenCloseForTask('A');
    expect([10, 11, 12].map((d) => forTask.isClosed(LocalDate.of(2020, 7, d)))).toEqual([true, true, true]);
    expect(forTask.isClosed(LocalDate.of(2020, 7, 13))).toBe(false);
  });

  it('"d+1 to d+2 are colored in #AAF" colours each day with the centre colour (java:166-175)', () => {
    const gantt = started();
    expect(say(gantt, 'd+1 to d+2 are colored in #AAF')).toBe('ok');
    const color = (d: number) =>
      asString(calendar(gantt).getDayColor(TimePoint.ofStartOfDay(LocalDate.of(2020, 7, d))));
    expect([1, 2, 3, 4].map(color)).toEqual([undefined, '#AAAAFF', '#AAAAFF', undefined]);
  });

  it('"2020-07-04 and 2 days are named [Holiday]" names each day (java:177-187 -> nameDay)', () => {
    const gantt = started();
    expect(say(gantt, '2020-07-04 and 2 days are named [Holiday]')).toBe('ok');
    const name = (d: number) => calendar(gantt).getDayName(TimePoint.ofStartOfDay(LocalDate.of(2020, 7, d)));
    expect([3, 4, 5, 6, 7].map(name)).toEqual([undefined, 'Holiday', 'Holiday', 'Holiday', undefined]);
  });
});
