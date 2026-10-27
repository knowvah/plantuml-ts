import { describe, expect, it } from 'vitest';
import { WeeklyHeaderStrategy } from '../../../../src/diagrams/gantt/draw/WeeklyHeaderStrategy.js';

describe('WeeklyHeaderStrategy', () => {
  it('has the three upstream constants in order (WeeklyHeaderStrategy.java:40)', () => {
    expect(Object.values(WeeklyHeaderStrategy)).toEqual(['WEEK_OF_YEAR', 'DAY_OF_MONTH', 'FROM_N']);
  });
});
