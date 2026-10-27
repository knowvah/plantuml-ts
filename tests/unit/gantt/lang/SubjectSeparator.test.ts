import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import { SubjectSeparator } from '../../../../src/diagrams/gantt/lang/SubjectSeparator.js';

// Expected values: SubjectSeparator.java:54-113.
const subject = SubjectSeparator.ME;
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

const START = LocalDate.of(2020, 7, 1);
const started = (): GanttDiagram => {
  const gantt = newGantt();
  gantt.updateStartingPoint(START);
  return gantt;
};

describe('SubjectSeparator', () => {
  it('subject accepts "separator" only (java:63)', () => {
    expect(subjectMatch('separator').getAcceptedMatch()).toBe('separator');
    expect(subjectMatch('separators').exactMatch()).toBe(false);
    expect(subjectMatch('sep').exactMatch()).toBe(false);
  });

  it('getMe is the diagram itself (java:67-69)', () => {
    const gantt = newGantt();
    expect(subject.getMe(gantt, subjectMatch('separator')).get()).toBe(gantt);
  });

  it('has the three verb phrases, all "just" (java:75,86,97)', () => {
    const phrases = subject.getVerbPhrases();
    expect(phrases).toHaveLength(3);
    expect(phrases[2]!.toString()).toContain('ComplementBeforeOrAfterOrAtTaskStartOrEnd');
  });

  it('"separator just before 2020-07-04" puts the separator on that day (java:75-84)', () => {
    const gantt = started();
    expect(say(gantt, 'separator just before 2020-07-04')).toBe('ok');
    expect(calendar(gantt).hasSeparatorBefore(LocalDate.of(2020, 7, 4))).toBe(true);
    expect(calendar(gantt).hasSeparatorBefore(LocalDate.of(2020, 7, 5))).toBe(false);
  });

  it('"separator just after 2020-07-04" puts it on the NEXT day (java:86-95, day.plusDays(1))', () => {
    const gantt = started();
    expect(say(gantt, 'separator just after 2020-07-04')).toBe('ok');
    expect(calendar(gantt).hasSeparatorBefore(LocalDate.of(2020, 7, 5))).toBe(true);
    expect(calendar(gantt).hasSeparatorBefore(LocalDate.of(2020, 7, 4))).toBe(false);
  });

  // [A] lasts 5 days from 2020-07-01 ends (exclusive) on 2020-07-06, which is `TaskInstant.getInstantPrecise().toDay()`.
  it('"separator just [A]\'s end" puts it before the day of the task end instant (java:97-107)', () => {
    const gantt = started();
    const a = gantt.getOrCreateTask(TaskCode.fromId('A'), false);
    a.setLoad(Load.of(Duration.ofDays(5)));
    expect(say(gantt, "separator just [A]'s end")).toBe('ok');
    const days = [3, 4, 5, 6, 7].map((d) => calendar(gantt).hasSeparatorBefore(LocalDate.of(2020, 7, d)));
    expect(days).toEqual([false, false, false, true, false]);
  });
});
