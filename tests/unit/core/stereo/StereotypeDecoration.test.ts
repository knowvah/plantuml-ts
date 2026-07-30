/**
 * StereotypeDecoration.test.ts — T9b: unit coverage for
 * `StereotypeDecoration` (stereo/StereotypeDecoration.java), `Stereotype`'s
 * own required sibling.
 */
import { describe, expect, it } from 'vitest';
import {
  StereotypeDecoration,
  cutLabels,
  GUILLEMET_NONE,
  GUILLEMET_DOUBLE_COMPARATOR,
} from '../../../../src/core/stereo/StereotypeDecoration.js';
import type { ResolvedColor } from '../../../../src/core/klimt/color/HColorSet.js';

/** Deterministic test double for `HColorSet#getColor` — 'red' only, so
 *  assertions do not depend on the full ~150-name color table. */
function resolver(name: string): ResolvedColor | undefined {
  return name === 'red' ? { r: 255, g: 0, b: 0, a: 255 } : undefined;
}

describe('StereotypeDecoration.buildSimple', () => {
  it('stores a plain label with no sprite/color/character decoration', () => {
    const d = StereotypeDecoration.buildSimple('<<Test>>');
    expect(d.label).toBe('<<Test>>');
    expect(d.htmlColor).toBeUndefined();
    expect(d.character).toBe('');
    expect(d.spriteName).toBeUndefined();
    expect(d.spriteScale).toBe(0);
  });

  it('extracts the sprite name from a <<$name>> label, defaulting scale to 1', () => {
    const d = StereotypeDecoration.buildSimple('<<$mysprite>>');
    expect(d.spriteName).toBe('mysprite');
    expect(d.spriteScale).toBe(1);
  });

  it('extracts an explicit {scale=N} factor', () => {
    const d = StereotypeDecoration.buildSimple('<<$mysprite{scale=2.5}>>');
    expect(d.spriteName).toBe('mysprite');
    expect(d.spriteScale).toBe(2.5);
  });
});

describe('StereotypeDecoration#toString', () => {
  it('reports the label and sprite name', () => {
    const d = StereotypeDecoration.buildSimple('<<$mysprite>>');
    expect(d.toString()).toBe("label='<<$mysprite>>' spriteName='mysprite'");
  });

  it('reports an empty spriteName when there is none', () => {
    const d = StereotypeDecoration.buildSimple('<<Foo>>');
    expect(d.toString()).toBe("label='<<Foo>>' spriteName=''");
  });
});

describe('StereotypeDecoration.buildComplex', () => {
  it('leaves an undecorated label unchanged', () => {
    const d = StereotypeDecoration.buildComplex('<<Singleton>>', resolver);
    expect(d.label).toBe('<<Singleton>>');
    expect(d.htmlColor).toBeUndefined();
    expect(d.character).toBe('');
  });

  it('reconstructs a stacked blob from multiple undecorated labels, in order', () => {
    const d = StereotypeDecoration.buildComplex('<<Singleton>><<Startup>>', resolver);
    expect(d.label).toBe('<<Singleton>><<Startup>>');
  });

  it('drops a triple-bracket (<<<...>>>) run entirely from the label', () => {
    const d = StereotypeDecoration.buildComplex('<<<mystyle>>>', resolver);
    expect(d.label).toBe('');
  });

  it('extracts a circled character + resolved color, with no visible label', () => {
    // Mirrors class-stereotype.ts's own jar-verified `<<(?, red)>>` case:
    // a pure spot-color/letter override draws no stereotype text row.
    const d = StereotypeDecoration.buildComplex('<<(?, red)>>', resolver);
    expect(d.character).toBe('?');
    expect(d.htmlColor).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(d.label).toBe('');
  });

  it('a circled character with a visible label keeps that label', () => {
    const d = StereotypeDecoration.buildComplex('<<(P, red)PlainCircleStereotype>>', resolver);
    expect(d.character).toBe('P');
    expect(d.htmlColor).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(d.label).toBe('<<PlainCircleStereotype>>');
  });

  it('a circled-character COLOR that fails to resolve leaves htmlColor unset (no BLACK fallback -- java:174-175, unlike the circled-sprite branch)', () => {
    const d = StereotypeDecoration.buildComplex('<<(X, notacolor)>>', resolver);
    expect(d.character).toBe('X');
    expect(d.htmlColor).toBeUndefined();
  });

  it('a circled sprite with NO color spec still falls back to black (java:164 applies even when colName is absent)', () => {
    const d = StereotypeDecoration.buildComplex('<<($mysprite)Label>>', resolver);
    expect(d.spriteName).toBe('mysprite');
    expect(d.htmlColor).toEqual({ r: 0, g: 0, b: 0, a: 255 });
  });

  it('extracts a circled sprite name + label, defaulting scale to 1', () => {
    const d = StereotypeDecoration.buildComplex('<<($mysprite,red)Label>>', resolver);
    expect(d.spriteName).toBe('mysprite');
    expect(d.spriteScale).toBe(1);
    expect(d.htmlColor).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(d.label).toBe('<<Label>>');
  });
});

describe('StereotypeDecoration#getStyleNames', () => {
  it('returns the label tokens with no sprite suffix', () => {
    const d = StereotypeDecoration.buildComplex('<<Singleton>>', resolver);
    expect(d.getStyleNames()).toEqual(['Singleton']);
  });

  it('appends the sprite name suffix (after the last "/") when present', () => {
    const d = StereotypeDecoration.buildSimple('<<$archimate/component>>');
    expect(d.getStyleNames()).toContain('component');
  });
});

describe('cutLabels', () => {
  it('splits a stacked blob back into per-label bracket runs, in order', () => {
    expect(cutLabels('<<Singleton>><<Startup>>', GUILLEMET_DOUBLE_COMPARATOR)).toEqual([
      '<<Singleton>>',
      '<<Startup>>',
    ]);
  });

  it('drops a triple-bracket run from the result', () => {
    expect(cutLabels('<<<mystyle>>>', GUILLEMET_DOUBLE_COMPARATOR)).toEqual([]);
  });

  it('rewrites delimiters per the guillemet pair (NONE strips them)', () => {
    expect(cutLabels('<<Foo>>', GUILLEMET_NONE)).toEqual(['Foo']);
  });

  it('is the identity for the DOUBLE_COMPARATOR pair', () => {
    expect(cutLabels('<<Foo>>', GUILLEMET_DOUBLE_COMPARATOR)).toEqual(['<<Foo>>']);
  });
});
