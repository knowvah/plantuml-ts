/**
 * `PSystemRIP` (eggs/PSystemRIP.java): ten strings (java:52-61) over
 * `RIP_PNG` at `BOTTOM` (java:63-64). Jar oracle:
 * `tests/fixtures/utility/rip.svg` (236x266, the image at 36.688,125).
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { PSystemRIP } from '../../../src/diagrams/eggs/PSystemRIP.js';

const rip = new PSystemRIP({ lines: [], type: 'sequence' }, new PreprocessingArtifact());

describe('PSystemRIP', () => {
  it('centres the 162x135 image under the text (GraphicStrings BOTTOM)', () => {
    const svg = rip.exportDiagram(0, new DeterministicMeasurer());
    expect(svg).toContain('width="236px" height="266px"');
    expect(svg).toMatch(/<image width="162" height="135" x="36.688" y="125" /);
  });

  it('describes itself as (RIP) (java:67-69)', () => {
    expect(rip.getDescription()).toBe('(RIP)');
  });
});
