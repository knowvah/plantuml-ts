/**
 * `DedicationSimple` (dedication/DedicationSimple.java): a sentence match
 * ignoring everything but letters and digits, and case (`same`, java:71-75),
 * then the vendored image through the asset store (D4).
 */
import { describe, expect, it } from 'vitest';

import { DedicationSimple } from '../../../src/diagrams/dedication/DedicationSimple.js';
import { DEDICATION_IMAGES } from '../../../src/diagrams/dedication/dedication-images.js';
import { TinyHashableString } from '../../../src/diagrams/dedication/TinyHashableString.js';
import { storeOf } from './dedication-store.js';

const SENTENCE = 'Write your own dedication!';
const IMAGE = DEDICATION_IMAGES[SENTENCE]!;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const STORE = storeOf(IMAGE.assetKey, PNG);
const simple = new DedicationSimple(IMAGE, SENTENCE);

function imageFor(line: string): ReturnType<DedicationSimple['getImage']> {
  return simple.getImage(new TinyHashableString(line), STORE);
}

describe('DedicationSimple.getImage', () => {
  it('serves the image at its drawn size, as a PNG data URI', () => {
    expect(imageFor(SENTENCE)).toEqual({ width: 640, height: 422, href: 'data:image/png;base64,iVBORw==' });
  });

  it.each(['write YOUR own dedication', '  Write-your-own...dedication!!!', 'writeyourowndedication'])(
    'matches %j (letters and digits only, any case)',
    (line) => {
      expect(imageFor(line)?.width).toBe(640);
    },
  );

  it('keeps digits and non-ASCII letters when comparing', () => {
    const ben = new DedicationSimple(DEDICATION_IMAGES['Ben and Jen 2020']!, 'Ben and Jen 2020');
    const store = storeOf('dedication:ben.png', PNG);
    expect(ben.getImage(new TinyHashableString('BEN-and-JEN: 2020!'), store)?.width).toBe(1000);
    expect(ben.getImage(new TinyHashableString('BEN-and-JEN: 2021!'), store)).toBe(undefined);
    expect(simple.getImage(new TinyHashableString('Write your own dédication!'), STORE)).toBe(undefined);
  });

  it('is undefined for another sentence', () => {
    expect(imageFor('Write your own dedication!2')).toBe(undefined);
  });

  it('is undefined when no store serves the bytes (the catch, java:65-68)', () => {
    expect(simple.getImage(new TinyHashableString(SENTENCE), undefined)).toBe(undefined);
    expect(simple.getImage(new TinyHashableString(SENTENCE), storeOf('dedication:other.png', PNG))).toBe(undefined);
  });
});
