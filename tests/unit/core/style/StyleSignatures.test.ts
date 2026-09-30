/**
 * StyleSignatures — a list of StyleSignature (`style/StyleSignatures.java`,
 * 92 lines). Pure-Java semantics, pinned by quoting the Java line.
 */
import { describe, expect, it } from 'vitest';
import { StyleSignatures } from '../../../../src/core/style/StyleSignatures.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { Stereostyles } from '../../../../src/core/abel/Stereostyles.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';

describe('StyleSignatures', () => {
  it('toString is the list toString of its members (java:54-57)', () => {
    const s = new StyleSignatures();
    expect(s.toString()).toBe('[]');
    s.add(StyleSignatureBasic.of('node'));
    s.add(StyleSignatureBasic.of('arrow'));
    // StyleSignatureBasic.toString is `key + " " + stereotypes` (StyleSignatureBasic.java:60-61).
    expect(s.toString()).toBe('[[node]  [], [arrow]  []]');
  });

  it('with(Stereostyles) maps every member; throws when empty (java:82-91)', () => {
    expect(() => new StyleSignatures().with(Stereostyles.NONE)).toThrow();
    const s = new StyleSignatures();
    s.add(StyleSignatureBasic.of('node'));
    s.add(StyleSignatureBasic.of('arrow'));
    const r = s.with(Stereostyles.build('<<<x>>>'));
    expect(r).not.toBe(s);
    expect(r.toString()).toBe('[[node]  [x], [arrow]  [x]]');
  });

  it('withTOBECHANGED always throws (java:75-80)', () => {
    expect(() => new StyleSignatures().withTOBECHANGED(undefined)).toThrow();
    const s = new StyleSignatures();
    s.add(StyleSignatureBasic.of('node'));
    expect(() => s.withTOBECHANGED(Stereotype.build('<<a>>'))).toThrow();
  });
});
