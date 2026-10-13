/**
 * `APPLE2_PNG` -- the module describes the PNG the jar embeds for the image the egg draws; the
 * bytes ship as `assets/eggs/apple2.png` (T1i). The asset must be byte-identical to the jar
 * oracle `tests/fixtures/utility/apple.svg` image, with the recorded sha256 and size.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pngSize, svgImage } from '../../../scripts/generate-utility-data.js';
import { DEFAULT_ASSETS_EGGS_DIR } from '../../../scripts/utility-assets-store.js';
import { APPLE2_PNG } from '../../../src/diagrams/eggs/apple2-image.js';

const ORACLE = join(import.meta.dirname, '..', '..', 'fixtures', 'utility', 'apple.svg');
const ASSET = readFileSync(join(DEFAULT_ASSETS_EGGS_DIR, 'apple2.png'));

describe('APPLE2_PNG', () => {
  it('is 389x269 under the key eggs:apple2.png', () => {
    expect(APPLE2_PNG).toMatchObject({ assetKey: 'eggs:apple2.png', width: 389, height: 269 });
  });

  it('has an asset whose sha256 is the recorded one', () => {
    expect(createHash('sha256').update(ASSET).digest('hex')).toBe(APPLE2_PNG.sha256);
  });

  it('has an asset whose IHDR agrees with the declared size', () => {
    expect(pngSize(ASSET)).toEqual({ width: 389, height: 269 });
  });

  it('has an asset byte-identical to the jar oracle image', () => {
    const embedded = svgImage(readFileSync(ORACLE, 'utf8'));
    expect(ASSET.equals(Buffer.from(embedded.png, 'base64'))).toBe(true);
    expect({ width: embedded.width, height: embedded.height }).toEqual({ width: 389, height: 269 });
  });
});
