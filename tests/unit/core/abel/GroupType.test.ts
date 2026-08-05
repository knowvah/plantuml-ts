/**
 * GroupType.test.ts — SI1/T2: the 8-value `GroupType` enum
 * (abel/GroupType.java:38-42).
 */
import { describe, expect, it } from 'vitest';
import { GroupType } from '../../../../src/core/abel/GroupType.js';

describe('GroupType values (java:40)', () => {
  it('has exactly the 8 upstream values, in declaration order', () => {
    expect(Object.keys(GroupType)).toEqual([
      'ROOT',
      'PACKAGE',
      'STATE',
      'CONCURRENT_STATE',
      'INNER_ACTIVITY',
      'CONCURRENT_ACTIVITY',
      'DOMAIN',
      'REQUIREMENT',
    ]);
  });

  it('each value maps to its own name', () => {
    for (const [k, v] of Object.entries(GroupType)) expect(v).toBe(k);
  });
});
