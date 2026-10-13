/**
 * `APPLE2_PNG` -- the PNG the jar embeds for the image `PSystemAppleTwo.java:55` draws, copied
 * from the authored jar oracle `tests/fixtures/utility/apple.svg`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pngSize, svgImage } from '../../../scripts/generate-utility-data.js';
import { APPLE2_PNG } from '../../../src/diagrams/eggs/apple2-image.js';

const ORACLE = join(import.meta.dirname, '..', '..', 'fixtures', 'utility', 'apple.svg');
const DATA_URI_PREFIX = 'data:image/png;base64,';

describe('APPLE2_PNG', () => {
  it('is 389x269, the size the jar draws', () => {
    expect(APPLE2_PNG.width).toBe(389);
    expect(APPLE2_PNG.height).toBe(269);
  });

  it('is a PNG data URI whose IHDR agrees with the declared size', () => {
    expect(APPLE2_PNG.href.startsWith(DATA_URI_PREFIX)).toBe(true);
    expect(pngSize(Buffer.from(APPLE2_PNG.href.slice(DATA_URI_PREFIX.length), 'base64'))).toEqual({
      width: 389,
      height: 269,
    });
  });

  it('is byte-identical to the jar oracle image', () => {
    const embedded = svgImage(readFileSync(ORACLE, 'utf8'));
    expect(APPLE2_PNG).toEqual({
      width: embedded.width,
      height: embedded.height,
      href: DATA_URI_PREFIX + embedded.png,
    });
  });
});
