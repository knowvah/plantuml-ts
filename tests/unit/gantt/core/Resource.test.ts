import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { ResourceDraw } from '../../../../src/diagrams/gantt/draw/ResourceDraw.js';
import { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Resource.java
const d = (day: number): LocalDate => LocalDate.of(2024, 3, day);

describe('Resource', () => {
  it('name, toString (java:67-74)', () => {
    const r = new Resource('Alice');
    expect(r.getName()).toBe('Alice');
    expect(r.toString()).toBe('Alice');
  });

  it('hashCode is String.hashCode of the name (java:56-59); equals by name (:61-65)', () => {
    expect(new Resource('abc').hashCode()).toBe(96354);
    expect(new Resource('abc').equals(new Resource('abc'))).toBe(true);
    expect(new Resource('abc').equals(new Resource('abd'))).toBe(false);
    expect(() => new Resource('abc').equals('abc')).toThrow('ClassCastException');
  });

  it('resource draw round trip (java:76-82)', () => {
    const r = new Resource('A');
    expect(r.getResourceDraw()).toBeUndefined();
    const draw = {} as ResourceDraw;
    r.setTaskDraw(draw);
    expect(r.getResourceDraw()).toBe(draw);
  });

  it('close / force-on days drive isClosedAt (java:84-94)', () => {
    const r = new Resource('A');
    expect(r.isClosedAt(d(4))).toBe(false);
    r.addCloseDay(d(4));
    expect(r.isClosedAt(d(4))).toBe(true);
    r.addForceOnDay(d(4));
    expect(r.isClosedAt(d(4))).toBe(false);
  });

  it('a closed weekday (java:96-98)', () => {
    const r = new Resource('A');
    r.addCloseDay(DayOfWeek.SUNDAY);
    expect(r.isClosedAt(d(3))).toBe(true); // 2024-03-03 is a Sunday
    expect(r.isClosedAt(d(4))).toBe(false);
  });

  it('off-before / off-after dates (java:100-110)', () => {
    const r = new Resource('A');
    expect(r.getLastDayIfAny()).toBeUndefined();
    r.setOffBeforeDate(d(5));
    r.setOffAfterDate(d(10));
    expect(r.isClosedAt(d(4))).toBe(true);
    expect(r.isClosedAt(d(7))).toBe(false);
    expect(r.isClosedAt(d(11))).toBe(true);
    expect(r.getLastDayIfAny()?.toString()).toBe('2024-03-10');
  });

  it('asPiecewiseConstant is the calendar (java:112-114)', () => {
    const r = new Resource('A');
    expect(r.asPiecewiseConstant()).toBe(r.asPiecewiseConstant());
  });
});
