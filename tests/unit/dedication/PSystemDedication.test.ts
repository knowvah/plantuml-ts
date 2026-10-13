/**
 * `PSystemDedication` (dedication/PSystemDedication.java): the image as a
 * `UImage`, sized one pixel short of the raster (`UImage.java:87-93`,
 * `:118-120`) and drawn at the origin.
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { PSystemDedication } from '../../../src/diagrams/dedication/PSystemDedication.js';

const measurer = new DeterministicMeasurer();
const IMAGE = { width: 30, height: 20, href: 'data:image/png;base64,iVBORw==' };
const page = new PSystemDedication({ lines: [], type: 'sequence' }, IMAGE, new PreprocessingArtifact());

describe('PSystemDedication', () => {
  it('measures the raster less one pixel each way (java:66-70)', () => {
    const dim = page.calculateDimension(stringBounderFor(measurer));
    expect([dim.getWidth(), dim.getHeight()]).toEqual([29, 19]);
  });

  it('draws the raster at its own size at the origin (java:60-64)', () => {
    const svg = page.exportDiagram(0, measurer);
    expect(svg).toContain('width="30px" height="20px"');
    expect(svg).toContain('<image width="30" height="20" x="0" y="0" xlink:href="data:image/png;base64,iVBORw=="/>');
  });

  it('describes itself as (Dedication) (java:72-74)', () => {
    expect(page.getDescription()).toBe('(Dedication)');
  });
});
