import { describe, expect, it } from 'vitest';
import { TaskAttribute } from '../../../../src/diagrams/gantt/core/TaskAttribute.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskAttribute.java:33-45
describe('TaskAttribute', () => {
  it('lists START, END, LOAD with ordinals 0..2', () => {
    expect(TaskAttribute.values().map((a) => [a.name(), a.ordinal()])).toEqual([
      ['START', 0],
      ['END', 1],
      ['LOAD', 2],
    ]);
  });

  it.each([
    ['start', TaskAttribute.START],
    ['End', TaskAttribute.END],
    ['LOAD', TaskAttribute.LOAD],
  ])('fromString(%j) upper-cases then valueOf (java:41-43)', (value, expected) => {
    expect(TaskAttribute.fromString(value)).toBe(expected);
    expect(String(expected)).toBe(expected.name());
  });

  it('fromString of an unknown name is an IllegalArgumentException with the JDK message', () => {
    expect(() => TaskAttribute.fromString('duration')).toThrow(
      'IllegalArgumentException: No enum constant net.sourceforge.plantuml.gantt.core.TaskAttribute.DURATION',
    );
  });

  it('valueOf is case-sensitive like Enum#valueOf', () => {
    expect(() => TaskAttribute.valueOf('start')).toThrow('No enum constant');
  });
});
