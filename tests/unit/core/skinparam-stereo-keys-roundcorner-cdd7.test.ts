/**
 * cdd7 T2b (xuloxo-85-vibu502, journal row 13): `skinparam <sname><<label>>
 * { RoundCorner N | DiagonalCorner N }` -- `addMagic` registers
 * `<sname>RoundCorner` -> `PName.RoundCorner` and `<sname>DiagonalCorner` ->
 * `PName.DiagonalCorner` on `{<sname>}` (`FromSkinparamToStyle.java:275-276`);
 * the ctor strips the `<<label>>` (`:292-302`) and `addStyle` re-signs the
 * style with it at +1000 (`:396-408`). Read by `EntityImageDescription
 * .java:168-169` off the stereotype-signed `styleTitle`.
 */
import { describe, it, expect } from 'vitest';

import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('applyGroupByStereo -- RoundCorner / DiagonalCorner roles', () => {
  it('stores <sname>RoundCorner<<label>> in roundCornerByStereo', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['rectangleroundcorner<<person>>', '0']]), defaultTheme);
    expect(unknown).toEqual([]);
    expect(theme.colors.elements?.rectangle?.roundCornerByStereo).toEqual({ person: 0 });
  });

  it('stores <sname>DiagonalCorner<<label>> in diagonalCornerByStereo', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['rectanglediagonalcorner<<box8>>', '10']]), defaultTheme);
    expect(unknown).toEqual([]);
    expect(theme.colors.elements?.rectangle?.diagonalCornerByStereo).toEqual({ box8: 10 });
  });

  it('drops a non-numeric corner value as unknown', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['rectangleroundcorner<<person>>', 'wide']]), defaultTheme);
    expect(unknown).toEqual(['rectangleroundcorner<<person>>']);
    expect(theme.colors.elements?.rectangle?.roundCornerByStereo).toBeUndefined();
  });
});

/**
 * cdd7 T2b: `addConvert("defaulttextalignment", PName.HorizontalAlignment,
 * SName.root)` (`FromSkinparamToStyle.java:155`) -- the ROOT bucket's
 * `horizontalAlignment`, parsed as `HorizontalAlignment.fromString`.
 */
describe('skinparam defaultTextAlignment -> root HorizontalAlignment', () => {
  it('stores the parsed alignment on the root element bucket', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['defaulttextalignment', 'center']]), defaultTheme);
    expect(unknown).toEqual([]);
    expect(theme.colors.elements?.root?.horizontalAlignment).toBe('CENTER');
  });

  it('ignores an unrecognised alignment', () => {
    const { theme } = resolveSkinparam(new Map([['defaulttextalignment', 'middle']]), defaultTheme);
    expect(theme.colors.elements?.root?.horizontalAlignment).toBeUndefined();
  });
});
