/**
 * `Dedications.get` (dedication/Dedications.java:91-103): the >25-char gate,
 * then the first of the 13 dedications that yields an image. Jar probes (T0e
 * generator, `scripts/oracle-render.sh`): `linux_china` alone is a syntax
 * error, `linux_china` padded with `!` past 25 chars draws its 180x180 image.
 */
import { describe, expect, it } from 'vitest';

import { Dedications } from '../../../src/diagrams/dedication/Dedications.js';
import { dedicationAssetStore } from './dedication-store.js';

const STORE = dedicationAssetStore();

describe('Dedications.get', () => {
  it('finds a public sentence', () => {
    const image = Dedications.get('Write your own dedication!', STORE);
    expect(image === undefined ? undefined : [image.width, image.height]).toEqual([640, 422]);
  });

  it('ignores a line of 25 chars or fewer (java:92)', () => {
    expect(Dedications.get('linux_china', STORE)).toBe(undefined);
    expect(Dedications.get('Write your own dedication', STORE)).toBe(undefined);
  });

  it('reaches a short sentence padded past the gate', () => {
    expect(Dedications.get('linux_china !!!!!!!!!!!!!!!!!!!!', STORE)?.width).toBe(180);
    expect(Dedications.get('arkban !!!!!!!!!!!!!!!!!!!!', STORE)?.height).toBe(203);
  });

  it('finds the last public sentence', () => {
    const line =
      'By the time a man realizes that maybe his father was right, he usually has a son who thinks he is wrong';
    expect(Dedications.get(line, STORE)?.width).toBe(600);
  });

  it('is undefined for an unknown long line and without a store', () => {
    expect(Dedications.get('this is not a dedication sentence at all', STORE)).toBe(undefined);
    expect(Dedications.get('Write your own dedication!', undefined)).toBe(undefined);
  });
});
