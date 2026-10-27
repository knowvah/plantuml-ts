import { describe, expect, it } from 'vitest';
import { CharClassType } from '../../../../src/core/ubrex/CharClassType.js';

describe('CharClassType (CharClassType.java)', () => {
  it('has NORMAL and NEGATIVE', () => {
    expect(Object.values(CharClassType)).toEqual(['NORMAL', 'NEGATIVE']);
  });
});
