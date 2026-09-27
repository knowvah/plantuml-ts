import { describe, it, expect } from 'vitest';
import { textFontFamily } from '../../../src/core/svg-text-font.js';

// C-5 (cdd3-T24): `UFont.java:112-113` (`case SVG: return
// fontStack.getSvgFamily();`) maps the three logical Java family names
// through `FontStack.java:178-187` BEFORE `SvgGraphics.java:726-727`'s
// `equalsIgnoreCase(DEFAULT_FONT_FAMILY)` omission test sees them.
describe('textFontFamily — FontStack#getSvgFamily mapping (FontStack.java:178-187)', () => {
  it('SansSerif maps to sans-serif, which is the root family, so no attribute (rose.skin root FontName)', () => {
    expect(textFontFamily('SansSerif')).toBeUndefined();
  });

  it('Serif maps to serif (FontStack.java:180-181)', () => {
    expect(textFontFamily('Serif')).toBe('serif');
  });

  it('Monospaced maps to monospace (FontStack.java:184-185)', () => {
    expect(textFontFamily('Monospaced')).toBe('monospace');
  });

  it('the switch is case-sensitive: sansserif is not a logical name and is emitted verbatim', () => {
    expect(textFontFamily('sansserif')).toBe('sansserif');
  });

  it('any other definition swaps double quotes for single quotes (FontStack.java:187)', () => {
    expect(textFontFamily('"Liberation Mono"')).toBe("'Liberation Mono'");
  });
});
