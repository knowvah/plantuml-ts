import { describe, expect, it, vi } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { SubjectWorkingHours } from '../../../../src/diagrams/gantt/lang/SubjectWorkingHours.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: SubjectWorkingHours.java:61-93.
const subject = SubjectWorkingHours.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const line = (s: string): StringLocated => new StringLocated(s, undefined);
const command = new NaturalGanttCommand(subject);

describe('SubjectWorkingHours', () => {
  it.each(['from 08:00 to 12:00', 'from  8:0  to  12:30', 'From 08:00 to 17:00'])(
    'subject accepts %s (java:70-77)',
    (s) => {
      expect(subjectMatch(s).exactMatch()).toBe(true);
    },
  );

  it.each(['from 08:00', 'from 08 to 12', '08:00 to 12:00', 'from 08:00 until 12:00', 'from 08:00 to'])(
    'subject rejects %s (java:70-77)',
    (s) => {
      expect(subjectMatch(s).exactMatch()).toBe(false);
    },
  );

  it('getMe builds the TimeRange from START and END (java:61-66)', () => {
    const range = subject.getMe(newGantt(), subjectMatch('from 08:00 to 12:30')).get() as TimeRange;
    expect(range.getStart()?.toString()).toBe('08:00');
    expect(range.getEnd()?.toString()).toBe('12:30');
  });

  it('absent START/END give a TimeRange with null bounds (java:63-65)', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    const range = subject.getMe(newGantt(), { ...subjectMatch('from 8:00 to 9:00'), ...none }).get() as TimeRange;
    expect(range.getStart()).toBeNull();
    expect(range.getEnd()).toBeNull();
  });

  it('has the single "are working hours" verb phrase (java:83-90)', () => {
    expect(subject.getVerbPhrases()).toHaveLength(1);
    expect(subject.getVerbPhrases()[0]!.toString()).toContain('ComplementWorkingHours');
  });

  it('"from 08:00 to 12:00 are working hours" adds the range (java:86-89 -> GanttDiagram.addWorkingTimeRange)', () => {
    const gantt = newGantt();
    const spy = vi.spyOn(gantt, 'addWorkingTimeRange');
    const text = 'from 08:00 to 12:00 are working hours';
    expect(command.isValid(line(text))).toBe('OK');
    expect(command.execute(gantt, line(text), ParserPass.ONE).isOk()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const range = spy.mock.calls[0]![0];
    expect(range).toBeInstanceOf(TimeRange);
    expect(range.getStart()?.toString()).toBe('08:00');
    expect(range.getEnd()?.toString()).toBe('12:00');
  });

  it('a different verb is not valid (java:83-90)', () => {
    expect(command.isValid(line('from 08:00 to 12:00 are closed'))).toBe('NOT_OK');
  });
});
