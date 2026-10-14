/**
 * Pure seams of `scripts/generate-utility-data.ts` (ufp T0e, D4/D5): the
 * Java-order helpers, the decoders, the oracle-SVG extractors and the module
 * emitters. The IO half (reading `~/git/plantuml`, shelling out to
 * `scripts/oracle-render.sh`) is not exercised here -- it needs Java and the
 * upstream checkout, which CI does not have. Byte-stability of the checked-in
 * modules is pinned instead by re-emitting each one from its own exported data
 * and comparing the bytes on disk (the file is a fixed point of its emitter).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import {
  archimateSpriteNames,
  decodeDonors,
  dedicationInputLine,
  emitCharlieModule,
  emitDedicationModule,
  emitModules,
  javaTreeSetOrder,
  pngSize,
  readLines,
  sameDedication,
  stdlibCatalog,
  svgImage,
  svgTexts,
  type GeneratedData,
} from '../../../scripts/generate-utility-data.js';
import { AsciiEncoder } from '../../../src/core/klimt/sprite/AsciiEncoder.js';
import { ARCHIMATE_SPRITE_NAMES } from '../../../src/core/klimt/sprite/archimate-sprite-names.js';
import { CHARLIE_PNG } from '../../../src/diagrams/eggs/charlie-image.js';
import { DEDICATION_IMAGES } from '../../../src/diagrams/dedication/dedication-images.js';
import { DONORS } from '../../../src/diagrams/donors/donors-list.js';
import { SKINPARAMETER_NAMES } from '../../../src/diagrams/donors/skinparameter-names.js';
import { OPENICONIC_ALL } from '../../../src/diagrams/openiconic/openiconic-all.js';
import { STDLIB_CATALOG } from '../../../src/diagrams/version/stdlib-catalog.js';

const REPO = join(import.meta.dirname, '..', '..', '..');

/** A minimal valid PNG header: signature + IHDR length/type + width/height. */
function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe('javaTreeSetOrder (TreeSet<String>, ResourcesUtils.java:89-99)', () => {
  it('sorts by UTF-16 code unit, so "-" (0x2d) sorts before "." (0x2e)', () => {
    expect(javaTreeSetOrder(['assessment.svg', 'assessment-filled.svg', 'Zeta', 'alpha'])).toEqual([
      'Zeta',
      'alpha',
      'assessment-filled.svg',
      'assessment.svg',
    ]);
  });

  it('drops duplicates, as a Set does (SkinParam.java:577-578 adds MinClassWidth twice)', () => {
    expect(javaTreeSetOrder(['b', 'a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('archimateSpriteNames (PSystemListArchimateSprites.java:67-72)', () => {
  it('keeps only .png/.svg entries and splits off the 3-letter format', () => {
    expect(archimateSpriteNames('archimate', ['', 'actor.svg', 'access.png', 'README.md'])).toEqual([
      { folder: 'archimate', name: 'access', format: 'png' },
      { folder: 'archimate', name: 'actor', format: 'svg' },
    ]);
  });
});

describe('readLines (BufferedReader.readLine)', () => {
  it('splits on \\n, \\r\\n and \\r and yields no trailing empty line', () => {
    expect(readLines('a\nb\r\nc\rd\n')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps an interior empty line, as readLine does', () => {
    expect(readLines('a\n\nb')).toEqual(['a', '', 'b']);
  });
});

describe('decodeDonors (PSystemDonors.java:156-170)', () => {
  it('AsciiEncoder-decodes, brotli-decompresses, maps * to . and tokenizes on \\n', () => {
    const encoded = new AsciiEncoder().encode(new Uint8Array(brotliCompressSync(Buffer.from('Al**er\n\nBob\n'))));
    expect(decodeDonors(encoded)).toEqual(['Al..er', 'Bob']);
  });
});

describe('svgTexts / svgImage (oracle extraction)', () => {
  it('reads every <text> body in document order, XML-unescaped', () => {
    const svg = '<g><text x="1" y="2">A &amp; B</text><text x="1" y="3">&lt;b&gt;</text></g>';
    expect(svgTexts(svg)).toEqual(['A & B', '<b>']);
  });

  it('reads the single embedded PNG with its declared width/height', () => {
    const svg = '<image width="250" height="66" x="0" y="0" xlink:href="data:image/png;base64,QUJD"/>';
    expect(svgImage(svg)).toEqual({ png: 'QUJD', width: 250, height: 66 });
  });

  it('throws when the oracle carries no embedded PNG', () => {
    expect(() => svgImage('<svg/>')).toThrow('no embedded PNG');
  });
});

describe('pngSize (IHDR)', () => {
  it('reads the big-endian width/height at bytes 16..23', () => {
    expect(pngSize(pngHeader(640, 422))).toEqual({ width: 640, height: 422 });
  });

  it('rejects bytes that are not a PNG', () => {
    expect(() => pngSize(new Uint8Array(24))).toThrow('not a PNG');
  });
});

describe('stdlibCatalog (Stdlib.java:166-176, 204-211, 320-331)', () => {
  it('lowercases folder names, TreeSet-orders them and follows `link` for version and source', () => {
    const manifest = {
      bundles: {
        C4: { version: '2.13.0', source: 'https://c4' },
        awslib: { link: 'awslib14', source: 'https://ignored' },
        awslib14: { version: '14.0.0', source: 'https://aws' },
      },
    };
    expect(stdlibCatalog(manifest)).toEqual([
      { name: 'awslib', version: '14.0.0', source: 'https://aws' },
      { name: 'awslib14', version: '14.0.0', source: 'https://aws' },
      { name: 'c4', version: '2.13.0', source: 'https://c4' },
    ]);
  });

  it('throws on a dangling link rather than inventing metadata', () => {
    expect(() => stdlibCatalog({ bundles: { a: { link: 'b' } } })).toThrow('stdlib bundle "a"');
  });
});

describe('dedication input lines (Dedications.java:89, DedicationSimple.java:67-71)', () => {
  it('pads a sentence of 25 chars or fewer past the length gate without changing its letters', () => {
    const line = dedicationInputLine('arkban');
    expect(line.length).toBeGreaterThan(25);
    expect(sameDedication('arkban', line)).toBe(true);
  });

  it('leaves a sentence longer than 25 chars untouched', () => {
    expect(dedicationInputLine('Write your own dedication!')).toBe('Write your own dedication!');
  });

  it('compares letters and digits only, case-insensitively', () => {
    expect(sameDedication('Ben and Jen 2020', 'ben-and-jen 2020 !!!')).toBe(true);
    expect(sameDedication('Ben and Jen 2020', 'Ben and Jen 2021')).toBe(false);
  });
});

describe('emitted modules are fixed points of the emitter (byte-stable on rerun)', () => {
  const data: GeneratedData = {
    openiconicAll: OPENICONIC_ALL,
    archimateSpriteNames: ARCHIMATE_SPRITE_NAMES,
    skinparameterNames: SKINPARAMETER_NAMES,
    donors: DONORS,
    stdlibCatalog: STDLIB_CATALOG,
  };

  it('re-emits every list module byte-identical to the checked-in file, twice', async () => {
    const first = await emitModules(data);
    const second = await emitModules(data);
    expect(second).toEqual(first);
    expect(first.size).toBe(5);
    for (const [path, text] of first) expect(text, path).toBe(readFileSync(join(REPO, path), 'utf8'));
  });

  it('re-emits the charlie module byte-identical to the checked-in file', async () => {
    const [path, text] = await emitCharlieModule(CHARLIE_PNG);
    expect(text).toBe(readFileSync(join(REPO, path), 'utf8'));
  });

  it('re-emits the dedication module byte-identical to the checked-in file', async () => {
    const [path, text] = await emitDedicationModule(DEDICATION_IMAGES);
    expect(text).toBe(readFileSync(join(REPO, path), 'utf8'));
  });
});
