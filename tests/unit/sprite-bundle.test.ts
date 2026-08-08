/**
 * F4-a — the vendored jar-internal sprite bundle, end to end against the REAL
 * bytes in `assets/sprites/`: licence notices present, manifest intact
 * (byte-verbatim), and the five names the mission's sprite fixtures reference
 * resolving to the dimensions the jar reports.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { combineAssetStores } from '../../src/core/asset-store.js';
import {
  internalSpriteAssetKey,
  internalSpriteStoreFrom,
} from '../../src/core/internal-sprite-store.js';
import { isSpriteSvg } from '../../src/core/klimt/sprite/SpriteSvg.js';
import { createSpriteRegistry, getSprite, matchSpriteCommand } from '../../src/core/sprite-commands.js';
import { SPRITES_DIR, SPRITES_MANIFEST, UPSTREAM_SHA, verifyTree } from '../../scripts/vendor-sprites.js';
import { buildSpriteAssetsStore } from '../helpers/sprite-assets-store.js';

const manifest = JSON.parse(readFileSync(SPRITES_MANIFEST, 'utf8')) as {
  sourceSha: string;
  attribution: string;
  trademark: string;
  files: Record<string, { bytes: number; sha256: string }>;
};

const LICENSES = readFileSync(join(SPRITES_DIR, 'LICENSES.md'), 'utf8');

/** Every archimate name the four G3b fixtures reference — three via
 *  `<<$archimate/...>>` stereotypes (turasu-73 / lesori-32 / ravodu-50) and
 *  two via `sprite $N jar:archimate/...` (tuliba-37). */
const FIXTURE_SPRITE_NAMES: readonly string[] = [
  'archimate/interface',
  'archimate/technology-function',
  'archimate/technology-device',
  'archimate/business-function',
  'archimate/application-component',
];

describe('vendored sprite bundle — licence obligations (F3-lic §5)', () => {
  it('carries both MIT lineages', () => {
    expect(LICENSES).toContain('Copyright (c) 2013-2015 Phillip Beauvoir');
    expect(LICENSES).toContain('The Open Group');
    expect(LICENSES).toContain('Copyright (c) Arnaud Roques and the PlantUML contributors');
    expect(LICENSES).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
  });

  it("reproduces upstream's own Archi attribution line (License.java:227)", () => {
    expect(LICENSES).toContain('http://www.archimatetool.com');
    expect(manifest.attribution).toContain('Archi');
  });

  it('carries the ArchiMate trademark notice', () => {
    expect(LICENSES).toContain('ArchiMate® is a registered trademark of The Open Group.');
    expect(manifest.trademark).toContain('registered trademark of The Open Group');
  });

  it('pins the upstream source SHA', () => {
    expect(manifest.sourceSha).toBe(UPSTREAM_SHA);
    expect(LICENSES).toContain(UPSTREAM_SHA);
  });

  it('is byte-verbatim: every file still hashes to its manifest entry', () => {
    expect(verifyTree()).toEqual([]);
  });

  it('covers the whole reviewed set — 139 files, 116 svg + 23 png', () => {
    const paths = Object.keys(manifest.files);
    expect(paths).toHaveLength(139);
    expect(paths.filter((p) => p.endsWith('.svg'))).toHaveLength(116);
    expect(paths.filter((p) => p.endsWith('.png'))).toHaveLength(23);
  });
});

describe('sprite asset store', () => {
  const assets = buildSpriteAssetsStore();

  it('keys every vendored image under the documented sprite: prefix', () => {
    expect(assets.has(internalSpriteAssetKey('archimate/interface.svg'))).toBe(true);
    expect(assets.has(internalSpriteAssetKey('archimate/access.png'))).toBe(true);
  });

  it('does not expose this repo’s own notice file as an asset', () => {
    expect(assets.has(internalSpriteAssetKey('LICENSES.md'))).toBe(false);
  });

  it('serves the verbatim on-disk bytes', () => {
    const payload = assets.get(internalSpriteAssetKey('archimate/interface.svg'))!;
    expect(payload.mimeType).toBe('image/svg+xml');
    expect(Array.from(payload.bytes)).toEqual(
      Array.from(new Uint8Array(readFileSync(join(SPRITES_DIR, 'archimate', 'interface.svg')))),
    );
  });

  it('layers under combineAssetStores without key collisions', () => {
    const other = { get: () => undefined, has: () => false };
    const combined = combineAssetStores(other, assets);
    expect(combined.get(internalSpriteAssetKey('archimate/interface.svg'))?.mimeType).toBe('image/svg+xml');
  });
});

describe('sprite resolution against the real bundle', () => {
  const store = internalSpriteStoreFrom(buildSpriteAssetsStore());

  it.each(FIXTURE_SPRITE_NAMES)('resolves %s at the archimate 20x20 canvas', (name) => {
    const sprite = store.get(name);
    expect(sprite).toBeDefined();
    // Declared `19.995mm x 19.928mm` with viewBox "0 0 19.995 19.928";
    // `UImageSvg#getData` ceils each -> 20 x 20.
    expect(sprite!.width).toBe(20);
    expect(sprite!.height).toBe(20);
    expect(isSpriteSvg(sprite)).toBe(true);
  });

  it('carries the verbatim SVG source through, not a re-serialisation', () => {
    const sprite = store.get('archimate/interface');
    const onDisk = readFileSync(join(SPRITES_DIR, 'archimate', 'interface.svg'), 'utf8');
    expect(isSpriteSvg(sprite) && sprite.svg).toBe(onDisk);
  });

  it('measures a real drawn-ink box inside that canvas', () => {
    const sprite = store.get('archimate/interface');
    expect(isSpriteSvg(sprite)).toBe(true);
    if (!isSpriteSvg(sprite)) return;
    expect(sprite.inkWidth).toBeGreaterThan(0);
    expect(sprite.inkWidth).toBeLessThanOrEqual(20);
    expect(sprite.inkHeight).toBeGreaterThan(0);
    expect(sprite.inkHeight).toBeLessThanOrEqual(20);
  });

  it('resolves a PNG-only name to its IHDR dimensions', () => {
    expect(store.get('archimate/junction-and')).toEqual({ width: 16, height: 16 });
  });

  it('resolves <<$archimate/interface>> through getSprite with no !include', () => {
    const registry = createSpriteRegistry(store);
    expect(getSprite(registry, 'archimate/interface')?.width).toBe(20);
  });

  it("resolves tuliba-37's two jar: sprite commands", () => {
    const registry = createSpriteRegistry(store);
    const lines = [
      'sprite $bFunction jar:archimate/business-function',
      'sprite $aComponent jar:archimate/application-component',
    ];
    expect(matchSpriteCommand(lines, 0, registry)).toEqual({ consumed: 1 });
    expect(matchSpriteCommand(lines, 1, registry)).toEqual({ consumed: 1 });
    expect(getSprite(registry, 'bFunction')?.width).toBe(20);
    expect(getSprite(registry, 'aComponent')?.height).toBe(20);
    expect(registry.unresolved).toEqual([]);
  });
});
