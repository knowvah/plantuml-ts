import { expect, it } from 'vitest';
import { LabelPosition } from '../../../src/diagrams/gantt/LabelPosition.js';

it('has its three positions in order (LabelPosition.java:38-42)', () => {
  expect(Object.values(LabelPosition)).toEqual(['LEGACY', 'FIRST_COLUMN', 'LAST_COLUMN']);
});
