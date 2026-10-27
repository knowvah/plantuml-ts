import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { ComplementIntervalsSmart } from '../../../../src/diagrams/gantt/lang/ComplementIntervalsSmart.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementIntervalsSmart.java:56-109.
const complement = new ComplementIntervalsSmart();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

function started() {
  const gantt = newGantt();
  gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
  const a = gantt.getOrCreateTask(TaskCode.fromId('A'), false);
  a.setLoad(Load.of(Duration.ofDays(5))); // A: 2020-07-01 .. 2020-07-06 (end exclusive)
  return gantt;
}

describe('ComplementIntervalsSmart', () => {
  it.each([
    "2020-07-02 to [A]'s end", // java:82-91
    "2020-07-02 to [A]'s start",
    "2020-07-02 to 2 days before [A]'s end", // optional durationBeforeOrAfter, java:85
    "2020-07-02 to 1 week and 2 working days after [A]'s start",
    "2020-07-02   to   [A]'s end",
  ])('accepts %s', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each([
    "to [A]'s end",
    '2020-07-02 to [A]', // START_OR_END is mandatory (java:91)
    "2020-07-02 [A]'s end", // " to" is mandatory (java:83)
    "[A]'s end",
    "2020-07-02 to [A]'s middle",
    "2020-07-02 to 2 days [A]'s end", // BEFORE_OR_AFTER is mandatory in the duration (java:78-79)
  ])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe to a task end decrements the end instant: the last worked day (java:94-109)', () => {
    const days = complement.getMe(started(), parse("2020-07-02 to [A]'s end")).get();
    // A ends 2020-07-06T00:00; TaskAttribute.END -> precise.decrement() -> 2020-07-05 (java:104-105)
    expect(days.toString()).toBe('{ 2020-07-02 , 2020-07-05 }');
    expect([...days].map((d) => d.toString())).toEqual(['2020-07-02', '2020-07-03', '2020-07-04', '2020-07-05']);
  });

  it('getMe to a task start does not decrement (java:104-105)', () => {
    const days = complement.getMe(started(), parse("2020-06-29 to [A]'s start")).get();
    expect(days.toString()).toBe('{ 2020-06-29 , 2020-07-01 }');
  });

  it('getMe propagates the unknown-task failure (java:98-101)', () => {
    const r = complement.getMe(started(), parse("2020-07-02 to [Nope]'s end"));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('No such task Nope');
  });
});
