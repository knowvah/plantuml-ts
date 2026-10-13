/**
 * `ARCHIMATE_SPRITE_NAMES` -- the `sprites/archimate/` jar entries in the
 * order `ResourcesUtils.getJarFile` yields them (`TreeSet`,
 * `ResourcesUtils.java:89-99`), filtered and split as
 * `PSystemListArchimateSprites.java:67-72` does (ufp T0e, D5). Order is
 * checked against the jar's own `listsprite` oracle.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { svgTexts } from '../../../../../scripts/generate-utility-data.js';
import { ARCHIMATE_SPRITE_NAMES } from '../../../../../src/core/klimt/sprite/archimate-sprite-names.js';

const ORACLE = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'test-results/dot-cache/unknown/xucoma-93-jeko861/in.svg',
);

describe('ARCHIMATE_SPRITE_NAMES', () => {
  it('lists all 139 png/svg files of the one archimate folder', () => {
    expect(ARCHIMATE_SPRITE_NAMES).toHaveLength(139);
    expect(new Set(ARCHIMATE_SPRITE_NAMES.map((s) => s.folder))).toEqual(new Set(['archimate']));
    expect(ARCHIMATE_SPRITE_NAMES[0]).toEqual({ folder: 'archimate', name: 'access', format: 'png' });
    expect(ARCHIMATE_SPRITE_NAMES.at(-1)).toEqual({ folder: 'archimate', name: 'workpackage', format: 'svg' });
  });

  it('orders by full file name, so assessment-filled.svg precedes assessment.svg', () => {
    const names = ARCHIMATE_SPRITE_NAMES.map((s) => s.name);
    expect(names.indexOf('assessment-filled')).toBe(names.indexOf('assessment') - 1);
  });

  it('matches the jar listsprite oracle line for line (xucoma-93-jeko861)', () => {
    const lines = svgTexts(readFileSync(ORACLE, 'utf8')).filter((t) => / \((png|svg)\)$/.test(t));
    expect(lines).toEqual(ARCHIMATE_SPRITE_NAMES.map((s) => `${s.name} (${s.format})`));
  });
});
