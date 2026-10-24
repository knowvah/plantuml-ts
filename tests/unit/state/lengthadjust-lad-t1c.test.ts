/**
 * lad-T1c: `skinparam lengthAdjust` reaches the state fragment.
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

const BODY = 'state Alpha\nstate Bravo\nAlpha --> Bravo : go\n';
const render = (skin: string): string =>
  renderSync(`@startuml\n${skin}${BODY}@enduml`, { measurer: new DeterministicMeasurer() });
const rootG = (svg: string): string => /<g[^>]*>/.exec(svg.slice(svg.indexOf('<defs')))?.[0] ?? '';

// sha256 of the pre-change render of the unset diagram (D4: byte-identical).
const UNSET_SHA256 = '170a435c897b96f207b09b4414b9cdcee39aab07c9cdbde8e76bb9308710de01';

describe('state skinparam lengthAdjust', () => {
  it('none: root group has no lengthAdjust and no text has textLength (SvgGraphics.java:155-158,703)', () => {
    const svg = render('skinparam lengthAdjust none\n');
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>Alpha<');
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
});
