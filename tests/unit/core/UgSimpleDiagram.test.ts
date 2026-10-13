/**
 * `UgSimpleDiagram` (UgSimpleDiagram.java): a `UgDiagram` that IS its own
 * `TextBlock` — `getTextBlock` returns `this` (java:47-50).
 */
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { UgSimpleDiagram } from '../../../src/core/UgSimpleDiagram.js';

class Square extends UgSimpleDiagram {
  constructor() {
    super({ lines: ['square'], type: 'sequence' }, new PreprocessingArtifact());
  }
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(30.5, 12.25);
  }
  drawU(ug: UGraphic): void {
    ug.draw(URectangle.build(30, 12));
  }
}

const measurer = new DeterministicMeasurer();

describe('UgSimpleDiagram (UgSimpleDiagram.java:41-51)', () => {
  it('getTextBlock returns the diagram itself, for every page', () => {
    const d = new Square();
    const sb = stringBounderFor(measurer);
    expect(d.getTextBlock(0, sb)).toBe(d);
    expect(d.getTextBlock(4, sb)).toBe(d);
  });

  it('exports itself through UgDiagram: (int) (30.5 + 1) x (int) (12.25 + 1) with no margin', () => {
    const svg = new Square().exportDiagram(0, measurer);
    expect(svg).toContain('width="31px" height="13px" viewBox="0 0 31 13"');
    expect(svg).toContain('<rect x="0" y="0" width="30" height="12"');
  });
});
