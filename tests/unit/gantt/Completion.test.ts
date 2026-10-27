import { expect, it } from 'vitest';
import { Completion } from '../../../src/diagrams/gantt/Completion.js';

it('stores the completion (Completion.java:42-48)', () => {
  expect(new Completion(40).getCompletion()).toBe(40);
});
