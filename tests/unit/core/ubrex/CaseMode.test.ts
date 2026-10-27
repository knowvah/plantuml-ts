import { describe, expect, it } from 'vitest';
import { CaseMode, ensureLowercase } from '../../../../src/core/ubrex/CaseMode.js';

describe('CaseMode (CaseMode.java)', () => {
  it('has the two modes (:38)', () => {
    expect(Object.values(CaseMode)).toEqual(['CASE_SENSITIVE', 'CASE_INSENSITIVE']);
  });
  it('ensureLowercase lowers ASCII A-Z only (:41-45)', () => {
    expect(ensureLowercase('A')).toBe('a');
    expect(ensureLowercase('Z')).toBe('z');
    expect(ensureLowercase('@')).toBe('@');
    expect(ensureLowercase('[')).toBe('[');
    expect(ensureLowercase('a')).toBe('a');
    expect(ensureLowercase('É')).toBe('É');
  });
});
