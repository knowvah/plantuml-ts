/**
 * LinkStrategy.test.ts — SI1/T2: the 2-value `LinkStrategy` enum
 * (abel/LinkStrategy.java:38-59).
 */
import { describe, expect, it } from 'vitest';
import { LinkStrategy } from '../../../../src/core/abel/LinkStrategy.js';

describe('LinkStrategy values (java:50,57)', () => {
  it('has LEGACY_toberemoved and SIMPLEST, in declaration order', () => {
    expect(Object.keys(LinkStrategy)).toEqual(['LEGACY_toberemoved', 'SIMPLEST']);
    expect(LinkStrategy.SIMPLEST).toBe('SIMPLEST');
  });
});
