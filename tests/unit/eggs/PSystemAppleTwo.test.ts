/**
 * `PSystemAppleTwo` (eggs/PSystemAppleTwo.java): the two strings (java:52-53)
 * over `APPLE2_PNG` at `BOTTOM` (java:55-56). Jar oracle:
 * `tests/fixtures/utility/apple.svg` (396x310, the image at 3.475,35).
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { PSystemAppleTwo } from '../../../src/diagrams/eggs/PSystemAppleTwo.js';

const apple = new PSystemAppleTwo({ lines: [], type: 'sequence' }, new PreprocessingArtifact());

describe('PSystemAppleTwo', () => {
  it('centres the 389x269 image under the text (GraphicStrings BOTTOM)', () => {
    const svg = apple.exportDiagram(0, new DeterministicMeasurer());
    expect(svg).toContain('width="396px" height="310px"');
    expect(svg).toMatch(/<image width="389" height="269" x="3.475" y="35" /);
  });

  it('describes itself as (Apple //e) (java:59-61)', () => {
    expect(apple.getDescription()).toBe('(Apple //e)');
  });
});
