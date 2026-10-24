/**
 * lad-T2d: `skinparam lengthAdjust` reaches the wbs option and fragment.
 *
 * Upstream: `TextBlockExporter.java:306-307` (option from the skin param),
 * `SkinParam.java:1258-1269` (value mapping, default SPACING),
 * `SvgGraphics.java:155-158` (root `<g lengthAdjust=...>`; none for NONE),
 * `SvgGraphics.java:699-705` (`textLength` only for SPACING/SPACING_AND_GLYPHS).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const BODY = '* Alpha\n** Bravo\n';
const render = (skin: string): string =>
  renderSync(`@startwbs\n${skin}${BODY}@endwbs`, { measurer: new DeterministicMeasurer() });
const rootG = (svg: string): string => /<g[^>]*>/.exec(svg.slice(svg.indexOf('<defs')))?.[0] ?? '';

// sha256 of the pre-change render of the unset diagram (D4: byte-identical).
const UNSET_SHA256 = '92744e2488e0e991b6cb371e16e49b2d79daff1a7178eeb81136a64ddc95fdea';

describe('wbs skinparam lengthAdjust', () => {
  it('none: root group has no lengthAdjust and no text has textLength (SvgGraphics.java:155-158,703)', () => {
    const svg = render('skinparam lengthAdjust none\n');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>Alpha<');
  });

  it('spacingAndGlyphs: root group and texts carry the value (SvgGraphics.java:155-158,705)', () => {
    const svg = render('skinparam lengthAdjust spacingAndGlyphs\n');
    expect(rootG(svg)).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(svg).toContain('textLength');
  });

  it('is case-insensitive and ignores unknown values (SkinParam.java:1260-1267)', () => {
    expect(rootG(render('skinparam lengthAdjust NONE\n'))).not.toContain('lengthAdjust');
    expect(rootG(render('skinparam lengthAdjust bogus\n'))).toContain('lengthAdjust="spacing"');
  });

  it('unset: root group carries spacing and the render is byte-identical to pre-change', () => {
    const svg = render('');
    expect(rootG(svg)).toContain('lengthAdjust="spacing"');
    expect(createHash('sha256').update(svg).digest('hex')).toBe(UNSET_SHA256);
  });
});
