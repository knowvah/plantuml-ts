import { describe, expect, it } from 'vitest';

import { Stereotag } from '../../../../src/core/abel/Stereotag.js';

/** Behavior tests from stereo/Stereotag.java:40-74. */
describe('Stereotag', () => {
  it('stores and returns its name', () => {
    expect(new Stereotag('important').getName()).toBe('important');
  });

  it('rejects a name still carrying the $ prefix', () => {
    expect(() => new Stereotag('$important')).toThrow('IllegalArgumentException: $important');
  });

  it('equals compares by name', () => {
    expect(new Stereotag('a').equals(new Stereotag('a'))).toBe(true);
    expect(new Stereotag('a').equals(new Stereotag('b'))).toBe(false);
  });

  it('toString restores the $ prefix', () => {
    expect(new Stereotag('tag1').toString()).toBe('$tag1');
  });

  it('pattern() reproduces the upstream composed regex source', () => {
    expect(Stereotag.pattern()).toBe('((\\$[^%s{}%g<>$]+)([%s]+(\\$[^%s{}%g<>$]+))*)');
  });
});
