/**
 * unwind2-S11: a creole `<$sprite>` atom the jar draws in a text path the port
 * used to drop -- the atom is sized into the text block
 * (`StripeSimple#addSprite`, `StripeSimple.java:229`, through
 * `skinParam.getSprite`) and drawn by `AtomSprite#drawU`. With the atom
 * resolved, the WHOLE element (box size, text runs, the `<image>`) equals the
 * jar render; the sprite PNG bytes are pinned separately
 * (`unwind2-s7-sprite-back.test.ts`). Every `.svg` beside its `.puml` is a
 * `scripts/oracle-render.sh` render.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';

const S7 = 'tests/fixtures/unwind2-S7';
const S11 = 'tests/fixtures/unwind2-S11';

function diffs(dir: string, name: string): unknown[] {
  const read = (ext: string) => readFileSync(join(dir, `${name}.${ext}`), 'utf8');
  const ours = renderSync(read('puml'), { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, read('svg'), 'deterministic').diffs;
}

const CASES: readonly (readonly [string, string])[] = [
  [S7, 'ac-activity'],
  [S11, 'ac-color'],
  [S11, 'ac-multiline'],
  [S11, 'ac-note'],
  [S11, 'ac-arrow'],
  [S11, 'ac-if'],
  [S7, 'st-state'],
  [S11, 'st-color'],
  [S11, 'st-desc'],
  [S11, 'st-empty'],
  [S11, 'st-hide-empty'],
  [S11, 'st-composite'],
  [S11, 'st-note'],
];

describe('unwind2-S11: sprite atoms in text paths draw as the jar', () => {
  it.each(CASES)('%s/%s: the whole render equals the jar', (dir, name) => {
    expect(diffs(dir, name)).toEqual([]);
  });
});
