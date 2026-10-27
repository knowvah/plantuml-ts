import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import { SubjectDayOfWeek } from '../../../../src/diagrams/gantt/lang/SubjectDayOfWeek.js';

// Expected values: SubjectDayOfWeek.java:54-108.
const subject = SubjectDayOfWeek.ME;
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

describe('SubjectDayOfWeek', () => {
  it.each(['saturday', 'Saturday', 'sat', 'SUNDAY', 'mon', 'tuesday', 'wednesday', 'thu', 'friday'])(
    'subject accepts %s (java:63 -> DayOfWeekUtils.getUbrex)',
    (s) => {
      expect(subjectMatch(s).exactMatch()).toBe(true);
    },
  );

  it.each(['', 'sa', 'day', 'satx1', '2020-07-04'])('subject rejects %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('getMe maps the SUBJECT capture to the DayOfWeek (java:101-106 -> DayOfWeekUtils.fromString)', () => {
    expect(subject.getMe(newGantt(), subjectMatch('saturday')).get()).toBe(DayOfWeek.SATURDAY);
    expect(subject.getMe(newGantt(), subjectMatch('Mon')).get()).toBe(DayOfWeek.MONDAY);
  });

  it('has three verb phrases: are open, are closed, is|are colored (java:69,78,87)', () => {
    const phrases = subject.getVerbPhrases();
    expect(phrases).toHaveLength(3);
    expect(phrases.map((p) => p.toString().split(' ').pop())).toEqual([
      'ComplementOpen',
      'ComplementClose',
      'ComplementInColors2',
    ]);
  });

  it('"saturday are closed" closes every Saturday (java:78-85 -> closeDayOfWeek)', () => {
    const gantt = started();
    expect(closed(gantt, 2020, 7, 4)).toBe(false);
    expect(say(gantt, 'saturday are closed')).toBe('ok');
    expect(closed(gantt, 2020, 7, 4)).toBe(true);
    expect(closed(gantt, 2020, 7, 11)).toBe(true);
    expect(closed(gantt, 2020, 7, 5)).toBe(false);
  });

  it('"sunday are open" after "sunday are closed" re-opens it (java:69-76 -> openDayOfWeek)', () => {
    const gantt = started();
    say(gantt, 'sunday are closed');
    expect(closed(gantt, 2020, 7, 5)).toBe(true);
    expect(say(gantt, 'sunday are open')).toBe('ok');
    expect(closed(gantt, 2020, 7, 5)).toBe(false);
  });

  it('"friday are open for [A]" opens it on the per-task calendar only (java:71-73, ComplementOpen A)', () => {
    const gantt = started();
    expect(say(gantt, 'friday are closed')).toBe('ok');
    expect(say(gantt, 'friday are open for [A]')).toBe('ok');
    expect(closed(gantt, 2020, 7, 3)).toBe(true);
    expect(
      calendar(gantt)
        .getOpenCloseForTask('A')
        .isClosed(LocalDate.of(2020, 7, 3)),
    ).toBe(false);
  });

  it('"saturday are colored in #AAF" colours the weekday with the centre colour (java:87-96)', () => {
    const gantt = started();
    expect(say(gantt, 'saturday are colored in #AAF')).toBe('ok');
    expect(asString(calendar(gantt).getDayOfWeekColor(DayOfWeek.SATURDAY))).toBe('#AAAAFF');
    expect(calendar(gantt).getDayOfWeekColor(DayOfWeek.SUNDAY)).toBeUndefined();
  });

  it('"saturday is coloured #AAF/#F00" uses only the centre colour (java:90 getCenter)', () => {
    const gantt = started();
    expect(say(gantt, 'saturday is coloured #AAF/#F00')).toBe('ok');
    expect(asString(calendar(gantt).getDayOfWeekColor(DayOfWeek.SATURDAY))).toBe('#AAAAFF');
  });

  it('chains two phrases with and (NaturalGanttCommand), as in the corpus', () => {
    const gantt = started();
    expect(say(gantt, 'saturday are closed and are colored in #AAF')).toBe('ok');
    expect(closed(gantt, 2020, 7, 4)).toBe(true);
    expect(asString(calendar(gantt).getDayOfWeekColor(DayOfWeek.SATURDAY))).toBe('#AAAAFF');
  });
});
