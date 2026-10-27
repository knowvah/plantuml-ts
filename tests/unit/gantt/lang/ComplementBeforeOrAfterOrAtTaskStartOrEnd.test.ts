import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TaskAttribute } from '../../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { ComplementBeforeOrAfterOrAtTaskStartOrEnd } from '../../../../src/diagrams/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementBeforeOrAfterOrAtTaskStartOrEnd.java:52-93 (the TaskInstant maths is
// AbstractComplementTaskInstant.java:49-84, covered by its own test).
const complement = new ComplementBeforeOrAfterOrAtTaskStartOrEnd();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementBeforeOrAfterOrAtTaskStartOrEnd', () => {
  it.each([
    "[A]'s end", // no leading word, java:76-87
    "[A]'s start",
    "at [A]'s end", // java:78
    "with [A]'s start", // java:79
    "after [A]'s end", // java:80
    "2 days after [A]'s end", // durationBeforeOrAfter, java:54-74
    "3 weeks before [A]'s start",
    "2 working days before [A]'s end",
    "1 day and 2 working weeks after [A]'s end",
    "[Prototype design]'s end",
  ])('accepts %s', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each([
    '[A] end', // 〴.s needs an apostrophe-like char then s (java:85)
    "[A]'s middle", // START_OR_END is start|end (java:87)
    "at [A]'s",
    "2 days [A]'s end", // BEFORE_OR_AFTER is mandatory inside the duration (java:73-74)
    '2 days after',
    "A's end",
    "at 3 days after [A]'s end", // at / with / after / duration are alternatives (java:77-81)
  ])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('captures the code, the start-or-end word, and the duration parts (java:55-74,84,87)', () => {
    const m = parse("1 day and 2 working weeks after [A]'s end");
    expect(m.findFirstValueByKey('COMPLEMENT_CODE_OTHER')).toBe('A');
    expect(m.findFirstValueByKey('COMPLEMENT_START_OR_END')).toBe('end');
    expect(m.findFirstValueByKey('COMPLEMENT_NB1')).toBe('1');
    expect(m.findFirstValueByKey('COMPLEMENT_DAY_OR_WEEK1')).toBe('day');
    expect(m.findFirstValueByKey('COMPLEMENT_NB2')).toBe('2');
    expect(m.findFirstValueByKey('COMPLEMENT_WORKING2')).toBe('working');
    expect(m.findFirstValueByKey('COMPLEMENT_DAY_OR_WEEK2')).toBe('week');
    expect(m.findFirstValueByKey('COMPLEMENT_BEFORE_OR_AFTER')).toBe('after');
  });

  it('getMe resolves to the task end instant (java:90-93 -> AbstractComplementTaskInstant)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const a = gantt.getOrCreateTask(TaskCode.fromId('A'), false);
    a.setLoad(Load.of(Duration.ofDays(5)));
    const r = complement.getMe(gantt, parse("[A]'s end"));
    expect(r.isFail()).toBe(false);
    expect(r.get().getAttribute()).toBe(TaskAttribute.END);
    expect(r.get().getInstantPrecise().toDay().toString()).toBe('2020-07-06');
  });

  it('getMe on an unknown task is a failure naming it (AbstractComplementTaskInstant.java:51-53)', () => {
    const r = complement.getMe(newGantt(), parse("[Nope]'s start"));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('No such task Nope');
  });
});
