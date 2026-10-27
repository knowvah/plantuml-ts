import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../src/core/time/LocalDate.js';
import { DaysAsDates } from '../../../src/diagrams/gantt/DaysAsDates.js';
import { newGantt } from './helpers/gantt-diagram-fixture.js';

// Expected values: gantt/DaysAsDates.java (:46-94).
describe('DaysAsDates', () => {
  it('toString is "{ d1 , d2 }" (java:52-54)', () => {
    const r = new DaysAsDates(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 3));
    expect(r.toString()).toBe('{ 2020-07-01 , 2020-07-03 }');
  });

  it('iterates inclusively from date1 to date2 (java:76-84, 92-94)', () => {
    const r = new DaysAsDates(LocalDate.of(2020, 2, 28), LocalDate.of(2020, 3, 1));
    expect([...r].map(String)).toEqual(['2020-02-28', '2020-02-29', '2020-03-01']);
  });

  it('iterator() exposes hasNext/next and remove is unsupported (java:76-90)', () => {
    const it1 = new DaysAsDates(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 1)).iterator();
    expect(it1.hasNext()).toBe(true);
    expect(it1.next().toString()).toBe('2020-07-01');
    expect(it1.hasNext()).toBe(false);
    expect(() => it1.remove()).toThrow('UnsupportedOperationException');
  });

  it('an empty range (date1 after date2) yields nothing (java:77)', () => {
    expect([...new DaysAsDates(LocalDate.of(2020, 7, 2), LocalDate.of(2020, 7, 1))]).toEqual([]);
  });

  it('the counting constructor ends after `count` open days, counting every day when all are open (java:56-66)', () => {
    const d = newGantt();
    const r = new DaysAsDates(d, LocalDate.of(2020, 7, 1), 3);
    expect(r.toString()).toBe('{ 2020-07-01 , 2020-07-04 }');
    expect([...r].length).toBe(4);
  });

  it('the counting constructor skips closed days (java:60-62)', () => {
    const d = newGantt();
    d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
    d.closeDayOfWeek(DayOfWeek.SUNDAY, '');
    // Fri 2020-07-03 open (count 2->1), Sat/Sun closed, Mon 07-06 open (1->0), tmp -> Tue 07-07.
    const r = new DaysAsDates(d, LocalDate.of(2020, 7, 3), 2);
    expect(r.toString()).toBe('{ 2020-07-03 , 2020-07-07 }');
  });

  it('count 0 ends on date1 (java:59)', () => {
    expect(new DaysAsDates(newGantt(), LocalDate.of(2020, 7, 1), 0).toString()).toBe('{ 2020-07-01 , 2020-07-01 }');
  });
});
