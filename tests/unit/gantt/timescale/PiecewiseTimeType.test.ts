import { expect, it } from 'vitest';
import { PiecewiseTimeType } from '../../../../src/diagrams/gantt/timescale/PiecewiseTimeType.js';

it('has OPEN and CLOSE in order (PiecewiseTimeType.java:38-42)', () => {
  expect(Object.values(PiecewiseTimeType)).toEqual(['OPEN', 'CLOSE']);
});
