/**
 * T1d — `skinparam <sname><<label>> { FontColor / StereotypeFontColor }`
 * declaration order.
 *
 * Mechanism (jar-verified, `unknown/fepiko-26-vobi566`): both properties
 * register `PName.FontColor` Style entries whose signatures BOTH match the
 * stereotype-text render node ({@link
 * '../../../src/diagrams/class/class-package-style.js'.elementStereoFontColor}
 * consumes them) at the SAME `+DELTA_PRIORITY_FOR_STEREOTYPE` tier
 * (`FromSkinparamToStyle.java:283,396-408`: `addMagic` registers
 * `<sname>FontColor` on `{<sname>}` via `addConFont` and
 * `<sname>StereotypeFontColor` on `{stereotype, <sname>}`; `addStyle`
 * re-signs BOTH with the block's `<<label>>` at `+1000`). Two Style entries
 * at the same priority TIER resolve by declaration order, not by which
 * property is more specific: `DarkString#mergeWith` (`DarkString.java:
 * 54-57`) keeps `other` (the later-built `ValueImpl`, whose `AutomaticCounter`
 * value is strictly greater) whenever neither side already carries a merged
 * `value1`/`value2` pair. `skinparam-stereo-keys.ts`'s `fontByStereo` /
 * `stereotypeFontByStereo` maps are POPULATED independently and the old
 * consumer chain preferred `stereotypeFontByStereo` unconditionally — correct
 * only when StereotypeFontColor happens to be declared last (jar
 * `dojanu-92`), wrong when reversed (fepiko: StereotypeFontColor red,
 * THEN FontColor blue — FontColor, declared later, must win).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/DarkString.java:54-57
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:283,396-408
 */
import { describe, it, expect } from 'vitest';

import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { elementStereoFontColor } from '../../../src/diagrams/class/class-package-style.js';

describe('applyGroupByStereo — FontColor/StereotypeFontColor declaration order', () => {
  it('StereotypeFontColor declared LAST wins (dojanu-92-shaped order)', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['rectanglefontcolor<<boundary>>', 'blue'],
        ['rectanglestereotypefontcolor<<boundary>>', 'red'],
      ]),
      defaultTheme,
    );
    expect(unknown).toEqual([]);
    expect(theme.colors.elements?.rectangle?.stereoTextFontByStereo).toEqual({ boundary: 'red' });
  });

  it('FontColor declared LAST wins (fepiko-26-vobi566’s own order)', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['rectanglestereotypefontcolor<<boundary>>', 'red'],
        ['rectanglefontcolor<<boundary>>', 'blue'],
      ]),
      defaultTheme,
    );
    expect(unknown).toEqual([]);
    expect(theme.colors.elements?.rectangle?.stereoTextFontByStereo).toEqual({ boundary: 'blue' });
  });

  it('either property alone still sets the merged tier (no regression when only one is declared)', () => {
    const onlyFont = resolveSkinparam(new Map([['rectanglefontcolor<<boundary>>', 'blue']]), defaultTheme);
    expect(onlyFont.theme.colors.elements?.rectangle?.stereoTextFontByStereo).toEqual({ boundary: 'blue' });

    const onlyStereo = resolveSkinparam(new Map([['rectanglestereotypefontcolor<<boundary>>', 'red']]), defaultTheme);
    expect(onlyStereo.theme.colors.elements?.rectangle?.stereoTextFontByStereo).toEqual({ boundary: 'red' });
  });

  it('end to end: elementStereoFontColor resolves fepiko’s reversed order to blue, not red', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['rectanglestereotypefontcolor<<boundary>>', 'red'],
        ['rectanglefontcolor<<boundary>>', 'blue'],
      ]),
      defaultTheme,
    );
    expect(elementStereoFontColor(theme, 'rectangle', ['boundary'])).toBe('blue');
  });

  it('a stereotype the block never tagged falls through the merged tier untouched', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['rectanglestereotypefontcolor<<boundary>>', 'red'],
        ['rectanglefontcolor<<boundary>>', 'blue'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.rectangle?.stereoTextFontByStereo?.other).toBeUndefined();
  });
});
