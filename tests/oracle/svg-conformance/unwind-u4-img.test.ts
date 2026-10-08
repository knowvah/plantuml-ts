/**
 * unwind-U4 (2b): `<img data:image/png;base64,...>` against the jar
 * (`tests/fixtures/unwind-U4/img/`, a 6x4 RGBA PNG at scale 1, 0.7, 1.5 in
 * a class member and a note).
 *
 * Geometry is the jar's: the box is `round(natural * scale)`
 * (`PortableImageAwt.java:117-118`, `SvgGraphics.java:973-974`). The href is
 * NOT: the jar decodes the payload (`AtomImg.java:203-208`, `SImageIO.read`),
 * resamples it (`PixelImage.java:69-78`) and re-encodes it through ImageIO
 * (`SvgGraphics.java:1055-1060`); this port passes the payload through
 * verbatim -- the CC BY-ND stdlib artwork may not be re-encoded
 * (`plans/si5b-stdlib/decisions.md` D3), and re-encoded bytes would need
 * zlib's own deflate (see `unwind-u4-sprite.test.ts`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { decodePng, pngPayloads } from '../../helpers/png-decode.js';

const DIR = 'tests/fixtures/unwind-U4/img';
const NATURAL = [6, 4];

function read(name: string, ext: string): string {
  return readFileSync(join(DIR, `${name}.${ext}`), 'utf8');
}

describe('unwind-U4 <img> data URIs vs the jar', () => {
  it.each([
    ['img-s1', [6, 4]],
    ['img-s07', [4, 3]],
    ['img-s15', [9, 6]],
  ] as const)('%s: geometry equals the jar; jar raster is resampled, ours is the verbatim input', (name, jarSize) => {
    const ours = renderSync(read(name, 'puml'), { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, read(name, 'svg'), 'deterministic').diffs).toEqual([]);
    const size = (svg: string) => pngPayloads(svg).map((p) => [decodePng(p).width, decodePng(p).height]);
    expect(size(read(name, 'svg'))).toEqual([jarSize, jarSize]);
    expect(size(ours)).toEqual([NATURAL, NATURAL]);
  });
});
