/**
 * unwind-U4 (2): sprite rasters against the jar (`tests/fixtures/unwind-U4/
 * sprite/`, each `.svg` rendered by `scripts/oracle-render.sh`).
 *
 * - Geometry: `<image>` width/height are the raster's own rounded size
 *   (`SvgGraphics.java:973-974`, `PortableImageAwt.java:117-118`) and a note
 *   bottom-aligns the atom on its line's span (`Sea.java:72-80`).
 * - Raster size: the PNG is resampled to that size (`PixelImage.java:69-78`).
 * - Pixels: given the drawing context's back colour and the tint
 *   (`SpriteMonochrome.java:181-207,216-217`), the port's tint + bilinear
 *   reproduce the jar's decoded pixels exactly. Given equal pixels the PNG
 *   BYTES are equal too (zlib level 4, `PNGImageWriter.java:364`; pinned in
 *   tests/unit/core/klimt/sprite/png-encoder-jar.test.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { spriteToPngDataUri, type SpriteLike } from '../../../src/core/klimt/sprite/sprite-raster.js';
import { compareSvg } from './compare.js';
import { decodePng, pngPayloads } from '../../helpers/png-decode.js';

const DIR = 'tests/fixtures/unwind-U4/sprite';
const SPRITE_W = 10;
const SPRITE_H = 12;
const GRAY_LEVELS = 16;
const NOTE_BACK = '#FEFFDD'; // plantuml.skin:3,324
const CLASS_BACK = '#F1F1F1'; // plantuml.skin:2,17
const PARTICIPANT_BACK = '#E2E2F0'; // plantuml.skin:4
/** `CommandCreoleSprite`'s font-relative factor at the 14pt class font. */
const CLASS_FONT_FACTOR = 14 / 13;

/** The fixtures' `sprite $foo [10x12/16]` grid, as authored. */
const SPRITE: SpriteLike = {
  width: SPRITE_W,
  height: SPRITE_H,
  grayLevels: GRAY_LEVELS,
  pixelAt: (x, y) => ((x + y) % 5 !== 0 ? (x * 3 + y * 5) % GRAY_LEVELS : 0),
};

function read(name: string, ext: string): string {
  return readFileSync(join(DIR, `${name}.${ext}`), 'utf8');
}

function ours(name: string): string {
  return renderSync(read(name, 'puml'), { measurer: new DeterministicMeasurer() });
}

const GEOMETRY_EXACT = [
  'scale1',
  'scale07',
  'scale033',
  'scale15',
  'scale2',
  'color',
  's1-class-member',
  's1-class-name',
  's1-component',
  'ctx-class-member',
  'ctx-component',
];

describe('unwind-U4 sprite rasters vs the jar', () => {
  it.each(GEOMETRY_EXACT)('%s renders equal to the jar', (name) => {
    expect(compareSvg(ours(name), read(name, 'svg'), 'deterministic').diffs).toEqual([]);
  });

  it.each([...GEOMETRY_EXACT, 's1-seq-participant'])('%s: PNG raster size equals the jar IHDR', (name) => {
    const size = (svg: string) => pngPayloads(svg).map((p) => [decodePng(p).width, decodePng(p).height]);
    expect(size(ours(name))).toEqual(size(read(name, 'svg')));
  });

  it.each([
    ['scale1', 1, NOTE_BACK, undefined],
    ['scale07', 0.7, NOTE_BACK, undefined],
    ['scale033', 0.33, NOTE_BACK, undefined],
    ['scale15', 1.5, NOTE_BACK, undefined],
    ['scale2', 2, NOTE_BACK, undefined],
    ['color', 1.5, NOTE_BACK, '#FF0000'],
    ['s1-class-member', CLASS_FONT_FACTOR, CLASS_BACK, undefined],
    ['ctx-class-member', 0.7 * CLASS_FONT_FACTOR, CLASS_BACK, undefined],
    ['s1-seq-participant', CLASS_FONT_FACTOR, PARTICIPANT_BACK, undefined],
  ] as const)(
    '%s: tint over the context back colour + bilinear = the jar pixels and PNG bytes',
    (name, scale, back, tint) => {
      const jar = decodePng(pngPayloads(read(name, 'svg'))[0]!);
      const href = spriteToPngDataUri(SPRITE, tint, back, scale).dataUri;
      const port = decodePng(new Uint8Array(Buffer.from(href.split(',')[1]!, 'base64')));
      expect([port.width, port.height, port.colorType]).toEqual([jar.width, jar.height, jar.colorType]);
      expect(Buffer.from(port.pixels).equals(Buffer.from(jar.pixels))).toBe(true);
      // unwind2-S6: and the PNG bytes themselves (PNGImageWriter.java:182,364,1035).
      expect(href.split(',')[1]).toBe(Buffer.from(pngPayloads(read(name, 'svg'))[0]!).toString('base64'));
    },
  );

  it('the jar PNG carries only IHDR/IDAT/IEND with a level-4 zlib header (0x78 0x5E)', () => {
    const png = pngPayloads(read('scale1', 'svg'))[0]!;
    expect(decodePng(png).chunkTypes).toEqual(['IHDR', 'IDAT', 'IEND']);
    const idatStart = 8 + 12 + 13 + 8;
    expect([png[idatStart], png[idatStart + 1]]).toEqual([0x78, 0x5e]);
  });
});
