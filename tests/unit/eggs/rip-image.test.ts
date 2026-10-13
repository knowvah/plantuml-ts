/**
 * `RIP_PNG` -- the PNG the jar embeds for the image `PSystemRIP.java:63` draws, copied
 * from the authored jar oracle `tests/fixtures/utility/rip.svg`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pngSize, svgImage } from '../../../scripts/generate-utility-data.js';
import { RIP_PNG } from '../../../src/diagrams/eggs/rip-image.js';

const ORACLE = join(import.meta.dirname, '..', '..', 'fixtures', 'utility', 'rip.svg');
const DATA_URI_PREFIX = 'data:image/png;base64,';

describe('RIP_PNG', () => {
  it('is 162x135, the size the jar draws', () => {
    expect(RIP_PNG.width).toBe(162);
    expect(RIP_PNG.height).toBe(135);
  });

  it('is a PNG data URI whose IHDR agrees with the declared size', () => {
    expect(RIP_PNG.href.startsWith(DATA_URI_PREFIX)).toBe(true);
    expect(pngSize(Buffer.from(RIP_PNG.href.slice(DATA_URI_PREFIX.length), 'base64'))).toEqual({
      width: 162,
      height: 135,
    });
  });

  it('is byte-identical to the jar oracle image', () => {
    const embedded = svgImage(readFileSync(ORACLE, 'utf8'));
    expect(RIP_PNG).toEqual({ width: embedded.width, height: embedded.height, href: DATA_URI_PREFIX + embedded.png });
  });
});
