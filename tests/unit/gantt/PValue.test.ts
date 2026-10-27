import { describe, expect, it } from 'vitest';
import type { PValue } from '../../../src/diagrams/gantt/PValue.js';
import { Instant } from '../../../src/diagrams/gantt/time/Instant.js';
import { Load } from '../../../src/diagrams/gantt/ngm/Load.js';

// PValue.java:38 is a member-less marker interface; Instant (time/Instant.java:40)
// and Load (ngm/Load.java:66) implement it.
describe('PValue', () => {
  it('is implemented by Instant and Load', () => {
    const values: PValue[] = [Instant.create(5), Load.zero()];
    expect(values.map(String)).toEqual(['5', 'PT0S']);
  });
});
