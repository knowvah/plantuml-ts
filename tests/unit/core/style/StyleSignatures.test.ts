/**
 * StyleSignatures — a list of StyleSignature (`style/StyleSignatures.java`,
 * 92 lines). Pure-Java semantics, pinned by quoting the Java line.
 */
import { describe, expect, it } from 'vitest';
import { StyleSignatures } from '../../../../src/core/style/StyleSignatures.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { Stereostyles } from '../../../../src/core/abel/Stereostyles.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { Style } from '../../../../src/core/style/Style.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { Value } from '../../../../src/core/style/Value.js';

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

describe('StyleSignatures.getMergedStyle (StyleSignatures.java:59-73)', () => {
  const fooStyle = (v: string, p: number, stereo: string): Style =>
    new Style(
      StyleSignatureBasic.of('root').addStereotype(stereo),
      new Map<PName, Value>([['FontColor', ValueImpl.regular(v, p)]]),
    );

  it('an empty list throws UnsupportedOperationException', () => {
    expect(() => new StyleSignatures().getMergedStyle(new StyleBuilder())).toThrow('UnsupportedOperationException');
  });

  it('merges member styles KEEP_EXISTING_VALUE_OF_STEREOTYPE: the first stereotype value above 1000 stays', () => {
    const builder = new StyleBuilder().muteStyle([fooStyle('red', 1005, 'a'), fooStyle('blue', 1009, 'b')]);
    const list = new StyleSignatures();
    list.add(StyleSignatureBasic.of('root').addStereotype('a'));
    list.add(StyleSignatureBasic.of('root').addStereotype('b'));
    expect(list.getMergedStyle(builder)?.value('FontColor').asString()).toBe('red');
  });

  it('a missing builder yields undefined from every member', () => {
    const list = new StyleSignatures();
    list.add(StyleSignatureBasic.of('root'));
    expect(list.getMergedStyle(undefined)).toBeUndefined();
  });
});
