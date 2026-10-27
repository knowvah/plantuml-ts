import { expect, it } from 'vitest';
import { GanttConstraintMode } from '../../../src/diagrams/gantt/GanttConstraintMode.js';

it('has its two modes in order (GanttConstraintMode.java:38-41)', () => {
  expect(Object.values(GanttConstraintMode)).toEqual(['IGNORE_CALENDAR', 'DO_NOT_COUNT_CLOSE_DAY']);
});
