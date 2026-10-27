import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';
import type { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { SubjectResource } from '../../../../src/diagrams/gantt/lang/SubjectResource.js';

// Expected values: SubjectResource.java:59-194.
const subject = SubjectResource.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const command = new NaturalGanttCommand(subject);
const line = (s: string): StringLocated => new StringLocated(s, undefined);

/** Run one sentence through the natural-language command; the result message ('ok' or the error). */
function say(gantt: GanttDiagram, text: string): string {
  expect(command.isValid(line(text))).toBe('OK');
  const result = command.execute(gantt, line(text), ParserPass.ONE);
  return result.isOk() ? 'ok' : result.getError();
}

const START = LocalDate.of(2020, 7, 1); // a Wednesday
const started = (): GanttDiagram => {
  const gantt = newGantt();
  gantt.updateStartingPoint(START);
  return gantt;
};

describe('SubjectResource', () => {
  it.each(['{Alice}', '{Bob Smith}', 'she', 'he', 'they'])('subject accepts %s (java:187-191)', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(true);
  });

  it.each(['', 'Alice', '{}', '{Alice', 'Alice}', '{A{B}}', 'it', 'we'])('subject rejects %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('captures RESOURCE without braces and THEY (java:187,190)', () => {
    expect(subjectMatch('{Alice}').findFirstValueByKey('RESOURCE')).toBe('Alice');
    expect(subjectMatch('they').findFirstValueByKey('THEY')).toBe('they');
  });

  it('getMe on {Alice} gets or creates the resource and remembers it as they (java:73-77)', () => {
    const gantt = newGantt();
    const alice = subject.getMe(gantt, subjectMatch('{Alice}')).get() as Resource;
    expect(alice.getName()).toBe('Alice');
    expect(gantt.getThey()).toBe(alice);
    expect(subject.getMe(gantt, subjectMatch('{Alice}')).get()).toBe(alice);
  });

  it('getMe on she/he/they without a previous resource is an error (java:67-72)', () => {
    const r = subject.getMe(newGantt(), subjectMatch('she'));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('Not sure who are you refering to?');
  });

  it('getMe on they returns the remembered resource (java:72)', () => {
    const gantt = newGantt();
    const bob = subject.getMe(gantt, subjectMatch('{Bob}')).get();
    expect(subject.getMe(gantt, subjectMatch('he')).get()).toBe(bob);
  });

  it('has eight verb phrases in upstream order (java:85-178)', () => {
    expect(subject.getVerbPhrases().map((p) => p.toString().split(' ').pop())).toEqual([
      'ComplementTask',
      'ComplementDate',
      'ComplementDate',
      'ComplementIntervals',
      'ComplementDayOfWeek',
      'ComplementDate',
      'ComplementIntervals',
      'ComplementDate',
    ]);
  });

  // ComplementTask captures `[A]` WITH its brackets (UBrexNamed wraps taskCode, ComplementTask.java:50) and
  // getExistingTask("[A]") does not find task "A": the jar itself prints "No such task [A]" for this corpus-style
  // sentence (oracle: scripts/oracle-render.sh on `{Alice} works on [A]` after `[A] lasts 5 days`).
  it('"{Alice} works on [A]" is the jar error "No such task [A]" (java:85-93 + ComplementTask.java:55-58)', () => {
    const gantt = started();
    gantt.getOrCreateTask(TaskCode.fromId('A'), false);
    expect(say(gantt, '{Alice} works on [A]')).toBe('No such task [A]');
  });

  it('the works-on action assigns the resource to the task at 100 percent (java:87-91)', () => {
    const gantt = started();
    const task = gantt.getOrCreateTask(TaskCode.fromId('A'), false);
    const alice = gantt.getResource('Alice');
    const worksOn = subject.getVerbPhrases()[0]!;
    expect(worksOn.execute(gantt, alice, task).isOk()).toBe(true);
    expect(task.isAssignedTo(alice)).toBe(true);
    expect(task.isAssignedTo(gantt.getResource('Bob'))).toBe(false);
  });

  it('"{Alice} is off on 2020-07-10" closes that day for her only (java:143-153)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off on 2020-07-10')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([9, 10, 11].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([false, true, false]);
    expect(gantt.getResource('Bob').isClosedAt(LocalDate.of(2020, 7, 10))).toBe(false);
  });

  // The `ignored` fragment of a VerbPhraseAction is optional by construction (VerbPhraseAction.java:112-115 jumps over
  // whatever it matched, possibly nothing), so without a filler word the FIRST date phrase (off BEFORE the date,
  // java:96-97) accepts the sentence: the day itself stays open. Jar-confirmed: no error for this sentence.
  it('"{Alice} is off 2020-07-10" is read as the off-before phrase (java:96-105)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off 2020-07-10')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([9, 10, 11].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([true, false, false]);
  });

  it('"{Alice} is off from 2020-07-10 to 2020-07-12" closes the interval (java:119-130)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off from 2020-07-10 to 2020-07-12')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([9, 10, 11, 12, 13].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });

  it('"{Alice} is off on saturday" closes that weekday (java:132-141)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off on saturday')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([3, 4, 5, 11].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([false, true, false, true]);
  });

  it('"{Alice} is off before 2020-07-05" closes every earlier day (java:95-105)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off before 2020-07-05')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([3, 4, 5, 6].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([true, true, false, false]);
  });

  it('"{Alice} is off after 2020-07-05" closes every later day (java:107-117)', () => {
    const gantt = started();
    expect(say(gantt, '{Alice} is off after 2020-07-05')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([4, 5, 6, 7].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([false, false, true, true]);
  });

  // Words.uzeroOrMore(THE) wants "the" glued to "after" (Words.java:67-74), so "after the" never matches; the jar
  // reports an error line for it (oracle-checked).
  it('"{Alice} is off after the 2020-07-05" is not a valid sentence (java:108-109)', () => {
    expect(command.isValid(line('{Alice} is off after the 2020-07-05'))).toBe('NOT_OK');
  });

  it('"{Alice} is on 2020-07-11" forces the day on, overriding a weekday close (java:168-178)', () => {
    const gantt = started();
    say(gantt, '{Alice} is off on saturday');
    expect(say(gantt, '{Alice} is on 2020-07-11')).toBe('ok');
    expect(gantt.getResource('Alice').isClosedAt(LocalDate.of(2020, 7, 11))).toBe(false);
    expect(gantt.getResource('Alice').isClosedAt(LocalDate.of(2020, 7, 18))).toBe(true);
  });

  it('"{Alice} is on from 2020-07-11 to 2020-07-12" forces each day on (java:155-166)', () => {
    const gantt = started();
    say(gantt, '{Alice} is off on saturday');
    say(gantt, '{Alice} is off on sunday');
    expect(say(gantt, '{Alice} is on from 2020-07-11 to 2020-07-12')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([11, 12, 18, 19].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([false, false, true, true]);
  });

  it('"{Alice} is off on 2020-07-10 and is off on 2020-07-11" chains two phrases on the one subject (NaturalGanttCommand)', () => {
    const gantt = started();
    expect(command.isValid(line('{Alice} is off on 2020-07-10 and is off on 2020-07-11'))).toBe('OK');
    expect(say(gantt, '{Alice} is off on 2020-07-10 and is off on 2020-07-11')).toBe('ok');
    const alice = gantt.getResource('Alice');
    expect([10, 11].map((d) => alice.isClosedAt(LocalDate.of(2020, 7, d)))).toEqual([true, true]);
  });
});
