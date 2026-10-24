/**
 * lad-T2e: `skinparam lengthAdjust` reaches the salt fragment.
 *
 * Upstream: `PSystemSalt.java:87` (extends TitledDiagram) so
 * `TextBlockExporter.java:306-307` applies; `SkinParam.java:1258-1269` (value
 * mapping, default SPACING); `SvgGraphics.java:155-158` (root `<g
 * lengthAdjust=...>`; none for NONE); `SvgGraphics.java:699-705` (`textLength`
 * only for SPACING/SPACING_AND_GLYPHS).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { buildMindmapStyleBuilder } from '../../../src/core/style/mindmap-style-builder.js';
import { PSystemSalt } from '../../../src/diagrams/salt/PSystemSalt.js';
import { renderSync } from '../../../src/index.js';

const render = (skin: string): string =>
  renderSync(`@startsalt\n${skin}{\nLogin\n}\n@endsalt`, { measurer: new DeterministicMeasurer() });
const rootG = (svg: string): string => /<g[^>]*>/.exec(svg.slice(svg.indexOf('<defs')))?.[0] ?? '';

// sha256 of the pre-change render of the unset diagram (D4: byte-identical).
const UNSET_SHA256 = 'dbb387ac315c6e3772ce3b3ee2fc51ee0f2f7f6dbc3a805f8a9e9f791885c313';

describe('salt skinparam lengthAdjust', () => {
  it('none: root group has no lengthAdjust and no text has textLength (SvgGraphics.java:155-158,703)', () => {
    const svg = render('skinparam lengthAdjust none\n');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>Login<');
  });

  it('spacingAndGlyphs: root group carries the value (SvgGraphics.java:155-158)', () => {
    const svg = render('skinparam lengthAdjust spacingAndGlyphs\n');
    expect(rootG(svg)).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(svg).toContain('textLength');
  });

  it('unset: root group carries spacing and the render is byte-identical to pre-change', () => {
    const svg = render('');
    expect(rootG(svg)).toContain('lengthAdjust="spacing"');
    expect(createHash('sha256').update(svg).digest('hex')).toBe(UNSET_SHA256);
  });

  it('getlengthAdjust mirrors SkinParam.java:1258-1269 (equalsIgnoreCase, else default)', () => {
    const of = (value: string | undefined): string | undefined => {
      const skinparam = new Map(value === undefined ? [] : [['lengthAdjust', value]]);
      const style = { skinparam, styles: [] as string[] };
      const d = new PSystemSalt({ lines: [] }, new PreprocessingArtifact(), {
        styleBuilder: buildMindmapStyleBuilder(style),
        skinparam,
      });
      return d.getSkinParam().getlengthAdjust();
    };
    expect(of('SPACINGANDGLYPHS')).toBe('spacingAndGlyphs');
    expect(of('Spacing')).toBe('spacing');
    expect(of('NONE')).toBe('none');
    expect(of('bogus')).toBeUndefined();
    expect(of(undefined)).toBeUndefined();
  });
});
