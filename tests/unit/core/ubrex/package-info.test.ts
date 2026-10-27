import { describe, expect, it } from 'vitest';
import * as pkg from '../../../../src/core/ubrex/package-info.js';

describe('package-info (package-info.java)', () => {
  it('exports nothing', () => {
    expect(Object.keys(pkg)).toEqual([]);
  });
});
