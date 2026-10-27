import { expect, it } from 'vitest';
import { ImpossibleSolvingException } from '../../../../src/diagrams/gantt/solver/ImpossibleSolvingException.js';

it('is an Error carrying its message (ImpossibleSolvingException.java:38-42)', () => {
  const e = new ImpossibleSolvingException('no solution');
  expect(e).toBeInstanceOf(Error);
  expect(e.message).toBe('no solution');
  expect(e.name).toBe('ImpossibleSolvingException');
});
