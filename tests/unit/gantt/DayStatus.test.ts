import { expect, it } from 'vitest';
import { DayStatus } from '../../../src/diagrams/gantt/DayStatus.js';

it('has OPEN and CLOSE in order (DayStatus.java:38-41)', () => {
  expect(Object.values(DayStatus)).toEqual(['OPEN', 'CLOSE']);
});
