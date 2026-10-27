import { describe, expect, it } from 'vitest';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskCode.java:35-81;
// hashCode values are Java's String.hashCode ("abc" = 96354, "" = 0).
describe('TaskCode', () => {
  it('fromId uses the id as display (java:42-44)', () => {
    const code = TaskCode.fromId('T1');
    expect(code.getId()).toBe('T1');
    expect(code.getDisplay()).toBe('T1');
  });

  it('fromIdAndDisplay keeps both (java:46-52)', () => {
    const code = TaskCode.fromIdAndDisplay('T1', 'First task');
    expect(code.getId()).toBe('T1');
    expect(code.getDisplay()).toBe('First task');
  });

  it('a null id falls back to the display', () => {
    const code = TaskCode.fromIdAndDisplay(null, 'First task');
    expect(code.getId()).toBe('First task');
    expect(code.getDisplay()).toBe('First task');
  });

  it('a null display falls back to fromId', () => {
    const code = TaskCode.fromIdAndDisplay('T1', undefined);
    expect(code.getId()).toBe('T1');
    expect(code.getDisplay()).toBe('T1');
  });

  it('both null is a NullPointerException (Objects.requireNonNull)', () => {
    expect(() => TaskCode.fromIdAndDisplay(null, null)).toThrow('NullPointerException');
  });

  it('equality and hash are by id only (java:59-68)', () => {
    const a = TaskCode.fromIdAndDisplay('abc', 'one');
    const b = TaskCode.fromIdAndDisplay('abc', 'two');
    const c = TaskCode.fromId('abd');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.hashCode()).toBe(96354);
    expect(b.hashCode()).toBe(96354);
    expect(TaskCode.fromId('').hashCode()).toBe(0);
  });

  it('hashCode wraps to a signed 32-bit int like Java', () => {
    // "polygenelubricants".hashCode() == Integer.MIN_VALUE in Java.
    expect(TaskCode.fromId('polygenelubricants').hashCode()).toBe(-2147483648);
  });

  it('equals against another type is a ClassCastException (unchecked cast, java:65)', () => {
    expect(() => TaskCode.fromId('a').equals('a')).toThrow('ClassCastException');
  });
});
