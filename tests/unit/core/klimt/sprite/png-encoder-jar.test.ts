/**
 * unwind2-S6: `encodePng` writes the jar's PNG bytes.
 *
 * The jar's raster PNG is `PNGImageWriter` with `new Deflater(4)`
 * (`PNGImageWriter.java:182,364,1213`) -> zlib `deflateInit2(level 4,
 * MAX_WBITS, DEF_MEM_LEVEL 8, DEFAULT_STRATEGY)` (OpenJDK
 * `libzip/Deflater.c:39,52-54`), filter 0 on every RGBA row
 * (`RowFilter.java:93-98`) and 32768-byte IDAT chunks
 * (`PNGImageWriter.java:1035`). Each jar PNG below is decoded to its RGBA
 * pixels and re-encoded; the result must equal the jar's PNG byte for byte.
 * Every `.svg` is a `scripts/oracle-render.sh` render of its `.puml`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodePng } from '../../../../../src/core/klimt/sprite/png-encoder.js';
import { decodePng, pngPayloads } from '../../../../helpers/png-decode.js';

const FIXTURE_DIRS = ['tests/fixtures/unwind-U4/sprite', 'tests/fixtures/unwind-U4/img', 'tests/fixtures/unwind2-S6'];
/** `PNGImageWriter.java:1035`. */
const IDAT_CHUNK_LENGTH = 32768;
const RGBA_COLOR_TYPE = 6;

/** Every jar oracle (`<name>.svg`, never a port render `<name>.ours.svg`). */
const JAR_SVGS = FIXTURE_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.svg') && !f.endsWith('.ours.svg'))
    .map((f) => join(dir, f)),
);

const CASES = JAR_SVGS.flatMap((path) =>
  pngPayloads(readFileSync(path, 'utf8')).map((png, i) => ({ name: `${path}#${i}`, png })),
);

function idatLengths(png: Uint8Array): number[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const lengths: number[] = [];
  for (let p = 8; p < png.length; p += 12 + view.getUint32(p)) {
    if (String.fromCharCode(...png.subarray(p + 4, p + 8)) === 'IDAT') lengths.push(view.getUint32(p));
  }
  return lengths;
}

describe('encodePng reproduces the jar PNG bytes', () => {
  it('covers every jar raster in the fixtures (27 PNGs, 23 distinct sources)', () => {
    expect(CASES).toHaveLength(27);
  });

  it.each(CASES)('$name', ({ png }) => {
    const jar = decodePng(png);
    expect(jar.colorType).toBe(RGBA_COLOR_TYPE);
    const ours = encodePng(jar.pixels, jar.width, jar.height);
    expect(Buffer.from(ours).equals(Buffer.from(png))).toBe(true);
  });

  it('splits IDAT at 32768 bytes exactly as the jar does (idat-multi-chunk)', () => {
    const png = pngPayloads(readFileSync('tests/fixtures/unwind2-S6/idat-multi-chunk.svg', 'utf8'))[0]!;
    const jar = decodePng(png);
    const lengths = idatLengths(encodePng(jar.pixels, jar.width, jar.height));
    expect(lengths).toEqual([...Array<number>(5).fill(IDAT_CHUNK_LENGTH), 30194]);
    expect(lengths).toEqual(idatLengths(png));
  });
});
