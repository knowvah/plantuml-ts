/**
 * Stereotype.test.ts — T9b: unit coverage for `Stereotype`
 * (stereo/Stereotype.java), one of `Display`'s `CharSequence`-typed
 * element kinds (T9c's consumer).
 */
import { describe, expect, it } from 'vitest';
import { Stereotype, isStereotype } from '../../../../src/core/stereo/Stereotype.js';
import type { ResolvedColor } from '../../../../src/core/klimt/color/HColorSet.js';
import { createSpriteRegistry, addSprite } from '../../../../src/core/sprite-commands.js';
import { GUILLEMET_DEFAULT } from '../../../../src/core/text/Guillemet.js';
import type { GuillemetPair } from '../../../../src/core/text/Guillemet.js';

function resolver(name: string): ResolvedColor | undefined {
  return name === 'red' ? { r: 255, g: 0, b: 0, a: 255 } : undefined;
}

const DOUBLE: GuillemetPair = { start: '<<', end: '>>' };

describe('Stereotype.build', () => {
  it('returns undefined for an undefined label (null-in/null-out)', () => {
    expect(Stereotype.build(undefined)).toBeUndefined();
  });

  it('throws on a label not wrapped in << >>', () => {
    expect(() => Stereotype.build('NotWrapped')).toThrow();
  });

  it('the 1-arg overload defaults automaticPackageStyle to true', () => {
    const s = Stereotype.build('<<node>>')!;
    expect(s.getPackageStyle()).toBe('NODE');
  });

  it('the 2-arg overload can disable automatic package-style matching', () => {
    const s = Stereotype.build('<<node>>', false);
    expect(s.getPackageStyle()).toBeUndefined();
  });

  it('the 4-arg overload carries radius/circledFont through to their getters', () => {
    const font = { family: 'sans', size: 10 };
    const s = Stereotype.build('<<(X, red)>>', 5, font, resolver);
    expect(s.getRadius()).toBe(5);
    expect(s.getCircledFont()).toBe(font);
    expect(s.getCharacter()).toBe('X');
    expect(s.getHtmlColor()).toEqual({ r: 255, g: 0, b: 0, a: 255 });
  });
});

describe('Stereotype basic accessors', () => {
  it('toString/charAt/length/subSequence read through decoration.label', () => {
    const s = Stereotype.build('<<Foo>>')!;
    expect(s.toString()).toBe('<<Foo>>');
    expect(s.length()).toBe(7);
    expect(s.charAt(2)).toBe('F');
    expect(s.subSequence(2, 5)).toBe('Foo');
  });

  it('toString prepends the circled character when spotted', () => {
    const s = Stereotype.build('<<(X, red)Foo>>', 0, undefined, resolver);
    expect(s.isSpotted()).toBe(true);
    expect(s.toString()).toBe('X <<Foo>>');
  });

  it('isSpotted is false with no circled character', () => {
    const s = Stereotype.build('<<Foo>>')!;
    expect(s.isSpotted()).toBe(false);
    expect(s.getCharacter()).toBe('');
  });

  it('isWithOOSymbol matches <<O-O>> case-insensitively', () => {
    expect(Stereotype.build('<<O-O>>')!.isWithOOSymbol()).toBe(true);
    expect(Stereotype.build('<<o-o>>')!.isWithOOSymbol()).toBe(true);
    expect(Stereotype.build('<<Foo>>')!.isWithOOSymbol()).toBe(false);
  });
});

describe('Stereotype#getMultipleLabels', () => {
  it('extracts each <<...>> occurrence from a stacked label', () => {
    const s = Stereotype.build('<<Singleton>><<Startup>>')!;
    expect(s.getMultipleLabels()).toEqual(['Singleton', 'Startup']);
  });

  it('returns a single-element list for one label', () => {
    expect(Stereotype.build('<<Foo>>')!.getMultipleLabels()).toEqual(['Foo']);
  });
});

describe('Stereotype#getLabel / getLabels', () => {
  it('getLabel rewrites the guillemet pair', () => {
    const s = Stereotype.build('<<Foo>>')!;
    expect(s.getLabel(GUILLEMET_DEFAULT)).toBe('«Foo»');
    expect(s.getLabel(DOUBLE)).toBe('<<Foo>>');
  });

  it('getLabel rewrites an archimate/-prefixed sprite name to its bare suffix, guillemet-wrapped', () => {
    const s = Stereotype.build('<<$archimate/component>>');
    expect(s!.getLabel(DOUBLE)).toBe('<<component>>');
  });

  it('getLabel returns undefined for the O-O symbol sentinel', () => {
    expect(Stereotype.build('<<O-O>>')!.getLabel(GUILLEMET_DEFAULT)).toBeUndefined();
  });

  it('getLabels splits a stacked label into its per-label guillemet-wrapped forms', () => {
    const s = Stereotype.build('<<Singleton>><<Startup>>')!;
    expect(s.getLabels(GUILLEMET_DEFAULT)).toEqual(['«Singleton»', '«Startup»']);
  });
});

describe('Stereotype#getSprite', () => {
  it('resolves a decorated sprite name against a SpriteRegistry', () => {
    const registry = createSpriteRegistry();
    addSprite(registry, 'mysprite', { width: 16, height: 16 });
    const s = Stereotype.build('<<($mysprite)Label>>', 0, undefined, resolver);
    expect(s.getSprite(registry)).toEqual({ width: 16, height: 16 });
  });

  it('returns undefined when the stereotype carries no sprite decoration', () => {
    const registry = createSpriteRegistry();
    expect(Stereotype.build('<<Foo>>')!.getSprite(registry)).toBeUndefined();
  });

  it('returns undefined when no registry is supplied', () => {
    const s = Stereotype.build('<<($mysprite)Label>>', 0, undefined, resolver);
    expect(s.getSprite(undefined)).toBeUndefined();
  });

  it('returns undefined when the name is not registered', () => {
    const registry = createSpriteRegistry();
    const s = Stereotype.build('<<($missing)Label>>', 0, undefined, resolver);
    expect(s.getSprite(registry)).toBeUndefined();
  });
});

describe('Stereotype#getStyleNames', () => {
  it('delegates to the decoration', () => {
    expect(Stereotype.build('<<Foo>>')!.getStyleNames()).toEqual(['Foo']);
  });
});

describe('Stereotype#getPackageStyle', () => {
  it('matches a bare PackageStyle name case-insensitively', () => {
    expect(Stereotype.build('<<folder>>')!.getPackageStyle()).toBe('FOLDER');
    expect(Stereotype.build('<<CARD>>')!.getPackageStyle()).toBe('CARD');
  });

  it('returns undefined for a non-matching label', () => {
    expect(Stereotype.build('<<Foo>>')!.getPackageStyle()).toBeUndefined();
  });

  it('returns undefined when automaticPackageStyle is false, even on a match', () => {
    expect(Stereotype.build('<<folder>>', false).getPackageStyle()).toBeUndefined();
  });
});

describe('Stereotype domain-tag predicates (ported verbatim)', () => {
  it('isBiddableOrUncertain', () => {
    expect(Stereotype.build('<<B>>')!.isBiddableOrUncertain()).toBe(true);
    expect(Stereotype.build('<<Biddable>>')!.isBiddableOrUncertain()).toBe(true);
    expect(Stereotype.build('<<Uncertain>>')!.isBiddableOrUncertain()).toBe(true);
    expect(Stereotype.build('<<Foo>>')!.isBiddableOrUncertain()).toBe(false);
  });

  it('isCausal', () => {
    expect(Stereotype.build('<<C>>')!.isCausal()).toBe(true);
    expect(Stereotype.build('<<Causal>>')!.isCausal()).toBe(true);
    expect(Stereotype.build('<<Foo>>')!.isCausal()).toBe(false);
  });

  it('isLexicalOrGiven', () => {
    expect(Stereotype.build('<<L>>')!.isLexicalOrGiven()).toBe(true);
    expect(Stereotype.build('<<Lexical>>')!.isLexicalOrGiven()).toBe(true);
    expect(Stereotype.build('<<X>>')!.isLexicalOrGiven()).toBe(true);
    expect(Stereotype.build('<<Given>>')!.isLexicalOrGiven()).toBe(true);
  });

  it('isDesignedOrSolved', () => {
    expect(Stereotype.build('<<D>>')!.isDesignedOrSolved()).toBe(true);
    expect(Stereotype.build('<<Designed>>')!.isDesignedOrSolved()).toBe(true);
    expect(Stereotype.build('<<Nested>>')!.isDesignedOrSolved()).toBe(true);
    expect(Stereotype.build('<<Solved>>')!.isDesignedOrSolved()).toBe(true);
  });

  it('isMachineOrSpecification: the bracketed forms match; the bracket-less "M" branch is preserved verbatim but unreachable through checkLabel-validated input (matches upstream exactly)', () => {
    // <<M>> (bracketed) does NOT match the bare "M" comparison -- proves
    // the bracket-less branch is dead for every value reachable through
    // `build` (checkLabel always requires << >> wrapping), exactly as it
    // is dead in the Java itself. Preserved per Stereotype.ts's own doc
    // comment rather than "fixed" to match its bracketed siblings.
    expect(Stereotype.build('<<M>>')!.isMachineOrSpecification()).toBe(false);
    expect(Stereotype.build('<<Machine>>')!.isMachineOrSpecification()).toBe(true);
    expect(Stereotype.build('<<S>>')!.isMachineOrSpecification()).toBe(true);
    expect(Stereotype.build('<<Spec>>')!.isMachineOrSpecification()).toBe(true);
    expect(Stereotype.build('<<Specification>>')!.isMachineOrSpecification()).toBe(true);
  });

  it('isIcon', () => {
    expect(Stereotype.build('<<icon>>')!.isIcon()).toBe(true);
    expect(Stereotype.build('<<Foo>>')!.isIcon()).toBe(false);
  });
});

describe('Stereotype discriminant + type guard', () => {
  it('carries the "Stereotype" discriminant for a Display element union', () => {
    expect(Stereotype.build('<<Foo>>')!.kind).toBe('Stereotype');
  });

  it('isStereotype discriminates Stereotype instances from plain strings', () => {
    const s = Stereotype.build('<<Foo>>')!;
    expect(isStereotype(s)).toBe(true);
    expect(isStereotype('<<Foo>>')).toBe(false);
    expect(isStereotype(undefined)).toBe(false);
  });
});
