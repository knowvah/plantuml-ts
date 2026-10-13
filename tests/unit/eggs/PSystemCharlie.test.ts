/**
 * `PSystemCharlie` (eggs/PSystemCharlie.java): `CHARLIE_PNG` as a `UImage`,
 * sized one pixel short of the raster (`UImage.java:87-93`, `:118-120`) and
 * drawn at the origin. Jar oracle: `unknown/kicizi-84-lexu138` (250x66 canvas,
 * the image 250x66 at 0,0).
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { PSystemCharlie } from '../../../src/diagrams/eggs/PSystemCharlie.js';

const measurer = new DeterministicMeasurer();
const charlie = new PSystemCharlie({ lines: [], type: 'sequence' }, new PreprocessingArtifact());

describe('PSystemCharlie', () => {
  it('measures the raster less one pixel each way', () => {
    const dim = charlie.calculateDimension(stringBounderFor(measurer));
    expect([dim.getWidth(), dim.getHeight()]).toEqual([249, 65]);
  });

  it('draws the raster at its own size at the origin', () => {
    const svg = charlie.exportDiagram(0, measurer);
    expect(svg).toContain('width="250px" height="66px"');
    expect(svg).toMatch(/<image width="250" height="66" x="0" y="0" xlink:href="data:image\/png;base64,iVBOR/);
  });

  it('describes itself as (Je Suis Charlie) (java:58-60)', () => {
    expect(charlie.getDescription()).toBe('(Je Suis Charlie)');
  });
});
