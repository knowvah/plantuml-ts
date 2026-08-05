import { describe, expect, it } from 'vitest';

import { Together } from '../../../../src/core/abel/Together.js';

/** Behavior tests from abel/Together.java:39-51. */
describe('Together', () => {
  it('holds an undefined parent for a top-level together', () => {
    const t = new Together(undefined);
    expect(t.getParent()).toBeUndefined();
  });

  it('chains nested togethers through getParent', () => {
    const outer = new Together(undefined);
    const inner = new Together(outer);
    expect(inner.getParent()).toBe(outer);
    expect(inner.getParent()?.getParent()).toBeUndefined();
  });
});
