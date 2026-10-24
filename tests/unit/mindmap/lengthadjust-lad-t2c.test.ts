/**
 * Mindmap honours `skinparam lengthAdjust` via the diagram's own SkinParam.
 * - `TextBlockExporter.java:306-307`: `option.withLengthAdjust(skinParam.getlengthAdjust())`.
 * - `SkinParam.java:1258-1269`: spacingAndGlyphs / spacing / none (equalsIgnoreCase), else SPACING.
 * - `SvgGraphics.java:155-158`: root `<g>` lengthAdjust attribute (none: omitted).
 * - `SvgGraphics.java:699-705`: `textLength` only for SPACING / SPACING_AND_GLYPHS.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';

const measurer = new DeterministicMeasurer();
const BODY = '* root\n** child';
const render = (skin: string): string => renderSync(`@startmindmap\n${skin}${BODY}\n@endmindmap`, { measurer });
/** sha256 of the no-skinparam render captured before the change (D4). */
const PRE_CHANGE_SHA256 = '70afc83536bbceeb1a252689d9b333b08c688115546193d7a3e761ff7673d861';

describe('mindmap skinparam lengthAdjust', () => {
  it('none: no root lengthAdjust and no textLength', () => {
    const svg = render('skinparam lengthAdjust none\n');
    expect(svg).not.toContain('lengthAdjust=');
    expect(svg).not.toContain('textLength=');
  });

  it('SPACINGANDGLYPHS (any case): root spacingAndGlyphs, textLength kept', () => {
    const svg = render('skinparam lengthAdjust SPACINGANDGLYPHS\n');
    expect(svg).toContain('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
    expect(svg).toContain('textLength=');
  });

  it('bogus value equals the no-skinparam render (SkinParam.java:1269)', () => {
    expect(render('skinparam lengthAdjust bogus\n')).toBe(render(''));
  });

  it('unset output is byte-identical to the pre-change render', () => {
    const svg = renderSync('@startmindmap\n* root\n** child\n@endmindmap', { measurer });
    expect(createHash('sha256').update(svg).digest('hex')).toBe(PRE_CHANGE_SHA256);
    expect(svg).toContain('lengthAdjust="spacing"');
  });
});
