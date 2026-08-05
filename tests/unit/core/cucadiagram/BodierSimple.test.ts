/**
 * BodierSimple.test.ts — SI1/T7: `src/core/cucadiagram/BodierSimple.ts`
 * against cucadiagram/BodierSimple.java, plus the `BodierAbstract`
 * surface (rawBody/getBestMatch/matchScore, BodierAbstract.java:45-151)
 * it inherits. Expectations hand-derived from the Java.
 */
import { describe, expect, it } from 'vitest';
import { BodierAbstract } from '../../../../src/core/cucadiagram/BodierAbstract.js';
import { BodierSimple } from '../../../../src/core/cucadiagram/BodierSimple.js';
import type { FontConfiguration } from '../../../../src/core/abel/FontConfiguration.js';
import type { Style } from '../../../../src/core/abel/ISkinParam.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { MockSkinParam } from '../abel/helpers.js';

const style: Style = { getHorizontalAlignment: () => HorizontalAlignment.LEFT };
const fontConfiguration = undefined as unknown as FontConfiguration;

describe('BodierSimple (BodierSimple.java)', () => {
  it('addFieldOrMethod appends the Display lines to rawBody (java:60-66)', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    expect(bodier.addFieldOrMethod('hello')).toBe(true);
    expect(bodier.getRawBody()).toEqual(['hello']);
  });

  it('addFieldOrMethod splits on the \\n escape via Display.getWithNewlines2 (java:62-64)', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    bodier.addFieldOrMethod('a\\nb');
    expect(bodier.getRawBody()).toEqual(['a', 'b']);
  });

  it('muteClassToObject is unsupported (java:51-54)', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    expect(() => bodier.muteClassToObject()).toThrow('UnsupportedOperationException');
  });

  it('getMethodsToDisplay/getFieldsToDisplay are unsupported (java:68-76)', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    expect(() => bodier.getMethodsToDisplay()).toThrow('UnsupportedOperationException');
    expect(() => bodier.getFieldsToDisplay()).toThrow('UnsupportedOperationException');
  });

  it('hasUrl is always false (java:78-81)', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    bodier.addFieldOrMethod('name [[[http://x]]]');
    expect(bodier.hasUrl()).toBe(false);
  });

  it('getBody delegates to BodyFactory.create1 — the SI1 batch-4/T9 throws-deferred hook (java:83-88)', () => {
    // Pinned deferred throw (T5 precedent) — flips to a real TextBlock
    // when T9 lands BodyEnhanced1 and fills the hook.
    const bodier = new BodierSimple(new MockSkinParam());
    bodier.addFieldOrMethod('line');
    expect(() => bodier.getBody(new MockSkinParam(), true, true, undefined, style, fontConfiguration)).toThrow(
      /create1: deferred to SI1 batch-4\/T9/,
    );
  });
});

describe('BodierAbstract.getBestMatch scoring (BodierAbstract.java:68-127)', () => {
  it('an exact line scores 0 and short-circuits', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    bodier.addFieldOrMethod('alpha');
    bodier.addFieldOrMethod('beta');
    expect(bodier.getBestMatch('beta')).toBe('beta');
  });

  it('prefers the line whose match has the cheapest surroundings', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    // 'field1 : int' -> 6 post-separator chars x 1_000 = 6_000
    // 'xxfield1'     -> 2 pre-match letters x 1_000_000_000
    bodier.addFieldOrMethod('xxfield1');
    bodier.addFieldOrMethod('field1 : int');
    expect(bodier.getBestMatch('field1')).toBe('field1 : int');
  });

  it('returns undefined on an empty body (upstream null) and throws on an empty candidate', () => {
    const bodier = new BodierSimple(new MockSkinParam());
    expect(bodier.getBestMatch('x')).toBeUndefined();
    expect(() => bodier.getBestMatch('')).toThrow('candidate must not be empty');
  });

  it('matchScore weights: trailing-in-word 1e6, post-separator 1e3, pre-match letter 1e9, other pre-match 1', () => {
    expect(BodierAbstract.matchScore('field1 : int', 'field1')).toBe(6_000);
    expect(BodierAbstract.matchScore('field1x', 'field1')).toBe(1_000_000);
    expect(BodierAbstract.matchScore('xfield1', 'field1')).toBe(1_000_000_000);
    expect(BodierAbstract.matchScore('+field1', 'field1')).toBe(1);
    expect(BodierAbstract.matchScore('nomatch', 'field1')).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('startsWith is an exact char-window compare (java:129-150)', () => {
    expect(BodierAbstract.startsWith('abcdef', 2, 'cde')).toBe(true);
    expect(BodierAbstract.startsWith('abcdef', 2, 'cdx')).toBe(false);
    expect(BodierAbstract.startsWith('abc', 2, 'cd')).toBe(false);
    expect(() => BodierAbstract.startsWith('abc', 0, '')).toThrow('IllegalArgumentException');
  });

  it('null guards mirror upstream (java:50-52, :94-95, :130-131, :139-140)', () => {
    const nullString = null as unknown as string;
    expect(() => new BodierSimple(new MockSkinParam()).setLeaf(null as unknown as Parameters<BodierSimple['setLeaf']>[0])).toThrow('NullPointerException');
    expect(() => BodierAbstract.matchScore(nullString, 'x')).toThrow('IllegalArgumentException');
    expect(() => BodierAbstract.matchScore('x', nullString)).toThrow('IllegalArgumentException');
    expect(BodierAbstract.startsWith(nullString, 0, 'x')).toBe(false);
    expect(BodierAbstract.startsWith('abc', -1, 'a')).toBe(false);
    expect(BodierAbstract.startsWith('abc', 4, 'a')).toBe(false);
  });
});
