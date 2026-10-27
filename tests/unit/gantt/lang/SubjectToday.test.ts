import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { SubjectToday } from '../../../../src/diagrams/gantt/lang/SubjectToday.js';
import { Today } from '../../../../src/diagrams/gantt/Today.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: SubjectToday.java:60-91.
const subject = SubjectToday.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const line = (s: string): StringLocated => new StringLocated(s, undefined);
const command = new NaturalGanttCommand(subject);

/** `dayCalendar` is protected on the diagram; `getDayColor` is the lookup `setTodayColors` feeds. */
const todayColor = (d: GanttDiagram): string | undefined => {
  const calendar = (d as unknown as { dayCalendar: { getDayColor(t: TimePoint): unknown } }).dayCalendar;
  const color = calendar.getDayColor(TimePoint.ofStartOfDay(d.getToday())) as HColorSimple | undefined;
  return color?.asString();
};

describe('SubjectToday', () => {
  it('subject accepts "today" and rejects other words (java:62)', () => {
    expect(subjectMatch('today').getAcceptedMatch()).toBe('today');
    expect(subjectMatch('tomorrow').exactMatch()).toBe(false);
    expect(subjectMatch('toda').exactMatch()).toBe(false);
  });

  it('getMe returns a Today marker (java:65-68)', () => {
    expect(subject.getMe(newGantt(), subjectMatch('today')).get()).toBeInstanceOf(Today);
  });

  it('has the two verb phrases, colored first then "is <date>" (java:73-90)', () => {
    const phrases = subject.getVerbPhrases();
    expect(phrases).toHaveLength(2);
    expect(phrases[0]!.toString()).toContain('ComplementInColors');
    expect(phrases[1]!.toString()).toContain('ComplementDate');
  });

  // Corpus: "today is 30 days after start and is colored in #AAF" (test-results/dot-cache/gantt/*/in.puml).
  it('"today is colored in #AAF" colours the today column (java:73-81 -> GanttDiagram.setTodayColors)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const text = 'today is colored in #AAF';
    expect(command.isValid(line(text))).toBe('OK');
    expect(command.execute(gantt, line(text), ParserPass.ONE).isOk()).toBe(true);
    expect(todayColor(gantt)).toBe('#AAAAFF');
  });

  it('"today is <date>" sets the today date (java:83-90 -> GanttDiagram.setToday)', () => {
    const gantt = newGantt();
    expect(command.execute(gantt, line('today is 2020-07-04'), ParserPass.ONE).isOk()).toBe(true);
    expect(gantt.getToday().toString()).toBe('2020-07-04');
  });

  it('"today is 30 days after start and is colored in #AAF" chains both phrases (corpus sentence)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const text = 'today is 30 days after start and is colored in #AAF';
    expect(command.isValid(line(text))).toBe('OK');
    expect(command.execute(gantt, line(text), ParserPass.ONE).isOk()).toBe(true);
    expect(gantt.getToday().toString()).toBe('2020-07-31');
    expect(todayColor(gantt)).toBe('#AAAAFF');
  });
});
