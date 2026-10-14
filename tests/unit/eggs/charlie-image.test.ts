/**
 * `CHARLIE_PNG` -- the PNG the jar embeds for `charlie`
 * (`PSystemCharlie.java`, `PSystemVersion.getCharlieImage`, java:104-106),
 * extracted from a jar render (ufp T0e, D4).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pngSize, svgImage } from '../../../scripts/generate-utility-data.js';
import { CHARLIE_PNG } from '../../../src/diagrams/eggs/charlie-image.js';

const ORACLE = join(import.meta.dirname, '..', '..', '..', 'test-results/dot-cache/unknown/kicizi-84-lexu138/in.svg');

describe('CHARLIE_PNG', () => {
  it('is 250x66, the size the jar draws', () => {
    expect(CHARLIE_PNG.width).toBe(250);
    expect(CHARLIE_PNG.height).toBe(66);
  });

  it('decodes to a PNG whose IHDR agrees with the declared size', () => {
    expect(pngSize(Buffer.from(CHARLIE_PNG.png, 'base64'))).toEqual({ width: 250, height: 66 });
  });

  it('is byte-identical to the corpus oracle image (kicizi-84-lexu138)', () => {
    expect(svgImage(readFileSync(ORACLE, 'utf8'))).toEqual(CHARLIE_PNG);
  });
});
