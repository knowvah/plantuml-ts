/**
 * `DEDICATION_IMAGES` -- the 10 `DedicationSimple` sentences
 * (`Dedications.java:55-65`) and the PNGs the jar embeds for them, extracted
 * from jar renders (ufp T0e, D4). The bytes live outside the core bundle under
 * `assets/dedication/` (stop 12); the module carries only the asset key, the
 * drawn size and a sha256 of the bytes.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pngSize, svgImage } from '../../../scripts/generate-utility-data.js';
import { DEDICATION_IMAGES } from '../../../src/diagrams/dedication/dedication-images.js';

const REPO = join(import.meta.dirname, '..', '..', '..');
const ORACLE = join(REPO, 'test-results/dot-cache/unknown/kavama-92-noro949/in.svg');

function assetBytes(resource: string): Buffer {
  return readFileSync(join(REPO, 'assets/dedication', `${resource}.png`));
}

describe('DEDICATION_IMAGES', () => {
  it('keys the 10 public sentences in Dedications.java order', () => {
    const sentences = Object.keys(DEDICATION_IMAGES);
    expect(sentences).toHaveLength(10);
    expect(sentences[0]).toBe('Write your own dedication!');
    expect(sentences.at(-1)).toBe(
      'By the time a man realizes that maybe his father was right, he usually has a son who thinks he is wrong',
    );
  });

  it('records the upstream resource name, asset key and drawn size', () => {
    expect(DEDICATION_IMAGES['Write your own dedication!']).toMatchObject({
      resource: 'dedication',
      assetKey: 'dedication:dedication.png',
      width: 640,
      height: 422,
    });
    expect(DEDICATION_IMAGES['linux_china']).toMatchObject({ resource: 'linux_china', width: 180, height: 180 });
  });

  it('ships every asset with the recorded sha256 and an IHDR matching the recorded size', () => {
    for (const image of Object.values(DEDICATION_IMAGES)) {
      const bytes = assetBytes(image.resource);
      expect(createHash('sha256').update(bytes).digest('hex'), image.resource).toBe(image.sha256);
      expect(pngSize(bytes), image.resource).toEqual({ width: image.width, height: image.height });
    }
  });

  it('is byte-identical to the corpus oracle image (kavama-92-noro949)', () => {
    const oracle = svgImage(readFileSync(ORACLE, 'utf8'));
    expect(assetBytes('dedication').toString('base64')).toBe(oracle.png);
  });
});
