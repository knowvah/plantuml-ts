/** `TinyHashableString` (dedication/TinyHashableString.java): the sentence it wraps. */
import { describe, expect, it } from 'vitest';

import { TinyHashableString } from '../../../src/diagrams/dedication/TinyHashableString.js';

describe('TinyHashableString', () => {
  it('returns the sentence it was built with, untouched (java:45-51)', () => {
    expect(new TinyHashableString('  Write your own dedication! ').getSentence()).toBe('  Write your own dedication! ');
  });
});
