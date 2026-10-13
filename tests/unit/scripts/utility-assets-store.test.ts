/**
 * `scripts/utility-assets-store.ts` (ufp T1i, ADR-2): serves every dedication PNG and both egg
 * pictures under the modules' own `assetKey`s, each with the sha256 the module records.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildUtilityAssetsStore,
  DEFAULT_ASSETS_DEDICATION_DIR,
  DEFAULT_ASSETS_EGGS_DIR,
  readUtilityAssetsStore,
} from '../../../scripts/utility-assets-store.js';
import { DEDICATION_IMAGES } from '../../../src/diagrams/dedication/dedication-images.js';
import { APPLE2_PNG } from '../../../src/diagrams/eggs/apple2-image.js';
import { RIP_PNG } from '../../../src/diagrams/eggs/rip-image.js';

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const EXPECTED = [...Object.values(DEDICATION_IMAGES), APPLE2_PNG, RIP_PNG];

describe('buildUtilityAssetsStore', () => {
  const store = buildUtilityAssetsStore();

  it('covers the 10 dedications and the 2 egg pictures', () => {
    expect(EXPECTED).toHaveLength(12);
  });

  it.each(EXPECTED.map((image) => [image.assetKey, image.sha256] as const))('serves %s with sha256 %s', (key, hash) => {
    expect(store.has(key)).toBe(true);
    const payload = store.get(key);
    expect(payload?.mimeType).toBe('image/png');
    expect(sha256(payload?.bytes ?? new Uint8Array())).toBe(hash);
  });

  it('misses an unknown key', () => {
    expect(store.has('eggs:nope.png')).toBe(false);
    expect(store.get('eggs:nope.png')).toBe(undefined);
  });

  it('is memoized process-wide', () => {
    expect(buildUtilityAssetsStore()).toBe(store);
  });
});

describe('readUtilityAssetsStore', () => {
  it('names the missing directory', () => {
    const missing = join(mkdtempSync(join(tmpdir(), 'uas-')), 'absent');
    expect(() => readUtilityAssetsStore(missing, DEFAULT_ASSETS_EGGS_DIR)).toThrow(/absent does not exist/);
    expect(() => readUtilityAssetsStore(DEFAULT_ASSETS_DEDICATION_DIR, missing)).toThrow(/absent does not exist/);
  });
});
