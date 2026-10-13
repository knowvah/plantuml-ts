/**
 * `DedicationEncrypted` (dedication/DedicationEncrypted.java): out of scope
 * (decisions.md D4 — argon2 + a 5-second wall-clock throttle); the port never
 * matches, whatever the sentence.
 */
import { describe, expect, it } from 'vitest';

import { DedicationEncrypted } from '../../../src/diagrams/dedication/DedicationEncrypted.js';
import { TinyHashableString } from '../../../src/diagrams/dedication/TinyHashableString.js';
import { dedicationAssetStore } from './dedication-store.js';

describe('DedicationEncrypted', () => {
  it('keeps its tiny hash and argon2 signature (Dedications.java:66-71)', () => {
    const secret = new DedicationEncrypted(5, '835ff5d643b58cd35a20db6480071d05751aa6a0e01da78662ceafd0161f3f5e');
    expect([secret.tinyHash, secret.argon2]).toEqual([
      5,
      '835ff5d643b58cd35a20db6480071d05751aa6a0e01da78662ceafd0161f3f5e',
    ]);
  });

  it('never yields an image (D4)', () => {
    const secret = new DedicationEncrypted(1, 'ae8a7cf3997ccd6418866fc59e596502e1bd1c0265bba2fc380ad7f51c76518f');
    const line = new TinyHashableString('a sentence long enough to pass the forty-char gate');
    expect(secret.getImage(line, dedicationAssetStore())).toBe(undefined);
  });
});
