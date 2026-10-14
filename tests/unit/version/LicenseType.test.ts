/**
 * `LicenseType` (version/LicenseType.java): the four kinds and `fromInt`'s
 * code table (java:42-53).
 */
import { describe, expect, it } from 'vitest';
import { fromInt, LicenseType } from '../../../src/diagrams/version/LicenseType.js';

describe('LicenseType', () => {
  it('declares NONE, NAMED, DISTRIBUTOR, UNKNOWN in enum order (java:40)', () => {
    expect(Object.values(LicenseType)).toEqual(['NONE', 'NAMED', 'DISTRIBUTOR', 'UNKNOWN']);
  });

  it('maps -1, 0 and 2 to NONE, NAMED and DISTRIBUTOR (java:43-51)', () => {
    expect(fromInt(-1)).toBe(LicenseType.NONE);
    expect(fromInt(0)).toBe(LicenseType.NAMED);
    expect(fromInt(2)).toBe(LicenseType.DISTRIBUTOR);
  });

  it('maps every other code to UNKNOWN (java:52)', () => {
    expect(fromInt(1)).toBe(LicenseType.UNKNOWN);
    expect(fromInt(3)).toBe(LicenseType.UNKNOWN);
    expect(fromInt(-2)).toBe(LicenseType.UNKNOWN);
  });
});
