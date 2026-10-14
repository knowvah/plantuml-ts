/**
 * `PSystemAppleTwo` (eggs/PSystemAppleTwo.java): the two strings (java:52-53)
 * over `APPLE2_PNG` at `BOTTOM` (java:55-56). Jar oracle:
 * `tests/fixtures/utility/apple.svg` (396x310, the image at 3.475,35).
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { EggImageUnavailableError } from '../../../src/diagrams/eggs/apple2-image.js';
import { PSystemAppleTwo } from '../../../src/diagrams/eggs/PSystemAppleTwo.js';
import { buildUtilityAssetsStore } from '../../helpers/utility-assets-store.js';

const apple = new PSystemAppleTwo(
  { lines: [], type: 'sequence' },
  new PreprocessingArtifact(),
  buildUtilityAssetsStore(),
);

describe('PSystemAppleTwo', () => {
  it('centres the 389x269 image under the text (GraphicStrings BOTTOM)', () => {
    const svg = apple.exportDiagram(0, new DeterministicMeasurer());
    expect(svg).toContain('width="396px" height="310px"');
    expect(svg).toMatch(/<image width="389" height="269" x="3.475" y="35" /);
  });

  it('throws EggImageUnavailableError (java:50 IOException) when the store lacks the picture', () => {
    expect(() => new PSystemAppleTwo({ lines: [], type: 'sequence' }, new PreprocessingArtifact(), undefined)).toThrow(
      EggImageUnavailableError,
    );
  });

  it('describes itself as (Apple //e) (java:59-61)', () => {
    expect(apple.getDescription()).toBe('(Apple //e)');
  });
});
