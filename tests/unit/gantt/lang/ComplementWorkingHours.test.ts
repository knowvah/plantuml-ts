import { describe, expect, it } from 'vitest';
import { ComplementWorkingHours } from '../../../../src/diagrams/gantt/lang/ComplementWorkingHours.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementWorkingHours.java:47-57.
const complement = new ComplementWorkingHours();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementWorkingHours', () => {
  it.each(['working hours', 'working   hours'])('accepts %s (java:49-51)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['workinghours', 'working hour', 'working', 'hours'])('rejects %s (java:49-51)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe is the empty string (java:55-56)', () => {
    expect(complement.getMe(newGantt(), parse('working hours')).get()).toBe('');
  });
});
