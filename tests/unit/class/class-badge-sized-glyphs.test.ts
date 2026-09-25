import { describe, it, expect } from 'vitest';
import { lookupSizedGlyph } from '../../../src/diagrams/class/class-badge-sized-glyphs.js';

describe('lookupSizedGlyph', () => {
  it('returns a captured entry for a known (C, size) pair', () => {
    const entry = lookupSizedGlyph('C', 18);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(23);
    expect(entry?.refCy).toBe(24);
    expect(entry?.d).toContain('M25.501,30.1221');
  });

  it('returns undefined for an uncaptured letter/size combination', () => {
    expect(lookupSizedGlyph('I', 18)).toBeUndefined();
    expect(lookupSizedGlyph('A', 13)).toBeUndefined();
  });

  it('returns undefined for a C at an uncaptured size', () => {
    expect(lookupSizedGlyph('C', 17)).toBeUndefined();
    expect(lookupSizedGlyph('C', 25)).toBeUndefined();
  });

  it('covers every captured size (13-22, excluding 17)', () => {
    for (const size of [13, 14, 15, 16, 18, 19, 20, 21, 22]) {
      expect(lookupSizedGlyph('C', size)).toBeDefined();
    }
  });
});

// cdd2-T15 (mechanism C-1): `circledCharacterFontSize 12` fixtures
// (befasi-62-vimu310 and its 6 siblings) draw badges for letters
// M/O/W/Q/C/A, all previously uncaptured at size 12 -- every non-'C'
// letter fell through `lookupSizedGlyph`'s old `letter !== 'C'` gate
// unconditionally, and 'C' itself had no size-12 entry (existing table
// only covers 13-22). Every `d`/`refCx`/`refCy` below is scraped verbatim
// from `test-results/dot-cache/class/befasi-62-vimu310/in.svg` (the cited
// entity's own `<ellipse cx/cy>` and `<path d>`), same methodology as the
// size-13..22 'C' captures above.
describe('lookupSizedGlyph — cdd2-T15 size-12 captures', () => {
  it('returns the jar-captured size-12 outline for letter M (ent0004, DrawableAdapter)', () => {
    const entry = lookupSizedGlyph('M', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(385.88);
    expect(entry?.refCy).toBe(393);
    expect(entry?.d).toBe(
      'M382.884,388.752 L384.946,388.752 L385.989,392.59 L387.026,388.752 L389.101,388.752 ' +
        'L389.101,397.5 L387.612,397.5 L387.612,390.492 L386.687,394.318 L385.31,394.318 ' +
        'L384.372,390.492 L384.372,397.5 L382.884,397.5 Z',
    );
  });

  it('returns the jar-captured size-12 outline for letter O (ent0005, WaterSurfaceGeom)', () => {
    const entry = lookupSizedGlyph('O', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(541.23);
    expect(entry?.refCy).toBe(495);
  });

  it('returns the jar-captured size-12 outline for letter W (ent0015, EWSMainWindow)', () => {
    const entry = lookupSizedGlyph('W', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(443.91);
    expect(entry?.refCy).toBe(128);
  });

  it('returns the jar-captured size-12 outline for letter Q (ent0025, SimulationState)', () => {
    const entry = lookupSizedGlyph('Q', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(117.96);
    expect(entry?.refCy).toBe(613.5);
  });

  it('returns the jar-captured size-12 outline for letter A (ent0043, Potential)', () => {
    const entry = lookupSizedGlyph('A', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(244.74);
    expect(entry?.refCy).toBe(1164);
  });

  it('adds a size-12 entry for letter C (ent0034, WaveModel) without disturbing 13-22', () => {
    const entry = lookupSizedGlyph('C', 12);
    expect(entry).toBeDefined();
    expect(entry?.refCx).toBe(225.03);
    expect(entry?.refCy).toBe(960);
    for (const size of [13, 14, 15, 16, 18, 19, 20, 21, 22]) {
      expect(lookupSizedGlyph('C', size)).toBeDefined();
    }
  });
});
