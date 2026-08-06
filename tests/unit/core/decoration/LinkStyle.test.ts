/**
 * LinkStyle.test.ts — SI1/T2: `LinkStyle` (decoration/LinkStyle.java:
 * 40-152) — factories, stroke derivation, thickness override, string
 * parsing, toString.
 */
import { describe, expect, it } from 'vitest';
import { LinkStyle } from '../../../../src/core/decoration/LinkStyle.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';

describe('factories and predicates (java:66-92)', () => {
  it('isNormal/isInvisible discriminate the type', () => {
    expect(LinkStyle.NORMAL().isNormal()).toBe(true);
    expect(LinkStyle.INVISIBLE().isInvisible()).toBe(true);
    expect(LinkStyle.DASHED().isNormal()).toBe(false);
    expect(LinkStyle.DASHED().isInvisible()).toBe(false);
  });

  it('each factory call returns a fresh instance (upstream allocates per call)', () => {
    expect(LinkStyle.NORMAL()).not.toBe(LinkStyle.NORMAL());
  });
});

describe('getStroke3 (java:98-109)', () => {
  it('DASHED is 7/7, DOTTED is 1/3, at thickness 1 by default', () => {
    expect(LinkStyle.DASHED().getStroke3().equals(new UStroke(7, 7, 1))).toBe(true);
    expect(LinkStyle.DOTTED().getStroke3().equals(new UStroke(1, 3, 1))).toBe(true);
  });

  it('BOLD is plain thickness 2; NORMAL is plain thickness 1', () => {
    expect(LinkStyle.BOLD().getStroke3().equals(UStroke.withThickness(2))).toBe(true);
    expect(LinkStyle.NORMAL().getStroke3().equals(UStroke.withThickness(1))).toBe(true);
  });

  it('goThickness overrides the dash thickness (java:94-96, 118-123)', () => {
    expect(LinkStyle.DASHED().goThickness(2.5).getStroke3().equals(new UStroke(7, 7, 2.5))).toBe(true);
    expect(LinkStyle.NORMAL().goThickness(3).getStroke3().equals(UStroke.withThickness(3))).toBe(true);
  });
});

describe('muteStroke (java:111-116)', () => {
  it('replaces the stroke for DASHED/DOTTED/BOLD only', () => {
    const base = new UStroke(2, 2, 5);
    expect(LinkStyle.DASHED().muteStroke(base).equals(new UStroke(7, 7, 1))).toBe(true);
    expect(LinkStyle.BOLD().muteStroke(base).equals(UStroke.withThickness(2))).toBe(true);
    expect(LinkStyle.NORMAL().muteStroke(base)).toBe(base);
    expect(LinkStyle.INVISIBLE().muteStroke(base)).toBe(base);
  });
});

describe('fromString1/fromString2 (java:125-147)', () => {
  it('parses dashed/dotted/bold/hidden case-insensitively', () => {
    expect(LinkStyle.fromString2('dashed')?.toString()).toBe('DASHED(null)');
    expect(LinkStyle.fromString2('DOTTED')?.toString()).toBe('DOTTED(null)');
    expect(LinkStyle.fromString2('Bold')?.toString()).toBe('BOLD(null)');
    expect(LinkStyle.fromString2('hidden')?.isInvisible()).toBe(true);
    expect(LinkStyle.fromString2('nope')).toBeNull();
  });

  it('fromString1 falls back to NORMAL', () => {
    expect(LinkStyle.fromString1('nope').isNormal()).toBe(true);
    expect(LinkStyle.fromString1('dashed').isNormal()).toBe(false);
  });
});

describe('isThicknessOverrided and toString (java:56-58, 149-151)', () => {
  it('only goThickness sets the override', () => {
    expect(LinkStyle.NORMAL().isThicknessOverrided()).toBe(false);
    expect(LinkStyle.NORMAL().goThickness(2).isThicknessOverrided()).toBe(true);
  });

  it('toString prints Java-style: TYPE(thickness) with Double formatting', () => {
    expect(LinkStyle.NORMAL().toString()).toBe('NORMAL(null)');
    expect(LinkStyle.DASHED().goThickness(2).toString()).toBe('DASHED(2.0)');
    expect(LinkStyle.DOTTED().goThickness(1.5).toString()).toBe('DOTTED(1.5)');
  });
});
